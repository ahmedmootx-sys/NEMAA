import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, HeartHandshake } from 'lucide-react';
import { generateShareAppPoster } from '../utils/shareAppPoster';
import { TRANSLATIONS } from '../i18n/translations';

export default function ShareAppModal({ isOpen, onClose, currentLang = 'ar' }) {
  const [posterUrl, setPosterUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
  const appUrl = 'https://ahmedmootx-sys.github.io/NEMAA/';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateShareAppPoster()
        .then(url => {
          setPosterUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error generating app poster:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `nemaa-share-poster-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    const shareText = `«تطبيق نِعْمَة ✨ تَذَكَّرْ لِتَشْكُرْ»\nتطبيق إسلامي تدبّري يُعينك على استشعار نعم الله وتجديد الحمد والامتنان كل يوم.\n\nرابط المنصة والتطبيق:\n${appUrl}\n\n«الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'تطبيق نِعْمَة — تَذَكَّرْ لِتَشْكُرْ',
      text: 'تطبيق إسلامي تدبّري يُعينك على استشعار نعم الله وتجديد الحمد والامتنان كل يوم. «الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ»',
      url: appUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        style={{ maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', padding: '24px 20px' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div className="modal-title" style={{ gap: '8px' }}>
            <HeartHandshake size={22} color="var(--color-gold)" />
            <span style={{ fontSize: '18px' }}>{t.shareApp.modalTitle}</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px', textAlign: 'center' }}>
          {t.shareApp.modalSubtitle}
        </p>

        {/* Poster Preview */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(212, 175, 55, 0.2)',
          border: '1.5px solid var(--border-gold)',
          marginBottom: '20px',
          background: 'linear-gradient(180deg, #0A1C15 0%, #163A2D 100%)',
          aspectRatio: '9 / 16',
          maxHeight: '440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          {loading ? (
            <div style={{ color: 'var(--color-gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={28} className="spin-slow" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>جارٍ تصميم البوستر بجودة فائقة...</span>
            </div>
          ) : posterUrl ? (
            <>
              <img 
                src={posterUrl} 
                alt="بوستر شارك تؤجر لتطبيق نعمة" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                background: 'rgba(10, 28, 21, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                fontSize: '11px',
                color: '#E5C358',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={12} />
                <span>جاهز للمشاركة في حالات واتساب وإنستغرام</span>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Download for WhatsApp Status */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownload}
            style={{ width: '100%', gap: '10px', padding: '14px 20px', fontSize: '15px' }}
          >
            <Download size={20} />
            <span>{t.shareApp.downloadStoryPoster}</span>
          </button>

          {/* Share directly or via Web Share */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleShare}
              style={{ gap: '7px', padding: '12px 14px', justifyContent: 'center' }}
            >
              <Share2 size={17} />
              <span>{t.shareApp.shareViaApp}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyLink}
              style={{ 
                gap: '7px', 
                padding: '12px 14px', 
                justifyContent: 'center',
                borderColor: copied ? '#22C55E' : undefined,
                color: copied ? '#22C55E' : undefined
              }}
            >
              {copied ? <Check size={17} color="#22C55E" /> : <Copy size={17} />}
              <span>{copied ? t.shareApp.linkCopied : t.shareApp.copyLink}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
