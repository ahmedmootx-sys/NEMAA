import React, { useState, useEffect } from 'react';
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
  PenTool
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
  animatingKey,
  lang = 'ar'
}) {
  const [copied, setCopied] = useState(false);
  const [duaCopied, setDuaCopied] = useState(false);
  const [hasArabicVoice, setHasArabicVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    return (
      <div className="blessing-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: 'var(--text-muted)' }}>لا توجد نِعَم متوفرة في هذا التصنيف حالياً.</p>
      </div>
    );
  }

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
  const displayBlessing = getBlessingInLang(blessing, lang) || blessing;
  const gratitudeDua = getBlessingGratitudeDua(blessing);

  const handleCopy = () => {
    const textToCopy = lang === 'en'
      ? `«${displayBlessing.title}»\n\n${displayBlessing.reflection}\n\n${displayBlessing.proofArabic ? displayBlessing.proofArabic + '\n' : ''}${displayBlessing.proofMeaning ? `Meaning: "${displayBlessing.proofMeaning}"` + (displayBlessing.proofSource ? ` (${displayBlessing.proofSource})` : '') + '\n\n' : ''}From NEMAA Platform — Remember to give thanks`
      : `«${blessing.title}»\n\n${blessing.reflection}\n\n${blessing.proof ? blessing.proof + (blessing.proofSource ? ` (${blessing.proofSource})` : '') + '\n\n' : ''}${gratitudeDua ? `دعاء شكر النعمة:\n${gratitudeDua.dua}\n\n` : ''}من منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ`;
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
        className="blessing-card"
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

            {blessing.isCustom && (
              <span className="card-custom-badge">
                {t.customBadge}
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
        {blessing.proof && (
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

        {/* Gratitude Dua Section (دعاء شكر النعمة) */}
        {gratitudeDua && (
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
