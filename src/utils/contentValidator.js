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
 * Checks if string contains any prohibited profanity word
 */
function containsProfanity(str) {
  if (!str) return false;
  const normalized = str
    .toLowerCase()
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = normalized.split(' ');
  return words.some(w => PROFANITY_BLOCKLIST.includes(w.trim()));
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
