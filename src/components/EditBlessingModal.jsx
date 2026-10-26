import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  PenTool, 
  BookOpen, 
  Quote, 
  FileText,
  Heart
} from 'lucide-react';

export default function EditBlessingModal({
  isOpen,
  onClose,
  blessing,
  onSaveCustomization,
  onResetCustomization,
  isCustomized = false
}) {
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');
  const [proof, setProof] = useState('');
  const [proofSource, setProofSource] = useState('');
  const [proofType, setProofType] = useState('quran');
  const [userNote, setUserNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (blessing) {
      setTitle(blessing.title || '');
      setReflection(blessing.reflection || '');
      setProof(blessing.proof || '');
      setProofSource(blessing.proofSource || '');
      setProofType(blessing.proofType || 'quran');
      setUserNote(blessing.userNote || '');
      setSavedSuccess(false);
    }
  }, [blessing, isOpen]);

  if (!isOpen || !blessing) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !reflection.trim()) return;

    onSaveCustomization(blessing.id, {
      title: title.trim(),
      reflection: reflection.trim(),
      proof: proof.trim(),
      proofSource: proofSource.trim(),
      proofType: proofType,
      userNote: userNote.trim(),
      isCustomized: true,
      customizedAt: new Date().toISOString()
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm('هل تود استعادة النص الأصلي لهذه النعمة وإلغاء تعديلاتك؟')) {
      onResetCustomization(blessing.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
        dir="rtl"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <PenTool size={20} color="var(--color-gold)" />
            <span>صياغة وتخصيص كلام النعمة</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* Guidance Notice */}
        <div style={{
          background: 'var(--surface-card-subtle)',
          borderRight: '3px solid var(--color-gold)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '18px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--text-muted)'
        }}>
          لك كامل الحرية في إعادة صياغة تدبر هذه النعمة بالكلمات التي تستشعر بها فضل الله ولطفه، أو تدوين آيات واستدلالات وخواطر تلامس قلبك أكثر.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="var(--color-primary)" />
              <span>عنوان النعمة:</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: نعمة الستر الجميل"
              required
            />
          </div>

          {/* Reflection Field */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={15} color="var(--color-primary)" />
              <span>نص التدبر والتأمل في النعمة:</span>
            </label>
            <textarea
              className="form-textarea"
              rows={5}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="اكتب صياغتك وتأملك الخاص في فضل هذه النعمة، وماذا كان سيحدث لولا لطف الله بها عليك..."
              required
              style={{ lineHeight: '1.7', fontSize: '14px' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
              نصيحة: اختم كلامك باستشعار ما كان سيصيبك لولا هذه النعمة، ثم حمد الله على رحمته ولطفه.
            </div>
          </div>

          {/* Proof Verse or Hadith */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Quote size={15} color="var(--color-primary)" />
                <span>الآية القرآنية أو الحديث أو الاستدلال:</span>
              </label>
              <select
                value={proofType}
                onChange={(e) => setProofType(e.target.value)}
                style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-main)'
                }}
              >
                <option value="quran">آية قرآنية</option>
                <option value="hadith">حديث نبوي</option>
                <option value="quote">أثر / مقولة إيمانية</option>
              </select>
            </div>
            <textarea
              className="form-textarea"
              rows={3}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="اكتب الآية أو الحديث الذي يذكرك بهذه النعمة..."
              style={{ lineHeight: '1.6', fontSize: '14px' }}
            />
          </div>

          {/* Proof Source */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} color="var(--color-primary)" />
              <span>المصدر أو المرجع:</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={proofSource}
              onChange={(e) => setProofSource(e.target.value)}
              placeholder="مثال: سورة النحل: 18 أو صحيح مسلم"
            />
          </div>

          {/* User Personal Note */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label">
              <span>خاطرة أو دعاء شخصي خاص بك (اختياري):</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="أضف خاطرة أو موقفا شخصيا مر بك واستشعرت فيه هذه النعمة..."
              style={{ lineHeight: '1.6', fontSize: '13px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="submit"
              className="form-submit-btn"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={18} />
                  <span>تم حفظ صياغتك بنجاح</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>حفظ الصياغة الخاصة</span>
                </>
              )}
            </button>

            {isCustomized && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-card-subtle)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="استعادة النص الأصلي للنعمة"
              >
                <RotateCcw size={15} />
                <span>استعادة الأصلي</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
