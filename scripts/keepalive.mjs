/**
 * يرسل قراءة خفيفة إلى Supabase حتى لا يُوقَف المشروع المجاني بسبب عدم النشاط.
 * ينجح فقط إذا ردّ الخادم برمز 2xx؛ غير ذلك يفشل التشغيل فيظهر لك بريد/إشعار GitHub بالفشل.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.resolve(here, '..', 'src', 'supabaseClient.js'), 'utf8');
const url = (src.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
const key = (src.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];

if (!url || !key) {
  console.error('❌ لم أجد SUPABASE_URL أو SUPABASE_ANON_KEY في src/supabaseClient.js (هل تغيّر اسمهما؟)');
  process.exit(1);
}

const endpoint = `${url.replace(/\/$/, '')}/rest/v1/blessings?select=title&limit=1`;
try {
  const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  console.log(`Supabase responded: HTTP ${res.status}`);
  if (!res.ok) {
    console.error('❌ الخادم رد بخطأ. قد يكون المشروع متوقفاً: افتح لوحة Supabase واضغط Restore.');
    console.error((await res.text()).slice(0, 300));
    process.exit(1);
  }
  console.log('✅ Supabase is awake.');
} catch (err) {
  console.error('❌ تعذّر الوصول إلى Supabase:', err.message);
  process.exit(1);
}
