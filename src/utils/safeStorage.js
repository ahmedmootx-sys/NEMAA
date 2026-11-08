/**
 * قراءة آمنة من localStorage.
 *
 * المشكلة التي تحلّها: التطبيق كان يفترض أن كل قيمة محفوظة بالشكل الذي كتبه هو بالضبط.
 * لو تلفت القيمة (إضافة متصفح، نسخة قديمة من التطبيق، تعديل يدوي) كانت تنهار الشاشة كلها.
 * هنا تُرجَع دائماً قيمة بالشكل المتوقع، وأي عنصر غير صالح يُتجاهل بدل أن يُسقط التطبيق.
 * لا تكتب شيئاً في التخزين ولا تمسح بيانات المستخدم.
 */

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// نعمة صالحة للعرض: العنوان نص، وبقية الحقول النصية إن وُجدت نصوص (الكود يستدعي عليها trim/toLowerCase)
const TEXT_FIELDS = ['reflection', 'author', 'proof', 'proofSource', 'category', 'categoryName'];
export const isBlessingLike = (v) =>
  isPlainObject(v) &&
  typeof v.title === 'string' &&
  TEXT_FIELDS.every((f) => v[f] === undefined || v[f] === null || typeof v[f] === 'string');

/**
 * يقرأ مصفوفة. itemType:
 *  - 'object'    → تبقى العناصر الكائنية فقط (إشعارات، بلاغات...)
 *  - 'blessing'  → كائنات نعم صالحة (عنوان نصي وحقول نصية سليمة)
 *  - 'string'    → معرّفات نصية (الأرقام تتحول إلى نص)
 *  - 'primitive' → تبقى النصوص والأرقام كما هي (المفضّلة: معرّفات النعم المدمجة أرقام)
 *  - غير ذلك     → يُحذف null/undefined فقط
 */
export function readStoredArray(key, itemType) {
  const value = readRaw(key);
  if (!Array.isArray(value)) return [];
  if (itemType === 'object') return value.filter(isPlainObject);
  if (itemType === 'blessing') return value.filter(isBlessingLike);
  if (itemType === 'string') {
    // معرّفات نصية: الأرقام تُحوَّل إلى نص (الكود يستدعي عليها دوال النصوص)، وغير ذلك يُهمل
    return value
      .filter((v) => typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))
      .map(String);
  }
  if (itemType === 'primitive') {
    return value.filter((v) => typeof v === 'string' || typeof v === 'number');
  }
  return value.filter((v) => v !== null && v !== undefined);
}

/** يقرأ كائناً عادياً (وليس مصفوفة ولا null)، وإلا يُرجع {} */
export function readStoredObject(key) {
  const value = readRaw(key);
  return isPlainObject(value) ? value : {};
}
