import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  Moon, 
  Sun, 
  Sparkles,
  Flame,
  Download
} from 'lucide-react';

export default function Header({ 
  favoritesCount, 
  onOpenFavorites, 
  onOpenAddModal, 
  onOpenSearch, 
  theme, 
  onToggleTheme,
  dailyCount,
  streak
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
  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo & Title */}
        <div className="brand-wrapper" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src={`${import.meta.env.BASE_URL}brand/logo-calligraphy.jpg`} 
            alt="شعار نِعْمَة" 
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-title">نِعْمَة</span>
              {streak > 0 && (
                <div 
                  className="daily-streak-badge mobile-compact-streak" 
                  title={`حامد مستمر: ${streak} أيام`}
                >
                  <Flame size={13} color="#D4AF37" />
                  <span>{streak}d</span>
                </div>
              )}
            </div>
            <span className="brand-slogan">« تَذَكَّرْ لِتَشْكُرْ »</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Search Button */}
          <button 
            className="btn-icon" 
            title="تصفح وبحث في النعم"
            onClick={onOpenSearch}
            aria-label="بحث"
          >
            <Search size={18} />
          </button>

          {/* Add Custom Blessing Button */}
          <button 
            className="btn-icon" 
            title="إضافة نعمة خاصة بك"
            onClick={onOpenAddModal}
            aria-label="إضافة نعمة"
          >
            <PlusCircle size={18} />
          </button>

          {/* Favorites Button with Badge */}
          <button 
            className="btn-icon" 
            title="النعم المفضلة"
            onClick={onOpenFavorites}
            aria-label="المفضلة"
          >
            <Heart size={18} fill={favoritesCount > 0 ? "var(--color-gold)" : "none"} color={favoritesCount > 0 ? "var(--color-gold)" : "currentColor"} />
            {favoritesCount > 0 && (
              <span className="btn-badge">{favoritesCount}</span>
            )}
          </button>

          {/* Theme Toggle (Day / Night) */}
          <button 
            className="btn-icon" 
            title={theme === 'night' ? 'الوضع النهاري' : 'وضع سكينة الليل'}
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
          >
            {theme === 'night' ? <Sun size={18} color="#E5C358" /> : <Moon size={18} />}
          </button>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button 
              className="btn-icon btn-install-pwa" 
              title="تثبيت تطبيق نِعْمَة على هاتفك"
              onClick={handleInstallClick}
              aria-label="تثبيت التطبيق"
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
