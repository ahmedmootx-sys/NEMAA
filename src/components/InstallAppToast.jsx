import React, { useState, useEffect } from 'react';
import { X, Smartphone, Check } from 'lucide-react';

export default function InstallAppToast({ deferredPrompt, canShow = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!canShow) {
      setIsVisible(false);
      return;
    }

    // Check if already in standalone / installed PWA mode
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );

    if (isStandalone) {
      return;
    }

    // Check if user dismissed it in this session
    const isDismissed = sessionStorage.getItem('nemaa_install_toast_dismissed');
    if (isDismissed) {
      return;
    }

    // Gentle delay after being allowed before displaying
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [canShow]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('nemaa_install_toast_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
          setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem('nemaa_install_toast_dismissed', 'true');
          }, 1500);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Toggle manual instructions
      setShowGuide(prev => !prev);
    }
  };

  if (!isVisible) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div 
      className="install-toast-banner" 
      role="alert" 
      aria-live="polite"
      dir="rtl"
    >
      <div className="install-toast-icon-wrap" aria-hidden="true">
        {installed ? (
          <Check size={20} color="#38A169" />
        ) : (
          <Smartphone size={20} color="var(--color-gold)" />
        )}
      </div>

      <div className="install-toast-content">
        <div className="install-toast-title">
          {installed ? 'تم التثبيت بنجاح!' : 'تثبيت نِعْمَة على هاتفك'}
        </div>
        <div className="install-toast-desc">
          {installed ? (
            'التطبيق الآن على شاشتك الرئيسية ويعمل معك في أي وقت.'
          ) : showGuide ? (
            isIOS
              ? 'اضغط زر المشاركة أسفل المتصفح، ثم اختر «إضافة إلى الشاشة الرئيسية».'
              : 'من قائمة المتصفح (⋮)، اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».'
          ) : (
            'ثبّت التطبيق لتفتحه بلمسة واحدة ويتيح لك التصفح بدون إنترنت.'
          )}
        </div>
      </div>

      <div className="install-toast-actions">
        {!installed && (
          <button
            type="button"
            className="install-toast-btn-action"
            onClick={handleInstallClick}
            aria-label="تثبيت التطبيق على الهاتف"
          >
            {showGuide ? 'حسناً' : 'تثبيت'}
          </button>
        )}

        <button
          type="button"
          className="install-toast-btn-close"
          onClick={handleDismiss}
          title="إغلاق الإشعار"
          aria-label="إغلاق الإشعار"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
