import React from 'react';
import { 
  Heart, 
  PlusCircle, 
  Search, 
  Flame,
  BookOpen,
  Settings,
  Bell
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
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo & Name */}
        <div className="header-brand">
          <div className="brand-icon-wrapper" style={{ overflow: 'hidden' }}>
            <img 
              src="./logo.png" 
              alt="نِعْمَة" 
              className="brand-logo-img"
              onError={(e) => {
                // Graceful fallback to typography emblem if image unavailable
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="brand-logo-fallback" style={{ display: 'none' }}>
              نِعْمَة
            </span>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">نِعْمَة</h1>
            <span className="brand-subtitle">«تَذَكَّرْ لِتَشْكُرْ»</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Daily Streak Indicator */}
          {streak > 0 && (
            <div className="streak-badge" title={t.streakTooltip}>
              <Flame size={15} color="#D4AF37" />
              <span>{streak} {t.daysSuffix}</span>
            </div>
          )}

          {/* Search Button */}
          <button 
            className="btn-icon" 
            title={t.searchBtn}
            onClick={onOpenSearch}
            aria-label={t.searchBtn}
          >
            <Search size={18} />
          </button>

          {/* Add Blessing Button */}
          <button 
            id="btn-publish-blessing-trigger"
            className="btn-icon btn-add-blessing" 
            title={t.addBlessingBtn}
            onClick={onOpenAddModal}
            aria-label={t.addBlessingBtn}
          >
            <PlusCircle size={18} />
          </button>

          {/* Favorites Button */}
          <button 
            className="btn-icon" 
            title={t.favoritesBtn}
            onClick={onOpenFavorites}
            aria-label={t.favoritesBtn}
          >
            <Heart size={18} />
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

          {/* Notification Inbox Button */}
          <button 
            id="btn-notifications-toggle"
            className="btn-icon btn-notifications-toggle" 
            title={currentLang === 'ar' ? 'بريد الإشعارات وتنبيهات الإدارة' : 'Notifications Inbox'}
            onClick={onOpenNotifications}
            aria-label={currentLang === 'ar' ? 'الإشعارات' : 'Notifications'}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#E53E3E',
                color: '#FFFFFF',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: '800',
                minWidth: '17px',
                height: '17px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(229,62,62,0.4)',
                padding: '0 3px',
                border: '1.5px solid var(--surface-card)'
              }}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
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
