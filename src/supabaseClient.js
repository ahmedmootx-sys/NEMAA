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
function simpleHash(str = '') {
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
  const author = (raw.author || '').trim() || 'محب للخير';
  const id = raw.id ? String(raw.id) : `sb_${simpleHash(title + reflection)}_${index}`;

  return {
    id,
    title,
    reflection,
    author,
    category: raw.category || 'hidden',
    categoryName: raw.category_name || raw.categoryName || 'نعم متشارَكة',
    proof: raw.proof || '',
    proofSource: raw.proof_source || raw.proofSource || (author !== 'محب للخير' ? `مشاركة بواسطة: ${author}` : ''),
    proofType: raw.proof_type || raw.proofType || 'wisdom',
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 
      ? raw.tags 
      : ['نعمة_متشارَكة', 'مجتمع_نعمة'],
    isShared: true,
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

    return data.map((item, idx) => formatSharedBlessing(item, idx));
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
  const cleanAuthor = (author || '').trim() || 'محب للخير';
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
 * Subscribe to realtime inserts on the 'blessings' table
 */
export function subscribeToSharedBlessings(onNewBlessing) {
  try {
    const channel = supabase
      .channel('realtime_shared_blessings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'blessings' },
        (payload) => {
          if (payload && payload.new) {
            const formatted = formatSharedBlessing(payload.new, Date.now());
            onNewBlessing(formatted);
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
