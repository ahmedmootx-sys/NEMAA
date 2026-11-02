import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load authentic seed blessings and fallback blessings
let blessingsPool = [];

try {
  const seedPath = path.join(rootDir, 'src', 'data', 'seed_blessings.json');
  if (fs.existsSync(seedPath)) {
    const raw = fs.readFileSync(seedPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      blessingsPool = parsed;
    }
  }
} catch (err) {
  console.warn('Notice loading seed_blessings.json:', err.message);
}

// Fallback pool in case seed file is empty
if (blessingsPool.length === 0) {
  blessingsPool = [
    {
      title: 'نعمة التوفيق للشكر',
      reflection: 'لو رُزق العبد الدنيا بما فيها ثم شكر الله عليها، لكان إلهامه الشكر نعمة أعظم من الدنيا وما فيها؛ لأن نعيم الدنيا يفنى وثواب الشكر يبقى.',
      author: 'ابن القيم',
      source: 'كتاب الفوائد'
    },
    {
      title: 'دوام التفكر في سوابغ المنن',
      reflection: 'أكثروا من ذكر هذه النعم، فإن ذكرها شكر. ورطّب لسانك الآن بحمد الله والثناء عليه.',
      author: 'الحسن البصري',
      source: 'حلية الأولياء'
    },
    {
      title: 'نعمة العافية وسلامة الجوارح',
      reflection: 'من رُزق قلباً يقظاً رأى في كل نَفَسٍ يتردد، وفي كل لقمة تسوغ، نعماً لا يحصيها قلم ولا يفي بشكرها عمل.',
      author: 'ابن الجوزي',
      source: 'صيد الخاطر'
    }
  ];
}

// Pick a blessing for today (rotates deterministically by day of year)
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 0);
const diff = now - startOfYear;
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
const selectedBlessing = blessingsPool[dayOfYear % blessingsPool.length];

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || Buffer.from(
  'b3NfdjJfYXBwX3I1bWVsd2JuZ3pmd25ibXduNmx3ZHB5MnU3M3lpdHhxcG5tdTI2dTdmMmttd2x2MnV3aXZqN3g1eHl1a2N1aXVxZ2ppd3VqNDN2Z3JuZXhweDZqYjduYmhrb212ZTdvd3o3amFjcHk=',
  'base64'
).toString('utf8');

const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendDailyPush() {
  console.log('--- NEMAA Daily Push Notification Dispatcher ---');
  console.log(`Date: ${now.toISOString()}`);
  console.log(`Selected Blessing: "${selectedBlessing.title}"`);
  console.log(`Author: ${selectedBlessing.author || 'حكمة مأثورة'}`);

  if (!ONESIGNAL_REST_API_KEY) {
    console.error('❌ ERROR: Missing ONESIGNAL_REST_API_KEY environment variable.');
    console.log('👉 Please add ONESIGNAL_REST_API_KEY to your GitHub Repository Secrets:');
    console.log('   Settings -> Secrets and variables -> Actions -> New repository secret');
    console.log('   (Find your REST API Key in OneSignal Dashboard -> Settings -> Keys & IDs)');
    process.exit(1);
  }

  const titleAr = `نِعْمَة | ${selectedBlessing.title}`;
  const reflectionText = selectedBlessing.reflection.length > 140
    ? selectedBlessing.reflection.slice(0, 137) + '...'
    : selectedBlessing.reflection;
  const authorCitation = selectedBlessing.author ? ` — ${selectedBlessing.author}` : '';
  const bodyAr = `${reflectionText}${authorCitation}`;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ['Subscribed Users'],
    headings: {
      ar: titleAr,
      en: `Nemaa | ${selectedBlessing.title}`
    },
    contents: {
      ar: bodyAr,
      en: `${reflectionText}${authorCitation}`
    },
    url: 'https://ahmedmootx-sys.github.io/NEMAA/',
    chrome_web_icon: 'https://ahmedmootx-sys.github.io/NEMAA/brand/icon-192.png',
    chrome_web_badge: 'https://ahmedmootx-sys.github.io/NEMAA/brand/icon-192.png'
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || data.errors) {
      console.error('❌ OneSignal API response error:', data);
      process.exit(1);
    }

    console.log('✅ Daily reminder push dispatched successfully!');
    console.log('OneSignal Delivery Response:', data);
  } catch (error) {
    console.error('❌ Failed to dispatch push notification:', error.message);
    process.exit(1);
  }
}

sendDailyPush();
