import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Compass, 
  HelpCircle, 
  Play, 
  Volume2, 
  Maximize2, 
  PenTool, 
  Share2, 
  Download, 
  Globe, 
  HeartHandshake, 
  Headphones, 
  RefreshCw,
  QrCode,
  CheckCircle2,
  Trash2,
  BookOpen,
  Settings,
  MessageSquare
} from 'lucide-react';

export default function AppGuideModal({ 
  isOpen, 
  onClose, 
  onStartInteractiveTour,
  lang = 'ar' 
}) {
  const [activeTab, setActiveTab] = useState('buttons'); // 'buttons' | 'changelog'

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const buttonGuides = [
    {
      icon: <Sparkles size={22} color="var(--color-gold)" />,
      title: isRtl ? 'زر «الحمد لله» وهالة السكينة والمزامنة اللحظية' : 'Praise Button & Realtime Aura',
      desc: isRtl 
        ? 'الزر الأساسي في المنصة؛ عند الضغط عليه بعد تدبّر النعمة يفيض نبض نوراني دافئ مع نقرة خشبية وقورة لخرزة المسبحة، ويتحرك عداد الحامدون للنعمة لحظياً لدى جميع المستخدمين المتصلين في نفس اللحظة.'
        : 'The core button; triggers a warm golden glow, prayer bead click, and syncs the praise counter in real-time across all users.'
    },
    {
      icon: <RefreshCw size={20} color="var(--color-primary)" />,
      title: isRtl ? 'زر «نعمة جديدة» والتنقل بالسحب (Swipe)' : 'New Blessing & Swipe Navigation',
      desc: isRtl 
        ? 'للتنقل الفوري بين نعم الله؛ يمكنك التنقل بالأسهم، أو بسحب قالب النعمة يميناً ويساراً بأصبعك بسلاسة تامة على الهاتف، أو بالضغط على «نعمة جديدة» لعرض نعمة عشوائية ملهمة (أو زر المسافة Spacebar).'
        : 'Seamlessly browse blessings using arrows, horizontal finger swipe on mobile, or click "New Blessing" (or Spacebar).'
    },
    {
      icon: <Settings size={20} color="var(--color-gold)" />,
      title: isRtl ? 'شاشة الإعدادات وتخصيص المنصة' : 'Settings & Full Preferences',
      desc: isRtl 
        ? 'شاشة شاملة في أعلى المنصة تتيح لك: اختيار مظهر التطبيق (فاتح دافئ / ليلي هادئ)، نوع الخط (عصري بوضوح فائق / تقليدي أصيل)، لغة التطبيق، إدارة نعمك المنشورة، ورسالة المنصة.'
        : 'Comprehensive control screen for dark/light theme, modern/classic typography, language toggle, and managing your published blessings.'
    },
    {
      icon: <Sparkles size={20} color="#D4AF37" />,
      title: isRtl ? 'نشر نعمة ومساعد الكتابة الذكي' : 'Publish Blessing & Writing Assistant',
      desc: isRtl 
        ? 'شارك نعمة استشعرت فضلها لتظهر لجميع زوار المنصة صدقةً جارية؛ كما يتوفر مساعد كتابة ذكي يمدك بأفكار وصياغات بلاغية وشواهد قرآنية ونبوية موثقة إن احتجت للمساعدة في الصياغة.'
        : 'Share a blessing with the community with guidance from the smart writing assistant for phrasing and authentic Quranic/Hadith proofs.'
    },
    {
      icon: <PenTool size={20} color="#319795" />,
      title: isRtl ? 'صياغة وتعديل النعمة بكلامك' : 'Personal Reflection Rephrasing',
      desc: isRtl 
        ? 'أيقونة القلم أعلى البطاقة تتيح لك كتابة تأملاتك ومشاعرك بأسلوبك وكلماتك الخاصة، وتُحفظ صياغتك بأمان على جهازك.'
        : 'The pen icon lets you personalize reflections in your own words, stored privately on your device.'
    },
    {
      icon: <Maximize2 size={20} color="var(--color-primary)" />,
      title: isRtl ? 'وضع الخلوة والتدبّر الصامت (Zen)' : 'Zen Reflection Mode',
      desc: isRtl 
        ? 'يُخفي كافة الأزرار والمشتتات ليمنحك واجهة خلوة نقية وساكنة تركز فيها فقط على النعمة والآية الكريمة بخشوع.'
        : 'Hides all controls for a pure, distraction-free spiritual contemplation space.'
    },
    {
      icon: <Volume2 size={20} color="var(--color-gold)" />,
      title: isRtl ? 'الاستماع الصوتي للنعمة' : 'Audio Narration',
      desc: isRtl 
        ? 'قراءة صوتية فصيحة ومريحة لنص النعمة وتدبرها تتيح لك الاستماع والتأمل وعيناك مغلقتان (يظهر عند توفر قارئ عربي في جهازك).'
        : 'Clear Arabic audio narration to listen and reflect with closed eyes.'
    },
    {
      icon: <Globe size={20} color="#3182CE" />,
      title: isRtl ? 'قسم «نِعَمي المنشورة» في الإعدادات' : 'My Published Blessings Section',
      desc: isRtl 
        ? 'قسم خاص في الإعدادات يعرض كل ما نشرته؛ لمتابعة عدد الذين حمدوا الله على نعمتك لحظياً، مع إمكانية تعديلها أو تصحيح أي خطأ إملائي أو حذفها في أي وقت.'
        : 'Dedicated section in Settings to track your contributions, see live praise counts, edit typos, or remove your blessings.'
    },
    {
      icon: <MessageSquare size={20} color="#38A169" />,
      title: isRtl ? 'الشكاوى والمقترحات' : 'Feedback & Suggestions',
      desc: isRtl 
        ? 'نافذة تواصل مباشرة وسريعة في الإعدادات؛ لإرسال أي فكرة تطويرية أو ملاحظة تقنية لتصل فوراً إلى لوحة تحكم المشرفين لمراجعتها والعمل بها.'
        : 'Direct feedback channel to send suggestions or report issues straight to admin moderation.'
    },
    {
      icon: <Share2 size={20} color="#805AD5" />,
      title: isRtl ? 'تصدير ومشاركة كروت النعم' : 'Export & Share Cards',
      desc: isRtl 
        ? 'تصدير بطاقة النعمة كصورة فائقة الدقة بتنسيق مربع (1:1) للمنشورات أو رأسي (9:16) للقصص (Story) بزخارف إسلامية ذهبية فاخرة لنشر الخير.'
        : 'Export high-resolution blessing cards formatted for social posts (1:1) or stories (9:16) with elegant Islamic motifs.'
    },
    {
      icon: <QrCode size={20} color="var(--color-gold)" />,
      title: isRtl ? 'بوستر «شَارِكْ تُؤْجَرْ»' : 'Share & Be Rewarded Poster',
      desc: isRtl 
        ? 'توليد بوستر دعوي فخم بالخط العربي ورابط المنصة والباركود المباشر لمشاركته في حالات واتساب وشبكات التواصل لنيل أجر الدال على الخير.'
        : 'Generate an elegant calligraphy poster with direct QR code for status updates and social media.'
    },
    {
      icon: <HeartHandshake size={20} color="#E53E3E" />,
      title: isRtl ? 'مفكرة الامتنان وقائمة المفضلة' : 'Gratitude Journal & Favorites',
      desc: isRtl 
        ? 'مفكرة يومية لتدوين 3 نعم شكرت الله عليها مع أرشيف أسبوعي، إلى جانب حفظ النعم المؤثرة في المفضلة للرجوع إليها متى شئت.'
        : 'Daily journal to record 3 personal blessings plus bookmarks for favorite blessings.'
    }
  ];

  const changelog = [
    {
      version: 'الإصدار 3.0 (الأحدث)',
      date: 'اليوم',
      badge: 'تحديث شامل',
      items: [
        '⚙️ شاشة إعدادات متكاملة: تجميع خيارات المظهر، الخط، اللغة، الدليل، والشكاوى والمقترحات في شاشة كاملة موحدة ومريحة للهاتف.',
        '🤲 تحديث عداد الحامدون لحظياً: تحرك العداد فوراً لدى كافة المستخدمين المتصلين مع إشعارات تدبّر رقيقة عند حمد الآخرين.',
        '✍️ مساعد كتابة النعمة بالذكاء الاصطناعي: مساعدة المتدبر في صياغة النعمة واقتراح شواهد موثقة من القرآن والسنة.',
        '📱 التنقل بالسحب (Swipe): إمكانية تقليب كروت النعم بالسحب بالأصبع يميناً ويساراً بسلاسة تامة على الهواتف.',
        '💎 أيقونات فيكتور عصرية ناعمة: استبدال الرموز التعبيرية بأيقونات هندسية أنيقة متناسقة مع الهوية الذهبية للمنصة.',
        '📂 قسم «نِعَمي المنشورة»: إمكانية تعديل نعمتك أو حذفها ومتابعة عدد الحامدون عليها من داخل الإعدادات.'
      ]
    },
    {
      version: 'الإصدار 2.5',
      date: 'تحديث سابق',
      badge: 'ميزات مجتمعية',
      items: [
        '✨ نشر وتشارك النعم بين جميع زوار المنصة وتحديثها لحظياً.',
        '🛡️ لوحة إدارة متطورة لمراجعة البلاغات والشكاوى وتعديل النعم أو حذفها.',
        '🕊️ هالة السكينة ونور الحمد مع نقر تسبيحة وقورة غير موسيقية.',
        '🎨 تحسين تصدير المنشورات المربعة والقصص (Stories) بدقة عالية.'
      ]
    }
  ];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      style={{
        zIndex: 10005,
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        className="modal-content guide-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '680px', 
          width: '94%',
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 30px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', margin: 0, borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(212, 175, 55, 0.14)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Compass size={22} color="var(--color-gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontFamily: 'var(--font-arabic-title)', margin: 0, color: 'var(--text-title)' }}>
                {lang === 'ar' ? 'دليل منصة نِعْمَة واستكشاف الميزات' : 'NEMAA Guide & Features'}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                {lang === 'ar' ? 'تعرّف على كافة الأزرار والوظائف والتحديثات الجديدة' : 'Explore all buttons, features, and recent updates'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: 'none',
              background: 'transparent',
              fontSize: '13.5px',
              fontWeight: activeTab === 'buttons' ? '700' : '500',
              color: activeTab === 'buttons' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'buttons' ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={16} />
            <span>شرح الأزرار والوظائف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: 'none',
              background: 'transparent',
              fontSize: '13.5px',
              fontWeight: activeTab === 'changelog' ? '700' : '500',
              color: activeTab === 'changelog' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'changelog' ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={16} color="var(--color-gold)" />
            <span>ما الجديد في التحديثات</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'buttons' ? (
            <div>
              {/* Quick Launch Interactive Tour Banner */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(44, 74, 62, 0.12) 0%, rgba(212, 175, 55, 0.16) 100%)',
                  border: '1.5px solid var(--border-gold)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-title)' }}>
                    الجولة التفاعلية المباشرة (النقطة المضيئة)
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    تظليل الشاشة والتركيز بنقطة مضيئة على كل زر بالترتيب مع شرح عملي.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartInteractiveTour) onStartInteractiveTour();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                    color: '#FFFFFF',
                    border: '1.5px solid #D4AF37',
                    borderRadius: 'var(--radius-full)',
                    padding: '9px 20px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)'
                  }}
                >
                  <Play size={14} fill="#FFFFFF" color="#FFFFFF" />
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>بدء الجولة المباشرة</span>
                </button>
              </div>

              {/* Grid of Button Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {buttonGuides.map((guide, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-sunken)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {guide.icon}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-title)' }}>
                        {guide.title}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                      {guide.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {changelog.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-primary)', fontFamily: 'var(--font-arabic-heading)' }}>
                        {entry.version}
                      </h3>
                      <span style={{ fontSize: '11px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                        {entry.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{entry.date}</span>
                  </div>

                  <ul style={{ margin: 0, paddingRight: '18px', listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {entry.items.map((item, itemIdx) => (
                      <li key={itemIdx} style={{ fontSize: '13px', lineHeight: '1.65', color: 'var(--text-main)' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
