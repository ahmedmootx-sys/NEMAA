import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, X, Check, Compass } from 'lucide-react';

export const TOUR_STEPS = [
  {
    targetId: 'blessing-card-exportable',
    title: 'بطاقة النعمة والتدبّر اليومي',
    description: 'كل بطاقة تعرض نعمة من نعم الله الباطنة والظاهرة مع تأمل يلامس القلب وشواهد موثقة من القرآن الكريم والحديث الشريف لترسيخ الحمد والامتنان.',
    position: 'bottom'
  },
  {
    targetId: 'btn-alhamdulillah-main',
    title: 'زر الحمد لله ونور السكينة',
    description: 'اضغط لترطيب لسانك بحمد الله عند تدبّر النعمة؛ يفيض حول الزر نبض نوراني دافئ مع رنين روحي هادئ يزيدك طمأنينة ويُحصي ذكرك في عداد الامتنان اليومي.',
    position: 'top'
  },
  {
    targetSelector: '.navigation-bar',
    title: 'التنقل واستكشاف النعم',
    description: 'تنقّل بين النعم بالأسهم السابقة والتالية، أو اضغط زر «نعمة جديدة» لتتدبّر نعمة عشوائية ملهمة (أو اضغط زر المسافة Spacebar في لوحة المفاتيح).',
    position: 'top'
  },
  {
    targetSelector: '.card-header-actions',
    title: 'أدوات التحكم وتخصيص النعمة',
    description: 'أعلى كل بطاقة تجد أدوات متعددة: صياغة النعمة بكلامك الخاص وتعديلها، وضع الخلوة والتدبر الصامت، الاستماع الصوتي للنعمة، نسخ النص، وحفظ النعمة في مفضلتك.',
    position: 'bottom'
  },
  {
    targetSelector: '.category-filter-scroll',
    title: 'أبواب النعم والنعم المتشاركة',
    description: 'صنّف النعم حسب أبوابها (باطنة، ظاهرة، حواس، قلبية، إيمانية) مع تبويب «نعم متشارَكة» الذي يجمع ما شاركه المتدبرون في مجتمع نِعْمَة.',
    position: 'bottom'
  },
  {
    targetId: 'btn-open-publish-modal',
    title: 'انشر نعمة وشارك الأجر',
    description: 'اكتب نعمة من فضل الله عليك وشاركها مع سائر المسلمين لتظهر للجميع فوراً وتكون لك صدقة جارية وينال ثوابها كل من قرأها وحمد الله عليها.',
    position: 'top'
  },
  {
    targetId: 'btn-share-app-trigger',
    title: 'بوستر «شَارِكْ تُؤْجَرْ»',
    description: 'أنشئ بوستر فخم ومزخرف بالخط العربي ورمز الباركود لنشر التطبيق في حالات واتساب ومواقع التواصل لنيل أجر الدال على الخير.',
    position: 'top'
  },
  {
    targetId: 'btn-ambient-sound',
    title: 'أصوات السكينة والخلوة',
    description: 'شغّل أصوات الطبيعة الروحية الهادئة في الخلفية (صوت المطر الرقيق، نسيم الهواء، أو تغريد الفجر) لصفاء الذهن واستحضار الخشوع أثناء الشكر.',
    position: 'bottom'
  }
];

export default function OnboardingTour({ isOpen, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const resizeObserverRef = useRef(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target element coordinates
  useEffect(() => {
    if (!isOpen || !step) return;

    const findTarget = () => {
      let el = null;
      if (step.targetId) {
        el = document.getElementById(step.targetId);
      } else if (step.targetSelector) {
        el = document.querySelector(step.targetSelector);
      }
      return el;
    };

    const updatePosition = () => {
      const el = findTarget();
      if (el) {
        // Scroll into view smoothly if not fully visible
        const rect = el.getBoundingClientRect();
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTargetRect(el.getBoundingClientRect());
      } else {
        // If element not rendered in current view, fallback to center
        setTargetRect(null);
      }
    };

    // Initial query
    updatePosition();
    const timer = setTimeout(updatePosition, 300);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStepIndex, step]);

  if (!isOpen) return null;

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

  // Calculate tooltip position relative to target
  let tooltipStyle = {};
  if (targetRect) {
    const isMobile = window.innerWidth <= 600;
    const padding = 14;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 340) : 380;
    
    // Calculate vertical placement
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const placeBelow = spaceBelow > 220 || spaceBelow > spaceAbove;

    let top = placeBelow 
      ? targetRect.bottom + padding 
      : Math.max(16, targetRect.top - 200 - padding);

    // Keep horizontally within screen
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    tooltipStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10001
    };
  } else {
    // Center modal fallback
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(90vw, 400px)',
      zIndex: 10001
    };
  }

  return (
    <div className="onboarding-tour-root" role="dialog" aria-modal="true">
      {/* Dark Dim Backdrop with SVG Cutout or Box Shadow Spotlight */}
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
            boxShadow: '0 0 0 9999px rgba(5, 14, 10, 0.78), 0 0 25px rgba(212, 175, 55, 0.65)',
            border: '2px solid var(--color-gold)',
            pointerEvents: 'none',
            zIndex: 10000,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      ) : (
        <div 
          className="spotlight-fallback-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 14, 10, 0.78)',
            zIndex: 10000
          }}
        />
      )}

      {/* Floating Explanatory Tooltip Card */}
      <div 
        className="tour-tooltip-card"
        style={{
          ...tooltipStyle,
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '20px',
          padding: '22px 20px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(212, 175, 55, 0.25)',
          color: 'var(--text-main)',
          direction: 'rtl'
        }}
      >
        {/* Header: Step counter & close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--color-gold)', background: 'rgba(212, 175, 55, 0.12)', padding: '3px 10px', borderRadius: '9999px' }}>
            <Compass size={13} />
            <span>خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}</span>
          </div>

          <button 
            type="button"
            onClick={handleFinish}
            title="تخطي الجولة"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <h3 style={{ fontFamily: 'var(--font-arabic-title)', fontSize: '20px', color: 'var(--text-title)', marginBottom: '8px' }}>
          {step.title}
        </h3>

        {/* Description */}
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-main)', marginBottom: '18px', opacity: 0.9 }}>
          {step.description}
        </p>

        {/* Controls: Prev, Next, Skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={handleFinish}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '6px 10px'
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
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
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

            <button
              type="button"
              onClick={handleNext}
              style={{
                background: 'var(--gradient-primary)',
                border: '1px solid var(--color-gold)',
                color: '#FFFFFF',
                padding: '7px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)'
              }}
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'إنهاء وفهمت' : 'التالي'}</span>
              {currentStepIndex === TOUR_STEPS.length - 1 ? <Check size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
