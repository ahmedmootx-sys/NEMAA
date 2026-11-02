/**
 * OneSignal Web Push Helper for Nemaa (نِعْمَة)
 * Robust, user-gesture compliant, and resilient against ad-blockers and deferred queues
 */

export const ONESIGNAL_APP_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ONESIGNAL_APP_ID)
  ? import.meta.env.VITE_ONESIGNAL_APP_ID
  : (typeof atob !== 'undefined'
      ? atob('b3NfdjJfYXBwX3I1bWVsd2JuZ3pmd25ibXduNmx3ZHB5MnU3M3lpdHhxcG5tdTI2dTdmMmttd2x2MnV3aXZqN3g1eHl1a2N1aXVxZ2ppd3VqNDN2Z3JuZXhweDZqYjduYmhrb212ZTdvd3o3amFjcHk=')
      : '');

// Detect iOS devices (iPhone, iPad, iPod)
export function isIOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Detect if running as installed PWA (Standalone mode)
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true || 
    window.matchMedia('(display-mode: standalone)').matches ||
    document.referrer.includes('android-app://');
}

// Check if Push Notifications are supported by the current environment
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Initialize OneSignal SDK safely in deferred queue
 * Strictly NO automatic prompt on page load
 */
export function initOneSignal() {
  if (typeof window === 'undefined' || !isPushSupported()) return;

  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: {
            enable: false // Never show floating bell — custom serene UI in Settings only
          },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: './' },
          serviceWorkerPath: './OneSignalSDKWorker.js'
        });
      } catch (err) {
        console.warn('[OneSignal] Init notice:', err);
      }
    });
  } catch (err) {
    console.warn('[OneSignal] Deferred queue notice:', err);
  }
}

/**
 * Get current push notification subscription status
 * Checks native browser permissions + local storage immediately, with non-blocking OneSignal check
 */
export async function getPushSubscriptionState() {
  const supported = isPushSupported();
  const ios = isIOS();
  const standalone = isStandalone();

  if (!supported) {
    return {
      isSupported: false,
      isSubscribed: false,
      permission: 'unsupported',
      isIOSNonStandalone: ios && !standalone
    };
  }

  const nativePerm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
  const localSaved = localStorage.getItem('nemaa_push_notifications_enabled') === 'true';

  // Immediate synchronous status
  const baseState = {
    isSupported: true,
    isSubscribed: nativePerm === 'granted' && localSaved,
    permission: nativePerm,
    isIOSNonStandalone: ios && !standalone
  };

  // If window.OneSignal is already loaded, read its state without blocking
  try {
    if (window.OneSignal?.User?.PushSubscription) {
      const isPushEnabled = window.OneSignal.User.PushSubscription.optedIn ?? false;
      return {
        ...baseState,
        isSubscribed: Boolean(isPushEnabled) || baseState.isSubscribed
      };
    }
  } catch {}

  return baseState;
}

/**
 * Request Push Permission gracefully when user clicks toggle
 * CRITICAL: Runs Notification.requestPermission() synchronously during the user click event
 * to satisfy browser user gesture requirements, then non-blockingly registers OneSignal & ServiceWorker.
 */
export async function requestPushPermission(preferredTimeSlot = 'morning') {
  // 1. Check iOS requirement: must be installed to Home Screen (PWA mode)
  if (isIOS() && !isStandalone()) {
    return {
      success: false,
      reason: 'ios_pwa_required',
      message: 'لتفعيل الإشعارات على آيفون، يرجى إضافة التطبيق للشاشة الرئيسية أولاً'
    };
  }

  // 2. Check general browser support
  if (!isPushSupported()) {
    return {
      success: false,
      reason: 'unsupported',
      message: 'المتصفح الحالي لا يدعم إشعارات الويب'
    };
  }

  // 3. Check if already blocked in browser site settings
  if (Notification.permission === 'denied') {
    return {
      success: false,
      reason: 'permission_denied',
      message: 'تم حظر الإشعارات سابقاً في إعدادات المتصفح. يُرجى تفعيلها من إعدادات الموقع أو الضغط على رمز القفل 🔒 بجانب الرابط'
    };
  }

  // 4. Trigger native permission prompt directly within the click event gesture
  let granted = Notification.permission === 'granted';

  if (!granted) {
    try {
      const result = await Notification.requestPermission();
      granted = result === 'granted';
    } catch (err) {
      console.warn('Native Notification.requestPermission error:', err);
    }
  }

  if (!granted) {
    return {
      success: false,
      reason: 'permission_denied',
      message: 'تم رفض إذن الإشعارات'
    };
  }

  // 5. Permission is GRANTED! Record state locally immediately
  localStorage.setItem('nemaa_push_notifications_enabled', 'true');
  localStorage.setItem('nemaa_push_preferred_slot', preferredTimeSlot);

  // 6. Ensure ServiceWorker registration for push background processing
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./OneSignalSDKWorker.js', { scope: './' }).catch(() => {});
    }
  } catch {}

  // 7. Non-blockingly sync with OneSignal if available (with strict timeout)
  syncOneSignalOptIn(preferredTimeSlot).catch(() => {});

  return {
    success: true,
    permission: 'granted'
  };
}

/**
 * Non-blocking helper to notify OneSignal of optIn and tags
 */
async function syncOneSignalOptIn(timeSlot) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 2000); // 2s max safety timeout

    try {
      // Direct instance
      if (window.OneSignal?.User?.PushSubscription) {
        window.OneSignal.User.PushSubscription.optIn().catch(() => {});
        if (window.OneSignal.User.addTag) {
          window.OneSignal.User.addTag('reminder_time', timeSlot);
          window.OneSignal.User.addTag('language', 'ar');
        }
        clearTimeout(timer);
        resolve(true);
        return;
      }

      // Deferred queue
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
          if (OneSignal.User?.addTag) {
            await OneSignal.User.addTag('reminder_time', timeSlot);
            await OneSignal.User.addTag('language', 'ar');
          }
        } catch {}
        clearTimeout(timer);
        resolve(true);
      });
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}

/**
 * Opt-out / Disable push notifications
 */
export async function unsubscribePush() {
  localStorage.setItem('nemaa_push_notifications_enabled', 'false');

  try {
    if (window.OneSignal?.User?.PushSubscription?.optOut) {
      await window.OneSignal.User.PushSubscription.optOut();
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal.User?.PushSubscription?.optOut) {
            await OneSignal.User.PushSubscription.optOut();
          }
        } catch {}
      });
    }
  } catch {}

  return { success: true };
}

/**
 * Update user's preferred daily reminder slot tag
 */
export async function updateReminderTimeSlot(timeSlot) {
  localStorage.setItem('nemaa_push_preferred_slot', timeSlot);

  try {
    if (window.OneSignal?.User?.addTag) {
      await window.OneSignal.User.addTag('reminder_time', timeSlot);
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal.User?.addTag) {
            await OneSignal.User.addTag('reminder_time', timeSlot);
          }
        } catch {}
      });
    }
  } catch {}

  return true;
}

/**
 * Send an immediate peaceful preview notification to test device connectivity
 */
export async function sendLocalTestNotification(lang = 'ar') {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false;
  }

  const title = lang === 'ar' ? 'نِعْمَة | تَذَكَّرْ لِتَشْكُرْ ✨' : 'Nemaa | Remember to Give Thanks ✨';
  const body = lang === 'ar' 
    ? '«وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا» — رطّب لسانك الآن بذكر الله وحمده.'
    : '"And if you should count the favor of Allah, you could not enumerate them." — Remember Allah and praise Him.';

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: './brand/icon-192.png',
          badge: './brand/icon-192.png',
          tag: 'nemaa_test_reminder',
          vibrate: [100, 50, 100],
          data: { url: './' }
        });
        return true;
      }
    }
    new Notification(title, {
      body,
      icon: './brand/icon-192.png'
    });
    return true;
  } catch (err) {
    console.warn('sendLocalTestNotification error:', err);
    return false;
  }
}
