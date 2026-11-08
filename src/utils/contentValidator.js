/**
 * Content validation and moderation for NEMAA community blessings.
 * Ensures submissions are meaningful, respectful, and free of profanity or gibberish.
 */

// Common Arabic profanity and abusive terms blocklist
const PROFANITY_BLOCKLIST = [
  'كلب', 'حمار', 'حيوان', 'وسخ', 'قذر', 'سافل', 'حقير', 'منحط', 'تافه',
  'لعنة', 'يلعن', 'اللعنة', 'تبا', 'شتيمة', 'قحبة', 'شرموطة', 'عرص', 'ديوث',
  'منيك', 'كس', 'طيز', 'زب', 'منيوك', 'ابن الكلب', 'ابن الحرام', 'يا كلب',
  'يا حمار', 'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'bastard'
];

/**
 * Checks if a string contains consecutive repeating characters exceeding threshold
 * e.g., 'هههههههههه' or 'سسسسسسس' or 'aaaaaaa'
 */
function hasExcessiveRepetition(str) {
  return /(.)\1{4,}/i.test(str);
}

/**
 * Checks if text is predominantly Latin gibberish (e.g., 'asdfghjkl')
 */
function isLatinGibberish(str) {
  const arabicLetters = (str.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (str.match(/[a-zA-Z]/g) || []).length;
  return latinLetters > arabicLetters && latinLetters > 4;
}

/**
 * توحيد النص قبل الفحص: يُزيل التشكيل والتطويل (ـ) وعلامات المصحف ويوحّد الألف والياء والتاء المربوطة
 * حتى لا تمرّ كلمة بذيئة بإضافة حركة أو مدّ. (النص السابق كان يحوّل التشكيل إلى مسافة فتفلت الكلمة.)
 */
export function normalizeForModeration(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// الكلمات المفردة تُطابَق كلمةً كاملة (فلا تُحجب «كسوة» بسبب «كس»)، والعبارات تُطابَق كعبارة.
const NORMALIZED_BLOCKLIST = PROFANITY_BLOCKLIST.map(normalizeForModeration).filter(Boolean);
const BLOCKED_WORDS = new Set(NORMALIZED_BLOCKLIST.filter(w => !w.includes(' ')));
const BLOCKED_PHRASES = NORMALIZED_BLOCKLIST.filter(w => w.includes(' '));

/**
 * Checks if string contains any prohibited profanity word
 */
function containsProfanity(str) {
  if (!str) return false;
  const normalized = normalizeForModeration(str);
  // نسخة ثانية تدمج الحرف المكرّر 3 مرات فأكثر («كللللب» → «كلب»)
  const collapsed = normalized.replace(/(.)\1{2,}/g, '$1');
  for (const text of [normalized, collapsed]) {
    const words = text.split(' ');
    if (words.some(w => BLOCKED_WORDS.has(w))) return true;
    const padded = ' ' + text + ' ';
    if (BLOCKED_PHRASES.some(p => padded.includes(' ' + p + ' '))) return true;
  }
  return false;
}

/**
 * Validates blessing submission content
 * - Allows single-word titles as requested (e.g. "البصر", "الأمان", "الستر")
 * - Enforces meaningful Arabic letters
 * - Disallows gibberish, spam repetition, and profanity
 */
export function validateBlessingContent({ title, reflection }) {
  const cleanTitle = (title || '').trim();
  const cleanReflection = (reflection || '').trim();

  // 1. Mandatory presence
  if (!cleanTitle) {
    return {
      isValid: false,
      field: 'title',
      errorMessage: 'يرجى كتابة اسم أو وصف النعمة (ولو كلمة واحدة كالـ «البصر» أو «الأمان»)'
    };
  }

  if (!cleanReflection) {
    return {
      isValid: false,
      field: 'reflection',
      errorMessage: 'يرجى كتابة تدبّر وشرح أثر النعمة على نفسك وحياتك'
    };
  }

  // 2. Minimum length check: Title at least 2 Arabic letters (allows single words)
  const titleArabicCount = (cleanTitle.match(/[\u0600-\u06FF]/g) || []).length;
  if (titleArabicCount < 2) {
    return {
      isValid: false,
      field: 'title',
      errorMessage: 'يرجى كتابة اسم نعمة مفهوم باللغة العربية'
    };
  }

  // Reflection minimum length: at least 8 Arabic characters
  const refArabicCount = (cleanReflection.match(/[\u0600-\u06FF]/g) || []).length;
  if (refArabicCount < 8) {
    return {
      isValid: false,
      field: 'reflection',
      errorMessage: 'التدبّر قصير جداً، يرجى كتابة جملة معبرة توضح فضل هذه النعمة'
    };
  }

  // 3. Gibberish & excessive repetition checks
  if (hasExcessiveRepetition(cleanTitle) || isLatinGibberish(cleanTitle)) {
    return {
      isValid: false,
      field: 'title',
      errorMessage: 'اسم النعمة يحتوي على حروف مكررة أو غير مفهومة، يرجى كتابة كلمة واضحة'
    };
  }

  if (hasExcessiveRepetition(cleanReflection) || isLatinGibberish(cleanReflection)) {
    return {
      isValid: false,
      field: 'reflection',
      errorMessage: 'كلام التدبّر يحتوي على حروف مكررة أو نص غير مفهوم، يرجى كتابة تأمل لائق'
    };
  }

  // 4. Profanity & inappropriate speech filter
  if (containsProfanity(cleanTitle)) {
    return {
      isValid: false,
      field: 'title',
      errorMessage: 'اسم النعمة يحتوي على ألفاظ غير لائقة، يرجى مراعاة قدسية المنصة'
    };
  }

  if (containsProfanity(cleanReflection)) {
    return {
      isValid: false,
      field: 'reflection',
      errorMessage: 'كلام التدبّر يحتوي على كلمات غير لائقة، يرجى الالتزام بالأدب والاحترام'
    };
  }

  return { isValid: true };
}
