import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  Quote,
  Volume2,
  VolumeX,
  Maximize2,
  HeartHandshake,
  PenTool,
  Globe,
  Trash2,
  User,
  Flag,
  Edit3
} from 'lucide-react';
import { subscribeToVoiceChanges, speakArabic, stopSpeaking } from '../utils/speechHelper';
import { getBlessingGratitudeDua } from '../utils/duaHelper';
import { getBlessingInLang } from '../i18n/blessingsEn';
import { TRANSLATIONS } from '../i18n/translations';

export default function BlessingCard({ 
  blessing, 
  isFavorite, 
  onToggleFavorite, 
  onShare, 
  onDownloadImage,
  onOpenFocusMode,
  onOpenEdit,
  onOpenPublishModal,
  isMyPublished,
  onEditPublished,
  onDeletePublished,
  onOpenReport,
  praisesCount,
  activeCategory,
  animatingKey,
  onNextBlessing,
  onPrevBlessing,
  lang = 'ar'
}) {
  const [copied, setCopied] = useState(false);
  const [duaCopied, setDuaCopied] = useState(false);
  const [hasArabicVoice, setHasArabicVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Swipe Gesture Handling (Touch & Mouse Drag)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0, isHorizontal: null });

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.card-action-btn')) return;
    const touch = e.touches ? e.touches[0] : e;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, isHorizontal: null };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (touchStartRef.current.isHorizontal === null) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        touchStartRef.current.isHorizontal = true;
      } else if (Math.abs(dy) > 8) {
        touchStartRef.current.isHorizontal = false;
      }
    }

    if (touchStartRef.current.isHorizontal) {
      if (e.cancelable && e.touches) {
        e.preventDefault();
      }
      const clamped = Math.max(-140, Math.min(140, dx));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const threshold = 60; // px to trigger navigation

    if (dragOffset < -threshold) {
      // Swiped Left
      if (onNextBlessing) onNextBlessing();
    } else if (dragOffset > threshold) {
      // Swiped Right
      if (onPrevBlessing) onPrevBlessing();
    }

    setDragOffset(0);
    setIsDragging(false);
    touchStartRef.current = { x: 0, y: 0, isHorizontal: null };
  };

  // Check if user's device has an authentic Arabic voice
  useEffect(() => {
    const unsubscribe = subscribeToVoiceChanges((voice) => {
      setHasArabicVoice(!!voice);
    });
    return () => {
      unsubscribe();
      stopSpeaking();
    };
  }, []);

  // Stop speaking when blessing changes
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, [blessing?.id]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `${blessing.title}. ${blessing.reflection}. ${blessing.proof ? blessing.proof : ''}`;
      speakArabic(
        textToSpeak,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  };

  if (!blessing) {
    if (activeCategory === 'shared') {
      return (
        <div className="blessing-card-container">
          <div className="blessing-card empty-shared-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div 
              style={{ 
                margin: '0 auto 18px', 
                width: '68px', 
                height: '68px', 
                borderRadius: '50%', 
                background: 'rgba(212, 175, 55, 0.12)', 
                border: '1.5px solid rgba(212, 175, 55, 0.35)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)'
              }}
            >
              <Globe size={32} color="var(--color-gold)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-arabic-title)', fontSize: '24px', color: 'var(--text-title)', marginBottom: '12px' }}>
              {lang === 'ar' ? 'كُنْ أَوَّلَ مَنْ يَذْكُرُ وَيُذَكِّرْ ✨' : 'Be the First to Share a Blessing ✨'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8', maxWidth: '440px', margin: '0 auto 24px' }}>
              {lang === 'ar' 
                ? 'لم تُنشر أي نعمة متشارَكة بعد.. انشر نعمة الآن من فضل الله عليك لتكون لك صدقة جارية وينال ثوابها كل من قرأها وحمد الله عليها.'
                : 'No community blessings shared yet. Be the first to share a blessing and inspire others to praise Allah.'}
            </p>
            {onOpenPublishModal && (
              <button 
                type="button" 
                className="btn-publish-empty-trigger"
                onClick={onOpenPublishModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                  color: '#FFFFFF',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid #D4AF37',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <Sparkles size={18} color="var(--color-gold)" />
                <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{lang === 'ar' ? 'انشر أول نعمة الآن' : 'Publish First Blessing Now'}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="blessing-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: 'var(--text-muted)' }}>{lang === 'ar' ? 'لا توجد نِعَم متوفرة في هذا التصنيف حالياً.' : 'No blessings available in this category.'}</p>
      </div>
    );
  }

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
  const displayBlessing = getBlessingInLang(blessing, lang) || blessing;
  const gratitudeDua = getBlessingGratitudeDua(blessing);
  const hasProof = Boolean(blessing.proof && blessing.proof.trim());
  // Gratitude dua appears strictly for built-in app blessings, never for user-published or shared blessings
  const shouldShowGratitudeDua = !blessing.isShared && !blessing.isCustom && Boolean(gratitudeDua);

  const handleCopy = () => {
    const textToCopy = lang === 'en'
      ? `«${displayBlessing.title}»\n\n${displayBlessing.reflection}\n\n${hasProof && displayBlessing.proofArabic ? displayBlessing.proofArabic + '\n' : ''}${hasProof && displayBlessing.proofMeaning ? `Meaning: "${displayBlessing.proofMeaning}"` + (displayBlessing.proofSource ? ` (${displayBlessing.proofSource})` : '') + '\n\n' : ''}From NEMAA Platform — Remember to give thanks`
      : `«${blessing.title}»\n\n${blessing.reflection}\n\n${hasProof ? blessing.proof + (blessing.proofSource ? ` (${blessing.proofSource})` : '') + '\n\n' : ''}${shouldShowGratitudeDua ? `دعاء شكر النعمة:\n${gratitudeDua.dua}\n\n` : ''}من منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleCopyDua = (e) => {
    e.stopPropagation();
    if (!gratitudeDua) return;
    navigator.clipboard.writeText(`${gratitudeDua.dua}\n— ${gratitudeDua.source}`).then(() => {
      setDuaCopied(true);
      setTimeout(() => setDuaCopied(false), 2000);
    });
  };

  return (
    <div className="blessing-card-container">
      <div 
        key={animatingKey}
        id="blessing-card-exportable"
        className={`blessing-card ${isDragging ? 'is-swiping' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        style={{
          transform: dragOffset ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.035}deg)` : undefined,
          opacity: dragOffset ? 1 - Math.abs(dragOffset) / 550 : undefined,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.15), opacity 0.28s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y'
        }}
      >
        {/* Subtle Watermark Emblem */}
        <img 
          src={`${import.meta.env.BASE_URL}brand/emblem-arabic.png`} 
          alt="" 
          className="card-watermark" 
          aria-hidden="true" 
        />

        {/* Card Header Metadata */}
        <div className="card-header-meta">
          <div className="card-meta-left">
            <span className="card-category-pill">
              <Sparkles size={12} color="var(--color-gold)" />
              <span>{displayBlessing.categoryName}</span>
            </span>

            {/* Author Badge if provided */}
            {blessing.author && blessing.author !== 'محب للخير' && (
              <span className="card-author-badge" title={lang === 'ar' ? `ناشر النعمة: ${blessing.author}` : `Published by: ${blessing.author}`}>
                <User size={11} color="var(--color-gold)" />
                <span>{lang === 'ar' ? `بقلم: ${blessing.author}` : `By: ${blessing.author}`}</span>
              </span>
            )}

            {/* Praise Counter Badge */}
            <span className="card-praises-badge" title={lang === 'ar' ? 'عدد الذين تدبّروا وحمدوا الله بسبب هذه النعمة' : 'Number of people who praised Allah for this blessing'}>
              <Heart size={11} fill="var(--color-gold)" color="var(--color-gold)" />
              <span className="praises-num">{praisesCount || blessing.praisesCount || 1}</span>
              <span className="praises-text">{lang === 'ar' ? 'حمدوا الله عليها' : 'praised'}</span>
            </span>

            {blessing.isCustom && (
              <span className="card-custom-badge">
                {t.customBadge}
              </span>
            )}

            {blessing.isShared && displayBlessing.categoryName !== 'نعم متشارَكة' && (
              <span className="card-shared-badge" title={lang === 'ar' ? 'نعمة متشارَكة مع مجتمع نِعْمَة' : 'Shared community blessing'}>
                <Globe size={11} />
                <span className="card-shared-text">{lang === 'ar' ? 'متشارَكة' : 'Community'}</span>
              </span>
            )}

            {blessing.isCustomized && (
              <button 
                type="button"
                className="card-user-edited-badge"
                onClick={() => onOpenEdit && onOpenEdit(blessing)}
                title="تم تخصيص هذه النعمة بصياغتك — اضغط لإعادة التعديل"
              >
                <PenTool size={11} />
                <span>صياغتي الخاصة</span>
              </button>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="card-header-actions">
            {/* Edit / Customize Blessing Button */}
            <button
              className={`card-action-btn ${blessing.isCustomized ? 'active-favorite' : ''}`}
              onClick={() => onOpenEdit && onOpenEdit(blessing)}
              title="صياغة وتعديل النعمة والتحكم بكلامها"
              aria-label="صياغة وتعديل النعمة"
            >
              <PenTool size={16} />
            </button>

            {/* Focus / Zen Mode Button */}
            <button
              className="card-action-btn"
              onClick={onOpenFocusMode}
              title={t.focusMode}
              aria-label={t.focusMode}
            >
              <Maximize2 size={16} />
            </button>

            {/* Audio Listen Button (Shown ONLY when authentic Arabic voice is detected) */}
            {hasArabicVoice && (
              <button
                className={`card-action-btn ${isSpeaking ? 'active-speaking' : ''}`}
                onClick={handleToggleSpeech}
                title={isSpeaking ? t.audioStop : t.audioListen}
                aria-label={t.audioListen}
                style={isSpeaking ? { color: 'var(--color-primary)', background: 'rgba(212, 175, 55, 0.2)', borderColor: 'var(--color-gold)' } : {}}
              >
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}

            {/* Copy Button */}
            <button
              className="card-action-btn"
              onClick={handleCopy}
              title={copied ? t.copiedText : t.copyBtn}
              aria-label={t.copyBtn}
            >
              {copied ? <Check size={16} color="#38A169" /> : <Copy size={16} />}
            </button>

            {/* Download as Image */}
            <button
              className="card-action-btn"
              onClick={() => onDownloadImage(blessing)}
              title={t.downloadBtn}
              aria-label={t.downloadBtn}
            >
              <Download size={16} />
            </button>

            {/* Share Dialog */}
            <button
              className="card-action-btn"
              onClick={() => onShare(blessing)}
              title={t.shareBtn}
              aria-label={t.shareBtn}
            >
              <Share2 size={16} />
            </button>

            {/* Edit Published Blessing (shown only for user's own published blessings) */}
            {isMyPublished && (
              <button
                className="card-action-btn btn-edit-published"
                onClick={() => onEditPublished && onEditPublished(blessing)}
                title={lang === 'ar' ? 'تعديل وتصحيح هذه النعمة المنشورة' : 'Edit published blessing'}
                aria-label="تعديل النعمة المنشورة"
                style={{ color: 'var(--color-gold)' }}
              >
                <Edit3 size={15} />
              </button>
            )}

            {/* Delete Published Blessing (shown only for user's own published blessings) */}
            {isMyPublished && (
              <button
                className="card-action-btn btn-delete-published"
                onClick={() => onDeletePublished && onDeletePublished(blessing)}
                title={lang === 'ar' ? 'حذف هذه النعمة من النشر للجميع' : 'Delete this blessing from publication'}
                aria-label="حذف النعمة من النشر"
                style={{ color: '#E53E3E' }}
              >
                <Trash2 size={15} />
              </button>
            )}

            {/* Report Button (للنعم المشاركة ونعم التطبيق) */}
            <button
              className="card-action-btn btn-report-blessing"
              onClick={() => onOpenReport && onOpenReport(blessing)}
              title={lang === 'ar' ? 'إبلاغ عن محتوى غير لائق أو خطأ' : 'Report content or issue'}
              aria-label="إبلاغ عن نعمة"
            >
              <Flag size={15} />
            </button>

            {/* Favorite Bookmark */}
            <button
              className={`card-action-btn ${isFavorite ? 'active-favorite' : ''}`}
              onClick={() => onToggleFavorite(blessing.id)}
              title={isFavorite ? t.favoriteRemove : t.favoriteAdd}
              aria-label={t.favoriteAdd}
            >
              <Heart 
                size={18} 
                fill={isFavorite ? "#E53E3E" : "none"} 
                color={isFavorite ? "#E53E3E" : "currentColor"} 
              />
            </button>
          </div>
        </div>

        {/* Blessing Title */}
        <h2 className="blessing-title">{displayBlessing.title}</h2>
        <div className="blessing-title-decor" aria-hidden="true">
          <span>◆</span>
        </div>

        {/* Reflection (التدبّر) */}
        <p className="blessing-reflection">
          {displayBlessing.reflection}
        </p>

        {/* Quranic Verse / Prophetic Hadith Callout Box */}
        {hasProof && (
          <div className="spiritual-proof-box">
            <div className="proof-header">
              <Quote size={14} />
              <span>{blessing.proofType === 'hadith' ? t.proofHadith : t.proofQuran}</span>
            </div>
            <div className={`proof-quote ${blessing.proofType === 'quran' ? 'quran-verse' : 'hadith-quote'}`} dir="rtl">
              {blessing.proof}
            </div>
            {lang === 'en' && displayBlessing.proofMeaning && (
              <div 
                className="proof-meaning-box"
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px dashed rgba(212, 175, 55, 0.3)',
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  color: 'var(--text-secondary)',
                  textAlign: 'left'
                }}
                dir="ltr"
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', color: 'var(--color-gold)', fontStyle: 'normal', marginBottom: '3px' }}>
                  {t.proofMeaningLabel || 'Translation of Meaning:'}
                </span>
                "{displayBlessing.proofMeaning}"
              </div>
            )}
            {blessing.proofSource && (
              <div className="proof-source">
                {displayBlessing.proofSource || blessing.proofSource}
              </div>
            )}
          </div>
        )}

        {/* Gratitude Dua Section (دعاء شكر النعمة) - Strictly for built-in curated blessings */}
        {shouldShowGratitudeDua && (
          <div className="gratitude-dua-box">
            <div className="dua-box-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HeartHandshake size={15} color="var(--color-gold)" />
                <span className="dua-box-title">{gratitudeDua.title}</span>
              </div>
              <button 
                type="button" 
                className="dua-copy-btn" 
                onClick={handleCopyDua}
                title="نسخ الدعاء"
                aria-label="نسخ الدعاء"
              >
                {duaCopied ? <Check size={13} color="#38A169" /> : <Copy size={13} />}
                <span>{duaCopied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            <p className="dua-text">
              {gratitudeDua.dua}
            </p>
            {gratitudeDua.source && (
              <div className="dua-source">
                — {gratitudeDua.source}
              </div>
            )}
          </div>
        )}

        {/* User Personal Note (خاطرة أو استشعار شخصي) */}
        {displayBlessing.userNote && (
          <div className="user-personal-note-box">
            <div className="user-personal-note-title">
              <PenTool size={12} />
              <span>خاطرة واستشعار شخصي خاص بك:</span>
            </div>
            <p style={{ margin: 0 }}>
              {displayBlessing.userNote}
            </p>
          </div>
        )}

        {/* Tags */}
        {blessing.tags && blessing.tags.length > 0 && (
          <div className="blessing-tags">
            {blessing.tags.map((tag, idx) => (
              <span key={idx} className="tag-badge">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
