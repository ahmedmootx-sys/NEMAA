import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen } from 'lucide-react';
import { CATEGORIES } from '../data/blessings';

export default function AddBlessingModal({ isOpen, onClose, onAddBlessing }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('hidden');
  const [reflection, setReflection] = useState('');
  const [proof, setProof] = useState('');
  const [proofSource, setProofSource] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !reflection.trim()) {
      setError('يرجى كتابة عنوان النعمة والتدبّر');
      return;
    }

    const catObj = CATEGORIES.find(c => c.id === category);
    const tags = tagsStr
      .split(/[,،\s]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean);

    const newBlessing = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      category: category,
      categoryName: catObj ? catObj.label : 'نعم خاصة',
      reflection: reflection.trim(),
      proof: proof.trim() ? (proof.includes('«') || proof.includes('﴿') ? proof.trim() : `«${proof.trim()}»`) : '',
      proofSource: proofSource.trim(),
      proofType: 'wisdom',
      tags: tags.length > 0 ? tags : ['نعمة_خاصة', 'امتنان'],
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    onAddBlessing(newBlessing);
    onClose();

    // Reset form
    setTitle('');
    setCategory('hidden');
    setReflection('');
    setProof('');
    setProofSource('');
    setTagsStr('');
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={22} color="var(--color-gold)" />
            <span>إضافة نعمة خاصة بك</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(229, 62, 62, 0.12)',
            color: '#E53E3E',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">عنوان النعمة *</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: نعمة نجاح ابني، نعمة شفاء الوالدة، نعمة تيسير وظيفة..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">التصنيف *</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reflection */}
          <div className="form-group">
            <label className="form-label">التدبّر وعِبرة النعمة *</label>
            <textarea
              className="form-textarea"
              placeholder="اكتب تأملك ومشاعرك حول هذه النعمة.. كيف غيرت نظرتك وماذا تعني لك؟"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              required
            />
          </div>

          {/* Proof / Quote */}
          <div className="form-group">
            <label className="form-label">آية، حديث، أو مقولة تلهمك (اختياري)</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: «وَمَا بِكُم مِّن نِّعْمَةٍ فَمِنَ اللَّهِ»"
              value={proof}
              onChange={e => setProof(e.target.value)}
            />
          </div>

          {/* Proof Source */}
          <div className="form-group">
            <label className="form-label">المصدر أو المرجع (اختياري)</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: سورة النحل: 53 أو صحيح البخاري"
              value={proofSource}
              onChange={e => setProofSource(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">وسوم للبحث (مفصولة بفاصلة)</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: شفاء, فرحة, توكل, عائلة"
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
            />
          </div>

          <button type="submit" className="form-submit-btn">
            حفظ النعمة وإضافتها للمنصة ✨
          </button>
        </form>
      </div>
    </div>
  );
}
