import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  Palette,
  Smartphone,
  Square
} from 'lucide-react';
import { THEME_CONFIGS } from '../utils/cardExporter';

const TEMPLATES = [
  { id: 'olive', name: 'الزيتوني الملكي', dotColor: '#2C4A3E', border: '#D4AF37' },
  { id: 'sand', name: 'الرملي النوراني', dotColor: '#503A28', border: '#C58B24' },
  { id: 'midnight', name: 'سكينة الليل', dotColor: '#0E1A17', border: '#E5C358' },
  { id: 'emerald', name: 'الزمردي النقي', dotColor: '#17372D', border: '#DFB758' }
];

export default function ShareModal({ 
  isOpen, 
  onClose, 
  blessing, 
  onDownloadImage 
}) {
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('olive');
  const [selectedRatio, setSelectedRatio] = useState('story'); // 'story' (9:16) or 'square' (1:1)
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !blessing) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nemaa.app';
  
  const shareText = `تدبّر في «${blessing.title}»:\n\n"${blessing.reflection}"\n\n${blessing.proof ? `${blessing.proof}\n\n` : ''}من منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ\n${currentUrl}`;

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

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (onDownloadImage) {
        await onDownloadImage(blessing, { theme: selectedTheme, ratio: selectedRatio });
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const activeThemeConfig = THEME_CONFIGS[selectedTheme] || THEME_CONFIGS.olive;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={22} color="var(--color-gold)" />
            <span>مشاركة النعمة والبطاقة</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* Card Snippet Preview Styled by Selected Theme */}
        <div style={{
          background: activeThemeConfig.bgStart,
          border: `1.5px solid ${activeThemeConfig.outerBorder}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h4 style={{ 
              fontFamily: 'var(--font-arabic-heading)', 
              fontSize: '18px', 
              fontWeight: 700, 
              color: activeThemeConfig.title 
            }}>
              {blessing.title}
            </h4>
            <span style={{ 
              fontSize: '11px', 
              background: activeThemeConfig.badgeBg, 
              color: activeThemeConfig.badgeText, 
              padding: '2px 8px', 
              borderRadius: '10px' 
            }}>
              {blessing.categoryName}
            </span>
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: activeThemeConfig.reflection, 
            lineHeight: 1.6,
            maxHeight: '75px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {blessing.reflection}
          </p>
        </div>

        {/* Template Picker */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
            <Palette size={15} color="var(--color-gold)" />
            <span>اختر نمط ولون بطاقة المشاركة:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTheme(tpl.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: selectedTheme === tpl.id ? '2px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                  background: selectedTheme === tpl.id ? 'rgba(212, 175, 55, 0.1)' : 'var(--surface-card)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: selectedTheme === tpl.id ? 700 : 500,
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: tpl.dotColor,
                  border: `2px solid ${tpl.border}`,
                  flexShrink: 0
                }} />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Picker */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
            <span>مقاس البطاقة:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedRatio('story')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: selectedRatio === 'story' ? '2px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                background: selectedRatio === 'story' ? 'rgba(212, 175, 55, 0.1)' : 'var(--surface-card)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: selectedRatio === 'story' ? 700 : 500,
                color: 'var(--text-main)'
              }}
            >
              <Smartphone size={16} color="var(--color-gold)" />
              <span>قصة / ستوري (9:16)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRatio('square')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: selectedRatio === 'square' ? '2px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                background: selectedRatio === 'square' ? 'rgba(212, 175, 55, 0.1)' : 'var(--surface-card)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: selectedRatio === 'square' ? 700 : 500,
                color: 'var(--text-main)'
              }}
            >
              <Square size={16} color="var(--color-gold)" />
              <span>منشور مربع (1:1)</span>
            </button>
          </div>
        </div>

        {/* Download as Designed Image Card */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="form-submit-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            marginBottom: '14px',
            cursor: isExporting ? 'wait' : 'pointer',
            opacity: isExporting ? 0.8 : 1
          }}
        >
          <Download size={18} />
          <span>{isExporting ? 'جاري رسم وتصدير البطاقة...' : 'تحميل البطاقة بالنمط والمقاس المختار'}</span>
        </button>

        {/* Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
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
              padding: '11px',
              background: '#25D366',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            <MessageCircle size={17} />
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
              padding: '11px',
              background: '#0088CC',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            <Send size={17} />
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
              padding: '11px',
              background: '#000000',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px'
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
              padding: '11px',
              background: 'var(--surface-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            {copied ? <Check size={17} color="#38A169" /> : <Copy size={17} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
          </button>
        </div>

        {/* Native Web Share fallback */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            onClick={handleNativeShare}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            مشاركة عبر تطبيقات أخرى على هاتفك
          </button>
        )}
      </div>
    </div>
  );
}
