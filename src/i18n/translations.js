/**
 * نظام الترجمة وتعدد اللغات لمنصة نِعْمَة (NEMAA)
 * يدعم اللغتين: العربية (الأصلية) والإنجليزية (English)
 */

export const TRANSLATIONS = {
  ar: {
    dir: 'rtl',
    lang: 'ar',
    brandTitle: 'نِعْمَة',
    brandSlogan: '« تَذَكَّرْ لِتَشْكُرْ »',
    streakTooltip: 'حامد مستمر: {streak} أيام',
    streakBadge: '{streak}d',
    
    // Header Buttons
    journalBtn: 'دَفْتَرُ الحَمْدِ وَالامْتِنَان',
    notificationsBtn: 'التذكير اليومي بالنعمة',
    searchBtn: 'تصفح وبحث في النعم',
    addBlessingBtn: 'إضافة نعمة خاصة بك',
    favoritesBtn: 'النعم المفضلة',
    themeDay: 'الوضع النهاري',
    themeNight: 'وضع سكينة الليل',
    switchLanguage: 'English',
    langBadge: 'EN',
    installPwa: 'تثبيت تطبيق نِعْمَة على هاتفك',
    
    // Stats Banner
    dailyStatsLabel: 'تأملاتك وحمدك اليوم:',
    dailyStatsCount: '{count} مرات',
    milestones: {
      bronze: 'بداية مباركة بالحمد',
      silver: 'حامدٌ شاكرٌ لله',
      gold: '«وَقَلِيلٌ مِّنْ عِبَادِيَ الشَّكُورُ»',
      diamond: 'نورٌ على نور وبركة دائمة'
    },

    // Card Header & Actions
    focusMode: 'الوضع التدبري الهادئ (ملء الشاشة)',
    audioListen: 'استماع للتأمل والذكر',
    audioStop: 'إيقاف القراءة الصوتية',
    copyBtn: 'نسخ النص والتأمل',
    copiedText: 'تم النسخ!',
    downloadBtn: 'تحميل كبطاقة مصممة',
    shareBtn: 'مشاركة النعمة',
    favoriteAdd: 'حفظ في المفضلة',
    favoriteRemove: 'إزالة من المفضلة',
    customBadge: 'خاصة بك',
    
    // Proof Box
    proofQuran: 'شاهد من كتاب الله',
    proofHadith: 'حديث شريف',
    proofMeaningLabel: 'ترجمة معاني الآية:',

    // Gratitude Dua
    duaTitle: 'دعاء شكر النعمة',
    duaCopy: 'نسخ الدعاء',
    duaCopied: 'تم النسخ',

    // Primary Controls
    alhamdulillahBtn: 'الْحَمْدُ لِلَّهِ',
    newBlessingBtn: 'نِعْمَةٌ جَدِيدَةٌ',
    prevBlessingBtn: 'السابقة',
    nextBlessingBtn: 'التالية',
    shareToRewardBtn: 'شَارِكْ تُؤْجَرْ',
    
    // Card Export
    cardThemes: {
      olive: 'الزيتوني الملكي',
      sand: 'الرملي النوراني',
      midnight: 'سكينة الليل',
      emerald: 'الزمردي النقي'
    },
    exportStory: 'حالة / قصة (9:16)',
    exportSquare: 'مربع (1:1)',

    // Categories
    categories: {
      all: 'كافة النعم',
      hidden: 'نعم باطنة وخفية',
      body: 'الصحة والجسد',
      spiritual: 'نعم إيمانية وروحية',
      family: 'العلاقات والأهل',
      daily: 'نعم يومية بسيطة'
    },

    // Language Modal
    langModal: {
      title: 'اختر لغة التطبيق',
      subtitle: 'Select your preferred language',
      desc: 'يمكنك تغيير اللغة في أي وقت من الشريط العلوي للتطبيق.',
      arOption: 'العربية (اللغة الأصلية)',
      enOption: 'English (Meaning & Translation)',
      confirmBtn: 'متابعة'
    },

    // Share App Modal
    shareApp: {
      modalTitle: 'شَارِكْ تُؤْجَرْ — صَدَقَةٌ جَارِيَةٌ',
      modalSubtitle: 'انشر تطبيق نِعْمَة بين أهلك وأحبابك، فالدال على الخير كفاعله',
      propheticProof: '«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»',
      proofSource: 'صحيح مسلم',
      appDesc: 'تطبيق إسلامي تدبّري لتذكير القلوب بنعم الله الغامرة وتجديد الحمد والامتنان كل يوم.',
      appLink: 'https://ahmedmootx-sys.github.io/NEMAA/',
      downloadStoryPoster: 'تنزيل كبوستر للحالة (Story)',
      shareViaApp: 'مشاركة رابط التطبيق',
      copyLink: 'نسخ الرابط',
      linkCopied: 'تم نسخ الرابط بنجاح!'
    }
  },

  en: {
    dir: 'ltr',
    lang: 'en',
    brandTitle: 'Nemaa',
    brandSlogan: '« Remember to Give Thanks »',
    streakTooltip: 'Continuous Gratitude: {streak} days',
    streakBadge: '{streak}d',
    
    // Header Buttons
    journalBtn: 'Gratitude & Reflection Journal',
    notificationsBtn: 'Daily Gratitude Reminder',
    searchBtn: 'Explore & Search Blessings',
    addBlessingBtn: 'Add Your Custom Blessing',
    favoritesBtn: 'Favorite Blessings',
    themeDay: 'Daylight Mode',
    themeNight: 'Night Serenity',
    switchLanguage: 'العربية',
    langBadge: 'ع',
    installPwa: 'Install Nemaa App on Your Phone',
    
    // Stats Banner
    dailyStatsLabel: 'Your praises today:',
    dailyStatsCount: '{count} times',
    milestones: {
      bronze: 'A blessed beginning of gratitude',
      silver: 'Grateful & giving thanks to Allah',
      gold: '«And few of My servants are grateful»',
      diamond: 'Light upon light and lasting blessing'
    },

    // Card Header & Actions
    focusMode: 'Serene Focus Mode (Full Screen)',
    audioListen: 'Listen to Reflection and Adhkar',
    audioStop: 'Stop Audio Playback',
    copyBtn: 'Copy Reflection & Text',
    copiedText: 'Copied!',
    downloadBtn: 'Download as Designed Card',
    shareBtn: 'Share Blessing',
    favoriteAdd: 'Save to Favorites',
    favoriteRemove: 'Remove from Favorites',
    customBadge: 'Custom Blessing',
    
    // Proof Box
    proofQuran: 'Evidence from the Holy Quran',
    proofHadith: 'Noble Prophetic Hadith',
    proofMeaningLabel: 'Translation of Meaning:',

    // Gratitude Dua
    duaTitle: 'Gratitude Prayer (Dua)',
    duaCopy: 'Copy Dua',
    duaCopied: 'Copied',

    // Primary Controls
    alhamdulillahBtn: 'ALHAMDULILLAH',
    newBlessingBtn: 'NEW BLESSING',
    prevBlessingBtn: 'Previous',
    nextBlessingBtn: 'Next',
    shareToRewardBtn: 'SHARE & BE REWARDED',
    
    // Card Export
    cardThemes: {
      olive: 'Royal Olive',
      sand: 'Luminous Sand',
      midnight: 'Night Serenity',
      emerald: 'Pure Emerald'
    },
    exportStory: 'Status / Story (9:16)',
    exportSquare: 'Square (1:1)',

    // Categories
    categories: {
      all: 'All Blessings',
      hidden: 'Hidden & Subtle Blessings',
      body: 'Health & Bodily Blessings',
      spiritual: 'Spiritual & Faith Blessings',
      family: 'Family & Kinship Blessings',
      daily: 'Daily Life Blessings'
    },

    // Language Modal
    langModal: {
      title: 'Choose Application Language',
      subtitle: 'اختر لغة التطبيق المفضلة',
      desc: 'You can change the language anytime from the top bar.',
      arOption: 'العربية (Original Arabic)',
      enOption: 'English (Translation of Meaning)',
      confirmBtn: 'Continue'
    },

    // Share App Modal
    shareApp: {
      modalTitle: 'SHARE & BE REWARDED — SADAQAH JARIYAH',
      modalSubtitle: 'Share Nemaa with family and friends — whoever guides to good receives the reward of the doer',
      propheticProof: '«Whoever guides someone to goodness will have a reward like one who did it»',
      proofSource: 'Sahih Muslim',
      appDesc: 'An Islamic mindfulness app to inspire hearts with Allah’s boundless favors and cultivate daily gratitude.',
      appLink: 'https://ahmedmootx-sys.github.io/NEMAA/',
      downloadStoryPoster: 'Download Story / Status Poster',
      shareViaApp: 'Share App Link',
      copyLink: 'Copy Link',
      linkCopied: 'Link copied successfully!'
    }
  }
};
