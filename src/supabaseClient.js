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
    category: raw.category || 'hidden',
    categoryName: raw.category_name || raw.categoryName || 'نعم متشارَكة',
    proof: raw.proof || '',
    proofSource: raw.proof_source || raw.proofSource || (author ? `مشاركة بواسطة: ${author}` : ''),
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
        success = true;
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
        success = true;
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
        success = true;
      } else {
        lastError = res.error;
      }
    }

    if (success) {
      return { success: true };
    }
    if (lastError) {
      console.warn('Supabase delete error:', lastError);
      return { success: false, error: lastError };
    }
    return { success: true };
  } catch (err) {
    console.warn('Delete error:', err);
    return { success: false, error: err };
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
 * Submit a report for an inappropriate or erroneous blessing
 */
export async function submitBlessingReport({ blessingId, blessingTitle, reason, notes }) {
  const reportObj = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    blessing_id: String(blessingId),
    blessing_title: blessingTitle || '',
    reason: reason || 'محتوى غير لائق',
    notes: notes || '',
    created_at: new Date().toISOString(),
    status: 'pending'
  };

  // 1. Try storing in Supabase 'reports' table
  try {
    await supabase.from('reports').insert([reportObj]);
  } catch (err) {}

  // 2. Always persist in localStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_reports_cache') || '[]');
    cached.unshift(reportObj);
    localStorage.setItem('nemaa_reports_cache', JSON.stringify(cached));
  } catch {}

  return { success: true, report: reportObj };
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
  } catch (err) {}

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
  } catch {}
  try {
    const cached = JSON.parse(localStorage.getItem('nemaa_reports_cache') || '[]');
    const filtered = cached.filter(r => r.id !== reportId);
    localStorage.setItem('nemaa_reports_cache', JSON.stringify(filtered));
  } catch {}
  return { success: true };
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
export function subscribeToSharedBlessings(onNewBlessing, onDeleteBlessing) {
  try {
    const channel = supabase
      .channel('realtime_shared_blessings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blessings' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            const formatted = formatSharedBlessing(payload.new, Date.now());
            onNewBlessing(formatted);
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
