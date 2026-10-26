import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  Check, 
  Clock, 
  Sparkles, 
  AlertCircle,
  Send
} from 'lucide-react';

export default function NotificationModal({ isOpen, onClose }) {
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('nemaa_notifications_enabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('nemaa_reminder_time') || '08:30';
  });
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatusMessage('متصفحك لا يدعم الإشعارات في هذا الوضع.');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setIsEnabled(true);
        localStorage.setItem('nemaa_notifications_enabled', 'true');
        setStatusMessage('تم تفعيل إشعارات نِعْمَة بنجاح.');
      } else {
        setIsEnabled(false);
        localStorage.setItem('nemaa_notifications_enabled', 'false');
        setStatusMessage('تم رفض إذن الإشعارات من المتصفح.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('حدث خطأ أثناء طلب الإذن.');
    }
  };

  const handleToggle = () => {
    if (!isEnabled) {
      if (permission === 'granted') {
        setIsEnabled(true);
        localStorage.setItem('nemaa_notifications_enabled', 'true');
        setStatusMessage('تم تفعيل التذكير اليومي.');
      } else {
        requestPermission();
      }
    } else {
      setIsEnabled(false);
      localStorage.setItem('nemaa_notifications_enabled', 'false');
      setStatusMessage('تم إيقاف التذكير اليومي مؤقتاً.');
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem('nemaa_reminder_time', newTime);
  };

  const sendTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('متصفحك لا يدعم الإشعارات.');
      return;
    }

    if (Notification.permission !== 'granted') {
      requestPermission();
      return;
    }

    const title = 'نِعْمَة | تَذَكَّرْ لِتَشْكُرْ';
    const options = {
      body: '«وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا» • افتح تطبيق نعمة اليوم لتتدبر نعمة مباركة وترطب لسانك بالحمد.',
      icon: './brand/icon-192.png',
      badge: './brand/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'nemaa-daily-reminder'
    };

    // Try through service worker first for PWA consistency, fallback to window.Notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }

    setStatusMessage('تم إرسال إشعار التجربة لهاتفك بنجاح.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card notification-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="إعدادات التذكير اليومي والإشعارات"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap" style={{ background: 'rgba(44, 74, 62, 0.1)', color: 'var(--color-primary)' }}>
              <BellRing size={20} />
            </div>
            <div>
              <h3 className="modal-title">التذكير اليومي بالنعمة</h3>
              <p className="modal-subtitle">ورد يومي يوقظ قلبك لترسيخ الحمد</p>
            </div>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Main Toggle Switch */}
          <div className="notification-toggle-card">
            <div className="toggle-info">
              <span className="toggle-title">تفعيل إشعار النعمة اليومية</span>
              <span className="toggle-desc">إشعار هادئ يصلك يومياً بنعمة مختارة وتدبر إيماني</span>
            </div>
            <label className="switch-label">
              <input 
                type="checkbox" 
                checked={isEnabled && permission === 'granted'}
                onChange={handleToggle}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Time Picker */}
          <div className="notification-time-section">
            <div className="time-label-group">
              <Clock size={16} color="var(--color-gold)" />
              <span>وقت التذكير المفضل:</span>
            </div>
            <input 
              type="time" 
              className="time-picker-input"
              value={reminderTime}
              onChange={handleTimeChange}
              disabled={!isEnabled}
            />
          </div>

          {/* Status Alert if denied */}
          {permission === 'denied' && (
            <div className="notification-alert-box alert-warning">
              <AlertCircle size={18} />
              <div>
                <strong>الإشعارات محظورة في متصفحك</strong>
                <p>يرجى النقر على أيقونة القفل بجانب شريط العنوان والسماح بالإشعارات للموقع.</p>
              </div>
            </div>
          )}

          {/* Feedback message */}
          {statusMessage && (
            <div className="notification-status-msg">
              {statusMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="notification-actions">
            <button 
              type="button"
              className="btn btn-secondary btn-full"
              onClick={sendTestNotification}
            >
              <Send size={15} />
              <span>تجربة إشعار فوري الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
