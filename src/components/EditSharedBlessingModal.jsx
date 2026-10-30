import React, { useState, useEffect } from 'react';
import { X, Check, PenTool, Sparkles, BookOpen, User, Quote, Loader2, AlertCircle } from 'lucide-react';
import { validateBlessingContent } from '../utils/contentValidator';

export default function EditSharedBlessingModal({
  isOpen,
  onClose,
  blessing,
  onSave,
  isAdmin = false,
  lang = 'ar'
}) {
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');
  const [author, setAuthor] = useState('');
  const [proof, setProof] = useState('');
  const [proofSource, setProofSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (blessing) {
      setTitle(blessing.title || '');
      setReflection(blessing.reflection || '');
      setAuthor(blessing.author && blessing.author !== 'محب للخير' ? blessing.author : '');
      setProof(blessing.proof || '');
      setProofSource(blessing.proofSource || '');
      setError('');
    }
  }, [blessing, isOpen]);

  if (!isOpen || !blessing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Content validation
    const validation = validateBlessingContent({ title, reflection });
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSave({
        title: title.trim(),
        reflection: reflection.trim(),
        author: author.trim(),
        proof: proof.trim(),
        proofSource: proofSource.trim()
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('blessings_pkey') || msg.includes('duplicate key')) {
        setError(lang === 'ar' 
          ? 'يوجد بالفعل نعمة أخرى منشورة بهذا العنوان، يرجى اختيار عنوان مميز' 
          : 'A blessing with this title already exists. Please choose a different title.');
      } else {
        setError(msg || (lang === 'ar' ? 'تعذر حفظ التعديلات، يرجى المحاولة ثانية' : 'Failed to save edits'));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ zIndex: 10005 }}>
      <div 
        className="modal-content publish-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <PenTool size={20} color="var(--color-gold)" />
            <span>
              {isAdmin 
                ? (lang === 'ar' ? 'تعديل وتصحيح النعمة (الإدارة)' : 'Edit Blessing (Admin)')
                : (lang === 'ar' ? 'تعديل نعمتك المنشورة' : 'Edit Your Published Blessing')}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
            <X size={18} />
          </button>
        </div>

        {/* Guidance Subtitle */}
        <div className="publish-modal-intro" style={{ marginBottom: '16px' }}>
          <div className="publish-intro-icon">
            <Sparkles size={18} color="var(--color-gold)" />
          </div>
          <div className="publish-intro-text">
            <strong>
              {isAdmin 
                ? (lang === 'ar' ? 'تصحيح الأخطاء الإملائية أو الصياغة' : 'Fix typos or refine wording')
                : (lang === 'ar' ? 'تحديث وتصحيح تفاصيل نعمتك' : 'Update your blessing details')}
            </strong>
            <p>
              {isAdmin
                ? (lang === 'ar' 
                    ? 'يمكنك تعديل أي خطأ إملائي أو لغوي ورد في البلاغ دون الحاجة لحذف النعمة بالكامل.'
                    : 'Fix typos directly without deleting the blessing from the community.')
                : (lang === 'ar'
                    ? 'تستطيع تصحيح الأخطاء الإملائية أو تعديل ألفاظ تدبّرك وستُحدّث فوراً لدى الجميع.'
                    : 'Update reflection wording or add missing details for everyone to see.')}
            </p>
          </div>
        </div>

        {error && (
          <div className="publish-modal-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="publish-modal-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              <span>{lang === 'ar' ? 'عنوان النعمة' : 'Blessing Title'}</span>
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: نعمة هدوء البال...' : 'e.g. The blessing of peace of mind...'}
              maxLength={120}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Reflection */}
          <div className="form-group">
            <label className="form-label">
              <span>{lang === 'ar' ? 'التدبّر واستشعار النعمة' : 'Reflection'}</span>
              <span className="required-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب تأملك ومشاعرك حول هذه النعمة...' : 'Write your contemplation and feelings...'}
              maxLength={800}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Author Name */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} color="var(--color-gold)" />
                <span>{lang === 'ar' ? 'اسم الكاتب / الناشر (اختياري)' : 'Author Name (Optional)'}</span>
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder={lang === 'ar' ? 'الافتراضي: محب للخير' : 'Default: Anonymous'}
              maxLength={60}
              disabled={isSubmitting}
            />
          </div>

          {/* Proof / Verse / Hadith */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={13} color="var(--color-gold)" />
                <span>{lang === 'ar' ? 'آية أو حديث أو استدلال مرتبط (اختياري)' : 'Quranic Verse or Hadith (Optional)'}</span>
              </span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={proof}
              onChange={e => setProof(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: ﴿وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا﴾' : 'e.g. Quran verse or prophetic hadith...'}
              maxLength={400}
              disabled={isSubmitting}
            />
          </div>

          {/* Proof Source */}
          {proof.trim() && (
            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Quote size={13} color="var(--color-gold)" />
                  <span>{lang === 'ar' ? 'مصدر الاستدلال (اختياري)' : 'Citation Source'}</span>
                </span>
              </label>
              <input
                type="text"
                className="form-input"
                value={proofSource}
                onChange={e => setProofSource(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: سورة إبراهيم: 34 / صحيح البخاري' : 'e.g. Surah Ibrahim: 34 / Sahih Bukhari'}
                maxLength={80}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="form-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="form-submit-btn"
              disabled={isSubmitting}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>{lang === 'ar' ? 'جاري حفظ التعديلات...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
