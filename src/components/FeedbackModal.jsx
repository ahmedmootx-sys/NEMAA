import React, { useState } from 'react';
import { X, Send, Lightbulb, AlertCircle, MessageSquare, CheckCircle2, User, Mail, Sparkles } from 'lucide-react';
import { submitFeedback } from '../supabaseClient';

export default function FeedbackModal({ isOpen, onClose, lang = 'ar' }) {
  const [type, setType] = useState('suggestion'); // 'suggestion' | 'complaint' | 'other'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userName, setUserName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى كتابة عنوان وتفاصيل الشكوى أو الاقتراح' : 'Please provide both title and details');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await submitFeedback({
        type,
        title: title.trim(),
        content: content.trim(),
        userName: userName.trim(),
        contact: contact.trim()
      });

      if (res.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setTitle('');
          setContent('');
          setUserName('');
          setContact('');
          onClose();
        }, 2600);
      } else {
        setErrorMsg(lang === 'ar' ? 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً' : 'Failed to submit, please try again');
      }
    } catch (err) {
      setErrorMsg(lang === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'An error occurred during submission');
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
          maxWidth: '520px',
          width: '92%',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
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
            <MessageSquare size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-heading)' }}>
              {lang === 'ar' ? 'الشكاوى والمقترحات' : 'Feedback & Suggestions'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'صوتك يساعدنا على تطوير منصة نِعْمَة وإصلاح أي ملاحظة' : 'Help us improve NEMAA platform with your suggestions or report issues'}
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

        {/* Content */}
        <div style={{ padding: '22px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 161, 105, 0.15)',
                color: '#38A169',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '19px', color: 'var(--color-primary)' }}>
                {lang === 'ar' ? 'جزاك الله خيراً، تم استلام رسالتك!' : 'Thank you, your message has been received!'}
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {lang === 'ar' ? 'نقدّر اهتمامك ومشاركتك، وسيتم مراجعة ما أرسلته من قِبل المشرفين باهتمام بعون الله.' : 'We appreciate your input. Our team will review your message carefully.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  border: '1px solid #E53E3E',
                  color: '#C53030',
                  fontSize: '13px'
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                  {lang === 'ar' ? 'نوع الرسالة:' : 'Type of Feedback:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setType('suggestion')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: type === 'suggestion' ? '2px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                      background: type === 'suggestion' ? 'rgba(212,175,55,0.12)' : 'var(--surface-sunken)',
                      color: type === 'suggestion' ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontWeight: type === 'suggestion' ? '700' : '500',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Lightbulb size={16} color={type === 'suggestion' ? 'var(--color-gold)' : 'currentColor'} />
                    <span>{lang === 'ar' ? 'اقتراح وتطوير' : 'Suggestion'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('complaint')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: type === 'complaint' ? '2px solid #E53E3E' : '1px solid var(--border-subtle)',
                      background: type === 'complaint' ? 'rgba(229,62,62,0.1)' : 'var(--surface-sunken)',
                      color: type === 'complaint' ? '#C53030' : 'var(--text-muted)',
                      fontWeight: type === 'complaint' ? '700' : '500',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertCircle size={16} color={type === 'complaint' ? '#E53E3E' : 'currentColor'} />
                    <span>{lang === 'ar' ? 'شكوى أو مشكلة' : 'Issue / Complaint'}</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'ar' ? 'عنوان الموضوع:' : 'Subject:'} <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: اقتراح إضافة عداد تسبيح، أو مشكلة في زر التحميل...' : 'Brief summary...'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Details Content */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'ar' ? 'تفاصيل الملاحظة أو الاقتراح:' : 'Details:'} <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={lang === 'ar' ? 'اشرح ما تراه مناسباً لتطوير التطبيق أو المشكلة التي واجهتك بالتفصيل...' : 'Please describe your suggestion or issue...'}
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Optional Name & Contact in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'اسمك (اختياري):' : 'Your Name (optional):'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder={lang === 'ar' ? 'فاعل خير' : 'Anonymous'}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'وسيلة تواصل (اختياري):' : 'Contact (optional):'}
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={lang === 'ar' ? 'بريد أو هاتف للرد' : 'Email or phone'}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                  color: '#FFFFFF',
                  border: '1.5px solid var(--color-gold)',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <Send size={16} />
                <span>{isSubmitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال الرسالة للأدمن' : 'Submit Feedback')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
