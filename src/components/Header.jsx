import React from 'react';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  Moon, 
  Sun, 
  Sparkles,
  Flame
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
  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo & Title */}
        <div className="brand-wrapper" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src="/brand/logo-calligraphy.jpg" 
            alt="شعار نِعْمَة" 
            className="brand-logo-img"
            onError={(e) => {
              // Fallback if image fails
              e.target.style.display = 'none';
            }}
          />
          <div className="brand-text">
            <span className="brand-title">نِعْمَة</span>
            <span className="brand-slogan">« تَذَكَّرْ لِتَشْكُرْ »</span>
          </div>
        </div>

        {/* Daily Streak Indicator */}
        {streak > 0 && (
          <div className="daily-streak-badge" title={`حامد مستمر: ${streak} أيام متتالية`} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--border-gold)',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-gold)'
          }}>
            <Flame size={15} color="#D4AF37" />
            <span>{streak} {streak === 1 ? 'يوم' : 'أيام'} حمد</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="header-actions">
          {/* Search Button */}
          <button 
            className="btn-icon" 
            title="تصفح وبحث في النعم"
            onClick={onOpenSearch}
            aria-label="بحث"
          >
            <Search size={19} />
          </button>

          {/* Add Custom Blessing Button */}
          <button 
            className="btn-icon" 
            title="إضافة نعمة خاصة بك"
            onClick={onOpenAddModal}
            aria-label="إضافة نعمة"
          >
            <PlusCircle size={19} />
          </button>

          {/* Favorites Button with Badge */}
          <button 
            className="btn-icon" 
            title="النعم المفضلة"
            onClick={onOpenFavorites}
            aria-label="المفضلة"
          >
            <Heart size={19} fill={favoritesCount > 0 ? "var(--color-gold)" : "none"} color={favoritesCount > 0 ? "var(--color-gold)" : "currentColor"} />
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
            {theme === 'night' ? <Sun size={19} color="#E5C358" /> : <Moon size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}
