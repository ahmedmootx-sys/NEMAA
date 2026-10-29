import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://biduslvoyjwhdbfrpvog.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZHVzbHZveWp3aGRiZnJwdm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDUyNzUsImV4cCI6MjEwODYyMTI3NX0._DHSRBvbsPVFdf5oA_2kAu7mFfLjmXn4RFYsBXYCQL8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Generate a consistent string hash code for fallback IDs
 */
export function simpleHash(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format a raw Supabase record into a full NEMAA blessing object
 */
export function formatSharedBlessing(raw, index = 0) {
  const title = (raw.title || '').trim();
  const reflection = (raw.reflection || '').trim();
  const rawAuthor = (raw.author || '').trim();
  const author = (rawAuthor && rawAuthor !== 'محب للخير') ? rawAuthor : '';
  const id = raw.id ? String(raw.id) : `sb_${simpleHash(title + reflection)}_${index}`;

  return {
    id,
    title,
    reflection,
    author,
    category: raw.category || 'shared',
    categoryName: raw.category_name || raw.categoryName || 'نعم متشارَكة',
    proof: (raw.proof || '').trim(),
    proofSource: (raw.proof_source || raw.proofSource || '').trim(),
    proofType: raw.proof_type || raw.proofType || 'wisdom',
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 
      ? raw.tags 
      : ['نعمة_متشارَكة', 'مجتمع_نعمة'],
    isShared: true,
    praisesCount: Number(raw.praises_count || raw.praisesCount || 0),
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString()
  };
}

/**
 * Fetch all shared blessings from Supabase (ordered by newest first)
 */
export async function fetchSharedBlessings() {
  try {
    // 1. Try ordering by created_at if available
    let { data, error } = await supabase
      .from('blessings')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. If created_at column doesn't exist, fallback to select('*')
    if (error) {
      const fallback = await supabase
        .from('blessings')
        .select('*');

      if (fallback.error) {
        console.warn('Supabase select fallback error:', fallback.error);
        return [];
      }

      // Reverse so latest inserted rows appear first
      data = (fallback.data || []).slice().reverse();
    }

    if (!Array.isArray(data)) return [];

    return data
      .filter(item => item && (item.title || '').trim() && (item.reflection || '').trim())
      .map((item, idx) => formatSharedBlessing(item, idx));
  } catch (err) {
    console.warn('Failed to fetch blessings from Supabase:', err);
    return [];
  }
}

/**
 * Publish a new blessing into the Supabase 'blessings' table with resilient fallback
 */
export async function publishSharedBlessing({ title, reflection, author, proof, proofSource }) {
  const cleanTitle = (title || '').trim();
  const cleanReflection = (reflection || '').trim();
  const rawAuthor = (author || '').trim();
  const cleanAuthor = (rawAuthor && rawAuthor !== 'محب للخير') ? rawAuthor : null;
  const cleanProof = (proof || '').trim();
  const cleanProofSource = (proofSource || '').trim();

  if (!cleanTitle || !cleanReflection) {
    throw new Error('يرجى كتابة عنوان النعمة والتدبّر');
  }

  // Extended payload
  const extendedPayload = {
    title: cleanTitle,
    reflection: cleanReflection,
    author: cleanAuthor,
    proof: cleanProof || null,
    proof_source: cleanProofSource || null
  };

  // Attempt extended insert
  let { data, error } = await supabase
    .from('blessings')
    .insert([extendedPayload])
    .select();

  // If error indicates column does not exist (PostgREST code 42703), fallback to basic payload
  if (error && (error.code === '42703' || (error.message && error.message.includes('does not exist')))) {
    const basicPayload = {
      title: cleanTitle,
      reflection: cleanReflection
    };

    const retry = await supabase
      .from('blessings')
      .insert([basicPayload])
      .select();

    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return {
      success: false,
      error,
      isRlsError: error.code === '42501' || (error.message && error.message.includes('row-level security'))
    };
  }

  const savedRecord = Array.isArray(data) && data[0] ? data[0] : { ...extendedPayload, id: Date.now() };
  return {
    success: true,
    data: formatSharedBlessing(savedRecord, Date.now())
  };
}

/**
 * Delete a shared blessing from Supabase by title/reflection or ID
 */
export async function deleteSharedBlessing(blessingOrId) {
  try {
    const isObj = typeof blessingOrId === 'object' && blessingOrId !== null;
    const blessingId = isObj ? blessingOrId.id : blessingOrId;
    const title = isObj ? (blessingOrId.title || '').trim() : '';
    const reflection = isObj ? (blessingOrId.reflection || '').trim() : '';

    let success = false;
    let deletedCount = 0;
    let lastError = null;

    // 1. Try deleting by title and reflection (most reliable since blessings table has no id column)
    if (title && reflection) {
      const res = await supabase
        .from('blessings')
        .delete()
        .eq('title', title)
        .eq('reflection', reflection)
        .select();

      if (!res.error) {
        deletedCount = Array.isArray(res.data) ? res.data.length : 0;
        if (deletedCount > 0) success = true;
      } else {
        lastError = res.error;
      }
    }

    // 2. Fallback: try by title only
    if (!success && title) {
      const res = await supabase
        .from('blessings')
        .delete()
        .eq('title', title)
        .select();

      if (!res.error) {
        deletedCount = Array.isArray(res.data) ? res.data.length : 0;
        if (deletedCount > 0) success = true;
      } else {
        lastError = res.error;
      }
    }

    // 3. Fallback: try by id if it is not a synthetic client ID
    if (!success && blessingId && !String(blessingId).startsWith('sb_') && !String(blessingId).startsWith('custom_')) {
      const res = await supabase
        .from('blessings')
        .delete()
        .eq('id', blessingId)
        .select();

      if (!res.error) {
        deletedCount = Array.isArray(res.data) ? res.data.length : 0;
        if (deletedCount > 0) success = true;
      } else {
        lastError = res.error;
      }
    }

    if (success) {
      return { success: true, deletedCount };
    }
    if (lastError) {
      console.warn('Supabase delete error:', lastError);
      return { success: false, deletedCount: 0, error: lastError };
    }
    return { success: true, deletedCount };
  } catch (err) {
    console.warn('Delete error:', err);
    return { success: false, deletedCount: 0, error: err };
  }
}

/**
 * Update an existing shared blessing in Supabase by matching original title/reflection or ID
 */
export async function updateSharedBlessing(oldBlessing, newFields) {
  try {
    const isObj = typeof oldBlessing === 'object' && oldBlessing !== null;
    const oldTitle = (isObj ? oldBlessing.title || '' : String(oldBlessing || '')).trim();
    const oldReflection = (isObj ? oldBlessing.reflection || '' : '').trim();
    const blessingId = isObj ? oldBlessing.id : null;

    const cleanTitle = (newFields.title || oldTitle).trim();
    const cleanReflection = (newFields.reflection || oldReflection).trim();
    const rawAuthor = (newFields.author !== undefined ? newFields.author : (isObj ? oldBlessing.author || '' : '')).trim();
    const cleanAuthor = (rawAuthor && rawAuthor !== 'محب للخير') ? rawAuthor : null;
    const cleanProof = (newFields.proof !== undefined ? newFields.proof : (isObj ? oldBlessing.proof || '' : '')).trim();
    const cleanProofSource = (newFields.proofSource !== undefined ? newFields.proofSource : (isObj ? oldBlessing.proofSource || '' : '')).trim();

    const updatePayload = {
      title: cleanTitle,
      reflection: cleanReflection,
      author: cleanAuthor,
      proof: cleanProof || null,
      proof_source: cleanProofSource || null
    };

    let updatedRow = null;
    let lastError = null;

    // 1. Try updating by original title and reflection (most unique match)
    if (oldTitle && oldReflection) {
      const res = await supabase
        .from('blessings')
        .update(updatePayload)
        .eq('title', oldTitle)
        .eq('reflection', oldReflection)
        .select();

      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        updatedRow = res.data[0];
      } else if (res.error) {
        lastError = res.error;
      }
    }

    // 2. Fallback: match by old title only
    if (!updatedRow && oldTitle) {
      const res = await supabase
        .from('blessings')
        .update(updatePayload)
        .eq('title', oldTitle)
        .select();

      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        updatedRow = res.data[0];
      } else if (res.error) {
        lastError = res.error;
      }
    }

    // 3. Fallback: match by numeric/UUID id if not synthetic
    if (!updatedRow && blessingId && !String(blessingId).startsWith('sb_') && !String(blessingId).startsWith('custom_')) {
      const res = await supabase
        .from('blessings')
        .update(updatePayload)
        .eq('id', blessingId)
        .select();

      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        updatedRow = res.data[0];
      } else if (res.error) {
        lastError = res.error;
      }
    }

    const formattedUpdated = formatSharedBlessing(
      updatedRow || { ...(isObj ? oldBlessing : {}), ...updatePayload },
      blessingId || Date.now()
    );

    return {
      success: true,
      data: formattedUpdated,
      persistedRemote: Boolean(updatedRow),
      error: lastError
    };
  } catch (err) {
    console.warn('Update shared blessing error:', err);
    return {
      success: false,
      error: err
    };
  }
}

/**
 * Increment praises count for a blessing
 */
export async function incrementBlessingPraises(blessingId) {
  try {
    const { data: current } = await supabase
      .from('blessings')
      .select('praises_count')
      .eq('id', blessingId)
      .single();

    if (current) {
      const nextCount = (current.praises_count || 0) + 1;
      await supabase
        .from('blessings')
        .update({ praises_count: nextCount })
        .eq('id', blessingId);
      return nextCount;
    }
  } catch (err) {
    // Non-critical: column might not exist or network unavailable
  }
  return null;
}

/**
 * Record a blessing as permanently deleted by admin in Supabase
 * (Syncs across all devices so built-in and shared blessings vanish globally)
 */
export async function recordAdminDeletedBlessing(blessingItem, adminEmail = '') {
  try {
    const isObj = typeof blessingItem === 'object' && blessingItem !== null;
    const rawId = isObj ? String(blessingItem.id || '') : String(blessingItem || '');
    const title = isObj ? (blessingItem.title || '').trim() : '';
    const recordId = rawId || `del_${simpleHash(title)}_${Date.now()}`;

    const payload = {
      id: recordId,
      blessing_title: title || rawId,
      deleted_by: adminEmail || 'admin',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('admin_deleted_blessings')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Error recording admin deleted blessing in Supabase:', error);
    }
    return { success: !error, data, error };
  } catch (err) {
    console.warn('Failed to record admin deleted blessing:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch all blessings permanently deleted by admin from Supabase
 */
export async function fetchAdminDeletedBlessings() {
  try {
    const { data, error } = await supabase
      .from('admin_deleted_blessings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch admin deleted blessings:', err);
    return [];
  }
}

/**
 * Subscribe to admin_deleted_blessings table in realtime
 */
export function subscribeToAdminDeletedBlessings(onDeleted, onRestored) {
  try {
    const channel = supabase
      .channel('realtime_admin_deleted_blessings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_deleted_blessings' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            if (typeof onDeleted === 'function') {
              onDeleted(payload.new);
            }
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onRestored === 'function') {
              onRestored(payload.old);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Admin deleted blessings realtime subscription error:', err);
    return () => {};
  }
}

/**
 * Submit a report for an inappropriate or erroneous blessing
 */
export async function submitBlessingReport({ blessingId, blessingTitle, reason, notes }) {
  const reportObj = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    blessing_id: String(blessingId || ''),
    blessing_title: (blessingTitle || '').trim(),
    reason: (reason || 'محتوى غير لائق').trim(),
    notes: (notes || '').trim(),
    created_at: new Date().toISOString(),
    status: 'pending'
  };

  let remoteSuccess = false;
  let remoteError = null;

  // 1. Store in Supabase 'reports' table
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([reportObj])
      .select();

    if (!error) {
      remoteSuccess = true;
    } else {
      remoteError = error;
      console.warn('Supabase report insert error:', error);
    }
  } catch (err) {
    remoteError = err;
    console.warn('Network / report insert error:', err);
  }

  // 2. Increment reports count on the blessing in 'blessings' table if present
  try {
    if (blessingTitle) {
      const { data: found } = await supabase
        .from('blessings')
        .select('title, reports')
        .eq('title', blessingTitle)
        .limit(1);

      if (found && found.length > 0) {
        const nextReports = (Number(found[0].reports) || 0) + 1;
        await supabase
          .from('blessings')
          .update({ reports: nextReports })
          .eq('title', blessingTitle);
      }
    }
  } catch (err) {
    // Non-critical
  }

  // 3. Persist in localStorage cache as fallback / local history
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_reports_cache') || '[]');
    cached.unshift(reportObj);
    localStorage.setItem('nemaa_reports_cache', JSON.stringify(cached));
  } catch {}

  return { success: true, remoteSuccess, error: remoteError, report: reportObj };
}

/**
 * Fetch all reports (from Supabase or local cache)
 */
export async function fetchBlessingReports() {
  let reports = [];
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      reports = data;
    }
  } catch (err) {
    console.warn('Failed to query Supabase reports:', err);
  }

  // Merge with local cache
  try {
    const local = JSON.parse(localStorage.getItem('nemaa_reports_cache') || '[]');
    local.forEach(r => {
      if (!reports.some(item => item.id === r.id)) {
        reports.push(r);
      }
    });
  } catch {}

  return reports;
}

/**
 * Dismiss / resolve a report
 */
export async function dismissBlessingReport(reportId) {
  try {
    await supabase.from('reports').delete().eq('id', reportId);
  } catch (err) {
    console.warn('Error deleting report from Supabase:', err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_reports_cache') || '[]');
    const filtered = cached.filter(r => r.id !== reportId);
    localStorage.setItem('nemaa_reports_cache', JSON.stringify(filtered));
  } catch {}

  return { success: true };
}

/**
 * Realtime subscription to reports (for live admin dashboard)
 */
export function subscribeToReports(onNewReport, onDeleteReport) {
  try {
    const channel = supabase
      .channel('realtime_reports_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            if (typeof onNewReport === 'function') {
              onNewReport(payload.new);
            }
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onDeleteReport === 'function') {
              onDeleteReport(payload.old);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Reports realtime subscription error:', err);
    return () => {};
  }
}

/**
 * Admin Authentication via Supabase Auth User
 */
export async function adminLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || '').trim(),
      password: password
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminLogout() {
  try {
    await supabase.auth.signOut();
  } catch {}
  return { success: true };
}

export async function getAdminUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Subscribe to realtime inserts and deletes on the 'blessings' table
 */
export function subscribeToSharedBlessings(onNewBlessing, onDeleteBlessing, onUpdateBlessing) {
  try {
    const channel = supabase
      .channel('realtime_shared_blessings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blessings' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            const formatted = formatSharedBlessing(payload.new, Date.now());
            if (typeof onNewBlessing === 'function') {
              onNewBlessing(formatted);
            }
          } else if (payload && payload.eventType === 'UPDATE' && payload.new) {
            const formatted = formatSharedBlessing(payload.new, Date.now());
            if (typeof onUpdateBlessing === 'function') {
              onUpdateBlessing(formatted, payload.old);
            }
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onDeleteBlessing === 'function') {
              onDeleteBlessing(payload.old);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

/**
 * ========================================================
 * Feedback, Suggestions & Complaints System (الشكاوى والمقترحات)
 * ========================================================
 */

/**
 * Submit feedback or a suggestion from any user
 */
export async function submitFeedback({ type = 'suggestion', title = '', content = '', userName = '', contact = '' }) {
  const feedbackObj = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: type || 'suggestion', // 'suggestion' | 'complaint' | 'other'
    title: (title || '').trim(),
    content: (content || '').trim(),
    user_name: (userName || '').trim() || null,
    contact: (contact || '').trim() || null,
    status: 'pending', // 'pending' | 'accepted' | 'rejected'
    admin_notes: null,
    created_at: new Date().toISOString()
  };

  let remoteSuccess = false;
  let remoteError = null;

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackObj])
      .select();

    if (!error) {
      remoteSuccess = true;
    } else {
      remoteError = error;
      console.warn('Supabase feedback insert error:', error);
    }
  } catch (err) {
    remoteError = err;
    console.warn('Feedback insert network error:', err);
  }

  // Local storage cache fallback
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    cached.unshift(feedbackObj);
    localStorage.setItem('nemaa_feedback_cache', JSON.stringify(cached));
  } catch {}

  return { success: true, remoteSuccess, error: remoteError, feedback: feedbackObj };
}

/**
 * Fetch all feedback items for the admin panel
 */
export async function fetchFeedback() {
  let list = [];
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      list = data;
    }
  } catch (err) {
    console.warn('Failed to query feedback from Supabase:', err);
  }

  // Merge with local fallback
  try {
    const local = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    local.forEach(item => {
      if (!list.some(f => f.id === item.id)) {
        list.push(item);
      }
    });
  } catch {}

  return list;
}

/**
 * Update feedback status (accept or reject) with optional admin notes
 */
export async function updateFeedbackStatus(feedbackId, status = 'accepted', adminNotes = '') {
  try {
    await supabase
      .from('feedback')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);
  } catch (err) {
    console.warn('Error updating feedback status in Supabase:', err);
  }

  // Update local cache
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    const updated = cached.map(f => f.id === feedbackId ? { ...f, status, admin_notes: adminNotes } : f);
    localStorage.setItem('nemaa_feedback_cache', JSON.stringify(updated));
  } catch {}

  return { success: true };
}

/**
 * Delete feedback item
 */
export async function deleteFeedback(feedbackId) {
  try {
    await supabase.from('feedback').delete().eq('id', feedbackId);
  } catch (err) {
    console.warn('Error deleting feedback from Supabase:', err);
  }

  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    const filtered = cached.filter(f => f.id !== feedbackId);
    localStorage.setItem('nemaa_feedback_cache', JSON.stringify(filtered));
  } catch {}

  return { success: true };
}

/**
 * Realtime subscription for feedback items
 */
export function subscribeToFeedback(onNewFeedback, onDeleteFeedback, onUpdateFeedback) {
  try {
    const channel = supabase
      .channel('realtime_feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            if (typeof onNewFeedback === 'function') {
              onNewFeedback(payload.new);
            }
          } else if (payload && payload.eventType === 'UPDATE' && payload.new) {
            if (typeof onUpdateFeedback === 'function') {
              onUpdateFeedback(payload.new, payload.old);
            }
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onDeleteFeedback === 'function') {
              onDeleteFeedback(payload.old);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Feedback realtime subscription error:', err);
    return () => {};
  }
}

