import React from 'react';
import { 
  X, 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Type, 
  Bell, 
  Compass, 
  BookOpen, 
  MessageSquare, 
  Share2, 
  Download, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  currentLang = 'ar',
  onToggleLanguage,
  fontMode = 'modern',
  onToggleFontMode,
  onOpenNotifications,
  onOpenGuide,
  onOpenMission,
  onOpenFeedback,
  onOpenShareApp,
  deferredPrompt,
  onInstallPwa
}) {
  if (!isOpen) return null;

  const isRTL = currentLang === 'ar';
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          position: 'relative',
          padding: '20px 24px',
          background: 'var(--surface-sunken, rgba(44,74,62,0.06))',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold)'
          }}>
            <Settings size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-heading)' }}>
              {isRTL ? 'إعدادات المنصة' : 'Settings & Preferences'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {isRTL ? 'تخصيص المظهر، الخطوط، التنبيهات ورسالة التطبيق' : 'Customize theme, fonts, reminders, and platform mission'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="إغلاق"
            style={{ position: 'static' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section 1: Appearance & Typography */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isRTL ? 'المظهر والخطوط' : 'Appearance & Typography'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Theme Toggle Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {theme === 'night' ? <Moon size={20} color="#E5C358" /> : <Sun size={20} color="#D4AF37" />}
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'مظهر التطبيق' : 'App Theme'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {theme === 'night' 
                        ? (isRTL ? 'سكينة الليل (داكن ومريح للعين)' : 'Night Mode (Calm & Dark)') 
                        : (isRTL ? 'نور الصباح (فاتح ودافئ)' : 'Day Mode (Warm Cream)')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-card)',
                    border: '1.5px solid var(--color-gold)',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {theme === 'night' ? (isRTL ? 'تحويل للنهاري' : 'Switch to Day') : (isRTL ? 'تحويل لليلي' : 'Switch to Night')}
                </button>
              </div>

              {/* Font Selector Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Type size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'نوع الخط في النعم' : 'Blessing Typography'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {fontMode === 'modern' 
                        ? (isRTL ? 'خط عصري فائق الوضوح (Cairo & Tajawal - بدون تداخل)' : 'Modern Clear Font (Cairo / Tajawal)') 
                        : (isRTL ? 'خط كلاسيكي تقليدي (نسخ وأصالة)' : 'Classic Traditional Naskh')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleFontMode}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-card)',
                    border: '1.5px solid var(--color-gold)',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {fontMode === 'modern' ? (isRTL ? 'تغيير للكلاسيكي' : 'Classic') : (isRTL ? 'تغيير للعصري' : 'Modern')}
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Language & Reminders */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isRTL ? 'اللغة والتنبيهات' : 'Language & Notifications'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Language Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Globe size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'لغة التطبيق' : 'App Language'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {currentLang === 'ar' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleLanguage}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface-card)',
                    border: '1.5px solid var(--color-gold)',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {currentLang === 'ar' ? 'English' : 'العربية'}
                </button>
              </div>

              {/* Notifications Row */}
              <div 
                onClick={() => { onClose(); onOpenNotifications && onOpenNotifications(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'تنبيهات وتذكيرات الامتنان اليومية' : 'Daily Gratitude Reminders'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isRTL ? 'ضبط أوقات التذكير والتأمل اليومي في نعم الله' : 'Configure reminder times for daily contemplation'}
                    </div>
                  </div>
                </div>
                <ArrowIcon size={18} color="var(--text-muted)" />
              </div>

            </div>
          </div>

          {/* Section 3: Mission, Guide & Community */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isRTL ? 'عن المنصة ورسالتها' : 'About Platform & Mission'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Mission Statement Row */}
              <div 
                onClick={() => { onClose(); onOpenMission && onOpenMission(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'رسالة وهدف منصة نِعْمَة' : 'NEMAA Mission & Purpose'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isRTL ? 'قراءة الرسالة الافتتاحية للمنصة وهدف إيقاظ الشكر' : 'Read the founding message & purpose of gratitude'}
                    </div>
                  </div>
                </div>
                <ArrowIcon size={18} color="var(--text-muted)" />
              </div>

              {/* Guided Tour Row */}
              <div 
                onClick={() => { onClose(); onOpenGuide && onOpenGuide(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Compass size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'دليل منصة نِعْمَة والتحديثات' : 'App Guide & Updates Tour'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isRTL ? 'جولة توضيحية لجميع خواص وأزرار المنصة' : 'Interactive walkthrough of all features'}
                    </div>
                  </div>
                </div>
                <ArrowIcon size={18} color="var(--text-muted)" />
              </div>

              {/* Feedback & Complaints Row */}
              <div 
                onClick={() => { onClose(); onOpenFeedback && onOpenFeedback(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MessageSquare size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'الشكاوى والمقترحات' : 'Complaints & Suggestions'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isRTL ? 'شاركنا فكرة لتطوير التطبيق أو أبلغ عن أي مشكلة' : 'Suggest an improvement or report a technical issue'}
                    </div>
                  </div>
                </div>
                <ArrowIcon size={18} color="var(--text-muted)" />
              </div>

              {/* Share Platform Row */}
              <div 
                onClick={() => { onClose(); onOpenShareApp && onOpenShareApp(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Share2 size={20} color="var(--color-gold)" />
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {isRTL ? 'مشاركة منصة نِعْمَة (الدال على الخير كفاعله)' : 'Share NEMAA App'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isRTL ? 'انشر رابط التطبيق وبارك لأهلك وأحبابك' : 'Spread goodness and share with family & friends'}
                    </div>
                  </div>
                </div>
                <ArrowIcon size={18} color="var(--text-muted)" />
              </div>

              {/* Install PWA Row if available */}
              {deferredPrompt && (
                <div 
                  onClick={() => { onClose(); onInstallPwa && onInstallPwa(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid var(--color-gold)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Download size={20} color="var(--color-gold)" />
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {isRTL ? 'تثبيت التطبيق على جهازك' : 'Install NEMAA App'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {isRTL ? 'تثبيت سريع للوصول المباشر بدون متصفح' : 'Install as a progressive web app'}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon size={18} color="var(--color-gold)" />
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer info */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>{isRTL ? 'منصة نِعْمَة — الإصدار 1.2.0' : 'NEMAA Platform — v1.2.0'}</span>
          <span style={{ color: 'var(--color-gold)', fontWeight: '700' }}>« تَذَكَّرْ لِتَشْكُرْ »</span>
        </div>
      </div>
    </div>
  );
}
