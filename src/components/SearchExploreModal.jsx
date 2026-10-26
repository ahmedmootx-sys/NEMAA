import React, { useState } from 'react';
import { X, Search, ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '../data/blessings';

export default function SearchExploreModal({ isOpen, onClose, allBlessings, onSelectBlessing }) {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  if (!isOpen) return null;

  const filtered = allBlessings.filter(b => {
    const matchesCat = selectedCat === 'all' || b.category === selectedCat;
    const matchesQuery = !query.trim() || 
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.reflection.toLowerCase().includes(query.toLowerCase()) ||
      (b.proof && b.proof.toLowerCase().includes(query.toLowerCase())) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Search size={22} color="var(--color-gold)" />
            <span>تصفح وابحث في النعم ({filtered.length})</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="ابحث بالاسم، الكلمة، المعنى، أو الوسم (مثال: نوم، أمان، ستر، صحة)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Quick Category filter buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '10px', 
          marginBottom: '16px',
          scrollbarWidth: 'none'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedCat === cat.id ? 'var(--color-gold)' : 'var(--border-subtle)',
                background: selectedCat === cat.id ? 'var(--color-gold-light)' : 'var(--surface-card-subtle)',
                color: selectedCat === cat.id ? 'var(--color-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: selectedCat === cat.id ? 700 : 500
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* List of results */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          maxHeight: '52vh', 
          overflowY: 'auto' 
        }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <p>لم يتم العثور على نتائج تطابق بحثك.</p>
            </div>
          ) : (
            filtered.map(b => (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBlessing(b);
                  onClose();
                }}
                style={{
                  background: 'var(--surface-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'border var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 700 }}>
                      {b.categoryName}
                    </span>
                    {b.isCustom && (
                      <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>• خاصة بك</span>
                    )}
                  </div>
                  <h4 style={{ 
                    fontFamily: 'var(--font-arabic-heading)', 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--text-heading)',
                    marginBottom: '3px'
                  }}>
                    {b.title}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {b.reflection}
                  </p>
                </div>
                <ArrowLeft size={16} color="var(--text-faint)" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
