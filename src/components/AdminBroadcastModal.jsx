import React from 'react';
import { X, Sparkles, Megaphone, Check } from 'lucide-react';

export default function AdminBroadcastModal({
  broadcast,
  onClose,
  lang = 'ar'
}) {
  if (!broadcast) return null;

  const isRtl = lang === 'ar';

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      style={{ zIndex: 10020, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div 
        className="admin-broadcast-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          animation: 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(44, 74, 62, 0.12) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--surface-card)',
              border: '1.5px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold)',
              boxShadow: '0 3px 10px rgba(212, 175, 55, 0.25)',
              flexShrink: 0
            }}>
              <Megaphone size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRtl ? 'إشعار وتنبيه عام من الإدارة' : 'Official Announcement'}
                </span>
                <Sparkles size={13} color="var(--color-gold)" />
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '800', color: 'var(--text-heading)', lineHeight: '1.3' }}>
                {broadcast.title || (isRtl ? 'رسالة عامة لكافة مستخدمي نِعْمَة' : 'Notice to all NEMAA users')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '22px 24px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '14.5px',
            lineHeight: '1.75',
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            background: 'var(--surface-sunken)',
            padding: '16px 18px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {broadcast.message}
          </div>

          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <span>{isRtl ? 'منصة نِعْمَة — تَذَكَّرْ لِتَشْكُرْ' : 'NEMAA Platform'}</span>
            <span>{broadcast.createdAt ? new Date(broadcast.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 22px 18px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="form-submit-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            <Check size={16} />
            <span>{isRtl ? 'فهمت واستوعبت' : 'Understood'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
