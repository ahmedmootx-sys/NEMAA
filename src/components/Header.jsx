import React from 'react';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  Flame,
  BookOpen,
  Settings
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export default function Header({ 
  favoritesCount, 
  onOpenFavorites, 
  onOpenAddModal, 
  onOpenSearch, 
  onOpenJournal,
  streak,
  currentLang = 'ar',
  onOpenSettings
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo & Title */}
        <div className="brand-wrapper" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src={`${import.meta.env.BASE_URL}brand/logo-wordmark.png`} 
            alt="شعار نِعْمَة" 
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-title">{t.brandTitle}</span>
              {streak > 0 && (
                <div 
                  className="daily-streak-badge mobile-compact-streak" 
                  title={t.streakTooltip.replace('{streak}', streak)}
                >
                  <Flame size={13} color="#D4AF37" />
                  <span>{t.streakBadge.replace('{streak}', streak)}</span>
                </div>
              )}
            </div>
            <span className="brand-slogan">{t.brandSlogan}</span>
          </div>
        </div>

        {/* Action Controls - Clean & Minimal */}
        <div className="header-actions">
          {/* Search Button */}
          <button 
            className="btn-icon" 
            title={t.searchBtn}
            onClick={onOpenSearch}
            aria-label={t.searchBtn}
          >
            <Search size={18} />
          </button>

          {/* Add Custom Blessing Button */}
          <button 
            className="btn-icon" 
            title={t.addBlessingBtn}
            onClick={onOpenAddModal}
            aria-label={t.addBlessingBtn}
          >
            <PlusCircle size={18} />
          </button>

          {/* Favorites Button with Badge */}
          <button 
            className="btn-icon" 
            title={t.favoritesBtn}
            onClick={onOpenFavorites}
            aria-label={t.favoritesBtn}
          >
            <Heart size={18} fill={favoritesCount > 0 ? "var(--color-gold)" : "none"} color={favoritesCount > 0 ? "var(--color-gold)" : "currentColor"} />
            {favoritesCount > 0 && (
              <span className="btn-badge">{favoritesCount}</span>
            )}
          </button>

          {/* Gratitude Journal Button */}
          <button 
            className="btn-icon" 
            title={t.journalBtn}
            onClick={onOpenJournal}
            aria-label={t.journalBtn}
          >
            <BookOpen size={18} />
          </button>

          {/* Settings & Preferences Button (الصفحة الموحدة لجميع الإعدادات) */}
          <button 
            id="btn-settings-toggle"
            className="btn-icon btn-settings-toggle" 
            title={currentLang === 'ar' ? 'الإعدادات والتفضيلات' : 'Settings & Preferences'}
            onClick={onOpenSettings}
            aria-label="الإعدادات"
            style={{ color: 'var(--color-gold)', borderColor: 'rgba(212, 175, 55, 0.4)' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
