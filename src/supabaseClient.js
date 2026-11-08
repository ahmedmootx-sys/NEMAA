import { createClient } from '@supabase/supabase-js';
import { readStoredArray } from './utils/safeStorage.js';

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

// ============================================================================
// نظام الملكية والأخطاء (يعمل مع ملف الترحيل الأمني 01_migration.sql)
// ============================================================================
// كل نعمة تُنشر تحصل على "رمز مالك" عشوائي (128 بت) يُحفظ في هذا الجهاز وفي حساب
// المستخدم إن كان مسجّلاً. الخادم لا يخزّن إلا بصمة SHA-256 للرمز، ولا يسمح بالتعديل
// أو الحذف إلا لمن يملك الرمز (أو للمدير).
const OWNER_TOKENS_KEY = 'nemaa_owner_tokens';
const MAX_OWNER_TOKENS = 100;
const ADMIN_PUBLIC_LABEL = 'إدارة منصة نِعْمَة';

function randomHex(bytes = 16) {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('secure_random_unavailable');
  }
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isValidToken(t) {
  return typeof t === 'string' && t.length >= 16 && t.length <= 128 && /^[A-Za-z0-9_-]+$/.test(t);
}

/** رموز الملكية المحفوظة في هذا الجهاز (الأحدث أولاً) */
export function getOwnerTokens() {
  try {
    const raw = JSON.parse(localStorage.getItem(OWNER_TOKENS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(isValidToken).slice(0, MAX_OWNER_TOKENS) : [];
  } catch {
    return [];
  }
}

function saveOwnerTokens(list) {
  try {
    localStorage.setItem(OWNER_TOKENS_KEY, JSON.stringify(list.slice(0, MAX_OWNER_TOKENS)));
  } catch {}
}

function addOwnerToken(token) {
  saveOwnerTokens([token, ...getOwnerTokens().filter((t) => t !== token)]);
  syncOwnerTokensWithCloud().catch(() => {});
}

function removeOwnerToken(token) {
  saveOwnerTokens(getOwnerTokens().filter((t) => t !== token));
}

// ============================================================================
// نسخة المستخدم الاحتياطية في الحساب (رموز الملكية + قائمة نعمه المنشورة)
// ============================================================================
// كانت تُحفظ في user_metadata، وهي تُضمَّن في كل JWT يُرسل مع كل طلب؛ فكلما نشر المؤلف نعماً أكثر
// كبر الرمز حتى يتجاوز حد رؤوس HTTP (نحو 8KB) وتفشل كل طلبات حسابه. الآن تُحفظ في جدول
// user_backup (صف لكل مستخدم، محمي بـ RLS). إن لم يكن الجدول منشوراً بعد نعود للسلوك القديم
// (مع تقليل الحجم) حتى يكتمل ترحيل قاعدة البيانات، وتُهاجَر البيانات القديمة تلقائياً بعدها.
const MAX_CLOUD_BLESSINGS = 150;
const LEGACY_META_MAX_BLESSINGS = 15; // احتياط فقط لحين نشر الجدول

function dedupeKeepOrder(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!seen.has(item)) { seen.add(item); out.push(item); }
  }
  return out;
}

function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function blessingTitleOf(b) {
  return (b && typeof b.title === 'string' ? b.title : '').trim();
}

/** دمج قائمتين بحسب العنوان (الأحدث يغلب) مع الحد الأقصى */
function mergeBlessingLists(...lists) {
  const byTitle = new Map();
  for (const list of lists) {
    for (const b of Array.isArray(list) ? list : []) {
      const t = blessingTitleOf(b);
      if (!t) continue;
      const prev = byTitle.get(t);
      if (!prev || Number(b.timestamp || 0) >= Number(prev.timestamp || 0)) byTitle.set(t, b);
    }
  }
  return [...byTitle.values()]
    .sort((x, y) => Number(y.timestamp || 0) - Number(x.timestamp || 0))
    .slice(0, MAX_CLOUD_BLESSINGS);
}

async function getAuthedUser(knownUser = null) {
  if (knownUser) return knownUser;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

async function readUserBackup(userId) {
  const { data, error } = await supabase
    .from('user_backup')
    .select('owner_tokens, my_blessings')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { ok: false, reason: classifyBackendError(error), error };
  return { ok: true, row: data || null };
}

async function writeUserBackup(userId, patch) {
  const { error } = await supabase
    .from('user_backup')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return error ? { ok: false, reason: classifyBackendError(error), error } : { ok: true };
}

/** بعد نجاح الحفظ في الجدول فقط: نُفرغ النسخة القديمة من user_metadata لتصغر JWT */
async function clearLegacyMetadata(keys) {
  try {
    const data = {};
    keys.forEach((k) => { data[k] = null; });
    await supabase.auth.updateUser({ data });
  } catch (err) {
    console.warn('clearLegacyMetadata notice:', err);
  }
}

/** السلوك القديم (الجدول غير منشور بعد) */
async function legacySyncTokens(user, local) {
  const { data } = await supabase.auth.getUser();
  const fresh = data?.user || user;
  const cloud = Array.isArray(fresh?.user_metadata?.owner_tokens)
    ? fresh.user_metadata.owner_tokens.filter(isValidToken)
    : [];
  const merged = dedupeKeepOrder([...local, ...cloud]).slice(0, MAX_OWNER_TOKENS);
  saveOwnerTokens(merged);
  if (!sameList(merged, cloud)) {
    await supabase.auth.updateUser({ data: { owner_tokens: merged } });
  }
  return true;
}

/**
 * دمج رموز الملكية بين هذا الجهاز وحساب المستخدم (إن كان مسجّلاً)
 * حتى لا يفقد المؤلف صلاحية تعديل نعمه عند تغيير المتصفح أو الجهاز.
 */
export async function syncOwnerTokensWithCloud(knownUser = null) {
  try {
    const user = await getAuthedUser(knownUser);
    if (!user) return false;

    const local = getOwnerTokens();
    const legacy = Array.isArray(user.user_metadata?.owner_tokens)
      ? user.user_metadata.owner_tokens.filter(isValidToken)
      : [];

    const rb = await readUserBackup(user.id);
    if (!rb.ok) {
      if (rb.reason === 'not_deployed') return await legacySyncTokens(user, local);
      return false;
    }

    const stored = Array.isArray(rb.row?.owner_tokens) ? rb.row.owner_tokens.filter(isValidToken) : [];
    const merged = dedupeKeepOrder([...local, ...stored, ...legacy]).slice(0, MAX_OWNER_TOKENS);
    saveOwnerTokens(merged);

    if (!sameList(merged, stored)) {
      const w = await writeUserBackup(user.id, { owner_tokens: merged });
      if (!w.ok) return false;
    }
    if (legacy.length) await clearLegacyMetadata(['owner_tokens']);
    return true;
  } catch (err) {
    console.warn('syncOwnerTokensWithCloud notice:', err);
    return false;
  }
}

/**
 * قبل تسجيل الخروج: نتأكد أن كل الرموز محفوظة في الحساب، ثم نمسحها من هذا الجهاز مع قائمة «نعمي المنشورة»،
 * حتى لا تنتقل نعم مستخدم سابق إلى حساب من يسجّل دخوله بعده على نفس الجهاز.
 * ترجع true إن مُسحت البيانات المحلية؛ وإن فشلت المزامنة تُترك كما هي (لا نُضيّع صلاحية أحد).
 */
export async function prepareForSignOut() {
  try {
    const synced = await syncOwnerTokensWithCloud();
    if (!synced) return false;
    return true;
  } catch {
    return false;
  }
}

/** يُستدعى بعد نجاح تسجيل الخروج وبعد prepareForSignOut() → true */
export function clearLocalOwnerData() {
  try {
    [OWNER_TOKENS_KEY, 'nemaa_my_published_blessings', 'nemaa_my_published_ids', 'nemaa_my_published_history']
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/** الرموز المستخدمة لقراءة الإشعارات: معرّف الجهاز (للمُبلّغين) + رموز النعم (للمؤلفين) */
function getNotificationTokens() {
  const devId = getReporterDeviceId();
  const tokens = [];
  if (isValidToken(devId) && !devId.startsWith('rep_device_')) tokens.push(devId);
  return [...tokens, ...getOwnerTokens()];
}

const KNOWN_BACKEND_ERRORS = [
  'invalid_title', 'invalid_reflection', 'invalid_input', 'invalid_token', 'rate_limited',
  'not_authorized', 'not_found', 'no_owner', 'no_target', 'invalid_kind', 'too_many_titles'
];

/** تحويل أي خطأ من Supabase إلى رمز سبب ثابت */
export function classifyBackendError(error) {
  if (!error) return null;
  const msg = String(error.message || error);
  const code = String(error.code || '');
  const hit = KNOWN_BACKEND_ERRORS.find((k) => msg.includes(k));
  if (hit) return hit;
  if (code === '23505' || /duplicate key/i.test(msg)) return 'duplicate_title';
  if (['PGRST202', '42883', 'PGRST205', '42P01'].includes(code)) return 'not_deployed';
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) return 'forbidden';
  if (!code && /fetch|network|timeout|failed/i.test(msg)) return 'network';
  return 'unknown';
}

const BACKEND_MESSAGES = {
  ar: {
    duplicate_title: 'هذه النعمة منشورة بالفعل بهذا العنوان في المنصة، يُرجى تمييز العنوان أو إضافة لمستك الخاصة',
    rate_limited: 'تم تنفيذ عدد كبير من الطلبات في وقت قصير. انتظر دقيقة ثم حاول مرة أخرى.',
    invalid_title: 'عنوان النعمة غير صالح (يجب ألا يزيد عن 120 حرفاً).',
    invalid_reflection: 'نص التدبّر غير صالح (يجب ألا يزيد عن 2000 حرف).',
    invalid_input: 'أحد الحقول أطول من المسموح به.',
    not_authorized: 'لا تملك صلاحية تعديل أو حذف هذه النعمة من هذا الجهاز. إن كانت قد نُشرت من جهاز أو متصفح آخر فسجّل دخولك بنفس الحساب هناك أولاً، أو تواصل مع الإدارة.',
    no_owner: 'هذه النعمة قديمة ولا يوجد لها مالك مسجّل، لذلك لا يمكن مراسلة صاحبها من هنا.',
    no_target: 'لا يتوفر معرّف جهاز المُبلّغ في هذا البلاغ، لذلك لا يمكن إرسال استفسار له.',
    too_many_titles: 'تعذر تسجيل التسبيح حالياً، حاول لاحقاً.',
    not_deployed: 'المنصة قيد التحديث الآن، يرجى المحاولة بعد دقائق.',
    forbidden: 'غير مسموح بتنفيذ هذا الإجراء.',
    network: 'تعذر الاتصال بالخادم، تحقق من الإنترنت وحاول مجدداً.',
    unknown: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
  },
  en: {
    duplicate_title: 'A blessing with this title already exists. Please choose a distinctive title.',
    rate_limited: 'Too many requests in a short time. Please wait a minute and try again.',
    invalid_title: 'Invalid blessing title (max 120 characters).',
    invalid_reflection: 'Invalid reflection text (max 2000 characters).',
    invalid_input: 'One of the fields is longer than allowed.',
    not_authorized: 'You do not have permission to edit or delete this blessing from this device. If it was published from another browser, sign in with the same account there first, or contact the admins.',
    no_owner: 'This blessing is legacy and has no registered owner, so its author cannot be messaged from here.',
    no_target: 'This report has no reporter device id, so an inquiry cannot be sent.',
    too_many_titles: 'Could not record the praise right now, please try later.',
    not_deployed: 'The platform is being updated. Please try again in a few minutes.',
    forbidden: 'This action is not allowed.',
    network: 'Could not reach the server. Check your connection and try again.',
    unknown: 'An unexpected error occurred, please try again.'
  }
};

export function explainBackendError(reason, lang = 'ar') {
  const table = BACKEND_MESSAGES[lang === 'ar' ? 'ar' : 'en'];
  return table[reason] || table.unknown;
}

/** يمنع تكرار الاستدعاء أكثر من مرة كل `ms` (مع تنفيذ أخير مؤجَّل) — حماية من إشارات مزوَّرة */
function makeThrottle(fn, ms) {
  let last = 0;
  let timer = null;
  return () => {
    const wait = ms - (Date.now() - last);
    if (wait <= 0) {
      last = Date.now();
      fn();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn();
      }, wait);
    }
  };
}

/** إشارة بلا محتوى عبر قناة البث: المستقبِل يعيد الجلب من قاعدة البيانات ولا يثق بالحمولة */
async function sendBroadcastPing(event) {
  try {
    const channel = getPraisesBroadcastChannel();
    await channel.send({ type: 'broadcast', event, payload: { ts: Date.now() } });
  } catch (err) {
    console.warn('Broadcast ping error:', err);
  }
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
 * Publish a new blessing through the secure server function.
 * The server stores only a hash of the owner token, so only this device (or the
 * user's account) can later edit or delete the blessing.
 * options.restore = true → used by the admin archive restore (blessing stays ownerless/admin-managed)
 */
export async function publishSharedBlessing({ title, reflection, author, proof, proofSource }, options = {}) {
  const cleanTitle = (title || '').trim();
  const cleanReflection = (reflection || '').trim();
  if (!cleanTitle || !cleanReflection) {
    return { success: false, reason: 'invalid_input', error: new Error('invalid_input') };
  }

  const asRestore = Boolean(options && options.restore);
  let token;
  try {
    token = randomHex(16);
  } catch (err) {
    return { success: false, reason: 'unknown', error: err };
  }
  // نحفظ الرمز قبل الإرسال حتى لا تضيع الملكية لو انقطع الاتصال بعد نجاح النشر
  if (!asRestore) addOwnerToken(token);

  try {
    const { data, error } = await supabase.rpc('publish_blessing', {
      p_title: cleanTitle,
      p_reflection: cleanReflection,
      p_author: (author || '').trim(),
      p_proof: (proof || '').trim(),
      p_proof_source: (proofSource || '').trim(),
      // استعادة المدير بلا مالك: يقبلها الخادم فقط من المدير
      p_token: asRestore ? null : token
    });

    if (error) {
      // رد قاطع من الخادم (له code) → نحذف الرمز. انقطاع الشبكة (بلا code) → نبقيه لأن النشر قد يكون نجح.
      if (!asRestore && error.code) removeOwnerToken(token);
      return { success: false, reason: classifyBackendError(error), error };
    }

    const row = data && typeof data === 'object' ? data : { title: cleanTitle, reflection: cleanReflection };
    const formatted = formatSharedBlessing(row, Date.now());
    if (!asRestore) saveBlessingToUserCloud(formatted).catch(() => {});
    return { success: true, data: formatted };
  } catch (err) {
    console.warn('publishSharedBlessing network error:', err);
    return { success: false, reason: 'network', error: err };
  }
}

/**
 * Get current authenticated user safely
 */
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch {
    return null;
  }
}


/** عناوين النعم الموجودة فعلاً في الخادم (لتنظيف «النعم الأشباح» من نسخة الحساب). null عند الفشل. */
async function fetchExistingTitles() {
  try {
    const { data, error } = await supabase.from('blessings').select('title').limit(5000);
    if (error || !Array.isArray(data)) return null;
    return new Set(data.map((r) => (r.title || '').trim()));
  } catch {
    return null;
  }
}

/**
 * Sync and restore published blessings from the user's Supabase cloud account
 * (also merges the owner tokens so the author keeps edit rights on every device)
 */
export async function syncUserCloudBlessings(user) {
  if (!user) return [];
  try {
    await syncOwnerTokensWithCloud(user);
    const legacy = Array.isArray(user.user_metadata?.my_blessings) ? user.user_metadata.my_blessings : [];

    const rb = await readUserBackup(user.id);
    if (!rb.ok) {
      // الجدول غير منشور بعد (أو خطأ عابر): نعرض ما في user_metadata كما كان
      return legacy.map((b) => formatSharedBlessing(b));
    }

    const stored = Array.isArray(rb.row?.my_blessings) ? rb.row.my_blessings : [];
    let list = mergeBlessingLists(stored, legacy);

    // نحذف من القائمة النعم التي لم تعد موجودة في الخادم (حذفها المؤلف أو المدير)
    const existing = await fetchExistingTitles();
    if (existing) list = list.filter((b) => existing.has(blessingTitleOf(b)));

    const changed = list.length !== stored.length || list.some((b, i) => blessingTitleOf(b) !== blessingTitleOf(stored[i]));
    if (changed) {
      const w = await writeUserBackup(user.id, { my_blessings: list });
      if (!w.ok) return list.map((b) => formatSharedBlessing(b));
    }
    if (legacy.length) await clearLegacyMetadata(['my_blessings']);
    return list.map((b) => formatSharedBlessing(b));
  } catch (err) {
    console.warn('syncUserCloudBlessings notice:', err);
  }
  return [];
}

function toCloudEntry(blessing) {
  return {
    id: blessing.id || `cl_${Date.now()}`,
    title: (blessing.title || '').trim(),
    reflection: (blessing.reflection || '').trim(),
    author: (blessing.author || '').trim(),
    proof: (blessing.proof || '').trim(),
    proofSource: (blessing.proofSource || blessing.proof_source || '').trim(),
    category: blessing.category || 'shared',
    categoryName: blessing.categoryName || 'نعم متشارَكة',
    isShared: true,
    timestamp: Date.now()
  };
}

/**
 * Save a newly published or edited blessing to the user's persistent Supabase cloud account
 */
export async function saveBlessingToUserCloud(blessing) {
  try {
    const user = await getAuthedUser();
    if (!user) return false;
    const entry = toCloudEntry(blessing);

    const rb = await readUserBackup(user.id);
    if (!rb.ok) {
      if (rb.reason !== 'not_deployed') return false;
      // السلوك القديم لحين نشر الجدول (مع حد صغير لحجم JWT)
      const { data } = await supabase.auth.getUser();
      const existing = Array.isArray(data?.user?.user_metadata?.my_blessings) ? data.user.user_metadata.my_blessings : [];
      const updated = [entry, ...existing.filter((b) => blessingTitleOf(b) !== entry.title)].slice(0, LEGACY_META_MAX_BLESSINGS);
      await supabase.auth.updateUser({ data: { my_blessings: updated } });
      return true;
    }

    const existing = Array.isArray(rb.row?.my_blessings) ? rb.row.my_blessings : [];
    const updated = mergeBlessingLists([entry], existing.filter((b) => blessingTitleOf(b) !== entry.title));
    const w = await writeUserBackup(user.id, { my_blessings: updated });
    return w.ok;
  } catch (err) {
    console.warn('saveBlessingToUserCloud notice:', err);
    return false;
  }
}

/**
 * Remove a blessing from user's persistent cloud account.
 * يقبل: (كائن النعمة) أو (العنوان) أو (المعرّف, العنوان).
 * (كان يُستدعى بـ (id, title) ويعامل الوسيط الأول كعنوان فلا يحذف شيئاً فتعود النعمة المحذوفة كشبح.)
 */
export async function removeBlessingFromUserCloud(blessingOrIdOrTitle, maybeTitle) {
  try {
    const user = await getAuthedUser();
    if (!user) return false;

    let targetId = null;
    let targetTitle = '';
    if (blessingOrIdOrTitle && typeof blessingOrIdOrTitle === 'object') {
      targetId = blessingOrIdOrTitle.id ? String(blessingOrIdOrTitle.id) : null;
      targetTitle = blessingTitleOf(blessingOrIdOrTitle);
    } else if (typeof maybeTitle === 'string') {
      targetId = blessingOrIdOrTitle ? String(blessingOrIdOrTitle) : null;
      targetTitle = maybeTitle.trim();
    } else {
      targetTitle = String(blessingOrIdOrTitle || '').trim();
    }
    const keep = (b) => !(
      (targetTitle && blessingTitleOf(b) === targetTitle) ||
      (targetId && b && String(b.id) === targetId)
    );

    const rb = await readUserBackup(user.id);
    if (!rb.ok) {
      if (rb.reason !== 'not_deployed') return false;
      const { data } = await supabase.auth.getUser();
      const existing = Array.isArray(data?.user?.user_metadata?.my_blessings) ? data.user.user_metadata.my_blessings : [];
      await supabase.auth.updateUser({ data: { my_blessings: existing.filter(keep) } });
      return true;
    }
    const existing = Array.isArray(rb.row?.my_blessings) ? rb.row.my_blessings : [];
    const filtered = existing.filter(keep);
    if (filtered.length === existing.length) return true;
    const w = await writeUserBackup(user.id, { my_blessings: filtered });
    return w.ok;
  } catch (err) {
    console.warn('removeBlessingFromUserCloud notice:', err);
    return false;
  }
}


/**
 * Delete a blessing through the secure server function (owner token or admin only).
 * Returns { success:false, reason } when the server refuses — callers must not pretend it worked.
 */
export async function deleteSharedBlessing(blessingOrId) {
  try {
    const isObj = typeof blessingOrId === 'object' && blessingOrId !== null;
    const title = isObj ? (blessingOrId.title || '').trim() : String(blessingOrId || '').trim();
    if (!title) {
      return { success: false, reason: 'invalid_title', error: new Error('invalid_title'), deletedCount: 0 };
    }

    const { error } = await supabase.rpc('delete_blessing', {
      p_title: title,
      p_tokens: getOwnerTokens()
    });

    if (error) {
      const reason = classifyBackendError(error);
      // غير موجودة أصلاً (حُذفت سابقاً أو لم تُنشر قط) → النتيجة المطلوبة متحققة
      if (reason === 'not_found') return { success: true, alreadyGone: true, deletedCount: 0 };
      return { success: false, reason, error, deletedCount: 0 };
    }
    return { success: true, deletedCount: 1 };
  } catch (err) {
    console.warn('deleteSharedBlessing error:', err);
    return { success: false, reason: 'network', error: err, deletedCount: 0 };
  }
}


/**
 * Update a published blessing through the secure server function (owner token or admin only).
 */
export async function updateSharedBlessing(oldBlessing, newFields) {
  try {
    if (!oldBlessing || !newFields) {
      return { success: false, reason: 'invalid_input', error: new Error('invalid_input'), persistedRemote: false };
    }
    const oldTitle = (oldBlessing.title || '').trim();
    const cleanTitle = (newFields.title !== undefined ? newFields.title : oldTitle || '').trim();
    const cleanReflection = (newFields.reflection !== undefined ? newFields.reflection : oldBlessing.reflection || '').trim();
    const cleanAuthor = (newFields.author !== undefined ? newFields.author : oldBlessing.author || '').trim();
    const cleanProof = (newFields.proof !== undefined ? newFields.proof : oldBlessing.proof || '').trim();
    const cleanProofSource = (newFields.proofSource !== undefined ? newFields.proofSource : oldBlessing.proofSource || '').trim();

    const { data, error } = await supabase.rpc('update_blessing', {
      p_old_title: oldTitle,
      p_tokens: getOwnerTokens(),
      p_title: cleanTitle,
      p_reflection: cleanReflection,
      p_author: cleanAuthor,
      p_proof: cleanProof,
      p_proof_source: cleanProofSource
    });

    if (error) {
      return { success: false, reason: classifyBackendError(error), error, persistedRemote: false };
    }

    const row = data && typeof data === 'object' ? data : {};
    const formatted = formatSharedBlessing(
      { ...row, title: row.title || cleanTitle, reflection: row.reflection || cleanReflection },
      Date.now()
    );
    // الهوية المحلية للنعمة لا تتغير حتى لو تغيّر العنوان
    if (oldBlessing.id) formatted.id = String(oldBlessing.id);
    return { success: true, data: formatted, persistedRemote: true };
  } catch (err) {
    console.warn('updateSharedBlessing error:', err);
    return { success: false, reason: 'network', error: err, persistedRemote: false };
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
 * Get or generate a persistent anonymous device identifier for this client.
 * Allows delivering admin replies/inquiries to reports without requiring login.
 */
export function getReporterDeviceId() {
  if (typeof window === 'undefined') return 'rep_device_ssr';
  try {
    let devId = localStorage.getItem('nemaa_reporter_device_id');
    if (!devId) {
      try {
        devId = 'dev_' + randomHex(12);
      } catch {
        devId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      }
      localStorage.setItem('nemaa_reporter_device_id', devId);
    }
    return devId;
  } catch {
    return 'rep_device_fallback';
  }
}


/**
 * Send an administrative notification/message to a blessing author (admin only, via server function).
 * The message is stored privately; only a content-free ping goes over the public channel.
 */
export async function adminSendAuthorNotification({
  blessingId = '',
  blessingTitle = '',
  author = '',
  message = '',
  actionType = 'message'
} = {}) {
  try {
    const { data, error } = await supabase.rpc('admin_send_notification', {
      p_kind: 'author_notification',
      p_blessing_title: (blessingTitle || '').trim(),
      p_target_token: null,
      p_message: (message || '').trim(),
      p_action_type: actionType || 'message',
      p_admin_label: ADMIN_PUBLIC_LABEL,
      p_blessing_id: String(blessingId || ''),
      p_author: (author || '').trim()
    });
    if (error) {
      const reason = classifyBackendError(error);
      return { success: false, reason, error: { message: explainBackendError(reason, 'ar') } };
    }
    sendBroadcastPing('admin_author_notification');
    return { success: true, data };
  } catch (err) {
    console.warn('adminSendAuthorNotification error:', err);
    return { success: false, reason: 'network', error: { message: explainBackendError('network', 'ar') } };
  }
}


/**
 * Send an administrative inquiry to the person who reported a blessing (admin only, via server function)
 */
export async function adminSendReporterInquiry({
  reportId = '',
  blessingTitle = '',
  reporterDeviceId = '',
  message = ''
} = {}) {
  try {
    const { data, error } = await supabase.rpc('admin_send_notification', {
      p_kind: 'reporter_inquiry',
      p_blessing_title: (blessingTitle || '').trim(),
      p_target_token: (reporterDeviceId || '').trim() || null,
      p_message: (message || '').trim(),
      p_action_type: 'reporter_inquiry',
      p_admin_label: ADMIN_PUBLIC_LABEL,
      p_blessing_id: String(reportId || ''),
      p_author: ''
    });
    if (error) {
      const reason = classifyBackendError(error);
      return { success: false, reason, error: { message: explainBackendError(reason, 'ar') } };
    }
    sendBroadcastPing('admin_reporter_inquiry');
    return { success: true, data };
  } catch (err) {
    console.warn('adminSendReporterInquiry error:', err);
    return { success: false, reason: 'network', error: { message: explainBackendError('network', 'ar') } };
  }
}


/**
 * Fetch this device's notifications (author messages + reporter inquiries) from the server.
 * The server matches them by owner-token hash, so nobody else can read them.
 */
export async function fetchAuthorNotifications() {
  try {
    const tokens = getNotificationTokens();
    if (tokens.length === 0) return [];
    const { data, error } = await supabase.rpc('get_my_notifications', { p_tokens: tokens });
    if (error || !Array.isArray(data)) return [];
    return data.map((r) => {
      const isInquiry = r.kind === 'reporter_inquiry';
      return {
        id: r.id,
        type: isInquiry ? 'reporter_inquiry' : 'author_notification',
        actionType: r.action_type || (isInquiry ? 'reporter_inquiry' : 'message'),
        blessingTitle: r.blessing_title || '',
        blessingId: r.blessing_id || '',
        message: r.message || '',
        adminEmail: r.admin_label || ADMIN_PUBLIC_LABEL,
        authorName: isInquiry ? 'المُبلّغ' : (r.author_name || ''),
        timestamp: Date.parse(r.created_at) || Date.now(),
        status: 'unread'
      };
    });
  } catch (err) {
    console.warn('fetchAuthorNotifications error:', err);
    return [];
  }
}


/**
 * Listen for "you have mail" pings. The ping carries no data: the app re-fetches from the
 * server, so a forged ping can at most cause one (throttled) refresh.
 */
export function subscribeToAuthorNotifications(onPing) {
  let active = true;
  try {
    const channel = getPraisesBroadcastChannel();
    const notify = makeThrottle(() => {
      if (active && typeof onPing === 'function') onPing();
    }, 8000);
    channel.on('broadcast', { event: 'admin_author_notification' }, notify);
    channel.on('broadcast', { event: 'admin_reporter_inquiry' }, notify);
  } catch (err) {
    console.warn('subscribeToAuthorNotifications error:', err);
  }
  return () => {
    active = false;
  };
}


/**
 * Dismiss (delete) one of this device's notifications on the server
 */
export async function dismissAuthorNotification(notificationId) {
  try {
    const tokens = getNotificationTokens();
    if (!notificationId || tokens.length === 0) return false;
    const { error } = await supabase.rpc('dismiss_my_notification', {
      p_id: String(notificationId),
      p_tokens: tokens
    });
    return !error;
  } catch {
    return false;
  }
}


/**
 * Persist a praise on the server (atomic increment) and tell other open devices.
 * Returns the authoritative server count, or null if the server call failed.
 */
export async function recordBlessingPraise(blessingId, blessingTitle, newCount, author = '') {
  const cleanTitle = (blessingTitle || '').trim();
  let serverCount = null;

  if (cleanTitle) {
    try {
      const { data, error } = await supabase.rpc('increment_praise', { p_title: cleanTitle });
      if (!error && data !== null && data !== undefined && !Number.isNaN(Number(data))) {
        serverCount = Number(data);
      } else if (error) {
        console.warn('Error recording praise in Supabase:', error);
      }
    } catch (err) {
      console.warn('Error recording praise in Supabase:', err);
    }
  }

  // Broadcast instantly to all users (cosmetic counter only)
  broadcastPraiseEvent({
    blessingId,
    blessingTitle: cleanTitle,
    author,
    newCount: serverCount !== null ? serverCount : newCount
  });
  return serverCount;
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
  const serverCount = await recordBlessingPraise(blessingId, blessingTitle, nextCount, author);
  return serverCount !== null ? serverCount : nextCount;
}


/**
 * Record a blessing as deleted by admin in Supabase (with full recovery archive).
 * A database trigger copies {id, title} to the public "hidden_blessings" list.
 * Admin only (enforced by the database).
 */
export async function recordAdminDeletedBlessing(blessingItem, adminEmail = '') {
  try {
    const isObj = typeof blessingItem === 'object' && blessingItem !== null;
    const rawId = isObj ? String(blessingItem.id || '') : String(blessingItem || '');
    const title = isObj ? (blessingItem.title || '').trim() : '';
    const recordId = rawId || `del_${simpleHash(title)}_${Date.now()}`;

    // Full serializable payload for 100% loss-free restore
    const fullData = isObj ? {
      title: blessingItem.title,
      reflection: blessingItem.reflection,
      author: blessingItem.author,
      proof: blessingItem.proof,
      proofSource: blessingItem.proofSource || blessingItem.proof_source,
      category: blessingItem.category,
      categoryName: blessingItem.categoryName,
      tags: blessingItem.tags
    } : { title: rawId };

    const payload = {
      id: recordId,
      blessing_title: title || rawId,
      deleted_by: adminEmail ? `${adminEmail}:::${JSON.stringify(fullData)}` : JSON.stringify(fullData),
      created_at: new Date().toISOString()
    };

    // Store in localStorage archive for resilient local backup
    try {
      const localArchive = readStoredArray('nemaa_admin_archived_deleted_blessings', 'object');
      localArchive.unshift({
        id: recordId,
        blessing_title: title || rawId,
        deleted_by: adminEmail || 'admin',
        full_data: fullData,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('nemaa_admin_archived_deleted_blessings', JSON.stringify(localArchive.slice(0, 100)));
    } catch {}

    const { error } = await supabase.from('admin_deleted_blessings').insert([payload]);

    if (error) {
      const reason = classifyBackendError(error);
      // مؤرشفة من قبل (نفس المعرّف) → لا مشكلة
      if (reason === 'duplicate_title') return { success: true, alreadyArchived: true };
      console.warn('Error recording admin deleted blessing in Supabase:', error);
      return { success: false, reason, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Failed to record admin deleted blessing:', err);
    return { success: false, reason: 'network', error: err };
  }
}

/**
 * Fetch all blessings archived/deleted by admin from Supabase & local cache
 */
export async function fetchAdminDeletedBlessings() {
  try {
    let remoteList = [];
    const { data, error } = await supabase
      .from('admin_deleted_blessings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      remoteList = data;
    }

    // Merge with local archive for full data hydration
    let localArchive = [];
    try {
      localArchive = readStoredArray('nemaa_admin_archived_deleted_blessings', 'object');
    } catch {}

    const localMap = new Map();
    localArchive.forEach(item => {
      if (item && item.id) localMap.set(item.id, item);
      if (item && item.blessing_title) localMap.set(item.blessing_title, item);
    });

    const parsedList = remoteList.map(item => {
      let fullData = null;
      let adminEmail = item.deleted_by || 'admin';
      if (item.deleted_by && item.deleted_by.includes('{')) {
        try {
          if (item.deleted_by.includes(':::')) {
            const parts = item.deleted_by.split(':::');
            adminEmail = parts[0];
            fullData = JSON.parse(parts[1]);
          } else {
            fullData = JSON.parse(item.deleted_by);
          }
        } catch {}
      }

      const localMatch = localMap.get(item.id) || localMap.get(item.blessing_title);
      if (!fullData && localMatch?.full_data) {
        fullData = localMatch.full_data;
      }

      return {
        ...item,
        admin_email: adminEmail,
        full_data: fullData
      };
    });

    // Also include any local-only archived items that are not in remoteList
    const existingTitles = new Set(parsedList.map(p => p.blessing_title));
    localArchive.forEach(loc => {
      if (!existingTitles.has(loc.blessing_title)) {
        parsedList.push({
          ...loc,
          admin_email: loc.deleted_by || 'admin'
        });
      }
    });

    return parsedList;
  } catch (err) {
    console.warn('Failed to fetch admin deleted blessings:', err);
    try {
      return readStoredArray('nemaa_admin_archived_deleted_blessings', 'object');
    } catch {
      return [];
    }
  }
}


/**
 * Restore an archived blessing back to the published community feed (admin only)
 */
export async function restoreAdminDeletedBlessing(deletedItem) {
  try {
    if (!deletedItem) return { success: false, error: { message: 'No blessing item provided' } };

    let full = deletedItem.full_data;
    if (!full && deletedItem.deleted_by && deletedItem.deleted_by.includes('{')) {
      try {
        const jsonStr = deletedItem.deleted_by.includes(':::')
          ? deletedItem.deleted_by.split(':::')[1]
          : deletedItem.deleted_by;
        full = JSON.parse(jsonStr);
      } catch {}
    }

    const title = (full?.title || deletedItem.blessing_title || '').trim();
    const reflection = full?.reflection || 'نعمة مستعادة من أرشيف المنصة.';
    const author = (full?.author || '').trim();
    const proof = full?.proof || '';
    const proofSource = full?.proofSource || full?.proof_source || '';

    // 1. Re-publish to blessings table (ownerless: managed by admins)
    const pubRes = await publishSharedBlessing({ title, reflection, author, proof, proofSource }, { restore: true });
    if (!pubRes.success && pubRes.reason !== 'duplicate_title') {
      // لا نمسح الأرشيف إذا فشلت الاستعادة — حتى لا تضيع النعمة
      return {
        success: false,
        reason: pubRes.reason,
        error: { message: explainBackendError(pubRes.reason, 'ar') }
      };
    }

    // 2. Remove from admin_deleted_blessings in Supabase (a trigger also un-hides it for everyone)
    try {
      if (deletedItem.id) {
        await supabase.from('admin_deleted_blessings').delete().eq('id', deletedItem.id);
      }
      if (title) {
        await supabase.from('admin_deleted_blessings').delete().eq('blessing_title', title);
      }
    } catch (e) {
      console.warn('Supabase delete from archive warning:', e);
    }

    // Clean up from local archive
    try {
      const localArchive = readStoredArray('nemaa_admin_archived_deleted_blessings', 'object');
      const filtered = localArchive.filter(i =>
        i.id !== deletedItem.id &&
        (i.blessing_title || '').trim() !== title
      );
      localStorage.setItem('nemaa_admin_archived_deleted_blessings', JSON.stringify(filtered));
    } catch {}

    // Clean up from local admin deleted ids on this device
    try {
      const delIds = readStoredArray('nemaa_admin_deleted_ids', 'string');
      const filteredIds = delIds.filter(x =>
        String(x).toLowerCase() !== String(deletedItem.id).toLowerCase() &&
        String(x).trim().toLowerCase() !== title.toLowerCase()
      );
      localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(filteredIds));
    } catch {}

    const restoredBlessing = pubRes.data || {
      id: `sb_${Date.now()}`,
      title,
      reflection,
      author,
      proof,
      proofSource,
      isShared: true
    };
    return { success: true, data: restoredBlessing };
  } catch (err) {
    console.warn('Failed to restore admin deleted blessing:', err);
    return { success: false, error: err };
  }
}


/**
 * Permanently purge a blessing from the admin deleted archive (admin only)
 */
export async function permanentlyDeleteArchivedBlessing(deletedItem) {
  try {
    const id = deletedItem.id;
    const title = deletedItem.blessing_title;

    if (id) await supabase.from('admin_deleted_blessings').delete().eq('id', id);
    if (title) await supabase.from('admin_deleted_blessings').delete().eq('blessing_title', title);

    try {
      const localArchive = readStoredArray('nemaa_admin_archived_deleted_blessings', 'object');
      const filtered = localArchive.filter(i => i.id !== id && i.blessing_title !== title);
      localStorage.setItem('nemaa_admin_archived_deleted_blessings', JSON.stringify(filtered));
    } catch {}

    return { success: true };
  } catch (err) {
    console.warn('Failed to permanently delete archived blessing:', err);
    return { success: false, error: err };
  }
}


/**
 * Public list of blessings hidden by the admins ({id, blessing_title} only — safe to expose).
 * Falls back to the old table only before the security migration has been applied.
 */
export async function fetchHiddenBlessings() {
  try {
    const { data, error } = await supabase.from('hidden_blessings').select('id, blessing_title');
    if (!error && Array.isArray(data)) return data;
    if (error && classifyBackendError(error) === 'not_deployed') {
      const old = await supabase.from('admin_deleted_blessings').select('id, blessing_title');
      if (!old.error && Array.isArray(old.data)) return old.data;
    }
  } catch (err) {
    console.warn('fetchHiddenBlessings error:', err);
  }
  return null; // unknown → caller keeps its local cache
}

/**
 * Subscribe (realtime) to the public hidden-blessings list
 */
export function subscribeToHiddenBlessings(onHidden, onUnhidden) {
  try {
    const channel = supabase
      .channel('realtime_hidden_blessings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidden_blessings' },
        (payload) => {
          if (payload && payload.eventType === 'INSERT' && payload.new) {
            if (typeof onHidden === 'function') onHidden(payload.new);
          } else if (payload && payload.eventType === 'DELETE' && payload.old) {
            if (typeof onUnhidden === 'function') onUnhidden(payload.old);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Hidden blessings realtime subscription error:', err);
    return () => {};
  }
}


/**
 * Submit a report for an inappropriate or erroneous blessing
 * (anyone may INSERT a report; only admins can read them)
 */
export async function submitBlessingReport({ blessingId, blessingTitle, reason, notes, reporterDeviceId }) {
  const devId = reporterDeviceId || getReporterDeviceId();
  const cleanNotes = (notes || '').trim().slice(0, 3000);

  // Package note & reporter device ID
  const structuredNotes = JSON.stringify({
    note: cleanNotes,
    reporterDeviceId: devId
  });

  const reportObj = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    blessing_id: String(blessingId || '').slice(0, 200),
    blessing_title: (blessingTitle || '').trim().slice(0, 300),
    reason: (reason || 'محتوى غير لائق').trim().slice(0, 200),
    notes: structuredNotes,
    status: 'pending'
  };

  let remoteSuccess = false;
  let remoteError = null;

  // Store in Supabase 'reports' table (no .select(): anonymous visitors cannot read reports back)
  try {
    const { error } = await supabase.from('reports').insert([reportObj]);
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

  if (remoteSuccess) {
    // Local history so the reporter can be matched with admin inquiries
    try {
      const cached = readStoredArray('nemaa_reports_cache', 'object');
      cached.unshift({ ...reportObj, rawNote: cleanNotes, reporterDeviceId: devId, created_at: new Date().toISOString() });
      localStorage.setItem('nemaa_reports_cache', JSON.stringify(cached.slice(0, 50)));
    } catch {}

    try {
      const mySubmitted = readStoredArray('nemaa_my_submitted_reports', 'object');
      mySubmitted.unshift({
        reportId: reportObj.id,
        blessingId: String(blessingId || ''),
        blessingTitle: (blessingTitle || '').trim(),
        reporterDeviceId: devId,
        timestamp: Date.now()
      });
      localStorage.setItem('nemaa_my_submitted_reports', JSON.stringify(mySubmitted.slice(0, 50)));
    } catch {}
  }

  return {
    success: remoteSuccess,
    remoteSuccess,
    reason: remoteError ? classifyBackendError(remoteError) : null,
    error: remoteError,
    report: reportObj
  };
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
    const local = readStoredArray('nemaa_reports_cache', 'object');
    local.forEach(r => {
      if (!reports.some(item => item.id === r.id)) {
        reports.push(r);
      }
    });
  } catch {}

  // Filter OUT suggestions, complaints, praise sync records, admin author notifications, and admin reporter inquiries
  return reports
    .filter(r => {
      if (!r) return false;
      if (r.reason === 'praise_sync') return false;
      if (r.reason === 'admin_author_notification') return false;
      if (r.reason === 'admin_reporter_inquiry') return false;
      if (r.reason === 'admin_global_broadcast') return false;
      const isFeedback = (r.reason === 'اقتراح وتطوير' || r.reason === 'شكوى أو مشكلة' ||
        (r.blessing_title && (r.blessing_title.startsWith('[اقتراح]') || r.blessing_title.startsWith('[شكوى]'))));
      return !isFeedback;
    })
    .map(r => {
      let cleanNote = r.notes || '';
      let reporterDeviceId = r.reporterDeviceId || r.reporter_device_id || '';
      if (cleanNote && typeof cleanNote === 'string') {
        try {
          const parsed = JSON.parse(cleanNote);
          cleanNote = parsed.note || parsed.message || cleanNote;
          reporterDeviceId = parsed.reporterDeviceId || parsed.reporter_device_id || reporterDeviceId;
        } catch {}
      }
      return {
        ...r,
        notes: cleanNote,
        reporterDeviceId
      };
    });
}

/**
 * Clean corrupt or orphaned admin notifications from reports table
 */
export async function cleanOrphanedNotificationsFromReports() {
  try {
    // 1. Delete admin inquiries with empty reporterDeviceId from Supabase
    await supabase
      .from('reports')
      .delete()
      .eq('reason', 'admin_reporter_inquiry')
      .ilike('notes', '%"reporterDeviceId":""%');

    // 2. Also clean local cache of any admin notification records
    try {
      const local = readStoredArray('nemaa_reports_cache', 'object');
      const filtered = local.filter(r => 
        r && r.reason !== 'admin_author_notification' && 
        r.reason !== 'admin_reporter_inquiry' && 
        r.reason !== 'admin_global_broadcast' &&
        r.reason !== 'praise_sync'
      );
      localStorage.setItem('nemaa_reports_cache', JSON.stringify(filtered));
    } catch {}

    return { success: true };
  } catch (err) {
    console.warn('cleanOrphanedNotificationsFromReports notice:', err);
    return { success: false, error: err };
  }
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
    const cached = readStoredArray('nemaa_reports_cache', 'object');
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
            const row = payload.new;
            // Strict filter out notifications, broadcasts, and praise sync records
            if (row.reason === 'praise_sync' || 
                row.reason === 'admin_author_notification' || 
                row.reason === 'admin_reporter_inquiry' || 
                row.reason === 'admin_global_broadcast') {
              return;
            }
            if (typeof onNewReport === 'function') {
              let cleanNote = row.notes || '';
              let reporterDeviceId = row.reporterDeviceId || row.reporter_device_id || '';
              if (cleanNote && typeof cleanNote === 'string') {
                try {
                  const parsed = JSON.parse(cleanNote);
                  cleanNote = parsed.note || parsed.message || cleanNote;
                  reporterDeviceId = parsed.reporterDeviceId || parsed.reporter_device_id || reporterDeviceId;
                } catch {}
              }
              onNewReport({
                ...row,
                notes: cleanNote,
                reporterDeviceId
              });
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
 * Is the signed-in user listed in the "admins" table? (checked by the database, not the browser)
 * Before the security migration the function does not exist → legacy behaviour (any signed-in user).
 */
async function checkIsAdmin() {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return classifyBackendError(error) === 'not_deployed';
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Admin Authentication via Supabase Auth User (must also be in the admins table)
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
    if (!(await checkIsAdmin())) {
      return { success: false, error: 'هذا الحساب لا يملك صلاحية المدير.' };
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
    if (!user) return null;
    return (await checkIsAdmin()) ? user : null;
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
 * (anyone may INSERT; only admins can read — so no .select() after the insert)
 */
export async function submitFeedback({ type = 'suggestion', title = '', content = '', userName = '', contact = '' }) {
  const cleanTitle = (title || '').trim().slice(0, 300);
  const cleanContent = (content || '').trim().slice(0, 4000);
  const cleanUserName = (userName || '').trim().slice(0, 100);
  const cleanContact = (contact || '').trim().slice(0, 300);

  const feedbackObj = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: ['suggestion', 'complaint', 'other'].includes(type) ? type : 'suggestion',
    title: cleanTitle,
    content: cleanContent,
    user_name: cleanUserName || null,
    contact: cleanContact || null,
    status: 'pending'
  };

  let remoteSuccess = false;
  let remoteError = null;

  try {
    const { error } = await supabase.from('feedback').insert([feedbackObj]);
    if (!error) {
      remoteSuccess = true;
    } else {
      remoteError = error;
      console.warn('Supabase feedback insert error:', error);
    }
  } catch (err) {
    remoteError = err;
  }

  return {
    success: remoteSuccess,
    remoteSuccess,
    reason: remoteError ? classifyBackendError(remoteError) : null,
    error: remoteError,
    feedback: feedbackObj
  };
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
    const local = readStoredArray('nemaa_feedback_cache', 'object');
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
    const cached = readStoredArray('nemaa_feedback_cache', 'object');
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
    const cached = readStoredArray('nemaa_feedback_cache', 'object');
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


/**
 * Publish a global announcement from Admin to all users (admin only, enforced by the database).
 * The text lives in the database; the realtime message is only a content-free ping.
 */
export async function publishAdminGlobalBroadcast({ title, message }) {
  try {
    const cleanTitle = (title || 'إعلان وتنبيه عام من إدارة نِعْمَة').trim();
    const cleanMessage = (message || '').trim();
    const payload = {
      id: `bc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      blessing_id: 'global_broadcast',
      blessing_title: cleanTitle,
      reason: 'admin_global_broadcast',
      notes: JSON.stringify({ message: cleanMessage, title: cleanTitle, timestamp: Date.now() }),
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('reports').insert([payload]);
    if (error) {
      const reason = classifyBackendError(error);
      return { success: false, reason, error: { message: explainBackendError(reason, 'ar') } };
    }

    sendBroadcastPing('admin_global_broadcast');
    return {
      success: true,
      data: { id: payload.id, title: cleanTitle, message: cleanMessage, timestamp: Date.now() }
    };
  } catch (err) {
    console.warn('publishAdminGlobalBroadcast error:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch latest global broadcast announcement from Admin
 */
export async function fetchLatestAdminBroadcast() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reason', 'admin_global_broadcast')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      const item = data[0];
      let details = {};
      try {
        details = JSON.parse(item.notes || '{}');
      } catch {}

      return {
        id: item.id,
        title: details.title || item.blessing_title || 'إعلان عام من الإدارة',
        message: details.message || '',
        createdAt: item.created_at,
        timestamp: details.timestamp || new Date(item.created_at).getTime()
      };
    }
    return null;
  } catch (err) {
    console.warn('fetchLatestAdminBroadcast error:', err);
    return null;
  }
}


/**
 * Listen for "new announcement" pings. The announcement text is always re-read from the
 * database (never taken from the realtime message, which anyone could forge).
 */
export function subscribeToAdminGlobalBroadcasts(onBroadcastReceived) {
  let active = true;
  try {
    const channel = getPraisesBroadcastChannel();
    const refresh = makeThrottle(() => {
      fetchLatestAdminBroadcast().then((b) => {
        if (active && b && typeof onBroadcastReceived === 'function') onBroadcastReceived(b);
      });
    }, 8000);
    channel.on('broadcast', { event: 'admin_global_broadcast' }, refresh);
  } catch (err) {
    console.warn('subscribeToAdminGlobalBroadcasts error:', err);
  }
  return () => {
    active = false;
  };
}
