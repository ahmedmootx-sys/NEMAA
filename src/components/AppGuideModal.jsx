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
  BookOpen
} from 'lucide-react';

export default function AppGuideModal({ 
  isOpen, 
  onClose, 
  onStartInteractiveTour,
  lang = 'ar' 
}) {
  const [activeTab, setActiveTab] = useState('buttons'); // 'buttons' | 'changelog'

  if (!isOpen) return null;

  const buttonGuides = [
    {
      icon: <Sparkles size={22} color="var(--color-gold)" />,
      title: 'زر «الحمد لله» وهالة السكينة',
      desc: 'الزر الأساسي في المنصة؛ عند الضغط عليه بعد تدبّر النعمة يفيض نبض نوراني ذهبي دافئ مع نقرة خشبية وقورة لخرزة المسبحة ونفحة سكينة تزيدك خشوعاً دون أي آلات موسيقية.'
    },
    {
      icon: <RefreshCw size={20} color="var(--color-primary)" />,
      title: 'زر «نعمة جديدة» والتنقل',
      desc: 'للتنقل الفوري بين نعم الله؛ يمكنك التنقل بالأسهم أو الضغط على «نعمة جديدة» لعرض نعمة عشوائية ملهمة (كما يمكنك استخدام زر المسافة Spacebar في لوحة المفاتيح).'
    },
    {
      icon: <PenTool size={20} color="#319795" />,
      title: 'صياغة وتعديل النعمة بكلامك',
      desc: 'أيقونة القلم أعلى البطاقة تتيح لك إعادة صياغة تدبّر النعمة وكتابة تأملاتك ومشاعرك بأسلوبك الشخصي، وتُحفظ صياغتك الخاصة على جهازك بأمان.'
    },
    {
      icon: <Maximize2 size={20} color="var(--color-primary)" />,
      title: 'وضع الخلوة والتدبّر الصامت (Zen)',
      desc: 'يُخفي جميع الأزرار وعناصر التحكم ليمنحك شاشة خلوة نقية وساكنة تركز فيها فقط على النعمة والآية الكريمة دون أي مشتتات بصرية.'
    },
    {
      icon: <Volume2 size={20} color="var(--color-gold)" />,
      title: 'الاستماع الصوتي للنعمة',
      desc: 'لقراءة نص النعمة والتدبّر صوتياً بنبرة عربية فصيحة ومريحة تتيح لك الاستماع والتأمل وعيناك مغلقتان (يظهر عند توفر قارئ عربي في جهازك).'
    },
    {
      icon: <Globe size={20} color="#3182CE" />,
      title: 'النعم المتشارَكة ونشر النعم',
      desc: 'قسم مجتمعي موصول بقاعدة بيانات عالمية؛ يمكنك نشر نعمة تدبّرتها لتظهر لجميع زوار المنصة وتكون لك صدقة جارية، مع إمكانية حذفها في أي وقت.'
    },
    {
      icon: <Share2 size={20} color="#805AD5" />,
      title: 'تصدير ومشاركة كروت النعم',
      desc: 'تصدير بطاقة النعمة كصورة فائقة الجودة بمقاس منشور مربع (1:1) أو ستوري (9:16) بزخارف إسلامية ذهبية فاخرة لنشرها في شبكات التواصل.'
    },
    {
      icon: <QrCode size={20} color="var(--color-gold)" />,
      title: 'بوستر «شَارِكْ تُؤْجَرْ»',
      desc: 'توليد بوستر دعوي فخم بالخط العربي المعتمد ورابط المنصة ورمز الباركود؛ لمشاركته في حالات واتساب ونيل أجر الدال على الخير كفاعله.'
    },
    {
      icon: <HeartHandshake size={20} color="#E53E3E" />,
      title: 'مفكرة الامتنان وقائمة المفضلة',
      desc: 'مفكرة لتدوين 3 نعم شكرت الله عليها اليوم مع أرشيف أسبوعي، بالإضافة لخاصية حفظ النعم المحببة إلى قلبك في قائمة المفضلة للرجوع إليها.'
    }
  ];

  const changelog = [
    {
      version: 'الإصدار 2.5 (الأحدث)',
      date: 'اليوم',
      badge: 'ميزات كبرى جديدة',
      items: [
        '✨ تكامل Supabase العالمي: إمكانية نشر وتشارك النعم بين جميع زوار المنصة وتحديثها لحظياً (Realtime).',
        '🗑️ إمكانية حذف النعمة المنشورة: يملك ناشر النعمة خيار حذفها من النشر العام في أي وقت بكل سهولة.',
        '🕊️ هالة السكينة ونور الحمد: استبدال القصاصات بهالة نور ذهبية ونقر تسبيحة وقورة غير موسيقية تبعث الطمأنينة والخشوع في القلب.',
        '🛡️ فحص جودة الكلام والأدب: نظام ذكي يمنع الألفاظ البذيئة والنصوص غير المفهومة، مع إتاحة تسمية النعمة بكلمة واحدة مفهومة.',
        '🎨 تحسين مقاس المنشور المربع (1:1): تكبير خط الرقعة وضبط تباعد النصوص والشاهد لسهولة القراءة التامة بدون أي تداخل.',
        '🧭 دليل التطبيق التفاعلي: جولة النقطة المضيئة (Spotlight) ودليل الأزرار الشامل عند فتح التطبيق لأول مرة.'
      ]
    },
    {
      version: 'الإصدار 2.0',
      date: 'تحديث سابق',
      badge: 'أدوات ونشر',
      items: [
        '📜 بوستر «شَارِكْ تُؤْجَرْ» بالخط العربي الفاخر والباركود المباشر لنشر التطبيق.',
        '✍️ إمكانية صياغة وتعديل النعمة بكلامك الخاص مع حفظها على جهازك.',
        '📱 دعم تثبيت التطبيق PWA خفيف الحجم يعمل بدون إنترنت على جميع الهواتف والحواسيب.',
        '📖 إضافة 50 نعمة جديدة وتدقيقات لغوية وشرعية لجميع الشواهد.'
      ]
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content guide-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '680px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(212, 175, 55, 0.15)',
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
              <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-arabic-title)', margin: 0, color: 'var(--text-title)' }}>
                {lang === 'ar' ? 'دليل منصة نِعْمَة والتحديثات' : 'NEMAA Guide & Updates'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                {lang === 'ar' ? 'تعرّف على كافة أزرار التطبيق وميزاته الجديدة' : 'Explore app buttons and recent updates'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: '36px', height: '36px' }}
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
              fontSize: '14px',
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
            <span>شرح أزرار وخصائص التطبيق</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
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
            <span>سجل ما الجديد في التحديثات</span>
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
                    background: 'var(--gradient-primary)',
                    color: '#FFFFFF',
                    border: '1px solid var(--color-gold)',
                    borderRadius: 'var(--radius-full)',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: 'var(--shadow-gold)'
                  }}
                >
                  <Play size={14} fill="#FFFFFF" />
                  <span>بدء الجولة المباشرة</span>
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
