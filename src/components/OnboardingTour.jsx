import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, X, Check, Compass } from 'lucide-react';

export const TOUR_STEPS = [
  {
    targetId: 'blessing-card-exportable',
    title: 'بطاقة النعمة والتدبّر اليومي',
    description: 'كل بطاقة تعرض نعمة من نعم الله الباطنة والظاهرة مع تأمل يلامس القلب وشواهد موثقة من القرآن الكريم والحديث الشريف لترسيخ الحمد والامتنان.'
  },
  {
    targetId: 'btn-alhamdulillah-main',
    title: 'زر «الحمد لله» وهالة السكينة',
    description: 'اضغط لترطيب لسانك بحمد الله عند تدبّر النعمة؛ يفيض حول الزر نبض نوراني دافئ مع نقر تسبيحة وقورة لخرزة المسبحة، ويتحرك عداد الحامدون للنعمة لحظياً.'
  },
  {
    targetSelector: '.navigation-bar',
    title: 'التنقل واستكشاف النعم (بالأزرار أو السحب)',
    description: 'تنقّل بين النعم بالأسهم السابقة والتالية، أو بسحب البطاقة يميناً ويساراً بأصبعك على شاشات الهواتف، أو اضغط «نعمة جديدة» لعرض نعمة عشوائية ملهمة.'
  },
  {
    targetSelector: '.card-header-actions',
    title: 'أدوات التحكم وتخصيص النعمة',
    description: 'أعلى كل بطاقة تجد أدوات متعددة: صياغة النعمة بكلامك وتعديلها، وضع الخلوة والتدبر الصامت، الاستماع الصوتي للنعمة، نسخ النص، وحفظ النعمة في مفضلتك.'
  },
  {
    targetSelector: '#category-filter-bar, .category-filter-bar',
    title: 'أبواب النعم والنعم المتشاركة',
    description: 'صنّف النعم حسب أبوابها (باطنة، ظاهرة، حواس، قلبية، إيمانية) مع تبويب «نعم متشارَكة» الذي يجمع ما شاركه المتدبرون في مجتمع نِعْمَة.'
  },
  {
    targetId: 'btn-publish-blessing-trigger',
    title: 'انشر نعمة وشارك الأجر (مع المساعد الذكي)',
    description: 'اكتب نعمة من فضل الله وشاركها مع سائر المسلمين لتكون لك صدقة جارية، مع إمكانية استخدام «مساعد كتابة النعمة» لاقتراح صياغات بليغة وشواهد قرآنية ونبوية.'
  },
  {
    targetId: 'btn-share-to-reward-main',
    title: 'بوستر «شَارِكْ تُؤْجَرْ»',
    description: 'أنشئ بوستر فخم ومزخرف بالخط العربي ورمز الباركود لمشاركته في حالات واتساب وشبكات التواصل لنيل أجر الدال على الخير كفاعله.'
  },
  {
    targetId: 'btn-settings-toggle',
    title: 'شاشة الإعدادات الشاملة',
    description: 'تخصيص كامل للتطبيق: اختيار المظهر (فاتح / ليلي)، نوع الخط (عصري / تقليدي)، اللغة، إدارة «نِعَمي المنشورة»، وقسم الشكاوى والمقترحات المباشر للإدارة.'
  }
];

export default function OnboardingTour({ isOpen, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const rafIdRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Helper to find step element in DOM
  const findTarget = () => {
    if (!step) return null;
    let el = null;
    if (step.targetId) {
      el = document.getElementById(step.targetId);
    }
    if (!el && step.targetSelector) {
      el = document.querySelector(step.targetSelector);
    }
    return el;
  };

  // 1. Smooth scroll ONCE on step change (never in scroll handler to prevent infinite loops / lag!)
  useEffect(() => {
    if (!isOpen || !step) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      const el = findTarget();
      if (el) {
        const rect = el.getBoundingClientRect();
        const isInView = rect.top >= 50 && rect.bottom <= window.innerHeight - 50;
        
        // Scroll into view if not comfortably visible
        if (!isInView) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch {
            // fallback
          }
        }

        // Measure after scroll has begun/settled
        setTimeout(() => {
          if (el) {
            setTargetRect(el.getBoundingClientRect());
          }
        }, 180);
      } else {
        setTargetRect(null);
      }
    }, 60);

    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isOpen, currentStepIndex]);

  // 2. Passive position updater for resize and manual scroll (throttled with RAF)
  useEffect(() => {
    if (!isOpen) return;

    const handlePassiveUpdate = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const el = findTarget();
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      });
    };

    window.addEventListener('resize', handlePassiveUpdate, { passive: true });
    window.addEventListener('scroll', handlePassiveUpdate, { passive: true });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', handlePassiveUpdate);
      window.removeEventListener('scroll', handlePassiveUpdate);
    };
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('nemaa_tour_seen', 'true');
    } catch {}
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  // Determine smart card positioning:
  // If target element is in the bottom half of the screen, place the card at the TOP.
  // If target element is in the top half of the screen, place the card at the BOTTOM.
  // This guarantees the card NEVER covers the target and buttons NEVER get pushed off-screen!
  const isTargetInBottomHalf = targetRect 
    ? (targetRect.top + targetRect.height / 2 > window.innerHeight * 0.44) 
    : false;

  const cardPositionStyle = targetRect
    ? {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100vw - 28px), 480px)',
        top: isTargetInBottomHalf ? '18px' : 'auto',
        bottom: isTargetInBottomHalf ? 'auto' : '18px',
        zIndex: 10002
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(calc(100vw - 28px), 460px)',
        zIndex: 10002
      };

  return (
    <div className="onboarding-tour-root" role="dialog" aria-modal="true">
      {/* Dark Dim Backdrop with Gold Spotlight around the target */}
      {targetRect ? (
        <div 
          className="spotlight-highlight-box"
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            borderRadius: '18px',
            boxShadow: '0 0 0 9999px rgba(5, 14, 10, 0.82), 0 0 25px rgba(212, 175, 55, 0.7)',
            border: '2px solid var(--color-gold, #D4AF37)',
            pointerEvents: 'none',
            zIndex: 10000,
            transition: 'top 0.25s ease-out, left 0.25s ease-out, width 0.25s ease-out, height 0.25s ease-out'
          }}
        />
      ) : (
        <div 
          className="spotlight-fallback-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 14, 10, 0.82)',
            zIndex: 10000
          }}
        />
      )}

      {/* Floating Explanatory Tour Card */}
      <div 
        className="tour-tooltip-card"
        style={{
          ...cardPositionStyle,
          background: 'var(--surface-card, #FFFFFF)',
          border: '2px solid var(--border-gold, #D4AF37)',
          borderRadius: '22px',
          padding: '20px',
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(212, 175, 55, 0.25)',
          color: 'var(--text-main, #2D3748)',
          direction: 'rtl',
          maxHeight: '48vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header: Step Badge & Close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#B78A1E', background: 'rgba(212, 175, 55, 0.16)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Compass size={14} color="#B78A1E" />
            <span>خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}</span>
          </div>

          <button 
            type="button"
            onClick={handleFinish}
            title="تخطي الجولة"
            aria-label="تخطي الجولة"
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              color: 'var(--text-muted, #718096)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-arabic-title, "Aref Ruqaa", serif)', fontSize: '20px', fontWeight: 700, color: 'var(--color-primary, #2C4A3E)', margin: '0 0 6px 0' }}>
            {step.title}
          </h3>
          <p style={{ fontSize: '13.5px', lineHeight: '1.7', color: 'var(--text-main, #2D3748)', margin: 0, opacity: 0.95 }}>
            {step.description}
          </p>
        </div>

        {/* Controls: Skip, Prev, Next */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.08))' }}>
          <button
            type="button"
            onClick={handleFinish}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #718096)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 10px'
            }}
          >
            تخطي الشرح
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  background: 'var(--surface-sunken, #F7FAFC)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  color: 'var(--text-main, #2D3748)',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronRight size={15} />
                <span>السابق</span>
              </button>
            )}

            {/* Next Button - Ultra Clear, Solid High-Contrast Styling */}
            <button
              type="button"
              onClick={handleNext}
              style={{
                background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                border: '1.5px solid #D4AF37',
                color: '#FFFFFF',
                padding: '9px 22px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.45)',
                fontFamily: 'var(--font-arabic-body, "Cairo", sans-serif)'
              }}
            >
              <span style={{ color: '#FFFFFF', fontWeight: '800' }}>
                {currentStepIndex === TOUR_STEPS.length - 1 ? 'إنهاء وفهمت' : 'التالي'}
              </span>
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <ChevronLeft size={16} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
