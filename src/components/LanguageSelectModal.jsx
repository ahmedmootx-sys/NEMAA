import { Globe, Check } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export default function LanguageSelectModal({ isOpen, onClose, currentLang, onSelectLang }) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

  const handleSelect = (lang) => {
    onSelectLang(lang);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        style={{ maxWidth: '440px', textAlign: 'center', padding: '32px 24px' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Bilingual Emblem */}
        <div style={{ marginBottom: '18px' }}>
          <img 
            src={`${import.meta.env.BASE_URL}brand/emblem-bilingual.png`} 
            alt="شعار نِعْمَة | NEMAA" 
            style={{ width: '110px', height: 'auto', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}
          />
        </div>

        <h2 style={{ 
          fontFamily: currentLang === 'ar' ? 'var(--font-arabic-heading)' : 'var(--font-arabic-ui)',
          fontSize: '22px', 
          fontWeight: 700, 
          color: 'var(--color-primary)',
          marginBottom: '6px'
        }}>
          {t.langModal.title}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-gold)', fontWeight: 600, marginBottom: '20px' }}>
          {t.langModal.subtitle}
        </p>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          {t.langModal.desc}
        </p>

        {/* Language Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Arabic Option */}
          <button
            type="button"
            onClick={() => handleSelect('ar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid',
              borderColor: currentLang === 'ar' ? 'var(--color-gold)' : 'var(--border-card)',
              background: currentLang === 'ar' ? 'rgba(212, 175, 55, 0.12)' : 'var(--surface-card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(44, 74, 62, 0.1)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-arabic-heading)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-primary)'
              }}>
                ع
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-arabic-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  العربية
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  اللغة الأصلية بالرسم العثماني
                </div>
              </div>
            </div>
            {currentLang === 'ar' && <Check size={18} color="var(--color-gold)" />}
          </button>

          {/* English Option */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid',
              borderColor: currentLang === 'en' ? 'var(--color-gold)' : 'var(--border-card)',
              background: currentLang === 'en' ? 'rgba(212, 175, 55, 0.12)' : 'var(--surface-card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-gold)'
              }}>
                EN
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  English
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Authentic Translation of Meanings
                </div>
              </div>
            </div>
            {currentLang === 'en' && <Check size={18} color="var(--color-gold)" />}
          </button>
        </div>

        {/* Confirmation Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          {t.langModal.confirmBtn}
        </button>
      </div>
    </div>
  );
}
