import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import BlessingCard from './components/BlessingCard';
import GratitudeInteractions from './components/GratitudeInteractions';
import FavoritesDrawer from './components/FavoritesDrawer';
import GratitudeJournalDrawer from './components/GratitudeJournalDrawer';
import NotificationModal from './components/NotificationModal';
import FocusReflectionModal from './components/FocusReflectionModal';
import AddBlessingModal from './components/AddBlessingModal';
import SearchExploreModal from './components/SearchExploreModal';
import ShareModal from './components/ShareModal';
import ShareAppModal from './components/ShareAppModal';
import LanguageSelectModal from './components/LanguageSelectModal';
import EditBlessingModal from './components/EditBlessingModal';
import EditSharedBlessingModal from './components/EditSharedBlessingModal';
import InstallAppToast from './components/InstallAppToast';
import { INITIAL_BLESSINGS, CATEGORIES } from './data/blessings';
import { exportBlessingAsImage } from './utils/cardExporter';
import { TRANSLATIONS } from './i18n/translations';
import { Award, Sparkles, X, MessageSquare, Scroll, Settings } from 'lucide-react';
import { 
  subscribeToLivePraises,
  fetchAllPersistedPraises,
  recordBlessingPraise,
  fetchSharedBlessings, 
  subscribeToSharedBlessings, 
  deleteSharedBlessing, 
  updateSharedBlessing, 
  incrementBlessingPraises, 
  simpleHash,
  recordAdminDeletedBlessing,
  fetchAdminDeletedBlessings,
  subscribeToAdminDeletedBlessings
} from './supabaseClient';
import confetti from 'canvas-confetti';
import { audioEngine } from './utils/audioEngine';
import OnboardingTour from './components/OnboardingTour';
import AppGuideModal from './components/AppGuideModal';
import ReportModal from './components/ReportModal';
import AdminScreen from './components/AdminScreen';
import SettingsScreen from './components/SettingsScreen';
import AppMissionModal from './components/AppMissionModal';
import FeedbackModal from './components/FeedbackModal';

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

  // Font Mode State (Modern Cairo/Tajawal vs Classic Calligraphy)
  const [fontMode, setFontMode] = useState(() => {
    return localStorage.getItem('nemaa_font_mode') || 'modern';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontMode);
    try {
      localStorage.setItem('nemaa_font_mode', fontMode);
    } catch {}
  }, [fontMode]);

  const toggleFontMode = () => {
    setFontMode(prev => prev === 'modern' ? 'classic' : 'modern');
  };

  // Unified Settings, App Mission & Feedback Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Language & Localization State
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('nemaa_lang') || 'ar';
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(() => {
    return !localStorage.getItem('nemaa_lang');
  });

  const [hasLanguageChosen, setHasLanguageChosen] = useState(() => {
    return Boolean(localStorage.getItem('nemaa_lang'));
  });

  const [tourCompleted, setTourCompleted] = useState(() => {
    return Boolean(localStorage.getItem('nemaa_tour_seen'));
  });

  const [isShareAppModalOpen, setIsShareAppModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [blessingToReport, setBlessingToReport] = useState(null);

  // Hidden Admin Management Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Admin permanently deleted blessing IDs (filtered out from entire app)
  const [adminDeletedIds, setAdminDeletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_admin_deleted_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Praises count tracking for each blessing (persisted locally and synced with Supabase)
  const [blessingPraises, setBlessingPraises] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_blessing_praises');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // User's own published blessings IDs (to allow deletion of what they shared)
  const [myPublishedIds, setMyPublishedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_my_published_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Shared Blessings from Supabase
  const [sharedBlessings, setSharedBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_shared_blessings_cache');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const valid = parsed.filter(b => b && (b.title || '').trim() && (b.reflection || '').trim());
      if (valid.length !== parsed.length) {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  });

  // 3. Custom Blessings State (New blessings created by user)
  const [customBlessings, setCustomBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_custom_blessings');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const valid = parsed.filter(b => b && (b.title || '').trim() && (b.reflection || '').trim());
      if (valid.length !== parsed.length) {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  });

  // Persistent User's Own Published Blessings (Preserves full ownership, praise counts & edits)
  const [myPublishedBlessings, setMyPublishedBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_my_published_blessings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const custom = localStorage.getItem('nemaa_custom_blessings');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(myPublishedBlessings));
    } catch {}
  }, [myPublishedBlessings]);

  // User-Customized / Rephrased Blessings State (Edits to existing blessings)
  const [customizedBlessings, setCustomizedBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_customized_blessings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // PWA Install Deferred Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [livePraiseToast, setLivePraiseToast] = useState('');

  // Stable references for async callbacks and listeners
  const currentLangRef = useRef(currentLang);
  currentLangRef.current = currentLang;
  const myPublishedBlessingsRef = useRef(myPublishedBlessings);
  myPublishedBlessingsRef.current = myPublishedBlessings;
  const lastPraiseNotificationRef = useRef(0);

  // Load persisted praises on mount and subscribe to live broadcasts
  useEffect(() => {
    fetchAllPersistedPraises().then(remoteMap => {
      if (remoteMap && Object.keys(remoteMap).length > 0) {
        setBlessingPraises(prev => ({ ...prev, ...remoteMap }));
      }
    }).catch(() => {});

    const unsubPraises = subscribeToLivePraises((payload) => {
      if (!payload) return;
      const strId = String(payload.blessingId || '');
      const title = (payload.blessingTitle || '').trim();
      const count = Number(payload.newCount) || 1;

      // 1. Immediately update praises in state so the counter moves live
      setBlessingPraises(prev => {
        const next = { ...prev };
        if (strId) next[strId] = count;
        if (title) next[title] = count;
        return next;
      });

      // 2. Check if this blessing belongs to current user via ref (always up to date)
      const isMyBlessing = myPublishedBlessingsRef.current.some(
        b => (strId && String(b.id) === strId) || (title && b.title === title)
      );

      // 3. Gentle Throttled Toast (min 12s gap to prevent screen spam, author always alerted)
      const now = Date.now();
      if (isMyBlessing || now - lastPraiseNotificationRef.current >= 12000) {
        lastPraiseNotificationRef.current = now;
        const authorMention = payload.author && payload.author !== 'محب للخير' ? ` (بقلم: ${payload.author})` : '';
        const msg = isMyBlessing
          ? (currentLangRef.current === 'ar' 
              ? `❤️ بشرى: حَمَدَ شخصٌ الله للتو على نعمتك «${title}»!` 
              : `❤️ Someone gave thanks for your blessing "${title}"!`)
          : (currentLangRef.current === 'ar'
              ? `🤲 رَطَّبَ أحدهم لسانه بالحمد الآن على «${title}»${authorMention}`
              : `🤲 Someone gave thanks for "${title}"`);

        setLivePraiseToast(msg);
        setTimeout(() => setLivePraiseToast(''), 4500);
      }
    });

    return () => {
      if (typeof unsubPraises === 'function') unsubPraises();
    };
  }, []);

  // Automatically start tour for first-time visitors who already have language selected
  useEffect(() => {
    const hasLang = localStorage.getItem('nemaa_lang');
    const hasSeenTour = localStorage.getItem('nemaa_tour_seen');
    if (hasLang && !hasSeenTour) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Purge legacy dummy test blessings from local storage
  useEffect(() => {
    try {
      const purgeLegacy = (key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(b => b && b.title !== 'نعمة السكينة وحسن الظن بالله');
            if (filtered.length !== list.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
            }
            return filtered;
          }
        }
        return null;
      };

      const cleanedCustom = purgeLegacy('nemaa_custom_blessings');
      if (cleanedCustom) {
        setCustomBlessings(cleanedCustom);
      }

      const cleanedShared = purgeLegacy('nemaa_shared_blessings_cache');
      if (cleanedShared) {
        setSharedBlessings(cleanedShared);
      }
    } catch {}
  }, []);

  const handleSelectLanguage = (newLang) => {
    setCurrentLang(newLang);
    localStorage.setItem('nemaa_lang', newLang);
    setIsLanguageModalOpen(false);
    setHasLanguageChosen(true);

    if (!localStorage.getItem('nemaa_tour_seen')) {
      setTimeout(() => {
        setIsTourOpen(true);
      }, 700);
    }
  };

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    handleSelectLanguage(nextLang);
  };

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [currentLang]);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Fetch from Supabase and subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;

    async function loadRemoteBlessings() {
      try {
        const remote = await fetchSharedBlessings();
        if (isMounted && Array.isArray(remote)) {
          setSharedBlessings(remote);
          try {
            localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(remote));
          } catch {}
        }
      } catch (err) {
        console.warn('Failed to load shared blessings from Supabase:', err);
      }
    }

    async function loadAdminDeleted() {
      try {
        const remoteDeleted = await fetchAdminDeletedBlessings();
        if (isMounted && Array.isArray(remoteDeleted) && remoteDeleted.length > 0) {
          setAdminDeletedIds(prev => {
            const identifiers = remoteDeleted.map(d => d.blessing_title || d.id).filter(Boolean);
            const combined = [...new Set([...prev, ...identifiers])];
            try {
              localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      } catch (err) {
        console.warn('Failed to load admin deleted blessings from Supabase:', err);
      }
    }

    loadRemoteBlessings();
    loadAdminDeleted();

    // Realtime listener for new and deleted shared blessings
    const unsubscribeBlessings = subscribeToSharedBlessings(
      (newBlessing) => {
        if (!isMounted) return;
        setSharedBlessings(prev => {
          if (prev.some(b => String(b.id) === String(newBlessing.id) || (b.title === newBlessing.title && b.reflection === newBlessing.reflection))) {
            return prev;
          }
          const updated = [newBlessing, ...prev];
          try {
            localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
          } catch {}

          setToastMessage(currentLangRef.current === 'ar' ? 'نعمة جديدة أضيفت للتو من أحد المتدبرين ✨' : 'A new blessing was just shared by the community ✨');
          setTimeout(() => setToastMessage(''), 5000);

          return updated;
        });
      },
      (deletedRow) => {
        if (!isMounted || !deletedRow) return;
        setSharedBlessings(prev => {
          const updated = prev.filter(b => {
            if (deletedRow.id && String(b.id) === String(deletedRow.id)) return false;
            if (deletedRow.title && deletedRow.reflection && b.title === deletedRow.title && b.reflection === deletedRow.reflection) return false;
            if (deletedRow.title && b.title === deletedRow.title) return false;
            return true;
          });
          try {
            localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      },
      (updatedBlessing, oldRow) => {
        if (!isMounted || !updatedBlessing) return;
        setSharedBlessings(prev => {
          const updated = prev.map(b => {
            const isMatch = (oldRow && oldRow.id && String(b.id) === String(oldRow.id)) ||
                            (oldRow && oldRow.title && b.title === oldRow.title) ||
                            (String(b.id) === String(updatedBlessing.id)) ||
                            (b.title === updatedBlessing.title);
            if (isMatch) {
              return { ...b, ...updatedBlessing };
            }
            return b;
          });
          try {
            localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    );

    // Realtime listener for blessings deleted by admin (applied instantly to all users)
    const unsubscribeAdminDeleted = subscribeToAdminDeletedBlessings(
      (newDeleted) => {
        if (!isMounted || !newDeleted) return;
        const identifier = (newDeleted.blessing_title || newDeleted.id || '').trim();
        if (!identifier) return;

        setAdminDeletedIds(prev => {
          if (prev.includes(identifier)) return prev;
          const updated = [...prev, identifier];
          try {
            localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // Also remove from shared blessings immediately if present
        setSharedBlessings(prev => prev.filter(b => b.title !== identifier && String(b.id) !== identifier));
      },
      (restored) => {
        if (!isMounted || !restored) return;
        const identifier = (restored.blessing_title || restored.id || '').trim();
        if (!identifier) return;

        setAdminDeletedIds(prev => {
          const updated = prev.filter(id => id !== identifier);
          try {
            localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribeBlessings === 'function') unsubscribeBlessings();
      if (typeof unsubscribeAdminDeleted === 'function') unsubscribeAdminDeleted();
    };
  }, []);

  const handleSaveCustomization = (blessingId, customizedData) => {
    const updated = {
      ...customizedBlessings,
      [blessingId]: customizedData
    };
    setCustomizedBlessings(updated);
    localStorage.setItem('nemaa_customized_blessings', JSON.stringify(updated));
  };

  const handleResetCustomization = (blessingId) => {
    const updated = { ...customizedBlessings };
    delete updated[blessingId];
    setCustomizedBlessings(updated);
    localStorage.setItem('nemaa_customized_blessings', JSON.stringify(updated));
  };

  // Combined Blessings Pool with Strict Deduplication (Prevents duplicate cards)
  const allBlessings = useMemo(() => {
    const pool = [];
    const seenTitles = new Set();
    const seenIds = new Set();

    const addUnique = (b) => {
      if (!b) return;
      const cleanTitle = (b.title || '').trim();
      const cleanReflection = (b.reflection || '').trim();
      if (!cleanTitle || !cleanReflection) return;
      const strId = String(b.id || '');

      // Check admin deleted
      if (adminDeletedIds.includes(strId) || adminDeletedIds.includes(cleanTitle)) {
        return;
      }

      // Check uniqueness: deduplicate by id OR by (title + initial reflection preview)
      const sig = cleanTitle.toLowerCase();
      if (seenIds.has(strId) || seenTitles.has(sig)) {
        return;
      }

      seenIds.add(strId);
      seenTitles.add(sig);

      // Check if user has personal local customizations
      if (customizedBlessings[strId]) {
        pool.push({
          ...b,
          ...customizedBlessings[strId],
          isCustomized: true
        });
      } else {
        pool.push(b);
      }
    };

    // 1. First shared blessings (from Supabase, newest first)
    sharedBlessings.forEach(addUnique);

    // 2. User's own published blessings (offline resilient)
    myPublishedBlessings.forEach(addUnique);

    // 3. Custom blessings
    customBlessings.forEach(addUnique);

    // 4. Initial platform catalog
    INITIAL_BLESSINGS.forEach(addUnique);

    return pool;
  }, [sharedBlessings, myPublishedBlessings, customBlessings, customizedBlessings, adminDeletedIds]);

  // Compute live praise count for any blessing (offline durable + remote sync)
  const getBlessingPraises = useCallback((blessing) => {
    if (!blessing) return 0;
    const strId = String(blessing.id);
    if (blessingPraises[strId] !== undefined) {
      return blessingPraises[strId];
    }
    if (typeof blessing.praisesCount === 'number') {
      return blessing.praisesCount;
    }
    // Newly published / shared blessings strictly start at 0 (never 38!)
    if (blessing.isShared || blessing.isCustom || strId.startsWith('sb_') || strId.startsWith('custom_') || strId.startsWith('pb_')) {
      return 0;
    }
    // Authentic deterministic baseline ONLY for initial built-in blessings
    const hashNum = parseInt(simpleHash(blessing.title || strId), 36) || 42;
    return (hashNum % 140) + 18;
  }, [blessingPraises]);

  // 3. Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredBlessings = useMemo(() => {
    if (activeCategory === 'all') return allBlessings;
    if (activeCategory === 'shared') return allBlessings.filter(b => b.isShared);
    return allBlessings.filter(b => b.category === activeCategory);
  }, [allBlessings, activeCategory]);

  // Dynamic Category Counts
  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map(cat => {
      if (cat.id === 'all') {
        return { ...cat, count: allBlessings.length };
      }
      if (cat.id === 'shared') {
        const count = allBlessings.filter(b => b.isShared).length;
        return { ...cat, count };
      }
      const count = allBlessings.filter(b => b.category === cat.id).length;
      return { ...cat, count };
    });
  }, [allBlessings]);

  // 4. Current Blessing Navigation (Distinct Random blessing on every app open)
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_custom_blessings');
      const customList = saved ? JSON.parse(saved) : [];
      const pool = [...customList, ...INITIAL_BLESSINGS];
      const lastSeenId = sessionStorage.getItem('nemaa_last_seen_blessing_id');

      if (pool.length > 1 && lastSeenId) {
        const differentIndices = [];
        pool.forEach((b, i) => {
          if (String(b.id) !== String(lastSeenId)) {
            differentIndices.push(i);
          }
        });
        if (differentIndices.length > 0) {
          const chosenIdx = differentIndices[Math.floor(Math.random() * differentIndices.length)];
          sessionStorage.setItem('nemaa_last_seen_blessing_id', String(pool[chosenIdx].id));
          return chosenIdx;
        }
      }

      const randomIdx = Math.floor(Math.random() * pool.length);
      if (pool[randomIdx]) {
        sessionStorage.setItem('nemaa_last_seen_blessing_id', String(pool[randomIdx].id));
      }
      return randomIdx;
    } catch {
      return Math.floor(Math.random() * INITIAL_BLESSINGS.length);
    }
  });

  const [animatingKey, setAnimatingKey] = useState(1);
  const isFirstMount = useRef(true);
  const prevCategory = useRef(activeCategory);

  // Keep currentIndex in bounds when category changes (without resetting on initial mount!)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (prevCategory.current !== activeCategory) {
      prevCategory.current = activeCategory;
      setCurrentIndex(0);
      setAnimatingKey(Date.now());
    }
  }, [activeCategory]);

  const currentBlessing = filteredBlessings[currentIndex] || filteredBlessings[0];

  // Save current blessing ID in session so reload avoids repeating it
  useEffect(() => {
    if (currentBlessing?.id) {
      sessionStorage.setItem('nemaa_last_seen_blessing_id', String(currentBlessing.id));
    }
  }, [currentBlessing?.id]);

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

    // Increment praise counter live for current blessing (both shared and built-in)
    if (currentBlessing) {
      const strId = String(currentBlessing.id || '');
      const title = (currentBlessing.title || '').trim();
      const currentCount = getBlessingPraises(currentBlessing);
      const newCount = currentCount + 1;

      // 1. Optimistic instant local update
      setBlessingPraises(prev => {
        const updated = { ...prev };
        if (strId) updated[strId] = newCount;
        if (title) updated[title] = newCount;
        try {
          localStorage.setItem('nemaa_blessing_praises', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 2. Broadcast & persist live to Supabase for all users without delay!
      recordBlessingPraise(
        strId,
        title,
        newCount,
        currentBlessing.author || ''
      ).catch(() => {});
    }
  };

  // 7. Publish Shared Blessing to Supabase & Local State (Ensures unique ID & zero praise baseline)
  const handleBlessingPublished = (newBlessing, meta = {}) => {
    const stableId = newBlessing.id || `pb_${Date.now()}_${simpleHash(newBlessing.title || '').slice(0, 6)}`;
    const fullBlessing = {
      ...newBlessing,
      id: stableId,
      isShared: true,
      praisesCount: 0
    };

    // Prepend to shared blessings
    setSharedBlessings(prev => {
      const filtered = prev.filter(b => b.id !== stableId && b.title !== fullBlessing.title);
      const updated = [fullBlessing, ...filtered];
      try {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Prepend to user's myPublishedBlessings list (Keeps persistent ownership)
    setMyPublishedBlessings(prev => {
      const filtered = prev.filter(b => b.id !== stableId && b.title !== fullBlessing.title);
      const updated = [fullBlessing, ...filtered];
      try {
        localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also persist in customBlessings for offline durability
    setCustomBlessings(prev => {
      const filtered = prev.filter(b => b.id !== stableId && b.title !== fullBlessing.title);
      const updated = [fullBlessing, ...filtered];
      try {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Register in myPublishedIds
    setMyPublishedIds(prev => {
      const updated = [stableId, ...prev.filter(id => id !== stableId)];
      try {
        localStorage.setItem('nemaa_my_published_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Immediately display the newly added blessing
    setActiveCategory('all');
    setCurrentIndex(0);
    setAnimatingKey(Date.now());

    // Show friendly success toast notification
    const successMsg = meta.successMessage || (currentLang === 'ar' ? 'تمت إضافة نعمتك بنجاح وستظهر للجميع!' : 'Your blessing has been published successfully!');
    setToastMessage(successMsg);
    setTimeout(() => {
      setToastMessage('');
    }, 5000);

    // Audio chime & celebration
    try {
      audioEngine.playGratitudeChime();
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#2C4A3E', '#F5D77F', '#528974', '#FFFFFF']
      });
    } catch {}
  };

  // Delete a user's own published blessing from Settings -> My Published Blessings
  const handleDeletePublishedBlessing = async (blessing) => {
    if (!blessing) return;
    const confirmPrompt = currentLang === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف نعمة «${blessing.title}»؟` 
      : `Are you sure you want to remove "${blessing.title}"?`;
    if (!window.confirm(confirmPrompt)) return;

    const strId = String(blessing.id);
    const title = (blessing.title || '').trim();

    // 1. Remove from myPublishedBlessings
    setMyPublishedBlessings(prev => {
      const updated = prev.filter(b => String(b.id) !== strId && b.title !== title);
      try {
        localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove from shared blessings
    setSharedBlessings(prev => {
      const updated = prev.filter(b => String(b.id) !== strId && b.title !== title);
      try {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Remove from custom blessings
    setCustomBlessings(prev => {
      const updated = prev.filter(b => String(b.id) !== strId && b.title !== title);
      try {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Remote delete from Supabase
    try {
      await deleteSharedBlessing(blessing);
    } catch {}

    setToastMessage(currentLang === 'ar' ? 'تم حذف النعمة بنجاح' : 'Blessing deleted successfully');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Delete a user's own published blessing
  const handleDeletePublished = async (blessing) => {
    if (!blessing) return;
    const confirmPrompt = currentLang === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف نعمة «${blessing.title}» من النعم المنشورة للجميع؟` 
      : `Are you sure you want to remove "${blessing.title}" from published blessings?`;
    if (!window.confirm(confirmPrompt)) return;

    const strId = String(blessing.id);

    // Remove from local published IDs
    setMyPublishedIds(prev => {
      const updated = prev.filter(id => id !== strId);
      try {
        localStorage.setItem('nemaa_my_published_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Remove from shared blessings state & cache
    setSharedBlessings(prev => {
      const updated = prev.filter(b => String(b.id) !== strId);
      try {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Remove from custom blessings state & storage
    setCustomBlessings(prev => {
      const updated = prev.filter(b => String(b.id) !== strId);
      try {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Call Supabase delete
    try {
      await deleteSharedBlessing(blessing);
    } catch (err) {
      console.warn('Error deleting shared blessing from Supabase:', err);
    }

    const deletedMsg = currentLang === 'ar' ? 'تم حذف النعمة المنشورة بنجاح' : 'Published blessing deleted successfully';
    setToastMessage(deletedMsg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Permanently delete any blessing from the app via Admin Panel
  const handleAdminDeleteBlessing = async (blessingOrId, adminEmail = 'admin') => {
    if (!blessingOrId) return;
    const isObj = typeof blessingOrId === 'object' && blessingOrId !== null;
    const strId = isObj ? String(blessingOrId.id) : String(blessingOrId);
    const title = isObj ? (blessingOrId.title || '').trim() : '';
    const reflection = isObj ? (blessingOrId.reflection || '').trim() : '';

    // 1. Permanently register as deleted in adminDeletedIds (both ID and title)
    setAdminDeletedIds(prev => {
      const identifiers = [strId];
      if (title) identifiers.push(title);
      const updated = [...new Set([...prev, ...identifiers])];
      try {
        localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove from shared blessings cache and state
    setSharedBlessings(prev => {
      const updated = prev.filter(b => {
        if (strId && String(b.id) === strId) return false;
        if (title && reflection && b.title === title && b.reflection === reflection) return false;
        if (title && b.title === title) return false;
        return true;
      });
      try {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Remove from custom blessings
    setCustomBlessings(prev => {
      const updated = prev.filter(b => {
        if (strId && String(b.id) === strId) return false;
        if (title && b.title === title) return false;
        return true;
      });
      try {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Remote delete from Supabase if shared
    try {
      await deleteSharedBlessing(blessingOrId);
    } catch (err) {
      console.warn('Admin remote delete error:', err);
    }

    // 5. Remote record in Supabase 'admin_deleted_blessings' table
    // (This ensures all users on all devices have this blessing hidden)
    try {
      await recordAdminDeletedBlessing(blessingOrId, adminEmail);
    } catch (err) {
      console.warn('Admin record deleted error:', err);
    }

    setToastMessage(currentLang === 'ar' ? 'تم حذف النعمة نهائياً وتطبيق ذلك لجميع المستخدمين' : 'Blessing permanently deleted for all users');
    setTimeout(() => setToastMessage(''), 4500);

    // Move to next blessing smoothly
    handleNext();
  };

  // Update a blessing (Used both by Admin and by Publisher)
  const handleUpdateBlessing = async (oldBlessing, newFields) => {
    if (!oldBlessing || !newFields) return;
    const oldTitle = (oldBlessing.title || '').trim();
    const oldId = String(oldBlessing.id || '');

    // 1. Update in Supabase remote
    let updatedRemote = null;
    try {
      const res = await updateSharedBlessing(oldBlessing, newFields);
      if (res && res.data) {
        updatedRemote = res.data;
      }
    } catch (err) {
      console.warn('Error updating blessing in Supabase:', err);
    }

    const mergedUpdated = {
      ...oldBlessing,
      ...newFields,
      ...(updatedRemote || {}),
      id: oldId, // ALWAYS PRESERVE ID SO OWNERSHIP IS NEVER LOST
      title: newFields.title || oldTitle,
      reflection: newFields.reflection || oldBlessing.reflection
    };

    // 2. Update in myPublishedBlessings (Preserves user's ownership permanently)
    setMyPublishedBlessings(prev => {
      const updated = prev.map(b => {
        if ((oldId && String(b.id) === oldId) || (oldTitle && b.title === oldTitle)) {
          return { ...b, ...mergedUpdated };
        }
        return b;
      });
      try {
        localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Update in sharedBlessings state & cache
    setSharedBlessings(prev => {
      const updated = prev.map(b => {
        if ((oldId && String(b.id) === oldId) || (oldTitle && b.title === oldTitle)) {
          return { ...b, ...mergedUpdated };
        }
        return b;
      });
      try {
        localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Update in customBlessings if present
    setCustomBlessings(prev => {
      const updated = prev.map(b => {
        if ((oldId && String(b.id) === oldId) || (oldTitle && b.title === oldTitle)) {
          return { ...b, ...mergedUpdated };
        }
        return b;
      });
      try {
        localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. If this blessing was customized locally, sync customization
    if (customizedBlessings[oldBlessing.id]) {
      handleSaveCustomization(oldBlessing.id, {
        ...customizedBlessings[oldBlessing.id],
        ...newFields
      });
    }

    setToastMessage(currentLang === 'ar' ? 'تم حفظ التعديلات وتحديث النعمة بنجاح ✨' : 'Blessing updated successfully ✨');
    setTimeout(() => setToastMessage(''), 4500);

    return mergedUpdated;
  };

  // Admin secret entry: ONLY triggered by 10 consecutive clicks on footer quote/verse
  const footerClicksRef = useRef({ count: 0, timer: null });
  const handleFooterSecretClick = () => {
    clearTimeout(footerClicksRef.current.timer);
    footerClicksRef.current.count += 1;
    if (footerClicksRef.current.count >= 10) {
      footerClicksRef.current.count = 0;
      setIsAdminModalOpen(true);
    } else {
      footerClicksRef.current.timer = setTimeout(() => {
        footerClicksRef.current.count = 0;
      }, 3500);
    }
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
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [blessingToShare, setBlessingToShare] = useState(null);

  // Edit / Customize Blessing Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [blessingToEdit, setBlessingToEdit] = useState(null);

  const handleOpenEdit = (blessing) => {
    setBlessingToEdit(blessing || currentBlessing);
    setIsEditModalOpen(true);
  };

  // Edit Published Blessing Modal State (للمستخدم الناشر)
  const [isEditPublishedOpen, setIsEditPublishedOpen] = useState(false);
  const [blessingToEditPublished, setBlessingToEditPublished] = useState(null);

  const handleOpenEditPublished = (blessing) => {
    setBlessingToEditPublished(blessing || currentBlessing);
    setIsEditPublishedOpen(true);
  };

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
      if (isFavoritesOpen || isJournalOpen || isNotificationsOpen || isAddModalOpen || isSearchOpen || isShareOpen || isFocusModeOpen) return;

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
  }, [handleRandom, handleNext, handlePrev, isFavoritesOpen, isJournalOpen, isNotificationsOpen, isAddModalOpen, isSearchOpen, isShareOpen, isFocusModeOpen]);

  // Milestone title based on dailyCount
  const getMilestoneLabel = () => {
    if (dailyStats.count >= 20) return t.milestones.diamond;
    if (dailyStats.count >= 10) return t.milestones.gold;
    if (dailyStats.count >= 5) return t.milestones.silver;
    return null;
  };

  return (
    <div className="nemaa-app-root">
      {/* Top Header */}
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        streak={dailyStats.streak}
        currentLang={currentLang}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="container" style={{ paddingTop: '20px', paddingBottom: '70px' }}>
        {/* Daily Gratitude Status Banner */}
        <div className="stats-banner">
          <div className="stats-item">
            <Sparkles size={16} color="var(--color-gold)" />
            <span>{t.dailyStatsLabel}</span>
            <span className="stats-number">{dailyStats.count}</span>
            <span style={{ fontSize: '12px' }}>{currentLang === 'ar' ? 'مرات' : 'times'}</span>
          </div>

          {getMilestoneLabel() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '13px' }}>
              <Award size={16} />
              <span>{getMilestoneLabel()}</span>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              {currentLang === 'ar' ? '«وَقَلِيلٌ مِّنْ عِبَادِيَ الشَّكُورُ»' : '“And few of My servants are grateful.”'}
            </span>
          )}
        </div>

        {/* Category Filter Pills Bar (Solid Vector Icons) */}
        <CategoryFilter
          categories={categoriesWithCounts}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* The Central Blessing Card */}
        <BlessingCard
          blessing={currentBlessing}
          isFavorite={currentBlessing ? favorites.includes(currentBlessing.id) : false}
          onToggleFavorite={toggleFavorite}
          onShare={handleOpenShare}
          onDownloadImage={handleDownloadImage}
          onOpenFocusMode={() => setIsFocusModeOpen(true)}
          onOpenEdit={handleOpenEdit}
          onOpenPublishModal={() => setIsAddModalOpen(true)}
          isMyPublished={currentBlessing ? myPublishedIds.includes(String(currentBlessing.id)) : false}
          onEditPublished={handleOpenEditPublished}
          onDeletePublished={handleDeletePublished}
          onOpenReport={(b) => {
            setBlessingToReport(b);
            setIsReportModalOpen(true);
          }}
          praisesCount={getBlessingPraises(currentBlessing)}
          activeCategory={activeCategory}
          animatingKey={animatingKey}
          onNextBlessing={handleNext}
          onPrevBlessing={handlePrev}
          lang={currentLang}
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
          onOpenShareApp={() => setIsShareAppModalOpen(true)}
          onOpenPublishModal={() => setIsAddModalOpen(true)}
          dailyCount={dailyStats.count}
          lang={currentLang}
        />

        {/* Spiritual Quote Footer Note (Secret 10-click trigger for admin dashboard) */}
        <div 
          onClick={handleFooterSecretClick}
          style={{ textAlign: 'center', marginTop: '30px', padding: '0 10px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}
          title={currentLang === 'ar' ? 'منصة نِعْمَة — تذكّر لتشكر' : 'NEMAA Platform — Remember to give thanks'}
        >
          <p style={{ fontFamily: 'var(--font-arabic-body)', fontSize: '17px', color: 'var(--color-primary)', marginBottom: '4px' }}>
            ﴿وَآتَاكُم مِّن كُلِّ مَا سَأَلْتُمُوهُ ۚ وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا﴾
          </p>
          <p style={{ color: 'var(--text-faint)' }}>
            {currentLang === 'ar' 
              ? 'منصة نِعْمَة — تذكّر لتشكر • اسحب قالب النعمة يمين أو يسار بالأصبع للتبديل'
              : 'NEMAA Platform — Remember to give thanks • Swipe blessing card left/right'}
          </p>
        </div>

        {/* In-App Live Spiritual Praise Alert Banner */}
        {livePraiseToast && (
          <div 
            style={{
              margin: '12px auto 0',
              maxWidth: '480px',
              width: '90%',
              padding: '9px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(44,74,62,0.12) 100%)',
              border: '1.2px solid var(--color-gold)',
              boxShadow: '0 4px 16px rgba(212,175,55,0.2)',
              fontSize: '12.5px',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              animation: 'fadeIn 0.25s ease-out'
            }}
            role="status"
          >
            <span>{livePraiseToast}</span>
          </div>
        )}

        {/* Quick Footer Links - Vector Icons only (no emojis) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={() => setIsFeedbackOpen(true)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontSize: '13px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px'
            }}
          >
            <MessageSquare size={14} color="var(--color-gold)" />
            <span>{currentLang === 'ar' ? 'الشكاوى والمقترحات' : 'Feedback & Suggestions'}</span>
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <button 
            type="button" 
            onClick={() => setIsMissionOpen(true)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontSize: '13px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px'
            }}
          >
            <Scroll size={14} color="var(--color-gold)" />
            <span>{currentLang === 'ar' ? 'رسالة وهدف المنصة' : 'Platform Mission'}</span>
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <button 
            type="button" 
            onClick={() => setIsSettingsOpen(true)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontSize: '13px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px'
            }}
          >
            <Settings size={14} color="var(--color-gold)" />
            <span>{currentLang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </button>
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

      <FocusReflectionModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        blessing={currentBlessing}
        onNext={handleNext}
        onPrev={handlePrev}
        onRandom={handleRandom}
        currentLang={currentLang}
      />

      <AddBlessingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBlessingPublished={handleBlessingPublished}
        lang={currentLang}
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

      {/* Share App Modal (شارك تُؤجر) */}
      <ShareAppModal
        isOpen={isShareAppModalOpen}
        onClose={() => setIsShareAppModalOpen(false)}
        currentLang={currentLang}
      />

      {/* Welcome / Language Select Modal */}
      <LanguageSelectModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLang={currentLang}
        onSelectLang={handleSelectLanguage}
      />

      {/* Edit / Customize Blessing Modal */}
      <EditBlessingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        blessing={blessingToEdit}
        onSaveCustomization={handleSaveCustomization}
        onResetCustomization={handleResetCustomization}
        isCustomized={blessingToEdit ? Boolean(customizedBlessings[blessingToEdit.id]) : false}
      />

      {/* Interactive Onboarding Spotlight Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('nemaa_tour_seen', 'true');
          } catch {}
          setTourCompleted(true);
          if (!localStorage.getItem('nemaa_mission_seen')) {
            setTimeout(() => {
              setIsMissionOpen(true);
              try {
                localStorage.setItem('nemaa_mission_seen', 'true');
              } catch {}
            }, 350);
          }
        }}
        onComplete={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('nemaa_tour_seen', 'true');
          } catch {}
          setTourCompleted(true);
          if (!localStorage.getItem('nemaa_mission_seen')) {
            setTimeout(() => {
              setIsMissionOpen(true);
              try {
                localStorage.setItem('nemaa_mission_seen', 'true');
              } catch {}
            }, 350);
          }
        }}
      />

      {/* App Guide & Buttons Reference Modal with Changelog */}
      <AppGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onStartInteractiveTour={() => {
          setIsGuideModalOpen(false);
          setTimeout(() => setIsTourOpen(true), 250);
        }}
        lang={currentLang}
      />

      {/* Report Blessing Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        blessing={blessingToReport}
        lang={currentLang}
      />

      {/* Hidden Admin Management Modal */}
      <AdminScreen
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        allBlessings={allBlessings}
        onDeleteBlessing={handleAdminDeleteBlessing}
        onUpdateBlessing={handleUpdateBlessing}
        lang={currentLang}
      />

      {/* Full-Screen Dedicated Settings View (صفحة الإعدادات الشاملة المستقلة) */}
      <SettingsScreen
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentLang={currentLang}
        onToggleLanguage={handleToggleLanguage}
        fontMode={fontMode}
        onToggleFontMode={toggleFontMode}
        myPublishedBlessings={myPublishedBlessings}
        onEditBlessing={(blessing) => {
          setBlessingToEditPublished(blessing);
          setIsEditPublishedOpen(true);
        }}
        onDeleteBlessing={handleDeletePublishedBlessing}
        onOpenPublish={() => setIsAddModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenMission={() => setIsMissionOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenShareApp={() => setIsShareAppModalOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
          }
        }}
        getBlessingPraises={getBlessingPraises}
      />

      {/* App Mission & Purpose Modal (رسالة وهدف منصة نِعْمَة) */}
      <AppMissionModal
        isOpen={isMissionOpen}
        onClose={() => setIsMissionOpen(false)}
        lang={currentLang}
      />

      {/* Feedback & Suggestions Modal (الشكاوى والمقترحات) */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        lang={currentLang}
      />

      {/* Edit Published Blessing Modal (للناشر لتعديل وتصحيح نعمته المنشورة) */}
      <EditSharedBlessingModal
        isOpen={isEditPublishedOpen}
        onClose={() => setIsEditPublishedOpen(false)}
        blessing={blessingToEditPublished}
        onSave={async (fields) => {
          await handleUpdateBlessing(blessingToEditPublished, fields);
        }}
        isAdmin={false}
        lang={currentLang}
      />

      {/* Friendly Success Notification Toast */}
      {toastMessage && (
        <div className="shared-blessing-success-toast" role="alert" dir="rtl">
          <div className="toast-icon-wrap" aria-hidden="true">
            <Sparkles size={18} color="var(--color-gold)" />
          </div>
          <div className="toast-text-content">
            {toastMessage}
          </div>
          <button 
            type="button" 
            className="toast-close-btn" 
            onClick={() => setToastMessage('')}
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Subtle PWA Install Notification Toast (Appears strictly after language & onboarding tour) */}
      <InstallAppToast 
        deferredPrompt={deferredPrompt} 
        canShow={hasLanguageChosen && tourCompleted && !isTourOpen && !isLanguageModalOpen} 
      />
    </div>
  );
}
