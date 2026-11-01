/**
 * OneSignal Web Push Helper for Nemaa (نِعْمَة)
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
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Initialize OneSignal SDK safely in deferred queue
 * Strictly NO automatic prompt on page load
 */
export function initOneSignal() {
  if (typeof window === 'undefined') return;

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

  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.OneSignalDeferred) {
        const nativePerm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
        resolve({
          isSupported: true,
          isSubscribed: nativePerm === 'granted',
          permission: nativePerm,
          isIOSNonStandalone: ios && !standalone
        });
        return;
      }

      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          const isPushEnabled = OneSignal.User?.PushSubscription?.optedIn ?? false;
          const perm = OneSignal.Notifications?.permission ? 'granted' : (Notification.permission || 'default');
          resolve({
            isSupported: true,
            isSubscribed: Boolean(isPushEnabled),
            permission: perm,
            isIOSNonStandalone: ios && !standalone
          });
        } catch {
          const nativePerm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
          resolve({
            isSupported: true,
            isSubscribed: nativePerm === 'granted',
            permission: nativePerm,
            isIOSNonStandalone: ios && !standalone
          });
        }
      });
    } catch {
      resolve({
        isSupported: true,
        isSubscribed: false,
        permission: 'default',
        isIOSNonStandalone: ios && !standalone
      });
    }
  });
}

/**
 * Request Push Permission gracefully when user clicks toggle
 */
export async function requestPushPermission(preferredTimeSlot = 'morning') {
  // Check iOS requirement first: must be installed to Home Screen
  if (isIOS() && !isStandalone()) {
    return {
      success: false,
      reason: 'ios_pwa_required',
      message: 'لتفعيل الإشعارات على آيفون، يرجى إضافة التطبيق للشاشة الرئيسية أولاً'
    };
  }

  if (!isPushSupported()) {
    return {
      success: false,
      reason: 'unsupported',
      message: 'المتصفح الحالي لا يدعم إشعارات الويب'
    };
  }

  return new Promise((resolve) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          // Request permission
          if (OneSignal.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission();
          }

          // Opt in push subscription
          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }

          // Tag preferred time slot (morning, afternoon, evening)
          if (OneSignal.User?.addTag) {
            await OneSignal.User.addTag('reminder_time', preferredTimeSlot);
            await OneSignal.User.addTag('language', 'ar');
          }

          const isGranted = (OneSignal.Notifications?.permission) || (Notification.permission === 'granted');
          if (isGranted) {
            localStorage.setItem('nemaa_push_notifications_enabled', 'true');
            localStorage.setItem('nemaa_push_preferred_slot', preferredTimeSlot);
            resolve({ success: true, permission: 'granted' });
          } else {
            resolve({
              success: false,
              reason: 'permission_denied',
              message: 'تم رفض إذن الإشعارات من إعدادات المتصفح'
            });
          }
        } catch (err) {
          console.warn('[OneSignal] request permission error:', err);
          // Native fallback
          try {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
              localStorage.setItem('nemaa_push_notifications_enabled', 'true');
              localStorage.setItem('nemaa_push_preferred_slot', preferredTimeSlot);
              resolve({ success: true, permission: 'granted' });
            } else {
              resolve({ success: false, reason: 'permission_denied' });
            }
          } catch (e) {
            resolve({ success: false, reason: 'error', error: e });
          }
        }
      });
    } catch (err) {
      resolve({ success: false, reason: 'error', error: err });
    }
  });
}

/**
 * Opt-out / Disable push notifications
 */
export async function unsubscribePush() {
  localStorage.setItem('nemaa_push_notifications_enabled', 'false');
  return new Promise((resolve) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal.User?.PushSubscription?.optOut) {
            await OneSignal.User.PushSubscription.optOut();
          }
          resolve({ success: true });
        } catch (err) {
          console.warn('[OneSignal] optOut error:', err);
          resolve({ success: true });
        }
      });
    } catch {
      resolve({ success: true });
    }
  });
}

/**
 * Update user's preferred daily reminder slot tag
 */
export async function updateReminderTimeSlot(timeSlot) {
  localStorage.setItem('nemaa_push_preferred_slot', timeSlot);
  return new Promise((resolve) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (OneSignal.User?.addTag) {
            await OneSignal.User.addTag('reminder_time', timeSlot);
          }
          resolve(true);
        } catch {
          resolve(false);
        }
      });
    } catch {
      resolve(false);
    }
  });
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
