import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  Moon, 
  Sun, 
  Flame,
  Download,
  BookOpen,
  Bell,
  Globe,
  Compass
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

export default function Header({ 
  favoritesCount, 
  onOpenFavorites, 
  onOpenAddModal, 
  onOpenSearch, 
  onOpenJournal,
  onOpenNotifications,
  theme, 
  onToggleTheme,
  dailyCount,
  streak,
  currentLang = 'ar',
  onToggleLanguage,
  onOpenLanguageModal,
  onOpenGuide
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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

        {/* Action Controls */}
        <div className="header-actions">
          {/* Language Switcher Button */}
          <button
            className="btn-icon btn-lang-toggle"
            title={t.switchLanguage}
            onClick={onToggleLanguage}
            aria-label="Language / اللغة"
          >
            <Globe size={14} color="var(--color-gold)" />
            <span>{currentLang === 'ar' ? 'EN' : 'ع'}</span>
          </button>

          {/* App Guide & What's New Button */}
          <button
            id="btn-app-guide"
            className="btn-icon btn-guide-toggle"
            title={currentLang === 'ar' ? 'دليل الأزرار والتحديثات' : 'App Guide & Updates'}
            onClick={onOpenGuide}
            aria-label="دليل التطبيق والتحديثات"
            style={{ color: 'var(--color-gold)' }}
          >
            <Compass size={18} />
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

          {/* Daily Notifications / Reminders Button */}
          <button 
            className="btn-icon" 
            title={t.notificationsBtn}
            onClick={onOpenNotifications}
            aria-label={t.notificationsBtn}
          >
            <Bell size={18} />
          </button>

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

          {/* Theme Toggle (Day / Night) */}
          <button 
            className="btn-icon" 
            title={theme === 'night' ? t.themeDay : t.themeNight}
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
          >
            {theme === 'night' ? <Sun size={18} color="#E5C358" /> : <Moon size={18} />}
          </button>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button 
              className="btn-icon btn-install-pwa" 
              title={t.installPwa}
              onClick={handleInstallClick}
              aria-label={t.installPwa}
              style={{ color: 'var(--color-primary)', background: 'rgba(44, 74, 62, 0.1)', borderColor: 'var(--color-gold)' }}
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
