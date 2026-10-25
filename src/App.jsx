import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import BlessingCard from './components/BlessingCard';
import GratitudeInteractions from './components/GratitudeInteractions';
import FavoritesDrawer from './components/FavoritesDrawer';
import GratitudeJournalDrawer from './components/GratitudeJournalDrawer';
import NotificationModal from './components/NotificationModal';
import AddBlessingModal from './components/AddBlessingModal';
import SearchExploreModal from './components/SearchExploreModal';
import ShareModal from './components/ShareModal';
import { INITIAL_BLESSINGS, CATEGORIES } from './data/blessings';
import { exportBlessingAsImage } from './utils/cardExporter';
import { Award, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Theme State (Day / Night)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nemaa_theme') || 'day';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nemaa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'night' ? 'day' : 'night');
  };

  // 2. Custom Blessings State
  const [customBlessings, setCustomBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_custom_blessings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Combined Blessings Pool
  const allBlessings = useMemo(() => {
    return [...customBlessings, ...INITIAL_BLESSINGS];
  }, [customBlessings]);

  // 3. Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredBlessings = useMemo(() => {
    if (activeCategory === 'all') return allBlessings;
    return allBlessings.filter(b => b.category === activeCategory);
  }, [allBlessings, activeCategory]);

  // Dynamic Category Counts
  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map(cat => {
      if (cat.id === 'all') {
        return { ...cat, count: allBlessings.length };
      }
      const count = allBlessings.filter(b => b.category === cat.id).length;
      return { ...cat, count };
    });
  }, [allBlessings]);

  // 4. Current Blessing Navigation (Random blessing on every app open)
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_custom_blessings');
      const customCount = saved ? JSON.parse(saved).length : 0;
      const total = INITIAL_BLESSINGS.length + customCount;
      return total > 0 ? Math.floor(Math.random() * total) : 0;
    } catch {
      return Math.floor(Math.random() * INITIAL_BLESSINGS.length);
    }
  });
  const [animatingKey, setAnimatingKey] = useState(1);

  // Keep currentIndex in bounds when category changes
  useEffect(() => {
    setCurrentIndex(0);
    setAnimatingKey(Date.now());
  }, [activeCategory]);

  const currentBlessing = filteredBlessings[currentIndex] || filteredBlessings[0];

  const handleNext = useCallback(() => {
    if (filteredBlessings.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % filteredBlessings.length);
    setAnimatingKey(Date.now());
  }, [filteredBlessings]);

  const handlePrev = useCallback(() => {
    if (filteredBlessings.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + filteredBlessings.length) % filteredBlessings.length);
    setAnimatingKey(Date.now());
  }, [filteredBlessings]);

  const handleRandom = useCallback(() => {
    if (filteredBlessings.length <= 1) return;
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * filteredBlessings.length);
    } while (nextIdx === currentIndex && filteredBlessings.length > 1);
    setCurrentIndex(nextIdx);
    setAnimatingKey(Date.now());
  }, [filteredBlessings, currentIndex]);

  // 5. Favorites Management
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem('nemaa_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = (id) => {
    setFavorites(prev => {
      const updated = prev.filter(item => item !== id);
      localStorage.setItem('nemaa_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllFavorites = () => {
    if (window.confirm('هل تود مسح جميع النعم من المفضلة؟')) {
      setFavorites([]);
      localStorage.removeItem('nemaa_favorites');
    }
  };

  const favoriteBlessingsList = useMemo(() => {
    return allBlessings.filter(b => favorites.includes(b.id));
  }, [allBlessings, favorites]);

  // 6. Daily Gratitude Counter & Streak Tracking
  const [dailyStats, setDailyStats] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const saved = localStorage.getItem('nemaa_daily_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) {
          return parsed;
        } else {
          // Check streak: was yesterday active?
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const continuedStreak = parsed.date === yesterdayStr && parsed.count > 0 ? (parsed.streak || 1) + 1 : 1;
          const newStats = { date: todayStr, count: 0, streak: continuedStreak };
          localStorage.setItem('nemaa_daily_stats', JSON.stringify(newStats));
          return newStats;
        }
      }
    } catch {
      // fallback
    }
    return { date: todayStr, count: 0, streak: 1 };
  });

  const incrementGratitude = () => {
    setDailyStats(prev => {
      const todayStr = new Date().toISOString().split('T')[0];
      const updated = {
        ...prev,
        date: todayStr,
        count: prev.count + 1
      };
      localStorage.setItem('nemaa_daily_stats', JSON.stringify(updated));
      return updated;
    });
  };

  // 7. Add Custom Blessing
  const handleAddCustomBlessing = (newBlessing) => {
    const updated = [newBlessing, ...customBlessings];
    setCustomBlessings(updated);
    localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
    // Immediately display the newly added blessing
    setActiveCategory('all');
    setCurrentIndex(0);
    setAnimatingKey(Date.now());
  };

  // 8. Select Blessing from Modal
  const handleSelectBlessing = (blessing) => {
    setActiveCategory('all');
    const idx = allBlessings.findIndex(b => b.id === blessing.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
    setAnimatingKey(Date.now());
  };

  // 9. Modals & Drawers State
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [blessingToShare, setBlessingToShare] = useState(null);

  const handleOpenShare = (blessing) => {
    setBlessingToShare(blessing || currentBlessing);
    setIsShareOpen(true);
  };

  const handleDownloadImage = async (blessing, options = {}) => {
    const target = blessing || currentBlessing;
    if (target) {
      const exportOptions = {
        theme: options.theme || (theme === 'night' ? 'midnight' : 'olive'),
        ratio: options.ratio || 'story'
      };
      await exportBlessingAsImage(target, exportOptions);
    }
  };

  // 10. Global Keyboard Navigation (Space for random, Left/Right for prev/next)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (isFavoritesOpen || isJournalOpen || isNotificationsOpen || isAddModalOpen || isSearchOpen || isShareOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleRandom();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRandom, handleNext, handlePrev, isFavoritesOpen, isJournalOpen, isNotificationsOpen, isAddModalOpen, isSearchOpen, isShareOpen]);

  // Milestone title based on dailyCount
  const getMilestoneLabel = () => {
    if (dailyStats.count >= 20) return 'حامدٌ شاكرٌ وممتن 🌟';
    if (dailyStats.count >= 10) return 'ذاكرٌ لنعم ربه 🌿';
    if (dailyStats.count >= 5) return 'قلبٌ مستشعر للفضل 🤍';
    return null;
  };

  return (
    <div className="nemaa-app-root">
      {/* Top Header */}
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        dailyCount={dailyStats.count}
        streak={dailyStats.streak}
      />

      <main className="container" style={{ paddingTop: '20px', paddingBottom: '70px' }}>
        {/* Category Filter Tabs */}
        <CategoryFilter
          categories={categoriesWithCounts}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Daily Gratitude Status Banner */}
        <div className="stats-banner">
          <div className="stats-item">
            <Sparkles size={16} color="var(--color-gold)" />
            <span>تأملاتك وحمدك اليوم:</span>
            <span className="stats-number">{dailyStats.count}</span>
            <span style={{ fontSize: '12px' }}>مرات</span>
          </div>

          {getMilestoneLabel() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '13px' }}>
              <Award size={16} />
              <span>{getMilestoneLabel()}</span>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              «وَقَلِيلٌ مِّنْ عِبَادِيَ الشَّكُورُ»
            </span>
          )}
        </div>

        {/* The Central Blessing Card */}
        <BlessingCard
          blessing={currentBlessing}
          isFavorite={currentBlessing ? favorites.includes(currentBlessing.id) : false}
          onToggleFavorite={toggleFavorite}
          onShare={handleOpenShare}
          onDownloadImage={handleDownloadImage}
          animatingKey={animatingKey}
        />

        {/* Gratitude & Navigation Actions */}
        <GratitudeInteractions
          onNextBlessing={handleNext}
          onPrevBlessing={handlePrev}
          onRandomBlessing={handleRandom}
          onIncrementGratitude={incrementGratitude}
          currentBlessing={currentBlessing}
          onDownloadImage={handleDownloadImage}
          onShare={handleOpenShare}
          dailyCount={dailyStats.count}
        />

        {/* Spiritual Quote Footer Note */}
        <div style={{ textAlign: 'center', marginTop: '30px', padding: '0 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <p style={{ fontFamily: 'var(--font-arabic-body)', fontSize: '17px', color: 'var(--color-primary)', marginBottom: '4px' }}>
            ﴿وَآتَاكُم مِّن كُلِّ مَا سَأَلْتُمُوهُ ۚ وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا﴾
          </p>
          <p style={{ color: 'var(--text-faint)' }}>
            منصة نِعْمَة — تذكّر لتشكر • اضغط مسافة للتبديل السريع بين النعم
          </p>
        </div>
      </main>

      {/* Modals & Drawers */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoritesList={favoriteBlessingsList}
        onSelectBlessing={handleSelectBlessing}
        onRemoveFavorite={removeFavorite}
        onClearAllFavorites={clearAllFavorites}
      />

      <GratitudeJournalDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AddBlessingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBlessing={handleAddCustomBlessing}
      />

      <SearchExploreModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allBlessings={allBlessings}
        onSelectBlessing={handleSelectBlessing}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        blessing={blessingToShare}
        onDownloadImage={handleDownloadImage}
      />
    </div>
  );
}
