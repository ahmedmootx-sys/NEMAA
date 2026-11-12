/**
 * إرسال تذكير «نِعْمَة» اليومي عبر OneSignal.
 *
 * وضعان (يُختاران بمتغيّر المستودع PUSH_MODE في GitHub: Settings → Secrets and variables → Actions → Variables):
 *   - broadcast (الافتراضي): إشعار واحد للجميع دفعة واحدة. هذا هو السلوك القديم تماماً.
 *   - slots: يحترم الوقت الذي اختاره كل مستخدم في الإعدادات (صباحاً/ظهراً/مساءً/قبل النوم/عشوائي/وقت مخصص)
 *            بتوقيته المحلي، عبر وسم reminder_time ومعامل delayed_option=timezone في OneSignal.
 *
 * متغيرات أخرى:
 *   DRY_RUN=1   يطبع الطلبات التي كانت ستُرسل دون إرسال أي شيء (للاختبار الآمن).
 *   SCHEDULE    (يضبطه الـ workflow) عنوان الجدول الذي شغّل التشغيل، لتجاهل الجدول غير المطابق للوضع.
 *   ONESIGNAL_API_URL  لتغيير العنوان في الاختبارات فقط.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APP_URL = 'https://ahmedmootx-sys.github.io/NEMAA/';
const API_URL = process.env.ONESIGNAL_API_URL || 'https://onesignal.com/api/v1/notifications';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8f5845d8-2d36-4b66-8596-6f9761bf1aa7';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const MODE = (process.env.PUSH_MODE || 'broadcast').trim().toLowerCase() === 'slots' ? 'slots' : 'broadcast';
const DRY_RUN = ['1', 'true', 'yes'].includes(String(process.env.DRY_RUN || '').toLowerCase());
const SCHEDULE = (process.env.SCHEDULE || '').trim();

// جدولان في الـ workflow: واحد للوضع العادي وواحد للوضع بحسب الوقت (يعمل بعد منتصف الليل UTC
// حتى تكون أوقات اليوم المحلية كلها لم تفُت بعد في معظم المناطق).
export const BROADCAST_CRON = '0 6 * * *';
export const SLOTS_CRON = '30 0 * * *';

// أوقات الخيارات الثابتة في الإعدادات (نفس نصوص الواجهة)
export const FIXED_SLOTS = { morning: '08:00', midday: '13:00', evening: '18:00', night: '22:30' };

// ---------------------------------------------------------------------------
// اختيار نعمة اليوم
// ---------------------------------------------------------------------------
export function loadPool() {
  let pool = [];
  try {
    const seedPath = path.join(rootDir, 'src', 'data', 'seed_blessings.json');
    if (fs.existsSync(seedPath)) {
      const parsed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      if (Array.isArray(parsed)) {
        pool = parsed.filter((b) => b && typeof b.title === 'string' && b.title.trim() && typeof b.reflection === 'string' && b.reflection.trim());
      }
    }
  } catch (err) {
    console.warn('Notice loading seed_blessings.json:', err.message);
  }
  if (pool.length === 0) {
    pool = [
      { title: 'نعمة التوفيق للشكر', reflection: 'لو رُزق العبد الدنيا بما فيها ثم شكر الله عليها، لكان إلهامه الشكر نعمة أعظم من الدنيا وما فيها؛ لأن نعيم الدنيا يفنى وثواب الشكر يبقى.', author: 'ابن القيم', source: 'كتاب الفوائد' },
      { title: 'دوام التفكر في سوابغ المنن', reflection: 'أكثروا من ذكر هذه النعم، فإن ذكرها شكر. ورطّب لسانك الآن بحمد الله والثناء عليه.', author: 'الحسن البصري', source: 'حلية الأولياء' },
      { title: 'نعمة العافية وسلامة الجوارح', reflection: 'من رُزق قلباً يقظاً رأى في كل نَفَسٍ يتردد، وفي كل لقمة تسوغ، نعماً لا يحصيها قلم ولا يفي بشكرها عمل.', author: 'ابن الجوزي', source: 'صيد الخاطر' }
    ];
  }
  return pool;
}

export function dayOfYearUTC(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

export function pickBlessing(pool, date) {
  return pool[dayOfYearUTC(date) % pool.length];
}

/** وقت عشوائي لكن ثابت لليوم (بين 09:00 و 20:00) لمن اختار «عشوائي» أو لم يختر شيئاً */
export function randomDaytimeSlot(date) {
  const seed = dayOfYearUTC(date) * 2654435761 + date.getUTCFullYear();
  const minuteOfWindow = Math.abs(Math.floor(seed)) % (11 * 60); // 09:00 → 19:59
  const total = 9 * 60 + minuteOfWindow;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// بناء الطلبات
// ---------------------------------------------------------------------------
export function buildMessage(blessing) {
  const chars = Array.from(blessing.reflection);
  const reflectionText = chars.length > 140 ? chars.slice(0, 137).join('') + '...' : blessing.reflection;
  const authorCitation = blessing.author ? ` — ${blessing.author}` : '';
  const text = `${reflectionText}${authorCitation}`;
  return {
    headings: { ar: `نِعْمَة | ${blessing.title}`, en: `Nemaa | ${blessing.title}` },
    contents: { ar: text, en: text },
    url: APP_URL,
    chrome_web_icon: `${APP_URL}brand/icon-192.png`,
    chrome_web_badge: `${APP_URL}brand/icon-192.png`
  };
}

const tagIs = (key, value) => ({ field: 'tag', key, relation: '=', value });
const tagMissing = (key) => ({ field: 'tag', key, relation: 'not_exists' });

/** يُرجع قائمة الطلبات (كل عنصر: وصف + جسم الطلب) حسب الوضع */
export function buildRequests(blessing, date, mode) {
  const message = buildMessage(blessing);
  if (mode !== 'slots') {
    // الشريحة 'Total Subscriptions' هي التي نجح بها الإرسال الفعلي من لوحة الأدمن على هذا التطبيق (10 نوفمبر 2026)،
    // بينما رجع 'Subscribed Users' بلا مستلمين رغم وجود جهاز مشترك. لذلك نعتمد الاسم المجرَّب.
    return [{ label: 'broadcast', body: { app_id: ONESIGNAL_APP_ID, included_segments: ['Total Subscriptions'], ...message } }];
  }

  // ملاحظة: لا نُرسل throttle_rate_per_minute إطلاقاً، حتى بالقيمة 0.
  // وثائق OneSignal تقول اجعله 0 مع التسليم بحسب المنطقة الزمنية، لكن الخطة المجانية ترفض وجود الحقل نفسه
  // (HTTP 400: "This app is not entitled to use throttling")، والتسليم بحسب المنطقة الزمنية متاح بدونه في الخطة المجانية.
  const timed = (time) => ({
    delayed_option: 'timezone',
    delivery_time_of_day: time
  });
  const reqs = [];

  for (const [slot, time] of Object.entries(FIXED_SLOTS)) {
    reqs.push({ label: `slot:${slot}@${time}`, body: { app_id: ONESIGNAL_APP_ID, filters: [tagIs('reminder_time', slot)], ...timed(time), ...message } });
  }

  // «عشوائي» + من لم يضبط أي وقت (اشتراكات قديمة بلا وسوم)
  const randomTime = randomDaytimeSlot(date);
  reqs.push({
    label: `slot:random@${randomTime}`,
    body: { app_id: ONESIGNAL_APP_ID, filters: [tagIs('reminder_time', 'random'), { operator: 'OR' }, tagMissing('reminder_time')], ...timed(randomTime), ...message }
  });

  // الوقت المخصص: يُقرَّب في التطبيق إلى أقرب ربع ساعة ويُحفظ في الوسم reminder_custom_slot
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      reqs.push({
        label: `slot:custom@${time}`,
        body: { app_id: ONESIGNAL_APP_ID, filters: [tagIs('reminder_time', 'custom'), { operator: 'AND' }, tagIs('reminder_custom_slot', time)], ...timed(time), ...message }
      });
    }
  }
  return reqs;
}

// ---------------------------------------------------------------------------
// الإرسال
// ---------------------------------------------------------------------------
const NO_RECIPIENTS = /not subscribed|no recipients|no subscribers|no (?:active )?(?:users|players|subscriptions)|all included/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// آخر ردّ «لا مستلمين» من OneSignal: نطبعه إن لم يُرسَل شيء، حتى لا يبقى السبب مخفياً خلف كلمة skipped
let lastSkip = null;
// آخر رفض (HTTP 4xx) من OneSignal، لنكتشف الخطأ المنهجي (نفس الرفض لكل الطلبات) ونتوقف مبكراً
let lastFail = null;

/** يُرجع 'sent' | 'skipped' (لا مستلمين لهذه الشريحة، وهذا طبيعي) | 'failed' */
export async function sendOne(req, fetchImpl = fetch) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let response, data;
    try {
      response = await fetchImpl(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${ONESIGNAL_REST_API_KEY}` },
        body: JSON.stringify(req.body)
      });
      data = await response.json().catch(() => ({}));
    } catch (err) {
      console.error(`⚠️  [${req.label}] network error (attempt ${attempt}):`, err.message);
      await sleep(1000 * attempt);
      continue;
    }
    const errText = JSON.stringify(data?.errors || '');
    if (response.ok && data?.id) {
      if (data.errors) console.warn(`⚠️  [${req.label}] sent with warnings:`, errText);
      return 'sent';
    }
    if (NO_RECIPIENTS.test(errText)) {
      lastSkip = { label: req.label, text: errText };
      return 'skipped';
    }
    if (response.status === 429 || response.status >= 500) {
      const wait = Number(response.headers?.get?.('retry-after')) || attempt * 2;
      console.error(`⚠️  [${req.label}] HTTP ${response.status}, retrying in ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    console.error(`❌ [${req.label}] OneSignal rejected the request (HTTP ${response.status}):`, JSON.stringify(data));
    lastFail = { label: req.label, status: response.status, text: JSON.stringify(data) };
    return 'failed';
  }
  return 'failed';
}

async function main() {
  const now = new Date();
  console.log('--- NEMAA Daily Push Notification Dispatcher ---');
  console.log(`Date: ${now.toISOString()} | mode: ${MODE}${DRY_RUN ? ' | DRY RUN (nothing is sent)' : ''}`);

  // كل جدول زمني يخص وضعاً واحداً؛ التشغيل اليدوي (بلا SCHEDULE) يعمل دائماً
  if (SCHEDULE) {
    const expected = MODE === 'slots' ? SLOTS_CRON : BROADCAST_CRON;
    if (SCHEDULE !== expected) {
      console.log(`ℹ️  This run was triggered by schedule "${SCHEDULE}" but the current mode (${MODE}) uses "${expected}". Skipping on purpose.`);
      return;
    }
  }

  const blessing = pickBlessing(loadPool(), now);
  console.log(`Selected Blessing: "${blessing.title}" — ${blessing.author || 'حكمة مأثورة'}`);

  const requests = buildRequests(blessing, now, MODE);

  if (DRY_RUN) {
    for (const r of requests.slice(0, 8)) console.log(`\n[${r.label}]\n${JSON.stringify(r.body, null, 2)}`);
    console.log(`\n(dry run) ${requests.length} request(s) would be sent. Showing the first ${Math.min(8, requests.length)}.`);
    return;
  }

  if (!ONESIGNAL_REST_API_KEY) {
    console.error('❌ ERROR: Missing ONESIGNAL_REST_API_KEY environment variable.');
    console.log('👉 Add ONESIGNAL_REST_API_KEY in GitHub: Settings -> Secrets and variables -> Actions -> New repository secret');
    console.log('   (Find the key in OneSignal Dashboard -> Settings -> Keys & IDs)');
    process.exit(1);
  }

  const tally = { sent: 0, skipped: 0, failed: 0 };
  let sameFailStreak = 0;
  let prevFailText = null;
  let attempted = 0;
  for (const r of requests) {
    const result = await sendOne(r);
    attempted++;
    tally[result]++;
    if (result === 'sent') console.log(`✅ [${r.label}] dispatched`);
    if (result === 'failed' && lastFail) {
      sameFailStreak = lastFail.text === prevFailText ? sameFailStreak + 1 : 1;
      prevFailText = lastFail.text;
    } else {
      sameFailStreak = 0;
      prevFailText = null;
    }
    // نفس الرفض لأول 3 طلبات ولم ينجح أي شيء: العطل منهجي (إعداد/خطة/مفتاح)، فلا نغرق السجل بمئة سطر متطابقة
    if (sameFailStreak >= 3 && tally.sent === 0 && tally.skipped === 0) {
      console.error(`⛔ Stopping early: the first ${sameFailStreak} requests were all rejected with the same error, so the rest would fail too (${requests.length - attempted} request(s) not attempted).`);
      console.error(`   OneSignal said: ${lastFail.text}`);
      break;
    }
    if (requests.length > 1) await sleep(250);
  }
  console.log(`\nSummary: sent=${tally.sent} skipped(no recipients)=${tally.skipped} failed=${tally.failed}`);
  if (tally.failed > 0) process.exit(1);
  if (tally.sent === 0) {
    console.log('ℹ️  Nothing was sent: no subscribed recipients matched. This is normal when nobody is subscribed yet.');
    if (lastSkip) console.log(`   OneSignal's last reply [${lastSkip.label}]: ${lastSkip.text}`);
    if (MODE === 'broadcast') console.log('   If your OneSignal dashboard shows devices with status Subscribed, the segment name in this script does not match your app.');
  }
}

// لا يعمل تلقائياً عند الاستيراد (للاختبار)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
