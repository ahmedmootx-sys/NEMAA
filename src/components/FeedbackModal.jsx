import React, { useState } from 'react';
import { X, Send, Lightbulb, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { submitFeedback } from '../supabaseClient';

export default function FeedbackModal({ isOpen, onClose, lang = 'ar' }) {
  const [type, setType] = useState('suggestion'); // 'suggestion' | 'complaint'
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
        }, 2400);
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
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header - Sleek with Circular Close Button */}
        <div style={{
          flex: '0 0 auto',
          position: 'relative',
          padding: '16px 20px',
          background: 'var(--surface-sunken)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold)',
            flexShrink: 0
          }}>
            <MessageSquare size={19} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lang === 'ar' ? 'الشكاوى والمقترحات' : 'Feedback & Suggestions'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {lang === 'ar' ? 'صوتك يساعدنا على تطوير منصة نِعْمَة' : 'Help us improve NEMAA platform'}
            </p>
          </div>

          {/* Pure Circular Close Button (No square borders) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: 0,
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content - Scrollable on mobile with safe bottom space */}
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '18px 20px 24px' }}>
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
              <h4 style={{ margin: '0 0 8px', fontSize: '18.5px', color: 'var(--color-primary)', fontWeight: '800' }}>
                {lang === 'ar' ? 'جزاك الله خيراً، تم استلام رسالتك!' : 'Thank you, your message has been received!'}
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {lang === 'ar' ? 'وصلت رسالتك إلى المشرفين وستتم مراجعتها بعناية واهتمام بإذن الله.' : 'Your message has been delivered to the admin team.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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

              {/* Type Selector with Solid Vector Icons */}
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
                      fontWeight: type === 'suggestion' ? '800' : '500',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
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
                      fontWeight: type === 'complaint' ? '800' : '500',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <AlertCircle size={16} color={type === 'complaint' ? '#E53E3E' : 'currentColor'} />
                    <span>{lang === 'ar' ? 'شكوى أو مشكلة' : 'Issue / Complaint'}</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'ar' ? 'عنوان الموضوع:' : 'Subject:'} <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: اقتراح إضافة ميزة، أو ملاحظة على زر...' : 'Brief summary...'}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
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
                  placeholder={lang === 'ar' ? 'اشرح ما تراه مناسباً لتطوير التطبيق أو المشكلة بالتفصيل...' : 'Please describe your suggestion or issue...'}
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Optional Name & Contact (Stacked cleanly for mobile) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'اسمك (اختياري):' : 'Your Name:'}
                  </label>
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
                      fontSize: '12.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'وسيلة تواصل (اختياري):' : 'Contact:'}
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={lang === 'ar' ? 'بريد أو هاتف' : 'Email or phone'}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-main)',
                      fontSize: '12.5px',
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
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                  color: '#FFFFFF',
                  border: '1.5px solid var(--color-gold)',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.25)',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxSizing: 'border-box'
                }}
              >
                <Send size={16} />
                <span>{isSubmitting ? (lang === 'ar' ? 'جاري الإرسال للأدمن...' : 'Sending...') : (lang === 'ar' ? 'إرسال الرسالة للأدمن' : 'Submit Feedback')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
