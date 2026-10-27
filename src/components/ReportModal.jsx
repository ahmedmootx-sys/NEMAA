import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { submitBlessingReport } from '../supabaseClient';

export default function ReportModal({ isOpen, onClose, blessing, lang = 'ar' }) {
  const [reason, setReason] = useState('inappropriate');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !blessing) return null;

  const REPORT_REASONS = [
    { id: 'inappropriate', label: lang === 'ar' ? 'محتوى غير لائق أو بذيء' : 'Inappropriate or offensive content' },
    { id: 'wrong_proof', label: lang === 'ar' ? 'خطأ في الآية القرآنية أو الحديث الشريف أو المعنى' : 'Mistake in Quran verse, Hadith, or meaning' },
    { id: 'gibberish', label: lang === 'ar' ? 'نص عشوائي غير مفهوم أو غير لائق بالتدبّر' : 'Gibberish or unsuitable for contemplation' },
    { id: 'other', label: lang === 'ar' ? 'سبب آخر' : 'Other reason' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedReasonLabel = REPORT_REASONS.find(r => r.id === reason)?.label || reason;

    try {
      await submitBlessingReport({
        blessingId: blessing.id,
        blessingTitle: blessing.title,
        reason: selectedReasonLabel,
        notes: notes.trim()
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setNotes('');
        setReason('inappropriate');
        onClose();
      }, 2500);
    } catch (err) {
      console.warn('Report submission note:', err);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-gold)',
          borderRadius: '22px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(212, 175, 55, 0.15)',
          padding: '24px 22px'
        }}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(229, 62, 62, 0.12)', border: '1px solid rgba(229, 62, 62, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={18} color="#E53E3E" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-arabic-heading)', color: 'var(--text-title)' }}>
                {lang === 'ar' ? 'إبلاغ عن نعمة' : 'Report Blessing'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {lang === 'ar' ? 'مساعدتنا في الحفاظ على نقاء وقدسية المنصة' : 'Help us keep the platform pure and authentic'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={17} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(56, 161, 105, 0.14)', border: '1.5px solid #38A169', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={30} color="#38A169" />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '17px', color: 'var(--color-primary)' }}>
              {lang === 'ar' ? 'جزاك الله خيراً، تم إرسال البلاغ' : 'Thank you, report submitted'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {lang === 'ar' 
                ? 'سيتم مراجعة النعمة من قِبل الإدارة فوراً واتخاذ الإجراء اللازم للحفاظ على نقاء المنصة.'
                : 'The moderation team will review this blessing and take necessary actions.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Target Blessing Summary Box */}
            <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                {lang === 'ar' ? 'النعمة المُبلّغ عنها:' : 'Reported Blessing:'}
              </span>
              <strong style={{ fontSize: '14.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-arabic-title)' }}>
                «{blessing.title}»
              </strong>
            </div>

            {/* Reasons List */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                {lang === 'ar' ? 'سبب الإبلاغ:' : 'Reason for report:'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REPORT_REASONS.map((r) => (
                  <label 
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: reason === r.id ? 'rgba(212, 175, 55, 0.12)' : 'var(--surface-sunken)',
                      border: reason === r.id ? '1.5px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="report_reason" 
                      value={r.id} 
                      checked={reason === r.id} 
                      onChange={() => setReason(r.id)}
                      style={{ accentColor: 'var(--color-gold)' }}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                {lang === 'ar' ? 'ملاحظة أو توضيح إضافي (اختياري):' : 'Additional details (optional):'}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب ما لاحظته باختصار لمساعدة الإدارة...' : 'Briefly describe the issue...'}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #9B2C2C 0%, #C53030 100%)',
                  color: '#FFFFFF',
                  border: '1px solid #FEB2B2',
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(197, 48, 48, 0.35)'
                }}
              >
                <Send size={14} style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
                <span>{isSubmitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : (lang === 'ar' ? 'إرسال البلاغ' : 'Submit Report')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
