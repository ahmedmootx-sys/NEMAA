/* NEMAA service worker
 * عامل خدمة واحد يجمع: التخزين دون اتصال + إشعارات OneSignal.
 * (كان هناك عاملان على نفس النطاق يستبدل أحدهما الآخر، فتتعطل الإشعارات أو التخزين.)
 *
 * قواعد مهمة:
 *  - لا نتدخل أبداً في طلبات النطاقات الأخرى (Supabase وOneSignal...) كي لا تُقدَّم بيانات قديمة أو بيانات مستخدم آخر.
 *  - صفحة HTML: الشبكة أولاً، ثم النسخة المحفوظة عند انقطاع الاتصال.
 *  - ملفات assets/ ذات الأسماء المُبصَّمة: من التخزين أولاً (لا تتغير).
 */

// عامل OneSignal داخل نفس الملف. إن حُجب (مانع إعلانات/انقطاع) نكمل بالتخزين دون اتصال فقط.
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (err) {
  // لا شيء: الإشعارات غير متاحة في هذه الجلسة لكن التطبيق يعمل
}

const CACHE_NAME = 'nemaa-pwa-v3';
const MAX_ENTRIES = 120;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './brand/icon-192.png',
  './brand/icon-512.png',
  './brand/icon-maskable-512.png',
  './brand/logo-calligraphy.jpg'
];

// الخطوط فقط من النطاقات الخارجية مسموح تخزينها (ثابتة وغير شخصية)
const CACHEABLE_EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const NEVER_CACHE_PATHS = ['sw.js', 'OneSignalSDKWorker.js', 'OneSignalSDK.sw.js'];

async function trimCache(cache) {
  const keys = await cache.keys();
  const extra = keys.length - MAX_ENTRIES;
  for (let i = 0; i < extra; i++) {
    await cache.delete(keys[i]);
  }
}

async function putSafe(request, response) {
  try {
    if (!response || response.status !== 200 || response.type === 'opaque') return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
    await trimCache(cache);
  } catch (err) {
    // مساحة التخزين ممتلئة أو غيره: لا نكسر الطلب
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          // فشل ملف واحد لا يوقف التثبيت
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CACHEABLE_EXTERNAL_HOSTS.includes(url.hostname)) return; // Supabase وغيره: مباشرة للشبكة
  if (sameOrigin && NEVER_CACHE_PATHS.some((p) => url.pathname.endsWith('/' + p))) return;

  // صفحة التطبيق: الشبكة أولاً
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putSafe(request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match('./index.html')) ||
            (await caches.match('./'));
          return cached || new Response('أنت غير متصل بالإنترنت. أعد المحاولة عند عودة الاتصال.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // ملفات مُبصَّمة لا تتغير: من التخزين أولاً
  if (sameOrigin && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          putSafe(request, response.clone());
          return response;
        });
      })
    );
    return;
  }

  // بقية الملفات الثابتة: من التخزين مع تحديث في الخلفية
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          putSafe(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
