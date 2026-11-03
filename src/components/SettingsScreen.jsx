import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Type, 
  Globe, 
  Sparkles, 
  Scroll, 
  Compass, 
  MessageSquare, 
  Share2, 
  Download, 
  Edit3, 
  Trash2, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Check,
  Bell,
  Clock,
  Send,
  LogIn,
  LogOut,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  getPushSubscriptionState,
  requestPushPermission,
  unsubscribePush,
  updateReminderTimeSlot,
  sendLocalTestNotification,
  isIOS,
  isStandalone
} from '../utils/oneSignalHelper';

export default function SettingsScreen({
  isOpen,
  onClose,
  theme = 'day',
  onToggleTheme,
  currentLang = 'ar',
  onToggleLanguage,
  fontMode = 'modern',
  onToggleFontMode,
  myPublishedBlessings = [],
  onEditBlessing,
  onDeleteBlessing,
  onOpenPublish,
  onOpenGuide,
  onOpenMission,
  onOpenFeedback,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenShareApp,
  deferredPrompt,
  onInstallPwa,
  getBlessingPraises,
  onShowToast,
  currentUser = null,
  onOpenAuth,
  onSignOut
}) {
  const isRtl = currentLang === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const NextChevron = isRtl ? ChevronLeft : ChevronRight;

  const [isPushActive, setIsPushActive] = useState(() => {
    return localStorage.getItem('nemaa_push_notifications_enabled') === 'true';
  });
  const [preferredSlot, setPreferredSlot] = useState(() => {
    return localStorage.getItem('nemaa_push_preferred_slot') || 'random';
  });
  const [customTime, setCustomTime] = useState(() => {
    return localStorage.getItem('nemaa_push_custom_time') || '09:00';
  });
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [localToast, setLocalToast] = useState('');
  const [permissionBlockedNotice, setPermissionBlockedNotice] = useState(false);

  const formatArabicTime = (timeStr) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return timeStr;
    const isPM = h >= 12;
    const period = isPM ? (isRtl ? 'مساءً' : 'PM') : (isRtl ? 'صباحاً' : 'AM');
    if (h === 0) {
      h = 12;
    } else if (h > 12) {
      h -= 12;
    }
    return `${h}:${m} ${period}`;
  };

  const triggerToast = (msg) => {
    setLocalToast(msg);
    if (typeof onShowToast === 'function') {
      onShowToast(msg);
    }
    setTimeout(() => setLocalToast(''), 6000);
  };

  useEffect(() => {
    if (!isOpen) return;
    async function checkState() {
      const state = await getPushSubscriptionState();
      if (state.isSubscribed) {
        setIsPushActive(true);
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setPermissionBlockedNotice(true);
      }
    }
    checkState();
  }, [isOpen]);

  const handleTogglePush = async () => {
    // If stuck loading, force release on tap
    if (isPushLoading) {
      setIsPushLoading(false);
      return;
    }

    setPermissionBlockedNotice(false);

    // 1. If currently active, turn OFF
    if (isPushActive) {
      setIsPushLoading(true);
      const safetyTimer = setTimeout(() => setIsPushLoading(false), 2000);
      try {
        await Promise.race([
          unsubscribePush(),
          new Promise(r => setTimeout(r, 1500))
        ]);
        setIsPushActive(false);
        triggerToast(isRtl ? 'تم إيقاف رسائل التذكير' : 'Daily reminders turned off');
      } finally {
        clearTimeout(safetyTimer);
        setIsPushLoading(false);
      }
      return;
    }

    // 2. Checking iOS limitation
    if (isIOS() && !isStandalone()) {
      triggerToast(isRtl ? 'لتفعيل الإشعارات على آيفون، يرجى إضافة التطبيق للشاشة الرئيسية أولاً' : 'On iOS, please add app to Home Screen first');
      return;
    }

    // 3. Check if browser has permanently blocked notifications
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setPermissionBlockedNotice(true);
      triggerToast(isRtl ? 'الإشعارات محظورة في متصفحك. انظر التعليمات لفك الحظر ⚠️' : 'Notifications are blocked in your browser settings');
      return;
    }

    // 4. Request Push Permission with hard 3.5s timeout (NEVER gets stuck)
    setIsPushLoading(true);
    const safetyTimer = setTimeout(() => setIsPushLoading(false), 3500);

    try {
      const res = await Promise.race([
        requestPushPermission(preferredSlot, preferredSlot === 'custom' ? customTime : ''),
        new Promise(r => setTimeout(() => r({ success: false, reason: 'timeout' }), 3000))
      ]);

      if (res && res.success) {
        setIsPushActive(true);
        setPermissionBlockedNotice(false);
        triggerToast(isRtl ? 'تم تفعيل رسائل الطمأنينة بنجاح — ستصلك نفحات الحمد اليومية ✨' : 'Daily reminders enabled successfully ✨');
      } else if (res && res.reason === 'permission_denied') {
        setPermissionBlockedNotice(true);
        triggerToast(res.message || (isRtl ? 'الإشعارات محظورة في متصفحك. يرجى السماح بها من إعدادات الموقع' : 'Push permission was denied in browser settings'));
      } else if (res && res.reason === 'ios_pwa_required') {
        triggerToast(res.message || (isRtl ? 'لتفعيل الإشعارات على آيفون، يرجى إضافة التطبيق للشاشة الرئيسية أولاً' : 'On iOS, please add to Home Screen first'));
      } else {
        triggerToast(isRtl ? 'تعذر إكمال طلب الإذن، يرجى إعادة المحاولة' : 'Could not complete request, please try again');
      }
    } catch {
      triggerToast(isRtl ? 'حدث خطأ أثناء طلب الإذن' : 'Error requesting permission');
    } finally {
      clearTimeout(safetyTimer);
      setIsPushLoading(false);
    }
  };

  const handleSelectTimeSlot = async (slot, customVal) => {
    setPreferredSlot(slot);
    const targetCustom = customVal || customTime;
    await updateReminderTimeSlot(slot, slot === 'custom' ? targetCustom : '');

    let label = '';
    if (slot === 'random') label = isRtl ? 'توقيت عشوائي نهاراً (09:00 ص - 08:00 م)' : 'Random Daytime Timing (9 AM - 8 PM)';
    else if (slot === 'morning') label = isRtl ? 'الصباح الباكر (08:00 ص)' : 'Early Morning (8:00 AM)';
    else if (slot === 'midday') label = isRtl ? 'منتصف النهار (01:00 م)' : 'Midday (1:00 PM)';
    else if (slot === 'evening') label = isRtl ? 'أول المساء (06:00 م)' : 'Early Evening (6:00 PM)';
    else if (slot === 'night') label = isRtl ? 'قبل النوم (10:30 م)' : 'Before Bed (10:30 PM)';
    else if (slot === 'custom') label = isRtl ? `وقت مخصص (${formatArabicTime(targetCustom)})` : `Custom time (${targetCustom})`;

    triggerToast(isRtl ? `تم ضبط التذكير: ${label}` : `Reminder time set to: ${label}`);
  };

  const handleSendTest = async () => {
    if (isTestingPush) return;
    setIsTestingPush(true);
    try {
      const ok = await sendLocalTestNotification(currentLang);
      if (ok) {
        triggerToast(isRtl ? 'تم إرسال إشعار تجريبي بنجاح إلى جهازك' : 'Test notification sent successfully');
      } else {
        if (!isPushActive) {
          triggerToast(isRtl ? 'يرجى تفعيل رسائل الطمأنينة أولاً لتلقي الإشعارات' : 'Please enable daily reminders first');
        } else {
          triggerToast(isRtl ? 'تعذر إرسال الإشعار. تأكد من إعدادات المتصفح' : 'Could not send test notification');
        }
      }
    } finally {
      setIsTestingPush(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="settings-screen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-main)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.22s ease-out'
      }}
    >
      {/* Sticky Header Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--header-bg, var(--surface-card))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'رجوع' : 'Back'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--surface-sunken)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <BackArrow size={20} />
        </button>

        {/* Center Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: '17.5px',
            fontWeight: '800',
            fontFamily: 'var(--font-arabic-heading)',
            color: 'var(--text-heading)'
          }}>
            {isRtl ? 'إعدادات المنصة' : 'Settings & Preferences'}
          </h1>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {isRtl ? 'تخصيص المظهر، نعمك المنشورة، والتواصل' : 'Preferences & My Blessings'}
          </span>
        </div>

        {/* Right balance spacer */}
        <div style={{ width: '40px' }} />
      </header>

      {/* Dynamic Local Feedback Toast Banner */}
      {localToast && (
        <div style={{
          position: 'sticky',
          top: '64px',
          zIndex: 60,
          margin: '8px 16px -12px',
          padding: '11px 16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0d241b 0%, #17382d 100%)',
          color: '#F4ECE1',
          border: '1px solid var(--color-gold)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '700',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <span>{localToast}</span>
          <button
            type="button"
            onClick={() => setLocalToast('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Body */}
      <main style={{
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 16px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box'
      }}>

        {/* User Account / Identity Section */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} color="var(--color-gold)" />
            <span>{isRtl ? 'الهوية والحساب الدائم' : 'Account & Identity'}</span>
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            {currentUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'rgba(56, 161, 105, 0.15)',
                    border: '1px solid rgba(56, 161, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2F855A'
                  }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {currentUser.email}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#2F855A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{isRtl ? 'حساب نشط — نعمك المنشورة محفوظة سحابياً للأبد' : 'Active account — blessings preserved in cloud'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogOut size={13} />
                  <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold)'
                  }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {isRtl ? 'حفظ نعمك المنشورة سحابياً' : 'Preserve Your Blessings in Cloud'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {isRtl ? 'سجّل الدخول بحساب مجاني لتظل نعمك محفوظة دائماً وتسترجعها من أي هاتف.' : 'Sign in to access and edit your published blessings on any device.'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAuth}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-gold) 0%, #b89326 100%)',
                    color: '#071510',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 12px rgba(212,175,55,0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogIn size={14} />
                  <span>{isRtl ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Section 1: Appearance & Typography */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'المظهر والخطوط' : 'Appearance & Fonts'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* Dark Mode Switch */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  {theme === 'night' ? <Moon size={19} /> : <Sun size={19} />}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'الوضع الليلي (Night Mode)' : 'Dark Theme'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {theme === 'night' 
                      ? (isRtl ? 'مُفعّل — ألوان هادئة ومريحة للعين' : 'Active — easy on eyes')
                      : (isRtl ? 'غير مفعّل — وضع النهار الدافئ' : 'Day mode')}
                  </div>
                </div>
              </div>

              {/* iOS-Style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'night'}
                onClick={onToggleTheme}
                aria-label={isRtl ? 'تبديل المظهر' : 'Toggle Theme'}
                style={{
                  width: '52px',
                  height: '30px',
                  borderRadius: '30px',
                  background: theme === 'night' ? 'var(--color-gold)' : 'var(--surface-sunken)',
                  border: '1.5px solid var(--border-subtle)',
                  padding: '2px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transform: theme === 'night' 
                    ? (isRtl ? 'translateX(-22px)' : 'translateX(22px)') 
                    : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </button>
            </div>

            {/* Font Style Selector */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Type size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'نمط الخط في النعم' : 'Blessing Typography'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {fontMode === 'modern' 
                      ? (isRtl ? 'خط حديث واضح ومريح للعين بدون تداخل (Cairo & Tajawal)' : 'Modern Cairo & Tajawal')
                      : (isRtl ? 'خط كلاسيكي أصيل بنكهة تراثية (Reem Kufi)' : 'Classic Calligraphy')}
                  </div>
                </div>
              </div>

              {/* Segmented Selector for Fonts */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--surface-sunken)',
                padding: '4px',
                borderRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => { if (fontMode !== 'modern') onToggleFontMode(); }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: fontMode === 'modern' ? 'var(--surface-card)' : 'transparent',
                    color: fontMode === 'modern' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: fontMode === 'modern' ? '800' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: fontMode === 'modern' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {fontMode === 'modern' && <Check size={14} color="var(--color-gold)" />}
                  <span>{isRtl ? 'حديث واضح (موصى به)' : 'Modern (Clear)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { if (fontMode !== 'classic') onToggleFontMode(); }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: fontMode === 'classic' ? 'var(--surface-card)' : 'transparent',
                    color: fontMode === 'classic' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: fontMode === 'classic' ? '800' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: fontMode === 'classic' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {fontMode === 'classic' && <Check size={14} color="var(--color-gold)" />}
                  <span>{isRtl ? 'كلاسيكي تقليدي' : 'Classic Traditional'}</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(56, 161, 105, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38A169'
                }}>
                  <Globe size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لغة المنصة' : 'Language'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {currentLang === 'ar' ? 'العربية (Arabic)' : 'English (الإنجليزية)'}
                  </div>
                </div>
              </div>

              {/* Segmented Language Pills */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken)',
                padding: '3px',
                borderRadius: '12px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => { if (currentLang !== 'ar') onToggleLanguage(); }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: currentLang === 'ar' ? 'var(--surface-card)' : 'transparent',
                    color: currentLang === 'ar' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: currentLang === 'ar' ? '800' : '500',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: currentLang === 'ar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => { if (currentLang !== 'en') onToggleLanguage(); }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: currentLang === 'en' ? 'var(--surface-card)' : 'transparent',
                    color: currentLang === 'en' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontWeight: currentLang === 'en' ? '800' : '500',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: currentLang === 'en' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Daily Reminders & Push Notifications (رسائل الطمأنينة والإشعارات اليومية) */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Bell size={13} color="var(--color-gold)" />
            <span>{isRtl ? 'رسائل الطمأنينة والإشعارات' : 'Peaceful Reminders & Notifications'}</span>
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* Main Toggle Row */}
            <div 
              onClick={handleTogglePush}
              style={{
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: isPushActive ? '1px solid var(--border-subtle)' : 'none',
                cursor: isPushLoading ? 'wait' : 'pointer',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, paddingRight: isRtl ? 0 : '10px', paddingLeft: isRtl ? '10px' : 0 }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: isPushActive ? 'rgba(212,175,55,0.15)' : 'var(--surface-sunken)',
                  border: isPushActive ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPushActive ? 'var(--color-gold)' : 'var(--text-muted)',
                  transition: 'all 0.25s ease',
                  flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '15.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'تفعيل رسائل الطمأنينة' : 'Enable Daily Reminders'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                    {isPushActive 
                      ? (isRtl ? 'مُفعّلة — ستصلك نفحات وتأملات تذكيرية هادئة حتى والتطبيق مغلق' : 'Active — daily peaceful blessings enabled')
                      : (isRtl ? 'تلقّ نفحات تدبرية هادئة لترطيب اللسان بالحمد في أوقاتك المفضلة' : 'Receive peaceful daily reminders to give thanks')}
                  </div>
                </div>
              </div>

              {/* iOS-Style Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isPushActive}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePush();
                }}
                disabled={isPushLoading}
                aria-label={isRtl ? 'تفعيل أو إيقاف رسائل الطمأنينة' : 'Toggle Daily Reminders'}
                style={{
                  width: '52px',
                  height: '30px',
                  borderRadius: '30px',
                  background: isPushActive ? 'var(--color-gold)' : 'var(--surface-sunken)',
                  border: '1.5px solid var(--border-subtle)',
                  padding: '2px',
                  cursor: isPushLoading ? 'wait' : 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  flexShrink: 0,
                  opacity: isPushLoading ? 0.6 : 1
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transform: isPushActive 
                    ? (isRtl ? 'translateX(-22px)' : 'translateX(22px)') 
                    : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </button>
            </div>

            {/* Browser Permission Blocked Helper Banner */}
            {permissionBlockedNotice && (
              <div style={{
                margin: '0 16px 16px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(229, 62, 62, 0.08)',
                border: '1.5px solid rgba(229, 62, 62, 0.3)',
                fontSize: '12.5px',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#C53030', marginBottom: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{isRtl ? 'الإشعارات محظورة في متصفحك لهذا الموقع' : 'Notifications are blocked in your browser'}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {isRtl 
                    ? 'المتصفح يمنع طلب الإذن تلقائياً لأنك اخترت رفض/حظر سابقاً. لفك الحظر وتفعيل الإشعارات بثوانٍ:'
                    : 'The browser blocked permission prompts. To unblock:'}
                </p>
                <ol style={{ margin: 0, paddingRight: isRtl ? '18px' : 0, paddingLeft: isRtl ? 0 : '18px', fontSize: '12px', color: 'var(--text-main)' }}>
                  <li>{isRtl ? 'اضغط على أيقونة الإعدادات 🎚️ أو القفل 🔒 في أعلى المتصفح بجوار رابط الموقع.' : 'Tap the settings or lock icon next to the URL.'}</li>
                  <li>{isRtl ? 'اضغط على «الأذونات» (Permissions) ثم «الإشعارات» (Notifications).' : 'Go to Permissions -> Notifications.'}</li>
                  <li>{isRtl ? 'اختر «سماح» (Allow)، ثم أعد الضغط على زر التفعيل هنا وسيعمل فوراً!' : 'Choose Allow, then tap the toggle here.'}</li>
                </ol>
              </div>
            )}

            {/* Sub-Panel: Reminder Time Preference & Test Notification (shown when active) */}
            {isPushActive && (
              <div style={{
                padding: '16px 18px',
                background: 'rgba(212, 175, 55, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text-heading)',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--color-gold)" />
                      <span>{isRtl ? 'الوقت المفضّل لوصول النعمة والتذكير:' : 'Preferred Reminder Time:'}</span>
                    </div>
                    {preferredSlot === 'custom' && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--color-gold)',
                        background: 'rgba(212,175,55,0.12)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {formatArabicTime(customTime)}
                      </span>
                    )}
                  </div>

                  {/* Compact Dropdown Selector for Reminder Timing */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={preferredSlot}
                        onChange={(e) => handleSelectTimeSlot(e.target.value)}
                        aria-label={isRtl ? 'اختر وقت التذكير' : 'Select reminder time'}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border-subtle)',
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-heading)',
                          fontSize: '13px',
                          fontWeight: '700',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          paddingLeft: isRtl ? '36px' : '14px',
                          paddingRight: isRtl ? '14px' : '36px',
                          transition: 'border-color 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <option value="random">{isRtl ? 'توقيت عشوائي نهاراً (الافتراضي 09:00 ص - 08:00 م)' : 'Random Daytime (Default 9 AM - 8 PM)'}</option>
                        <option value="morning">{isRtl ? 'الصباح الباكر (08:00 ص)' : 'Early Morning (8:00 AM)'}</option>
                        <option value="midday">{isRtl ? 'منتصف النهار (01:00 م)' : 'Midday (1:00 PM)'}</option>
                        <option value="evening">{isRtl ? 'أول المساء (06:00 م)' : 'Early Evening (6:00 PM)'}</option>
                        <option value="night">{isRtl ? 'قبل النوم (10:30 م)' : 'Before Bed (10:30 PM)'}</option>
                        <option value="custom">{isRtl ? 'وقت مخصص بالدقيقة من اختيارك...' : 'Custom exact time...'}</option>
                      </select>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: isRtl ? '12px' : 'auto',
                        right: isRtl ? 'auto' : '12px',
                        pointerEvents: 'none',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    {/* Notice if Random Timing */}
                    {preferredSlot === 'random' && (
                      <div style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        background: 'rgba(212, 175, 55, 0.08)',
                        padding: '7px 11px',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Sparkles size={12} color="var(--color-gold)" />
                        <span>{isRtl ? 'ستصلك نفحة وتأمل مبارك في وقت مفاجئ خلال ساعات النهار لترطيب اللسان بالحمد.' : 'Surprise peaceful reminder during daylight hours to give thanks.'}</span>
                      </div>
                    )}

                    {/* Exact Time Input if Custom Selected */}
                    {preferredSlot === 'custom' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-gold)',
                        background: 'var(--surface-card)',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="var(--color-gold)" />
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-heading)' }}>
                            {isRtl ? 'اختر الساعة والدقيقة:' : 'Choose time:'}
                          </span>
                        </div>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            setCustomTime(val);
                            handleSelectTimeSlot('custom', val);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--surface-sunken)',
                            color: 'var(--text-heading)',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            fontWeight: '700',
                            direction: 'ltr',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Test Push Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'جرّب وصول الإشعار لهاتفك الآن:' : 'Test notification on device:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isTestingPush}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-gold)',
                      background: 'rgba(212,175,55,0.1)',
                      color: 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: isTestingPush ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={12} color="var(--color-gold)" />
                    <span>{isRtl ? (isTestingPush ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي') : (isTestingPush ? 'Sending...' : 'Send Test Notification')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: My Published Blessings (نِعَمي المنشورة) */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '1px',
              color: 'var(--color-gold)',
              textTransform: 'uppercase'
            }}>
              {isRtl ? 'نِعَمي المنشورة' : 'My Published Blessings'}
            </div>
            {myPublishedBlessings.length > 0 && (
              <span style={{
                fontSize: '11.5px',
                fontWeight: '700',
                background: 'rgba(212,175,55,0.15)',
                color: 'var(--color-gold)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {myPublishedBlessings.length} {isRtl ? 'نعمة' : 'items'}
              </span>
            )}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden',
            padding: '16px'
          }}>
            {myPublishedBlessings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <Sparkles size={26} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لم تنشر أي نعمة بعد' : 'No published blessings yet'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.6' }}>
                    {isRtl 
                      ? 'شارك إخوانك نعمة لمست فضلها في حياتك لتكون تذكرة ونوراً يستشعر به الآخرون ويحمدون الله عليها.'
                      : 'Share a blessing you experienced to inspire others and encourage gratitude.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenPublish && onOpenPublish(), 200);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: '#FFFFFF',
                    border: '1px solid var(--color-gold)',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(44,74,62,0.3)'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>{isRtl ? 'انشر أول نعمة الآن' : 'Publish a Blessing Now'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myPublishedBlessings.map((blessing) => {
                  const praises = getBlessingPraises ? getBlessingPraises(blessing) : (blessing.praisesCount || 0);
                  return (
                    <div
                      key={blessing.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          <h4 style={{
                            margin: '0 0 4px',
                            fontSize: '15.5px',
                            fontWeight: '800',
                            fontFamily: 'var(--font-arabic-heading)',
                            color: 'var(--text-heading)'
                          }}>
                            {blessing.title}
                          </h4>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {blessing.reflection}
                          </p>
                        </div>
                      </div>

                      {/* Praises & Action Buttons */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {/* Live Praises Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--color-primary)',
                          background: 'rgba(212,175,55,0.14)',
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          <Heart size={13} fill="#E53E3E" color="#E53E3E" />
                          <span>
                            {isRtl ? `حَمَدَ الله بسببها ${praises} شخصاً` : `${praises} people gave thanks`}
                          </span>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onEditBlessing && onEditBlessing(blessing)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'var(--surface-card)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--color-primary)',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Edit3 size={14} />
                            <span>{isRtl ? 'تعديل النعمة' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteBlessing && onDeleteBlessing(blessing)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'rgba(229,62,62,0.08)',
                              border: '1px solid rgba(229,62,62,0.2)',
                              color: '#C53030',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>{isRtl ? 'حذف' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add another button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenPublish && onOpenPublish(), 200);
                  }}
                  style={{
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1.5px dashed var(--border-gold)',
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={16} />
                  <span>{isRtl ? 'نشر نعمة إضافية جديدة' : 'Publish Another Blessing'}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Spiritual Mission & Interactive Tour */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'عن المنصة والرسالة' : 'About & Mission'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* App Mission Row */}
            <div
              onClick={onOpenMission}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <Scroll size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'رسالة وهدف منصة نِعْمَة' : 'Platform Mission & Purpose'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? '«نَحْنُ نَعِيشُ فِي كَنَفِ نِعَمٍ سَابِغَةٍ...» — اقرأ الرسالة كاملة' : 'Read our full spiritual mission statement'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>

            {/* Guide Tour Row */}
            <div
              onClick={onOpenGuide}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Compass size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'دليل المنصة واستكشاف الميزات' : 'App Guide & Interactive Tour'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'جولة توضيحية لجميع الأزرار والوظائف' : 'Interactive tour of all features'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Section 4: Feedback & Support */}
        <section>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            {isRtl ? 'التواصل والمقترحات' : 'Support & Feedback'}
          </div>

          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            {/* User Notifications Inbox Row */}
            <div
              onClick={() => {
                onClose();
                setTimeout(() => onOpenNotifications && onOpenNotifications(), 200);
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)',
                  position: 'relative'
                }}>
                  <Bell size={19} />
                  {unreadNotificationsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      background: '#E53E3E',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      fontSize: '10px',
                      fontWeight: '800',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px'
                    }}>
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {isRtl ? 'بريد الإشعارات وتنبيهات الإدارة' : 'Notifications & Notices'}
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <span style={{
                        background: 'rgba(229,62,62,0.15)',
                        color: '#E53E3E',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '1px 7px',
                        borderRadius: '6px'
                      }}>
                        {isRtl ? `${unreadNotificationsCount} جديدة` : `${unreadNotificationsCount} new`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'رسائل المشرفين وتوضيحات تعديل أو مراجعة نعمك' : 'Updates from admin regarding your blessings'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>

            {/* Feedback & Suggestions Row */}
            <div
              onClick={() => {
                onClose();
                setTimeout(() => onOpenFeedback && onOpenFeedback(), 200);
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: (deferredPrompt || onOpenShareApp) ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(212,175,55,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <MessageSquare size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'الشكاوى والمقترحات التطويرية' : 'Feedback & Suggestions'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'صوتك يساعدنا على تطوير المنصة وإصلاح أي ملاحظة' : 'Report an issue or suggest a feature'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>

            {/* Install PWA Button (if prompt available) */}
            {deferredPrompt && (
              <div
                onClick={() => {
                  if (onInstallPwa) onInstallPwa();
                }}
                role="button"
                tabIndex={0}
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(56,161,105,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38A169'
                  }}>
                    <Download size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {isRtl ? 'تثبيت تطبيق نِعْمَة على هاتفك' : 'Install NEMAA on Home Screen'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {isRtl ? 'تشغيل سريع ومباشر بدون إنترنت كتطبيق أصلي' : 'Fast standalone experience with offline access'}
                    </div>
                  </div>
                </div>
                <NextChevron size={18} color="var(--text-muted)" />
              </div>
            )}

            {/* Share App Row */}
            <div
              onClick={() => {
                onClose();
                setTimeout(() => onOpenShareApp && onOpenShareApp(), 200);
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(44,74,62,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Share2 size={19} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {isRtl ? 'مشاركة المنصة مع من تحب' : 'Share NEMAA App'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? '«الدال على الخير كفاعله» — انشر نِعمة لتؤجر' : 'Spread the blessings with family and friends'}
                  </div>
                </div>
              </div>
              <NextChevron size={18} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Section 5: App Version & About */}
        <section style={{ textAlign: 'center', paddingTop: '10px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>منصة نِعْمَة</span>
            <span>•</span>
            <span>الإصدار 1.2.0</span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-gold)',
            marginTop: '4px',
            fontWeight: '600'
          }}>
            {isRtl ? '«تَذَكَّرْ لِتَشْكُرْ»' : 'Remember to Give Thanks'}
          </div>
        </section>
      </main>
    </div>
  );
}

