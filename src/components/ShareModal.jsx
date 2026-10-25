import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  Globe 
} from 'lucide-react';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  blessing, 
  onDownloadImage 
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !blessing) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nemaa.app';
  
  const shareText = `✨ تدبّر في «${blessing.title}»:\n\n"${blessing.reflection}"\n\n${blessing.proof ? `${blessing.proof}\n\n` : ''}من منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ 🌿\n${currentUrl}`;

  const encodedText = encodeURIComponent(shareText);

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `نِعْمَة | ${blessing.title}`,
          text: `«${blessing.title}» - ${blessing.reflection}`,
          url: currentUrl
        });
      } catch (err) {
        // user cancelled share
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={22} color="var(--color-gold)" />
            <span>مشاركة النعمة والتأمل</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* Card Snippet Preview */}
        <div style={{
          background: 'var(--surface-card-subtle)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ 
            fontFamily: 'var(--font-arabic-heading)', 
            fontSize: '18px', 
            fontWeight: 700, 
            color: 'var(--color-primary)', 
            marginBottom: '6px' 
          }}>
            {blessing.title}
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6 }}>
            {blessing.reflection}
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: '#25D366',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <MessageCircle size={18} />
            <span>واتساب</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: '#0088CC',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <Send size={18} />
            <span>تيليجرام</span>
          </a>

          {/* X (Twitter) */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: '#000000',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <span>𝕏 منصة إكس</span>
          </a>

          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: 'var(--surface-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            {copied ? <Check size={18} color="#38A169" /> : <Copy size={18} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
          </button>
        </div>

        {/* Download as Designed Image Card */}
        <button
          onClick={() => {
            onDownloadImage(blessing);
            onClose();
          }}
          className="form-submit-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
          }}
        >
          <Download size={18} />
          <span>تحميل البطاقة كصورة مصممة عريضة / ستوري</span>
        </button>

        {/* Native Web Share fallback */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            onClick={handleNativeShare}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            مشاركة عبر تطبيقات أخرى على جهازك 📱
          </button>
        )}
      </div>
    </div>
  );
}
