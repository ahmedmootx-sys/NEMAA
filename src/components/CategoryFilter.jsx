import React from 'react';

export default function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-filter-bar" role="tablist" aria-label="تصنيفات النعم">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-pill ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            {cat.count > 0 && (
              <span style={{
                fontSize: '11px',
                opacity: 0.85,
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--badge-bg)',
                borderRadius: '9999px',
                padding: '1px 6px',
                marginLeft: '-2px'
              }}>
                {cat.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
