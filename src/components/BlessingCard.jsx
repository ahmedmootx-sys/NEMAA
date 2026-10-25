import React, { useState } from 'react';
import { 
  Heart, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  Sparkles,
  Quote
} from 'lucide-react';

export default function BlessingCard({ 
  blessing, 
  isFavorite, 
  onToggleFavorite, 
  onShare, 
  onDownloadImage,
  animatingKey
}) {
  const [copied, setCopied] = useState(false);

  if (!blessing) {
    return (
      <div className="blessing-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
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
        style={{
          animation: 'slideFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Subtle Watermark Emblem */}
        <img 
          src="/brand/emblem-calligraphy.jpg" 
          alt="" 
          className="card-watermark" 
          aria-hidden="true" 
        />

        {/* Card Header Metadata */}
        <div className="card-header-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="card-category-pill">
              <Sparkles size={13} color="var(--color-gold)" />
              {blessing.categoryName}
            </span>

            {blessing.isCustom && (
              <span className="card-custom-badge">
                نعمة خاصة بك ✍️
              </span>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="card-header-actions">
            {/* Copy Button */}
            <button
              className="card-action-btn"
              onClick={handleCopy}
              title={copied ? "تم النسخ!" : "نسخ النص والتأمل"}
              aria-label="نسخ"
            >
              {copied ? <Check size={18} color="#38A169" /> : <Copy size={18} />}
            </button>

            {/* Download as Image */}
            <button
              className="card-action-btn"
              onClick={() => onDownloadImage(blessing)}
              title="تحميل كبطاقة مصممة للمشاركة"
              aria-label="تحميل صورة"
            >
              <Download size={18} />
            </button>

            {/* Share Dialog */}
            <button
              className="card-action-btn"
              onClick={() => onShare(blessing)}
              title="مشاركة النعمة"
              aria-label="مشاركة"
            >
              <Share2 size={18} />
            </button>

            {/* Favorite Bookmark */}
            <button
              className={`card-action-btn ${isFavorite ? 'active-favorite' : ''}`}
              onClick={() => onToggleFavorite(blessing.id)}
              title={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
              aria-label="المفضلة"
            >
              <Heart 
                size={20} 
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
              <Quote size={15} />
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
