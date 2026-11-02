/**
 * Intelligent Arabic Spell Checker and Linguistic Proofreader
 * Dedicated to Islamic, gratitude, and classical reflections vocabulary
 */

// Common exact word replacements
const WORD_REPLACEMENTS = {
  // Hamzat & Divine Name corrections
  'اللة': 'الله',
  'للة': 'لله',
  'باللة': 'بالله',
  'واللة': 'والله',
  'فاللة': 'فالله',
  'تاللة': 'تالله',
  'الحمدلله': 'الحمد لله',
  'ولله': 'ولله',
  'انشاء': 'إن شاء',
  'انشالله': 'إن شاء الله',
  'انشا': 'إن شاء',
  
  // Salawat corrections
  'صلي': 'صلِّ',
  'صلوات': 'صلوات',
  
  // Prepositions (Alif Maqsura vs Yaa)
  'علي': 'على',
  'وعلي': 'وعلى',
  'فعلي': 'فعلى',
  'إلي': 'إلى',
  'والي': 'وإلى',
  'فالي': 'فإلى',
  'حتي': 'حتى',
  'وحتي': 'وحتى',
  'بلي': 'بلى',
  'متي': 'متى',
  'لدي': 'لدى',
  'سوي': 'سوى',
  
  // Nouns with Taa Marbuta vs Haa
  'نعمه': 'نعمة',
  'ونعمه': 'ونعمة',
  'رحمه': 'رحمة',
  'ورحمه': 'ورحمة',
  'عافيه': 'عافية',
  'وعافيه': 'وعافية',
  'هدايه': 'هداية',
  'وهدايه': 'وهداية',
  'بركه': 'بركة',
  'وبركه': 'وبركة',
  'سعاده': 'سعادة',
  'حياه': 'حياة',
  'وحياه': 'وحياة',
  'يقظه': 'يقظة',
  'منه': 'منّة',
  'سكينه': 'سكينة',
  'طمأنينه': 'طمأنينة',
  'خاتمه': 'خاتمة',
  'مغفره': 'مغفرة',
  'توبه': 'توبة',
  'طاعه': 'طاعة',
  'محبوبه': 'محبوبة',
  'معصيه': 'معصية',
  'غايه': 'غاية',
  'بدايه': 'بداية',
  'نهايه': 'نهاية',
  'عظيمه': 'عظيمة',
  'جليله': 'جليلة',
  'كبيره': 'كبيرة',
  'صغيره': 'صغيرة',
  'كثيره': 'كثيرة',
  'قليله': 'قليلة',
  
  // Common Hamza corrections
  'ان': 'إن',
  'وان': 'وإن',
  'فان': 'فإن',
  'بان': 'بأن',
  'لان': 'لأن',
  'ولان': 'ولأن',
  'الا': 'إلا',
  'والا': 'وإلا',
  'اذا': 'إذا',
  'واذا': 'وإذا',
  'فاذا': 'فإذا',
  'ايمان': 'إيمان',
  'وايمان': 'وإيمان',
  'اسلام': 'إسلام',
  'واسلام': 'وإسلام',
  'احسان': 'إحسان',
  'انسان': 'إنسان',
  'والانسان': 'والإنسان',
  'للانسان': 'للإنسان',
  'انعام': 'إنعام',
  'ايثار': 'إيثار',
  'اخلاص': 'إخلاص',
  'استغفار': 'استغفار',
  'إستغفار': 'استغفار',
  'إستغفر': 'استغفر',
  'إبتلاء': 'ابتلاء',
  'إبتلى': 'ابتلى',
  'إصطفى': 'اصطفى',
  'إلهام': 'إلهام',
  'والهام': 'وإلهام',
  'ادعية': 'أدعية',
  'وادعية': 'وأدعية',
  'اذكار': 'أذكار',
  'واذكار': 'وأذكار',
  'افضل': 'أفضل',
  'اعظم': 'أعظم',
  'اكثر': 'أكثر',
  'اجمل': 'أجمل',
  'اكرم': 'أكرم',
  'ارحم': 'أرحم',
  'اول': 'أول',
  'اخر': 'آخر',
  'امس': 'أمس',
  'اليوم': 'اليوم',
  'اية': 'آية',
  'ايات': 'آيات',
  'قران': 'قرآن',
  'القران': 'القرآن'
};

// Phrase corrections
const PHRASE_REPLACEMENTS = [
  { pattern: /\bان\s+شاء\s+الله\b/gu, replacement: 'إن شاء الله' },
  { pattern: /\bإنشاء\s+الله\b/gu, replacement: 'إن شاء الله' },
  { pattern: /\bصلى\s+اللة\b/gu, replacement: 'صلى الله' },
  { pattern: /\bصلي\s+الله\s+عليه\s+وسلم\b/gu, replacement: 'صلى الله عليه وسلم' },
  { pattern: /\bاللهم\s+صلي\b/gu, replacement: 'اللهم صلِّ' },
  { pattern: /\bجزاك\s+اللة\b/gu, replacement: 'جزاك الله' },
  { pattern: /\bجزاكم\s+اللة\b/gu, replacement: 'جزاكم الله' },
  { pattern: /\bسبحان\s+اللة\b/gu, replacement: 'سبحان الله' },
  { pattern: /\bلا\s+اله\s+الا\s+الله\b/gu, replacement: 'لا إله إلا الله' },
  { pattern: /\bلاإله\s+إلا\s+الله\b/gu, replacement: 'لا إله إلا الله' },
  { pattern: /\bاستغفر\s+اللة\b/gu, replacement: 'أستغفر الله' },
  { pattern: /\bاستغفر\s+الله\b/gu, replacement: 'أستغفر الله' }
];

/**
 * Clean and normalize spacing around punctuation
 */
function fixPunctuationSpacing(text) {
  if (!text) return '';
  return text
    // Remove space before punctuation marks
    .replace(/\s+([،؛.?!:)])/gu, '$1')
    // Remove space after opening brackets
    .replace(/([([{«])\s+/gu, '$1')
    // Ensure single space after punctuation (if followed by a letter/word)
    .replace(/([،؛.?!:)])([^\s،؛.?!:)\d])/gu, '$1 $2')
    // Ensure single space before opening quotes/brackets
    .replace(/([^\s([{«])([«([{])/gu, '$1 $2')
    // Clean up excessive spaces
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Proofread and correct a single text string
 */
export function proofreadArabicText(text) {
  if (!text || typeof text !== 'string') {
    return { correctedText: text || '', changesCount: 0, details: [] };
  }

  let working = text;
  let changesCount = 0;
  const details = [];

  // 1. Apply multi-word phrase replacements
  for (const item of PHRASE_REPLACEMENTS) {
    if (item.pattern.test(working)) {
      working = working.replace(item.pattern, (match) => {
        if (match !== item.replacement) {
          changesCount++;
          details.push(`«${match}» ⬅️ «${item.replacement}»`);
          return item.replacement;
        }
        return match;
      });
    }
  }

  // 2. Tokenize into words and punctuation
  const tokens = working.split(/([\s،؛.?!:()«»"'/\\-]+)/u);
  const correctedTokens = tokens.map(token => {
    // If token is in dictionary, replace
    if (WORD_REPLACEMENTS[token]) {
      const repl = WORD_REPLACEMENTS[token];
      if (repl !== token) {
        changesCount++;
        details.push(`«${token}» ⬅️ «${repl}»`);
        return repl;
      }
    }
    return token;
  });

  working = correctedTokens.join('');

  // 3. Punctuation formatting
  const formatted = fixPunctuationSpacing(working);
  if (formatted !== working) {
    changesCount++;
  }

  return {
    correctedText: formatted.trim(),
    changesCount,
    details: [...new Set(details)]
  };
}

/**
 * Proofread both title and reflection of a blessing
 */
export function proofreadBlessing({ title, reflection }) {
  const titleRes = proofreadArabicText(title || '');
  const refRes = proofreadArabicText(reflection || '');

  const totalChanges = titleRes.changesCount + refRes.changesCount;
  const allDetails = [...titleRes.details, ...refRes.details];

  return {
    title: titleRes.correctedText,
    reflection: refRes.correctedText,
    changesCount: totalChanges,
    details: [...new Set(allDetails)],
    hasChanges: totalChanges > 0
  };
}
