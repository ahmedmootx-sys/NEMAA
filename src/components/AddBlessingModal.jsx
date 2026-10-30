import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  Globe, 
  User, 
  BookOpen, 
  Quote, 
  Lightbulb, 
  Wand2, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { publishSharedBlessing } from '../supabaseClient';
import { validateBlessingContent } from '../utils/contentValidator';
import { BLESSING_INSPIRATIONS, enhanceReflectionDraft } from '../utils/blessingAssistant';

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

  // Writing Assistant States
  const [showInspirations, setShowInspirations] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState('');

  if (!isOpen) return null;

  // Handle selecting an inspired blessing idea
  const handleSelectInspiration = (item) => {
    setTitle(item.title);
    setReflection(item.reflection);
    if (item.proof) {
      setProof(item.proof);
      setProofSource(item.proofSource || '');
      setShowExtraFields(true);
    }
    setShowInspirations(false);
    setAssistantNotice(lang === 'ar' ? 'تم اختيار النعمة، يمكنك التعديل عليها بحرية!' : 'Inspiration applied, feel free to customize!');
    setTimeout(() => setAssistantNotice(''), 3500);
  };

  // Handle smart reflection enhancement
  const handleEnhanceReflection = () => {
    if (!title.trim() && !reflection.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة عنوان للنعمة أو فكرة أولية ليساعدك المساعد في صياغتها' : 'Please enter a title or draft first for the assistant to enhance');
      return;
    }

    setIsEnhancing(true);
    setError('');

    setTimeout(() => {
      const enhanced = enhanceReflectionDraft(title, reflection);
      setReflection(enhanced.reflection);
      if (enhanced.proof && !proof.trim()) {
        setProof(enhanced.proof);
        setProofSource(enhanced.proofSource || '');
        setShowExtraFields(true);
      }
      setIsEnhancing(false);
      setAssistantNotice(lang === 'ar' ? '✨ تم إثراء وصياغة التدبّر واقتراح الاستدلال بنجاح!' : '✨ Reflection enhanced & quote suggested!');
      setTimeout(() => setAssistantNotice(''), 3500);
    }, 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict content validation against gibberish, profanity and incomplete thoughts
    const validation = validateBlessingContent({ title, reflection });
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await publishSharedBlessing({
        title: title.trim(),
        reflection: reflection.trim(),
        author: author.trim(),
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
          author: author.trim(),
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
            ? 'تمت إضافة نعمتك بنجاح وستظهر للجميع!' 
            : 'Your blessing has been published successfully!'
        });

        setTitle('');
        setReflection('');
        setAuthor('');
        setProof('');
        setProofSource('');
        setShowExtraFields(false);
        onClose();
      } else {
        const rawErr = result.error?.message || '';
        if (rawErr.includes('blessings_pkey') || rawErr.includes('duplicate key')) {
          setError(lang === 'ar' 
            ? 'هذه النعمة منشورة بالفعل بهذا العنوان في المنصة، يُرجى تمييز العنوان أو إضافة لمستك الخاصة'
            : 'A blessing with this title already exists. Please choose a distinctive title.');
        } else {
          setError(rawErr || (lang === 'ar' ? 'تعذر النشر، يرجى المحاولة مرة أخرى' : 'Failed to publish, please try again'));
        }
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

        {/* Assistant / Success notice banner */}
        {assistantNotice && (
          <div style={{
            margin: '0 0 14px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(212, 175, 55, 0.14)',
            border: '1px solid var(--color-gold)',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={15} color="var(--color-gold)" />
            <span>{assistantNotice}</span>
          </div>
        )}

        {error && (
          <div className="publish-modal-alert error">
            {error}
          </div>
        )}

        {/* Assistant Tool 1: Inspiration Ideas Button & Drawer */}
        <div style={{
          marginBottom: '16px',
          background: 'var(--surface-sunken)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}>
          <button
            type="button"
            onClick={() => setShowInspirations(!showInspirations)}
            style={{
              width: '100%',
              padding: '11px 16px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-primary)',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={17} color="var(--color-gold)" />
              <span>{lang === 'ar' ? 'لا يحضرك عنوان نعمة؟ استلهم فكرة الآن' : 'Need inspiration? Pick an idea'}</span>
            </div>
            {showInspirations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showInspirations && (
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border-subtle)' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
                {BLESSING_INSPIRATIONS.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCategoryIdx(idx)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: activeCategoryIdx === idx ? '1px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                      background: activeCategoryIdx === idx ? 'rgba(212,175,55,0.18)' : 'var(--surface-card)',
                      color: activeCategoryIdx === idx ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: activeCategoryIdx === idx ? '700' : '500',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'ar' ? cat.category : cat.categoryEn}
                  </button>
                ))}
              </div>

              {/* Items in active category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {BLESSING_INSPIRATIONS[activeCategoryIdx]?.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectInspiration(item)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '3px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.reflection}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                <span>{lang === 'ar' ? 'التدبّر واستشعار النعمة' : 'Reflection & Contemplation'}</span>
                <span className="required-star">*</span>
              </label>

              {/* Assistant Tool 2: Reflection Enhancer Button */}
              <button
                type="button"
                onClick={handleEnhanceReflection}
                disabled={isEnhancing || isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(44,74,62,0.1) 100%)',
                  border: '1px solid var(--color-gold)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: isEnhancing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Wand2 size={13} color="var(--color-gold)" />
                <span>{isEnhancing ? (lang === 'ar' ? 'جاري الصياغة...' : 'Enhancing...') : (lang === 'ar' ? '✨ إكمال وصياغة التدبّر' : '✨ Enhance with AI Assistant')}</span>
              </button>
            </div>

            <textarea
              className="form-textarea"
              style={{ minHeight: '120px' }}
              placeholder={lang === 'ar' ? 'اكتب تأملك ومشاعرك حول هذه النعمة.. أو اضغط على «✨ إكمال وصياغة التدبّر» ليساعدك المساعد في كتابتها.' : 'Share your feelings, or tap Enhance to generate eloquent thoughts.'}
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
