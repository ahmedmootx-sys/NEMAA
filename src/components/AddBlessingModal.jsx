import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Globe, User, BookOpen, Quote } from 'lucide-react';
import { publishSharedBlessing } from '../supabaseClient';

export default function AddBlessingModal({ 
  isOpen, 
  onClose, 
  onBlessingPublished,
  lang = 'ar' 
}) {
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');
  const [author, setAuthor] = useState('');
  const [proof, setProof] = useState('');
  const [proofSource, setProofSource] = useState('');
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !reflection.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة عنوان النعمة والتدبّر' : 'Please provide both title and reflection');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await publishSharedBlessing({
        title: title.trim(),
        reflection: reflection.trim(),
        author: author.trim() || 'محب للخير',
        proof: proof.trim(),
        proofSource: proofSource.trim()
      });

      if (result.success) {
        onBlessingPublished(result.data, {
          successMessage: lang === 'ar' 
            ? 'تمت إضافة نعمتك بنجاح وستظهر للجميع!' 
            : 'Your blessing has been published successfully!'
        });
        
        // Reset form
        setTitle('');
        setReflection('');
        setAuthor('');
        setProof('');
        setProofSource('');
        setShowExtraFields(false);
        setError('');
        onClose();
      } else if (result.isRlsError) {
        const fallbackObj = {
          id: `custom_${Date.now()}`,
          title: title.trim(),
          reflection: reflection.trim(),
          author: author.trim() || 'محب للخير',
          category: 'shared',
          categoryName: 'نعم متشارَكة',
          proof: proof.trim(),
          proofSource: proofSource.trim(),
          tags: ['نعمة_متشارَكة', 'مجتمع_نعمة'],
          isShared: true,
          createdAt: new Date().toISOString()
        };

        onBlessingPublished(fallbackObj, {
          successMessage: lang === 'ar' 
            ? 'تمت إضافة نعمتك بنجاح في جلستك! (تأكد من تفعيل صلاحية INSERT في Supabase لتظهر للجميع عالمياً)' 
            : 'Blessing added locally! Ensure Supabase RLS allows public inserts.'
        });

        setTitle('');
        setReflection('');
        setAuthor('');
        setProof('');
        setProofSource('');
        setShowExtraFields(false);
        onClose();
      } else {
        setError(result.error?.message || (lang === 'ar' ? 'تعذر النشر، يرجى المحاولة مرة أخرى' : 'Failed to publish, please try again'));
      }
    } catch (err) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع أثناء النشر' : 'An unexpected error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content publish-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={22} color="var(--color-gold)" />
            <span>{lang === 'ar' ? 'نشر نعمة على نِعْمَة' : 'Publish a Blessing on NEMAA'}</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
            <X size={18} />
          </button>
        </div>

        {/* Spiritual Guidance Subtitle */}
        <div className="publish-modal-intro">
          <div className="publish-intro-icon">
            <Globe size={18} color="var(--color-gold)" />
          </div>
          <div className="publish-intro-text">
            <strong>{lang === 'ar' ? 'شارك نِعمة استشعرتها مع الجميع' : 'Share a blessing with the community'}</strong>
            <p>
              {lang === 'ar' 
                ? '«فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي» — كل نعمة تنشرها هنا تصبح متاحة فوراً لجميع زوار المنصة ليتدبروها ويحمدوا الله عليها.'
                : 'Share your contemplation with all platform visitors to inspire gratitude worldwide.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="publish-modal-alert error">
            {error}
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
              placeholder={lang === 'ar' ? 'مثال: نعمة هدوء البال، نعمة ستر العيوب، نعمة تيسير الأمور...' : 'e.g. The blessing of peace of mind, ease after hardship...'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
              maxLength={120}
            />
            <div className="input-hint">
              {title.length}/120 {lang === 'ar' ? 'حرفاً' : 'chars'}
            </div>
          </div>

          {/* Reflection */}
          <div className="form-group">
            <label className="form-label">
              <span>{lang === 'ar' ? 'التدبّر واستشعار النعمة' : 'Reflection & Contemplation'}</span>
              <span className="required-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '120px' }}
              placeholder={lang === 'ar' ? 'اكتب تأملك ومشاعرك حول هذه النعمة.. ما أثر وجودها، وكيف تكون الحياة لو فُقدت؟' : 'Share your deep feelings and realization about this divine blessing...'}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <div className="input-hint">
              {lang === 'ar' ? 'احرص على أسلوب هادئ يوقظ الامتنان ويدعو لحمد الله.' : 'Craft a mindful message that awakens gratitude.'}
            </div>
          </div>

          {/* Optional Extra Fields Toggle */}
          <div style={{ margin: '10px 0 14px' }}>
            <button
              type="button"
              className="extra-fields-toggle-btn"
              onClick={() => setShowExtraFields(!showExtraFields)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-gold)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Quote size={13} />
              <span>
                {showExtraFields 
                  ? (lang === 'ar' ? 'إخفاء الحقول الإضافية' : 'Hide additional fields') 
                  : (lang === 'ar' ? '+ إضافة اسم الكاتب أو آية/حديث (اختياري)' : '+ Add author name or quote (optional)')}
              </span>
            </button>
          </div>

          {showExtraFields && (
            <div className="extra-fields-box" style={{ 
              background: 'var(--surface-card-subtle)', 
              padding: '14px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Author */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  <User size={13} color="var(--color-gold)" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                  <span>{lang === 'ar' ? 'اسم الكاتب أو صاحب التدبّر (اختياري)' : 'Author name (optional)'}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ar' ? 'الافتراضي: محب للخير' : 'Default: Well-wisher'}
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Proof / Verse / Hadith */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  <BookOpen size={13} color="var(--color-gold)" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                  <span>{lang === 'ar' ? 'آية، حديث، أو مقولة تلهمك (اختياري)' : 'Aya, Hadith or inspiring quote (optional)'}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ar' ? 'مثال: «وَمَا بِكُم مِّن نِّعْمَةٍ فَمِنَ اللَّهِ»' : 'e.g. "And whatever of blessings and good things you have, it is from Allah"'}
                  value={proof}
                  onChange={e => setProof(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Proof Source */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  <span>{lang === 'ar' ? 'مصدر الشاهد (اختياري)' : 'Quote source (optional)'}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ar' ? 'مثال: سورة النحل: 53 أو صحيح مسلم' : 'e.g. Surah An-Nahl: 53'}
                  value={proofSource}
                  onChange={e => setProofSource(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Prominent Publish Button */}
          <button 
            type="submit" 
            id="btn-publish-supabase"
            className="form-submit-btn publish-submit-btn"
            disabled={isSubmitting || !title.trim() || !reflection.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                <span>{lang === 'ar' ? 'جاري النشر على نعمة...' : 'Publishing to NEMAA...'}</span>
              </>
            ) : (
              <>
                <Send size={18} style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
                <span>{lang === 'ar' ? 'نشر على نعمة' : 'Publish on NEMAA'}</span>
                <Sparkles size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
