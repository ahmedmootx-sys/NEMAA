import React, { useState } from 'react';
import { X, Heart, Trash2, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

export default function FavoritesDrawer({
  isOpen,
  onClose,
  favoritesList,
  onSelectBlessing,
  onRemoveFavorite,
  onClearAllFavorites
}) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filtered = favoritesList.filter(b => 
    b.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    b.reflection.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (b.categoryName && b.categoryName.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Heart size={22} color="#E53E3E" fill="#E53E3E" />
            <span>النعم المحفوظة ({favoritesList.length})</span>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input if user has multiple favorites */}
        {favoritesList.length > 3 && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="ابحث في النعم المحفوظة..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        )}

        {/* List of Favorites */}
        {favoritesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Heart size={44} color="var(--border-gold)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
            <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>لم تحفظ أي نِعَم بعد</p>
            <p style={{ fontSize: '14px' }}>اضغط على أيقونة القلب على أي بطاقة لحفظها هنا والرجوع إليها متى شئت.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: 'var(--surface-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => {
                  onSelectBlessing(item);
                  onClose();
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 700 }}>
                      {item.categoryName}
                    </span>
                    {item.isCustom && (
                      <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>• خاصة</span>
                    )}
                  </div>
                  <h4 style={{ 
                    fontFamily: 'var(--font-arabic-heading)', 
                    fontSize: '17px', 
                    fontWeight: 700, 
                    color: 'var(--text-heading)',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.reflection}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="card-action-btn"
                    title="حذف من المفضلة"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item.id);
                    }}
                  >
                    <Trash2 size={16} color="#E53E3E" />
                  </button>
                  <ArrowLeft size={16} color="var(--text-faint)" />
                </div>
              </div>
            ))}

            {favoritesList.length > 2 && (
              <button
                onClick={onClearAllFavorites}
                style={{
                  marginTop: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-faint)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '8px'
                }}
              >
                مسح جميع المحفوظات
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
