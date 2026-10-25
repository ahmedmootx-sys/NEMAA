import React, { useEffect } from 'react';
import { 
  X, 
  Minimize2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Quote, 
  HeartHandshake,
  Shuffle
} from 'lucide-react';
import { getBlessingGratitudeDua } from '../utils/duaHelper';

export default function FocusReflectionModal({ 
  isOpen, 
  onClose, 
  blessing, 
  onNext, 
  onPrev, 
  onRandom 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'ArrowRight') {
        onNext();
      } else if (e.code === 'ArrowLeft') {
        onPrev();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onRandom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrev, onRandom, onClose]);

  if (!isOpen || !blessing) return null;

  const duaInfo = getBlessingGratitudeDua(blessing);

  return (
    <div className="focus-modal-overlay" role="dialog" aria-modal="true" aria-label="الوضع التدبري الهادئ">
      {/* Ambient spiritual glow */}
      <div className="focus-ambient-orb focus-orb-1" aria-hidden="true" />
      <div className="focus-ambient-orb focus-orb-2" aria-hidden="true" />

      {/* Top Bar with Minimal Exit Controls */}
      <div className="focus-top-bar">
        <div className="focus-brand-tag">
          <Sparkles size={16} color="var(--color-gold)" />
          <span>الوضع التدبري الهادئ</span>
        </div>

        <button 
          className="focus-close-btn" 
          onClick={onClose}
          title="الخروج من الوضع التدبري (Esc)"
          aria-label="إغلاق"
        >
          <span>خروج</span>
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Main Peaceful Content Area */}
      <div className="focus-center-content">
        <div className="focus-category-pill">
          {blessing.categoryName}
        </div>

        {/* Title */}
        <h1 className="focus-blessing-title">
          {blessing.title}
        </h1>

        <div className="focus-title-divider" aria-hidden="true">
          <span>◆</span>
        </div>

        {/* Reflection Text */}
        <p className="focus-reflection-text">
          {blessing.reflection}
        </p>

        {/* Quranic Ayah / Hadith Callout */}
        {blessing.proof && (
          <div className="focus-proof-box">
            <div className="focus-proof-badge">
              <Quote size={13} />
              <span>{blessing.proofType === 'hadith' ? 'حديث شريف' : 'شاهد من كتاب الله'}</span>
            </div>
            <div className={`focus-proof-quote ${blessing.proofType === 'quran' ? 'quran-script' : ''}`}>
              {blessing.proof}
            </div>
            {blessing.proofSource && (
              <div className="focus-proof-source">
                — {blessing.proofSource}
              </div>
            )}
          </div>
        )}

        {/* Gratitude Dua Section */}
        {duaInfo && (
          <div className="focus-dua-box">
            <div className="focus-dua-header">
              <HeartHandshake size={14} color="var(--color-gold)" />
              <span>{duaInfo.title}</span>
            </div>
            <p className="focus-dua-text">
              {duaInfo.dua}
            </p>
            {duaInfo.source && (
              <span className="focus-dua-source">— {duaInfo.source}</span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation Arrows */}
      <div className="focus-bottom-nav">
        <button 
          className="focus-nav-btn" 
          onClick={onPrev}
          title="النعمة السابقة (السهم الأيمن)"
          aria-label="السابق"
        >
          <ChevronRight size={22} />
          <span>السابقة</span>
        </button>

        <button 
          className="focus-random-btn" 
          onClick={onRandom}
          title="نعمة عشوائية (المسافة)"
          aria-label="عشوائي"
        >
          <Shuffle size={18} />
          <span>نعمة أخرى</span>
        </button>

        <button 
          className="focus-nav-btn" 
          onClick={onNext}
          title="النعمة التالية (السهم الأيسر)"
          aria-label="التالي"
        >
          <span>التالية</span>
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
}
