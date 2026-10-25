/**
 * مُساعد القراءة الصوتية باللغة العربية (Speech Synthesis Helper)
 * يتحقق بدقة من توفر صوت عربي أصيل في نظام جهاز المستخدم، ويخفي الميزة تماماً في حال عدم وجوده.
 */

let arabicVoiceCache = null;
let voicesLoaded = false;

// دالة فحص واسترجاع أفضل صوت عربي متاح
export function getAvailableArabicVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // البحث عن صوت يدعم اللغة العربية
  const arabicVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('ar') || lang.includes('arabic');
  });

  if (arabicVoices.length === 0) {
    return null;
  }

  // تفضيل الأصوات الطبيعية المتقدمة (Google عربي، Microsoft، Maged، Leila، إلخ)
  const premiumVoice = arabicVoices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Natural') || 
    v.name.includes('Maged') || 
    v.name.includes('Tarik') || 
    v.name.includes('Laila') ||
    v.name.includes('Hoda') ||
    v.name.includes('Naayf')
  );

  arabicVoiceCache = premiumVoice || arabicVoices[0];
  return arabicVoiceCache;
}

// مراقبة تحميل الأصوات في المتصفح
export function subscribeToVoiceChanges(callback) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callback(null);
    return () => {};
  }

  const checkVoices = () => {
    const voice = getAvailableArabicVoice();
    callback(voice);
  };

  checkVoices();

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = checkVoices;
  }

  return () => {
    if (window.speechSynthesis.onvoiceschanged === checkVoices) {
      window.speechSynthesis.onvoiceschanged = null;
    }
  };
}

// دالة نطق النص العربي بهدوء وتأمل
export function speakArabic(text, onStart, onEnd, onError) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('المتصفح لا يدعم القراءة الصوتية');
    return;
  }

  const voice = getAvailableArabicVoice();
  if (!voice) {
    if (onError) onError('لا يتوفر صوت عربي أصيل على جهازك');
    return;
  }

  // إيقاف أي قراءة سابقة
  window.speechSynthesis.cancel();

  // إعداد النطق بنبرة هادئة ومتأنية تناسب التأمل والذكر
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang || 'ar-SA';
  utterance.rate = 0.86; // وتيرة هادئة مريحة
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

// إيقاف القراءة الصوتية
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
