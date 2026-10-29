import React from 'react';
import { 
  X, 
  Bell, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  Edit3, 
  Clock 
} from 'lucide-react';

export default function UserNotificationsDrawer({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onDismissNotification, 
  onClearAll, 
  lang = 'ar' 
}) {
  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const diffMs = Date.now() - Number(ts);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return isRtl ? 'الآن' : 'Just now';
      if (diffMins < 60) return isRtl ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
      if (diffHours < 24) return isRtl ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
      if (diffDays === 1) return isRtl ? 'أمس' : 'Yesterday';
      return isRtl ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case 'edit':
        return {
          icon: <Edit3 size={13} />,
          label: isRtl ? 'تعديل وتصحيح' : 'Edited by Admin',
          bg: 'rgba(212, 175, 55, 0.14)',
          color: 'var(--color-gold)',
          border: '1px solid rgba(212, 175, 55, 0.3)'
        };
      case 'delete':
        return {
          icon: <Trash2 size={13} />,
          label: isRtl ? 'حذف نعمة' : 'Blessing Removed',
          bg: 'rgba(229, 62, 62, 0.12)',
          color: '#E53E3E',
          border: '1px solid rgba(229, 62, 62, 0.25)'
        };
      default:
        return {
          icon: <MessageSquare size={13} />,
          label: isRtl ? 'رسالة من الإدارة' : 'Admin Notice',
          bg: 'rgba(44, 74, 62, 0.12)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(44, 74, 62, 0.25)'
        };
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      style={{
        zIndex: 10005,
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        className="modal-content user-notifications-drawer"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '92%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 22px 16px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(44,74,62,0.06) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--surface-card)',
              border: '1.5px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold)'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-heading)' }}>
                  {isRtl ? 'بريد الإشعارات وتنبيهات الإدارة' : 'Notification Inbox & Notices'}
                </h3>
                {notifications.length > 0 && (
                  <span style={{
                    background: 'var(--color-gold)',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px'
                  }}>
                    {notifications.length}
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {isRtl ? 'رسائل المشرفين وتوضيحات تعديل أو حذف نعمك' : 'Messages and updates regarding your blessings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Clear all bar if notifications present */}
        {notifications.length > 0 && (
          <div style={{
            padding: '10px 22px',
            background: 'var(--surface-sunken)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isRtl ? `لديك ${notifications.length} رسالة من الإدارة` : `You have ${notifications.length} notices`}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#E53E3E',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <Trash2 size={13} />
              <span>{isRtl ? 'مسح الكل' : 'Clear All'}</span>
            </button>
          </div>
        )}

        {/* List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold)'
              }}>
                <Sparkles size={28} />
              </div>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-heading)' }}>
                {isRtl ? 'لا توجد رسائل جديدة' : 'No new notifications'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.6' }}>
                {isRtl ? 'بريدك هادئ ومبارك.. ستصلك هنا أي رسائل أو تنبيهات من إدارة المنصة بشأن نعمك المنشورة.' : 'Your inbox is clear. Any messages from moderators will appear here.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const badge = getActionBadge(notif.actionType);
              return (
                <div
                  key={notif.id}
                  style={{
                    background: 'var(--surface-sunken)',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative'
                  }}
                >
                  {/* Top Row: Badge, Timestamp, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border
                      }}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {notif.timestamp && (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {formatTimestamp(notif.timestamp)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissNotification && onDismissNotification(notif.id)}
                      title={isRtl ? 'حذف الإشعار' : 'Dismiss notification'}
                      aria-label="حذف"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Blessing Reference */}
                  {notif.blessingTitle && (
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: 'var(--text-heading)',
                      padding: '6px 12px',
                      background: 'var(--surface-card)',
                      borderRadius: '8px',
                      borderRight: '3px solid var(--color-gold)'
                    }}>
                      {isRtl ? `بخصوص نعمة: «${notif.blessingTitle}»` : `Regarding: "${notif.blessingTitle}"`}
                    </div>
                  )}

                  {/* Message Body */}
                  <div style={{
                    fontSize: '13.5px',
                    lineHeight: '1.7',
                    color: 'var(--text-main)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {notif.message}
                  </div>

                  {/* Sender signature */}
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', textAlign: isRtl ? 'left' : 'right', fontWeight: '600' }}>
                    — {notif.adminEmail || (isRtl ? 'إدارة منصة نِعْمَة' : 'NEMAA Team')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
