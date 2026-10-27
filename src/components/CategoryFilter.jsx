import React from 'react';
import { 
  Layers, 
  Globe,
  ShieldCheck, 
  Activity, 
  Compass, 
  Users, 
  Sun 
} from 'lucide-react';

const CATEGORY_ICONS = {
  all: Layers,
  shared: Globe,
  hidden: ShieldCheck,
  body: Activity,
  spiritual: Compass,
  family: Users,
  daily: Sun
};

export default function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-filter-bar" role="tablist" aria-label="تصنيفات النعم">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const IconComponent = CATEGORY_ICONS[cat.id] || Layers;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-pill ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <IconComponent 
              size={14} 
              color={isActive ? "currentColor" : "var(--color-primary)"} 
              style={{ flexShrink: 0 }}
            />
            <span>{cat.label}</span>
            {cat.count > 0 && (
              <span style={{
                fontSize: '11px',
                opacity: 0.9,
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
