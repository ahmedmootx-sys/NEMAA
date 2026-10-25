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
  VolumeX
} from 'lucide-react';
import { subscribeToVoiceChanges, speakArabic, stopSpeaking } from '../utils/speechHelper';

export default function BlessingCard({ 
  blessing, 
  isFavorite, 
  onToggleFavorite, 
  onShare, 
  onDownloadImage,
  animatingKey
}) {
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    const textToCopy = `«${blessing.title}»\n\n${blessing.reflection}\n\n${blessing.proof ? blessing.proof + (blessing.proofSource ? ` (${blessing.proofSource})` : '') + '\n\n' : ''}من منصة نِعْمَة ✨ تَذَكَّرْ لِتَشْكُرْ`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
          src={`${import.meta.env.BASE_URL}brand/emblem-calligraphy.jpg`} 
          alt="" 
          className="card-watermark" 
          aria-hidden="true" 
        />

        {/* Card Header Metadata */}
        <div className="card-header-meta">
          <div className="card-meta-left">
            <span className="card-category-pill">
              <Sparkles size={12} color="var(--color-gold)" />
              <span>{blessing.categoryName}</span>
            </span>

            {blessing.isCustom && (
              <span className="card-custom-badge">
                خاصة بك ✍️
              </span>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="card-header-actions">
            {/* Audio Listen Button (Shown ONLY when authentic Arabic voice is detected) */}
            {hasArabicVoice && (
              <button
                className={`card-action-btn ${isSpeaking ? 'active-speaking' : ''}`}
                onClick={handleToggleSpeech}
                title={isSpeaking ? "إيقاف القراءة الصوتية" : "استماع للتأمل والذكر بصوت مهدئ"}
                aria-label="قراءة صوتية"
                style={isSpeaking ? { color: 'var(--color-primary)', background: 'rgba(212, 175, 55, 0.2)', borderColor: 'var(--color-gold)' } : {}}
              >
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}

            {/* Copy Button */}
            <button
              className="card-action-btn"
              onClick={handleCopy}
              title={copied ? "تم النسخ!" : "نسخ النص والتأمل"}
              aria-label="نسخ"
            >
              {copied ? <Check size={16} color="#38A169" /> : <Copy size={16} />}
            </button>

            {/* Download as Image */}
            <button
              className="card-action-btn"
              onClick={() => onDownloadImage(blessing)}
              title="تحميل كبطاقة مصممة للمشاركة"
              aria-label="تحميل صورة"
            >
              <Download size={16} />
            </button>

            {/* Share Dialog */}
            <button
              className="card-action-btn"
              onClick={() => onShare(blessing)}
              title="مشاركة النعمة"
              aria-label="مشاركة"
            >
              <Share2 size={16} />
            </button>

            {/* Favorite Bookmark */}
            <button
              className={`card-action-btn ${isFavorite ? 'active-favorite' : ''}`}
              onClick={() => onToggleFavorite(blessing.id)}
              title={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
              aria-label="المفضلة"
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
        <h2 className="blessing-title">{blessing.title}</h2>
        <div className="blessing-title-decor" aria-hidden="true">
          <span>◆</span>
        </div>

        {/* Reflection (التدبّر) */}
        <p className="blessing-reflection">
          {blessing.reflection}
        </p>

        {/* Quranic Verse / Prophetic Hadith Callout Box */}
        {blessing.proof && (
          <div className="spiritual-proof-box">
            <div className="proof-header">
              <Quote size={14} />
              <span>{blessing.proofType === 'hadith' ? 'حديث شريف' : 'شاهد من كتاب الله'}</span>
            </div>
            <div className="proof-quote">
              {blessing.proof}
            </div>
            {blessing.proofSource && (
              <div className="proof-source">
                {blessing.proofSource}
              </div>
            )}
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
