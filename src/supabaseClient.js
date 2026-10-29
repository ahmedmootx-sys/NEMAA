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
  const stableKey = raw.created_at ? (title + '_' + raw.created_at) : (title + '_' + reflection);
  const id = raw.id ? String(raw.id) : (raw.client_id || `sb_${simpleHash(stableKey)}`);

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

    const baseObj = updatedRow || { ...(isObj ? oldBlessing : {}), ...updatePayload };
    const preserveId = (isObj && oldBlessing.id) ? String(oldBlessing.id) : (blessingId ? String(blessingId) : null);
    const formattedUpdated = {
      ...formatSharedBlessing(baseObj, 0),
      id: preserveId || baseObj.id || `sb_${simpleHash(cleanTitle)}`
    };

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

// Live Realtime Praise Broadcast Channel
let praisesBroadcastChannel = null;

export function getPraisesBroadcastChannel() {
  if (!praisesBroadcastChannel) {
    praisesBroadcastChannel = supabase.channel('nemaa_praises_live', {
      config: { broadcast: { self: false } }
    });
    praisesBroadcastChannel.subscribe();
  }
  return praisesBroadcastChannel;
}

/**
 * Broadcast praise event to all connected users in real time
 */
export async function broadcastPraiseEvent({ blessingId, blessingTitle, author = '', newCount = 1 }) {
  try {
    const channel = getPraisesBroadcastChannel();
    await channel.send({
      type: 'broadcast',
      event: 'praise_given',
      payload: {
        blessingId: String(blessingId || ''),
        blessingTitle: (blessingTitle || '').trim(),
        author: (author || '').trim(),
        newCount: Number(newCount) || 1,
        timestamp: Date.now()
      }
    });
  } catch (err) {
    console.warn('Broadcast praise error:', err);
  }
}

/**
 * Subscribe to live praise events from other users
 */
export function subscribeToLivePraises(onPraiseReceived) {
  try {
    const channel = getPraisesBroadcastChannel();
    channel.on('broadcast', { event: 'praise_given' }, (event) => {
      if (event && event.payload && typeof onPraiseReceived === 'function') {
        onPraiseReceived(event.payload);
      }
    });
    return () => {};
  } catch (err) {
    console.warn('Subscribe to live praises error:', err);
    return () => {};
  }
}

/**
 * Persist praise count to Supabase (via reports table praise_sync)
 */
export async function recordBlessingPraise(blessingId, blessingTitle, newCount, author = '') {
  const cleanTitle = (blessingTitle || '').trim();
  const recordId = `praise_${simpleHash(cleanTitle || blessingId)}`;

  try {
    await supabase.from('reports').upsert({
      id: recordId,
      blessing_title: cleanTitle,
      reason: 'praise_sync',
      notes: String(newCount),
      status: 'praise'
    });
  } catch (err) {
    console.warn('Error recording praise in Supabase:', err);
  }

  // Broadcast instantly to all users
  broadcastPraiseEvent({ blessingId, blessingTitle: cleanTitle, author, newCount });
}

/**
 * Fetch all persisted praise counts from Supabase
 */
export async function fetchAllPersistedPraises() {
  const praisesMap = {};
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('blessing_title, notes')
      .eq('reason', 'praise_sync');

    if (!error && Array.isArray(data)) {
      data.forEach(row => {
        const title = (row.blessing_title || '').trim();
        const count = parseInt(row.notes, 10);
        if (title && !isNaN(count)) {
          praisesMap[title] = count;
        }
      });
    }
  } catch (err) {
    console.warn('Error fetching persisted praises:', err);
  }
  return praisesMap;
}

/**
 * Increment praises count for a blessing
 */
export async function incrementBlessingPraises(blessingId, blessingTitle = '', currentCount = 0, author = '') {
  const nextCount = (Number(currentCount) || 0) + 1;
  await recordBlessingPraise(blessingId, blessingTitle, nextCount, author);
  return nextCount;
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

  // Filter OUT suggestions, complaints, and praise sync records
  return reports.filter(r => {
    if (!r) return false;
    if (r.reason === 'praise_sync') return false;
    const isFeedback = (r.reason === 'اقتراح وتطوير' || r.reason === 'شكوى أو مشكلة' ||
      (r.blessing_title && (r.blessing_title.startsWith('[اقتراح]') || r.blessing_title.startsWith('[شكوى]'))));
    return !isFeedback;
  });
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
 * Submit feedback or a suggestion from any user (Dual Smart Routing)
 * Attempts to save to 'feedback' table; if missing/unreachable, gracefully falls back to 'reports' table.
 */
export async function submitFeedback({ type = 'suggestion', title = '', content = '', userName = '', contact = '' }) {
  const cleanTitle = (title || '').trim();
  const cleanContent = (content || '').trim();
  const cleanUserName = (userName || '').trim();
  const cleanContact = (contact || '').trim();

  const feedbackObj = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: type || 'suggestion', // 'suggestion' | 'complaint' | 'other'
    title: cleanTitle,
    content: cleanContent,
    user_name: cleanUserName || null,
    contact: cleanContact || null,
    status: 'pending', // 'pending' | 'accepted' | 'rejected'
    admin_notes: null,
    created_at: new Date().toISOString()
  };

  let remoteSuccess = false;
  let remoteError = null;

  // 1. Try 'feedback' table first
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackObj])
      .select();

    if (!error && Array.isArray(data) && data.length > 0) {
      remoteSuccess = true;
    } else if (error) {
      remoteError = error;
    }
  } catch (err) {
    remoteError = err;
  }

  // 2. If 'feedback' table not found or errored, use resilient fallback into 'reports'
  if (!remoteSuccess) {
    try {
      const typeLabel = feedbackObj.type === 'complaint' ? 'شكوى' : 'اقتراح';
      const reasonLabel = feedbackObj.type === 'complaint' ? 'شكوى أو مشكلة' : 'اقتراح وتطوير';
      const contactInfo = `[بيانات التواصل: ${cleanUserName || 'فاعل خير'} | ${cleanContact || 'بدون'}]`;
      const combinedNotes = `${cleanContent}\n\n${contactInfo}`;

      const reportPayload = {
        id: feedbackObj.id,
        blessing_id: 'feedback_entry',
        blessing_title: `[${typeLabel}] ${cleanTitle}`,
        reason: reasonLabel,
        notes: combinedNotes,
        status: 'pending',
        created_at: feedbackObj.created_at
      };

      const res = await supabase
        .from('reports')
        .insert([reportPayload])
        .select();

      if (!res.error) {
        remoteSuccess = true;
        remoteError = null;
      }
    } catch (fallbackErr) {
      console.warn('Fallback insert to reports error:', fallbackErr);
    }
  }

  // 3. Local storage cache fallback
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    cached.unshift(feedbackObj);
    localStorage.setItem('nemaa_feedback_cache', JSON.stringify(cached));
  } catch {}

  return { success: true, remoteSuccess, error: remoteError, feedback: feedbackObj };
}

/**
 * Helper to convert a report row into standard feedback item
 */
function parseReportToFeedback(rep) {
  const isComplaint = (rep.reason || '').includes('شكوى') || (rep.blessing_title || '').includes('[شكوى]');
  let cleanTitle = (rep.blessing_title || '').replace(/^\[(شكوى|اقتراح)\]\s*/, '').trim();
  let content = rep.notes || '';
  let userName = '';
  let contact = '';

  const match = content.match(/\[بيانات التواصل:\s*(.*?)\s*\|\s*(.*?)\]$/);
  if (match) {
    userName = match[1] === 'فاعل خير' ? '' : match[1];
    contact = match[2] === 'بدون' ? '' : match[2];
    content = content.replace(/\n\n\[بيانات التواصل:.*?\]$/, '').trim();
  }

  return {
    id: rep.id,
    type: isComplaint ? 'complaint' : 'suggestion',
    title: cleanTitle || 'بدون عنوان',
    content: content,
    user_name: userName || null,
    contact: contact || null,
    status: rep.status || 'pending',
    admin_notes: null,
    created_at: rep.created_at,
    sourceTable: 'reports'
  };
}

/**
 * Fetch all feedback items for the admin panel (from feedback table + reports fallback)
 */
export async function fetchFeedback() {
  const list = [];
  const seenIds = new Set();

  // 1. Fetch from 'feedback' table
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          list.push(item);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to query feedback table:', err);
  }

  // 2. Fetch feedback items routed through 'reports' table
  try {
    const { data: repData, error: repError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!repError && Array.isArray(repData)) {
      repData.forEach(rep => {
        const isFeedbackType = (rep.reason === 'اقتراح وتطوير' || rep.reason === 'شكوى أو مشكلة' || 
          (rep.blessing_title && (rep.blessing_title.startsWith('[اقتراح]') || rep.blessing_title.startsWith('[شكوى]'))));
        if (isFeedbackType && rep.id && !seenIds.has(rep.id)) {
          seenIds.add(rep.id);
          list.push(parseReportToFeedback(rep));
        }
      });
    }
  } catch (err) {
    console.warn('Failed to query reports for feedback:', err);
  }

  // 3. Merge with local fallback
  try {
    const local = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    local.forEach(item => {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        list.push(item);
      }
    });
  } catch {}

  // Sort newest first
  list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return list;
}

/**
 * Update feedback status (accept or reject) with optional admin notes
 */
export async function updateFeedbackStatus(feedbackId, status = 'accepted', adminNotes = '') {
  // Update in 'feedback' table
  try {
    await supabase
      .from('feedback')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);
  } catch {}

  // Also update in 'reports' table if it was stored there
  try {
    await supabase
      .from('reports')
      .update({
        status,
        notes: adminNotes ? `[ملاحظة الأدمن: ${adminNotes}]` : undefined
      })
      .eq('id', feedbackId);
  } catch {}

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
  // Delete from 'feedback'
  try {
    await supabase.from('feedback').delete().eq('id', feedbackId);
  } catch {}

  // Delete from 'reports'
  try {
    await supabase.from('reports').delete().eq('id', feedbackId);
  } catch {}

  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_feedback_cache') || '[]');
    const filtered = cached.filter(f => f.id !== feedbackId);
    localStorage.setItem('nemaa_feedback_cache', JSON.stringify(filtered));
  } catch {}

  return { success: true };
}

/**
 * Realtime subscription for feedback items (subscribes to feedback and reports fallback)
 */
export function subscribeToFeedback(onNewFeedback, onDeleteFeedback, onUpdateFeedback) {
  const channels = [];

  try {
    const channel1 = supabase
      .channel('realtime_feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            if (typeof onNewFeedback === 'function') onNewFeedback(payload.new);
          } else if (payload && payload.eventType === 'UPDATE' && payload.new) {
            if (typeof onUpdateFeedback === 'function') onUpdateFeedback(payload.new, payload.old);
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onDeleteFeedback === 'function') onDeleteFeedback(payload.old);
          }
        }
      )
      .subscribe();
    channels.push(channel1);

    const channel2 = supabase
      .channel('realtime_reports_feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload && payload.new) {
            const isFeedback = (payload.new.reason === 'اقتراح وتطوير' || payload.new.reason === 'شكوى أو مشكلة' ||
              (payload.new.blessing_title && (payload.new.blessing_title.startsWith('[اقتراح]') || payload.new.blessing_title.startsWith('[شكوى]'))));
            if (isFeedback) {
              const formatted = parseReportToFeedback(payload.new);
              if (payload.eventType === 'INSERT' && typeof onNewFeedback === 'function') {
                onNewFeedback(formatted);
              } else if (payload.eventType === 'UPDATE' && typeof onUpdateFeedback === 'function') {
                onUpdateFeedback(formatted, payload.old);
              }
            }
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onDeleteFeedback === 'function') onDeleteFeedback(payload.old);
          }
        }
      )
      .subscribe();
    channels.push(channel2);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  } catch (err) {
    console.warn('Feedback realtime subscription error:', err);
    return () => {};
  }
}

