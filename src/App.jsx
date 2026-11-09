import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
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
 
  simpleHash,
  recordAdminDeletedBlessing,
  fetchHiddenBlessings,
  subscribeToHiddenBlessings,
  explainBackendError,
  fetchAuthorNotifications,
  dismissAuthorNotification,
  subscribeToAuthorNotifications,
  fetchLatestAdminBroadcast,
  subscribeToAdminGlobalBroadcasts,
  supabase,
  getCurrentUser,
  syncUserCloudBlessings,
  saveBlessingToUserCloud,
  removeBlessingFromUserCloud,
  prepareForSignOut,
  clearLocalOwnerData
} from './supabaseClient';
import confetti from 'canvas-confetti';
import { audioEngine } from './utils/audioEngine';
import OnboardingTour from './components/OnboardingTour';
import AppGuideModal from './components/AppGuideModal';
import ReportModal from './components/ReportModal';
// شاشتان ثقيلتان لا يحتاجهما معظم الزوار عند الفتح: تُحمَّلان عند أول استخدام
const AdminScreen = lazy(() => import('./components/AdminScreen'));
const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
import AuthModal from './components/AuthModal';
import AppMissionModal from './components/AppMissionModal';
import FeedbackModal from './components/FeedbackModal';
import UserNotificationsDrawer from './components/UserNotificationsDrawer';
import AdminBroadcastModal from './components/AdminBroadcastModal';
import { initOneSignal } from './utils/oneSignalHelper';
import { readStoredArray, readStoredObject, isBlessingLike } from './utils/safeStorage';

export default function App() {
  // Initialize OneSignal Web SDK quietly (strictly no prompt on load)
  useEffect(() => {
    initOneSignal();
  }, []);
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

  // Persistent User Cloud Account & Authentication State (حساب المستخدم السحابي الدائم)
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Admin Global Broadcast Announcement State
  const [activeAdminBroadcast, setActiveAdminBroadcast] = useState(null);

  // User Notifications Inbox State (بريد الإشعارات وتنبيهات الإدارة)
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState(() =>
    readStoredArray('nemaa_user_notifications', 'object')
  );

  const unreadNotificationsCount = useMemo(() => {
    return userNotifications.filter(n => n.status !== 'read').length;
  }, [userNotifications]);

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
  const [adminDeletedIds, setAdminDeletedIds] = useState(() =>
    readStoredArray('nemaa_admin_deleted_ids', 'string')
  );

  // Praises count tracking for each blessing (persisted locally and synced with Supabase)
  const [blessingPraises, setBlessingPraises] = useState(() => {
    const obj = readStoredObject('nemaa_blessing_praises');
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean[k] = v;
    }
    return clean;
  });

  // User's own published blessings IDs (to allow deletion of what they shared)
  const [myPublishedIds, setMyPublishedIds] = useState(() =>
    readStoredArray('nemaa_my_published_ids', 'string')
  );

  // 2. Shared Blessings from Supabase
  const [sharedBlessings, setSharedBlessings] = useState(() => {
    try {
      const saved = localStorage.getItem('nemaa_shared_blessings_cache');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const valid = parsed.filter(b => isBlessingLike(b) && b.title.trim() && typeof b.reflection === 'string' && b.reflection.trim());
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
      const valid = parsed.filter(b => isBlessingLike(b) && b.title.trim() && typeof b.reflection === 'string' && b.reflection.trim());
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
    const mine = readStoredArray('nemaa_my_published_blessings', 'blessing');
    if (mine.length > 0) return mine;
    return readStoredArray('nemaa_custom_blessings', 'blessing');
  });

  useEffect(() => {
    try {
      localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(myPublishedBlessings));
    } catch {}
  }, [myPublishedBlessings]);

  // Synchronize authenticated user and restore their cloud blessings
  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then(user => {
      if (!isMounted) return;
      setCurrentUser(user);
      if (user) {
        syncUserCloudBlessings(user).then(cloudBlessings => {
          if (!isMounted || !Array.isArray(cloudBlessings) || cloudBlessings.length === 0) return;
          setMyPublishedBlessings(prev => {
            const map = new Map();
            prev.forEach(b => map.set((b.title || b.id || '').trim().toLowerCase(), b));
            cloudBlessings.forEach(b => {
              const key = (b.title || b.id || '').trim().toLowerCase();
              if (key && !map.has(key)) map.set(key, b);
            });
            return Array.from(map.values());
          });
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        const cloudBlessings = await syncUserCloudBlessings(user);
        if (isMounted && Array.isArray(cloudBlessings) && cloudBlessings.length > 0) {
          setMyPublishedBlessings(prev => {
            const map = new Map();
            prev.forEach(b => map.set((b.title || b.id || '').trim().toLowerCase(), b));
            cloudBlessings.forEach(b => {
              const key = (b.title || b.id || '').trim().toLowerCase();
              if (key && !map.has(key)) map.set(key, b);
            });
            return Array.from(map.values());
          });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // نتأكد أولاً أن رموز ملكية نعمك محفوظة في حسابك، ثم نمسحها من هذا الجهاز بعد الخروج
      // (حتى لا تنتقل نعمك إلى حساب من يسجّل دخوله بعدك على نفس الجهاز).
      const safeToClear = await prepareForSignOut();
      await supabase.auth.signOut();
      if (safeToClear) {
        clearLocalOwnerData();
        setMyPublishedBlessings([]);
        setMyPublishedIds([]);
      }
      setCurrentUser(null);
      setToastMessage(currentLang === 'ar'
        ? (safeToClear ? 'تم تسجيل الخروج. نعمك المنشورة محفوظة في حسابك وتعود عند الدخول' : 'تم تسجيل الخروج بنجاح')
        : (safeToClear ? 'Signed out. Your published blessings stay safe in your account.' : 'Signed out successfully'));
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // User-Customized / Rephrased Blessings State (Edits to existing blessings)
  const [customizedBlessings, setCustomizedBlessings] = useState(() => {
    const obj = readStoredObject('nemaa_customized_blessings');
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) clean[k] = v;
    }
    return clean;
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

  // Purge legacy test blessings & orphan community blessings from local storage on mount
  useEffect(() => {
    try {
      const isOrphan = (b) => {
        if (!b) return true;
        const t = (b.title || '').trim();
        const r = (b.reflection || '').trim();
        return !t || !r;
      };

      const purgeLegacy = (key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(b => !isOrphan(b));
            if (filtered.length !== list.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
            }
            return filtered;
          }
        }
        return null;
      };

      const cleanedPublished = purgeLegacy('nemaa_my_published_blessings');
      if (cleanedPublished) {
        setMyPublishedBlessings(cleanedPublished);
      }

      const cleanedCustom = purgeLegacy('nemaa_custom_blessings');
      if (cleanedCustom) {
        setCustomBlessings(cleanedCustom);
      }

      const cleanedShared = purgeLegacy('nemaa_shared_blessings_cache');
      if (cleanedShared) {
        setSharedBlessings(cleanedShared);
      }

      // Purge all shared/community blessing keys from customizedBlessings (fixes badge "صياغتي الخاصة" on other users' devices)
      const rawCustomized = localStorage.getItem('nemaa_customized_blessings');
      if (rawCustomized) {
        const custObj = JSON.parse(rawCustomized);
        if (custObj && typeof custObj === 'object') {
          let dirty = false;
          for (const k of Object.keys(custObj)) {
            const isCommunityKey = k.startsWith('sb_') || k.startsWith('pb_') || k.startsWith('custom_') || custObj[k]?.isShared;
            if (isCommunityKey) {
              delete custObj[k];
              dirty = true;
            }
          }
          if (dirty) {
            localStorage.setItem('nemaa_customized_blessings', JSON.stringify(custObj));
            setCustomizedBlessings(custObj);
          }
        }
      }

      // Purge orphan IDs from myPublishedIds
      const rawIds = localStorage.getItem('nemaa_my_published_ids');
      if (rawIds) {
        const ids = JSON.parse(rawIds);
        if (Array.isArray(ids)) {
          const filtered = ids.filter(id => String(id).toLowerCase() !== 'sb_vrgco8');
          if (filtered.length !== ids.length) {
            localStorage.setItem('nemaa_my_published_ids', JSON.stringify(filtered));
            setMyPublishedIds(filtered);
          }
        }
      }
    } catch {}
  }, []);

  const handleSelectLanguage = (newLang) => {
    setCurrentLang(newLang);
    localStorage.setItem('nemaa_lang', newLang);
    setIsLanguageModalOpen(false);
    setHasLanguageChosen(true);

    // Sequence: First Language -> Second App Mission -> Third Onboarding Tour
    if (!localStorage.getItem('nemaa_mission_seen')) {
      setTimeout(() => {
        setIsMissionOpen(true);
      }, 400);
    } else if (!localStorage.getItem('nemaa_tour_seen')) {
      setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
    }
  };

  const handleCloseMissionModal = () => {
    setIsMissionOpen(false);
    try {
      localStorage.setItem('nemaa_mission_seen', 'true');
    } catch {}
    if (!localStorage.getItem('nemaa_tour_seen')) {
      setTimeout(() => {
        setIsTourOpen(true);
      }, 350);
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

          // Single Source of Truth reconciliation:
          // Purge any community blessing from local states and localStorage if it no longer exists on Supabase!
          const remoteIds = new Set(remote.map(r => String(r.id || '').toLowerCase()));
          const remoteTitles = new Set(remote.map(r => (r.title || '').trim().toLowerCase()));

          const isCommunityActive = (b) => {
            if (!b) return false;
            const bId = String(b.id || '').toLowerCase();
            const bTitle = (b.title || '').trim().toLowerCase();
            const isCommunity = b.isShared || bId.startsWith('sb_') || bId.startsWith('pb_') || bId.startsWith('custom_');
            if (isCommunity) {
              return remoteIds.has(bId) || remoteTitles.has(bTitle);
            }
            return true;
          };

          setMyPublishedBlessings(prev => {
            const next = prev.filter(isCommunityActive).map(b => {
              const bTitle = (b.title || '').trim().toLowerCase();
              const matchingRemote = remote.find(r => 
                (b.id && String(r.id).toLowerCase() === String(b.id).toLowerCase()) ||
                ((r.title || '').trim().toLowerCase() === bTitle)
              );
              if (matchingRemote) {
                return { ...b, ...matchingRemote, id: matchingRemote.id };
              }
              return b;
            });
            try { localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(next)); } catch {}
            return next;
          });

          setCustomBlessings(prev => {
            const next = prev.filter(isCommunityActive);
            try { localStorage.setItem('nemaa_custom_blessings', JSON.stringify(next)); } catch {}
            return next;
          });

          setMyPublishedIds(prev => {
            const activeIds = remote
              .filter(r => {
                const rId = String(r.id || '').toLowerCase();
                const rTitle = (r.title || '').trim().toLowerCase();
                return prev.some(id => String(id).toLowerCase() === rId) || 
                       myPublishedBlessingsRef.current.some(mb => (mb.title || '').trim().toLowerCase() === rTitle);
              })
              .map(r => String(r.id));
            const merged = [...new Set([...prev, ...activeIds])].filter(id => 
              remoteIds.has(id.toLowerCase()) || id.startsWith('pb_') || id.startsWith('custom_')
            );
            try { localStorage.setItem('nemaa_my_published_ids', JSON.stringify(merged)); } catch {}
            return merged;
          });

          setCustomizedBlessings(prev => {
            const next = { ...prev };
            let changed = false;
            for (const key of Object.keys(next)) {
              const item = next[key];
              const isCommunity = key.startsWith('sb_') || key.startsWith('pb_') || key.startsWith('custom_') || item?.isShared;
              if (isCommunity) {
                const title = (item?.title || '').trim().toLowerCase();
                if (!remoteIds.has(String(key).toLowerCase()) && !remoteTitles.has(title)) {
                  delete next[key];
                  changed = true;
                }
              }
            }
            if (changed) {
              try { localStorage.setItem('nemaa_customized_blessings', JSON.stringify(next)); } catch {}
            }
            return next;
          });
        }
      } catch (err) {
        console.warn('Failed to load shared blessings from Supabase:', err);
      }
    }

    async function loadAdminDeleted() {
      try {
        const remoteDeleted = await fetchHiddenBlessings();
        if (isMounted && Array.isArray(remoteDeleted)) {
          const identifiers = remoteDeleted.flatMap(d => [d.blessing_title, d.id]).filter(Boolean).map(s => String(s).trim());
          const idSet = new Set(identifiers.map(s => s.toLowerCase()));

          // Server is Single Source of Truth for deleted items:
          setAdminDeletedIds(identifiers);
          try {
            localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(identifiers));
          } catch {}

          const isNotDeleted = (b) => {
            if (!b) return false;
            const bId = String(b.id || '').toLowerCase();
            const bTitle = (b.title || '').trim().toLowerCase();
            return !idSet.has(bId) && !idSet.has(bTitle);
          };

          setSharedBlessings(prev => {
            const next = prev.filter(isNotDeleted);
            try { localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(next)); } catch {}
            return next;
          });

          setMyPublishedBlessings(prev => {
            const next = prev.filter(isNotDeleted);
            try { localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(next)); } catch {}
            return next;
          });

          setCustomBlessings(prev => {
            const next = prev.filter(isNotDeleted);
            try { localStorage.setItem('nemaa_custom_blessings', JSON.stringify(next)); } catch {}
            return next;
          });

          setCustomizedBlessings(prev => {
            const next = { ...prev };
            let changed = false;
            for (const key of Object.keys(next)) {
              const title = (next[key]?.title || '').trim().toLowerCase();
              if (idSet.has(String(key).toLowerCase()) || idSet.has(title)) {
                delete next[key];
                changed = true;
              }
            }
            if (changed) {
              try { localStorage.setItem('nemaa_customized_blessings', JSON.stringify(next)); } catch {}
            }
            return next;
          });

          setMyPublishedIds(prev => {
            const next = prev.filter(id => !idSet.has(String(id).toLowerCase()));
            try { localStorage.setItem('nemaa_my_published_ids', JSON.stringify(next)); } catch {}
            return next;
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
        const delId = String(deletedRow.id || '').toLowerCase();
        const delTitle = (deletedRow.title || '').trim().toLowerCase();

        const matchDelete = (b) => {
          if (!b) return true;
          const bId = String(b.id || '').toLowerCase();
          const bTitle = (b.title || '').trim().toLowerCase();
          return (delId && bId === delId) || (delTitle && bTitle === delTitle);
        };

        setSharedBlessings(prev => {
          const updated = prev.filter(b => !matchDelete(b));
          try { localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(updated)); } catch {}
          return updated;
        });

        setMyPublishedBlessings(prev => {
          const updated = prev.filter(b => !matchDelete(b));
          try { localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated)); } catch {}
          return updated;
        });

        setCustomBlessings(prev => {
          const updated = prev.filter(b => !matchDelete(b));
          try { localStorage.setItem('nemaa_custom_blessings', JSON.stringify(updated)); } catch {}
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

        // Keep the author's own list in sync too (e.g. edited from another device or by an admin)
        setMyPublishedBlessings(prev => {
          const updated = prev.map(b => {
            const isMatch = (oldRow && oldRow.title && b.title === oldRow.title) ||
                            (b.title === updatedBlessing.title);
            return isMatch ? { ...b, ...updatedBlessing, id: b.id } : b;
          });
          try {
            localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    );

    // Realtime listener for blessings deleted by admin (applied instantly to all users)
    const unsubscribeAdminDeleted = subscribeToHiddenBlessings(
      (newDeleted) => {
        if (!isMounted || !newDeleted) return;
        const identifier = (newDeleted.blessing_title || newDeleted.id || '').trim();
        if (!identifier) return;
        const idLower = identifier.toLowerCase();

        setAdminDeletedIds(prev => {
          if (prev.includes(identifier)) return prev;
          const updated = [...prev, identifier];
          try {
            localStorage.setItem('nemaa_admin_deleted_ids', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        const isTarget = (b) => {
          if (!b) return false;
          return String(b.id || '').toLowerCase() === idLower || (b.title || '').trim().toLowerCase() === idLower;
        };

        // Remove from shared blessings immediately
        setSharedBlessings(prev => {
          const next = prev.filter(b => !isTarget(b));
          try { localStorage.setItem('nemaa_shared_blessings_cache', JSON.stringify(next)); } catch {}
          return next;
        });

        // Remove from author's published blessings immediately
        setMyPublishedBlessings(prev => {
          const next = prev.filter(b => !isTarget(b));
          try { localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(next)); } catch {}
          return next;
        });

        // Remove from custom blessings
        setCustomBlessings(prev => {
          const next = prev.filter(b => !isTarget(b));
          try { localStorage.setItem('nemaa_custom_blessings', JSON.stringify(next)); } catch {}
          return next;
        });

        // Clear local customization so badge "صياغتي الخاصة" vanishes
        setCustomizedBlessings(prev => {
          const next = { ...prev };
          if (next[identifier]) delete next[identifier];
          for (const k of Object.keys(next)) {
            if ((next[k]?.title || '').trim().toLowerCase() === idLower) {
              delete next[k];
            }
          }
          try { localStorage.setItem('nemaa_customized_blessings', JSON.stringify(next)); } catch {}
          return next;
        });
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

  // Notifications fetching & real-time listening (Robust multi-tier matching)
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications(announce = false) {
      try {
        const notifs = await fetchAuthorNotifications();
        if (!isMounted || !Array.isArray(notifs)) return;

        const knownIds = new Set(
          readStoredArray('nemaa_user_notifications', 'object').map(n => n.id)
        );
        const hasFresh = notifs.some(n => !knownIds.has(n.id));

        setUserNotifications(prev => {
          const merged = [...prev];
          for (const n of notifs) {
            if (!merged.some(m => m.id === n.id)) {
              merged.unshift(n);
            }
          }
          try {
            localStorage.setItem('nemaa_user_notifications', JSON.stringify(merged));
          } catch {}
          return merged;
        });

        if (announce && hasFresh) {
          setToastMessage(currentLangRef.current === 'ar' ? 'وصلتك رسالة جديدة من إدارة المنصة في بريد الإشعارات 🔔' : 'New notification from Admin in your inbox 🔔');
          setTimeout(() => setToastMessage(''), 5000);
        }
      } catch (err) {
        console.warn('Failed to load author notifications:', err);
      }
    }

    loadNotifications();

    // The realtime message is only a "ping": the real content is always read from the server
    const unsub = subscribeToAuthorNotifications(() => {
      if (!isMounted) return;
      loadNotifications(true);
    });

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Fetch and subscribe to Admin Global Broadcast Announcements
  useEffect(() => {
    let isMounted = true;
    fetchLatestAdminBroadcast().then(b => {
      if (!isMounted || !b || !b.id) return;
      const dismissedId = localStorage.getItem('nemaa_dismissed_admin_broadcast_id');
      if (String(dismissedId) !== String(b.id)) {
        setActiveAdminBroadcast(b);
      }
    });

    const unsub = subscribeToAdminGlobalBroadcasts((broadcast) => {
      if (broadcast && broadcast.id) {
        setActiveAdminBroadcast(broadcast);
        try {
          audioEngine.playGratitudeChime();
        } catch {}
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleDismissNotification = async (notifId) => {
    setUserNotifications(prev => {
      const next = prev.filter(n => n.id !== notifId);
      try {
        localStorage.setItem('nemaa_user_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });
    await dismissAuthorNotification(notifId);
  };

  const handleClearAllNotifications = async () => {
    const ids = userNotifications.map(n => n.id);
    setUserNotifications([]);
    try {
      localStorage.removeItem('nemaa_user_notifications');
    } catch {}
    for (const id of ids) {
      await dismissAuthorNotification(id);
    }
  };

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

  // Combined Blessings Pool with Strict Deduplication & Single Source of Truth enforcement
  const allBlessings = useMemo(() => {
    const pool = [];
    const seenTitles = new Set();
    const seenIds = new Set();
    const adminDeletedSet = new Set(adminDeletedIds.map(x => String(x).trim().toLowerCase()));

    const initialCatalogIds = new Set(INITIAL_BLESSINGS.map(b => String(b.id)));
    const initialCatalogTitles = new Set(INITIAL_BLESSINGS.map(b => (b.title || '').trim().toLowerCase()));

    const addUnique = (b) => {
      if (!b) return;
      const cleanTitle = (b.title || '').trim();
      const cleanReflection = (b.reflection || '').trim();
      if (!cleanTitle || !cleanReflection) return;
      const strId = String(b.id || '');
      const sig = cleanTitle.toLowerCase();

      // Check admin deleted (case-insensitive & trimmed)
      if (adminDeletedSet.has(strId.toLowerCase()) || adminDeletedSet.has(sig)) {
        return;
      }

      // Single Source of Truth Rule:
      // If it is a community / shared blessing (not in the 100 initial catalog blessings),
      // it MUST currently exist in sharedBlessings (verified remote) to be rendered.
      // Any deleted or missing community blessing is blocked completely!
      const isInitialCatalog = initialCatalogIds.has(strId) || initialCatalogTitles.has(sig);
      if (!isInitialCatalog && (b.isShared || strId.startsWith('sb_') || strId.startsWith('pb_') || strId.startsWith('custom_'))) {
        const existsInShared = sharedBlessings.some(sb => 
          String(sb.id).toLowerCase() === strId.toLowerCase() || (sb.title || '').trim().toLowerCase() === sig
        );
        if (!existsInShared) {
          return; // Server is Single Source of Truth: deleted community blessing is never shown!
        }
      }

      // Check uniqueness: deduplicate by id OR by title
      if (seenIds.has(strId) || seenTitles.has(sig)) {
        return;
      }

      seenIds.add(strId);
      seenTitles.add(sig);

      // Check if user has personal local customizations (STRICTLY for built-in catalog blessings only)
      const isCatalog = initialCatalogIds.has(strId) || initialCatalogTitles.has(sig);
      if (isCatalog && customizedBlessings[strId]) {
        pool.push({
          ...b,
          ...customizedBlessings[strId],
          isCustomized: true
        });
      } else {
        // Community / shared blessings are always regular community cards (never tagged with "صياغتي الخاصة")
        const cleanB = b.isCustomized ? { ...b, isCustomized: false } : b;
        pool.push(cleanB);
      }
    };

    // 1. First shared blessings (from Supabase, newest first)
    sharedBlessings.forEach(addUnique);

    // 2. User's own published blessings (offline resilient, strictly guarded)
    myPublishedBlessings.forEach(addUnique);

    // 3. Custom blessings
    customBlessings.forEach(addUnique);

    // 4. Initial platform catalog (100 curated blessings)
    INITIAL_BLESSINGS.forEach(addUnique);

    return pool;
  }, [sharedBlessings, myPublishedBlessings, customBlessings, customizedBlessings, adminDeletedIds]);

  // Compute live praise count for any blessing (offline durable + remote sync)
  const getBlessingPraises = useCallback((blessing) => {
    if (!blessing) return 0;
    const strId = String(blessing.id);
    const title = (blessing.title || '').trim();
    const isCommunity = blessing.isShared || blessing.isCustom || strId.startsWith('sb_') || strId.startsWith('custom_') || strId.startsWith('pb_');
    if (isCommunity) {
      // الخادم يحفظ عدّاد الحمد بعنوان النعمة، لذلك نقرأ بالعنوان أيضاً (قبل ذلك كان يُقرأ بالمعرّف فقط
      // فيظهر العدّاد صفراً في أي متصفح جديد). العدّاد لا ينقص أبداً فنأخذ الأكبر.
      const byId = blessingPraises[strId];
      const byTitle = title ? blessingPraises[title] : undefined;
      if (byId !== undefined || byTitle !== undefined) {
        return Math.max(Number(byId) || 0, Number(byTitle) || 0);
      }
    } else if (blessingPraises[strId] !== undefined) {
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
      const customList = readStoredArray('nemaa_custom_blessings', 'blessing');
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
  const [favorites, setFavorites] = useState(() =>
    readStoredArray('nemaa_favorites', 'primitive')
  );

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
        if (!parsed || typeof parsed !== 'object' || typeof parsed.count !== 'number' || !Number.isFinite(parsed.count)) {
          throw new Error('invalid daily stats');
        }
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
      ).then((serverCount) => {
        // نعم المجتمع: نعتمد رقم الخادم إن كان أكبر (متصفح جديد يبدأ من صفر محلياً بينما الخادم عنده العدد الحقيقي)
        const isCommunity = currentBlessing.isShared || currentBlessing.isCustom || strId.startsWith('sb_') || strId.startsWith('custom_') || strId.startsWith('pb_');
        if (!isCommunity || typeof serverCount !== 'number' || serverCount <= newCount) return;
        setBlessingPraises(prev => {
          const updated = { ...prev };
          if (strId) updated[strId] = serverCount;
          if (title) updated[title] = serverCount;
          try {
            localStorage.setItem('nemaa_blessing_praises', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }).catch(() => {});
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

    // Save to user cloud account if authenticated
    saveBlessingToUserCloud(fullBlessing).catch(() => {});

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

    // 0. Delete on the server FIRST — never report success unless the server accepted it
    const delRes = await deleteSharedBlessing(blessing);
    if (!delRes.success) {
      setToastMessage(explainBackendError(delRes.reason, currentLang));
      setTimeout(() => setToastMessage(''), 7000);
      return;
    }

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

    // 4. Remove from user cloud account if authenticated
    removeBlessingFromUserCloud(blessing.id, blessing.title).catch(() => {});

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

    // Delete on the server FIRST — never report success unless the server accepted it
    const delRes = await deleteSharedBlessing(blessing);
    if (!delRes.success) {
      setToastMessage(explainBackendError(delRes.reason, currentLang));
      setTimeout(() => setToastMessage(''), 7000);
      return;
    }

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

    // 0. Server first: archive (backup + hide for everyone), then delete. If either step is
    //    refused we stop and say so — nothing is removed locally for a deletion that didn't happen.
    const archiveRes = await recordAdminDeletedBlessing(blessingOrId, adminEmail);
    if (!archiveRes.success) {
      setToastMessage(explainBackendError(archiveRes.reason, currentLang));
      setTimeout(() => setToastMessage(''), 7000);
      return;
    }
    const remoteDelRes = await deleteSharedBlessing(blessingOrId);
    if (!remoteDelRes.success) {
      setToastMessage(explainBackendError(remoteDelRes.reason, currentLang));
      setTimeout(() => setToastMessage(''), 7000);
      return;
    }

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

    // 4. Remove from user's published blessings (so author's device wipes it completely)
    setMyPublishedBlessings(prev => {
      const updated = prev.filter(b => {
        if (strId && String(b.id) === strId) return false;
        if (title && b.title === title) return false;
        return true;
      });
      try {
        localStorage.setItem('nemaa_my_published_blessings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 5. Remove from customizedBlessings (wipes badge "صياغتي الخاصة" permanently)
    setCustomizedBlessings(prev => {
      const next = { ...prev };
      if (strId && next[strId]) delete next[strId];
      const titleLower = title.toLowerCase();
      for (const k of Object.keys(next)) {
        if (titleLower && (next[k]?.title || '').trim().toLowerCase() === titleLower) {
          delete next[k];
        }
      }
      try {
        localStorage.setItem('nemaa_customized_blessings', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 6. Remove from published IDs
    setMyPublishedIds(prev => {
      const updated = prev.filter(id => String(id) !== strId);
      try {
        localStorage.setItem('nemaa_my_published_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

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

    // Is this a community (shared) blessing? Only those live on the server;
    // built-in blessings are customised locally on this device.
    const isSharedBlessing = oldBlessing.isShared ||
                             myPublishedIds.includes(oldId) ||
                             String(oldId).startsWith('sb_') ||
                             String(oldId).startsWith('pb_') ||
                             String(oldId).startsWith('custom_');

    // 1. Update on the server FIRST. If the server refuses we stop with a real error
    //    (the edit modal / admin screen show it) instead of pretending the edit was saved.
    let updatedRemote = null;
    if (isSharedBlessing) {
      const res = await updateSharedBlessing(oldBlessing, newFields);
      if (res && res.success && res.data) {
        updatedRemote = res.data;
      } else if (!res || res.reason !== 'not_found') {
        // 'not_found' = a purely local leftover that was never on the server → keep editing locally
        throw new Error(explainBackendError(res && res.reason, currentLang));
      }
    }

    const cleanProof = newFields.proof !== undefined 
      ? newFields.proof 
      : (updatedRemote?.proof !== undefined ? updatedRemote.proof : (oldBlessing.proof || ''));
    const cleanProofSource = newFields.proofSource !== undefined 
      ? newFields.proofSource 
      : (updatedRemote?.proofSource !== undefined ? updatedRemote.proofSource : (oldBlessing.proofSource || ''));

    const mergedUpdated = {
      ...oldBlessing,
      ...(updatedRemote || {}),
      ...newFields,
      id: oldId, // ALWAYS PRESERVE ID SO OWNERSHIP IS NEVER LOST
      title: newFields.title || oldTitle,
      reflection: newFields.reflection || oldBlessing.reflection,
      proof: cleanProof,
      proofSource: cleanProofSource
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

    // 4. Handle customization vs shared blessing:
    // If it's a shared community blessing, clear any local customization key so it never displays "صياغتي الخاصة"
    if (isSharedBlessing) {
      handleResetCustomization(oldBlessing.id);
      // Also update in historical published titles so author still matches if admin sends messages
      try {
        const hist = readStoredArray('nemaa_my_published_history', 'object');
        hist.unshift({ id: oldId, title: mergedUpdated.title, author: mergedUpdated.author, timestamp: Date.now() });
        localStorage.setItem('nemaa_my_published_history', JSON.stringify(hist.slice(0, 50)));
      } catch {}
    } else {
      // Record customization strictly for built-in catalog blessings
      handleSaveCustomization(oldBlessing.id, {
        ...(customizedBlessings[oldBlessing.id] || {}),
        ...mergedUpdated
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
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
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
          isMyPublished={
            currentBlessing ? (
              myPublishedIds.includes(String(currentBlessing.id)) ||
              myPublishedBlessings.some(mb => 
                (mb.id && String(mb.id) === String(currentBlessing.id)) ||
                (mb.title && (mb.title || '').trim().toLowerCase() === (currentBlessing.title || '').trim().toLowerCase())
              )
            ) : false
          }
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

      {/* User Notifications Drawer (بريد الإشعارات وتنبيهات الإدارة) */}
      <UserNotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        notifications={userNotifications}
        onDismissNotification={handleDismissNotification}
        onClearAll={handleClearAllNotifications}
        lang={currentLang}
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
        isSignedIn={Boolean(currentUser)}
        accountEmail={currentUser?.email || ''}
        onOpenAccount={() => { setIsAddModalOpen(false); setIsSettingsOpen(true); }}
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
        }}
        onComplete={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('nemaa_tour_seen', 'true');
          } catch {}
          setTourCompleted(true);
        }}
      />

      {/* App Guide & Buttons Reference Modal with Changelog */}
      <AppGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onStartInteractiveTour={() => {
          setIsGuideModalOpen(false);
          setIsSettingsOpen(false);
          setIsTourOpen(true);
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
      {isAdminModalOpen && (<Suspense fallback={null}>
      <AdminScreen
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        allBlessings={allBlessings}
        sharedBlessings={sharedBlessings}
        onDeleteBlessing={handleAdminDeleteBlessing}
        onUpdateBlessing={handleUpdateBlessing}
        onRefreshBlessings={async () => {
          const remote = await fetchSharedBlessings();
          if (Array.isArray(remote)) setSharedBlessings(remote);
        }}
        getBlessingPraises={getBlessingPraises}
        lang={currentLang}
      />
      </Suspense>)}

      {/* Full-Screen Dedicated Settings View (صفحة الإعدادات الشاملة المستقلة) */}
      {isSettingsOpen && (<Suspense fallback={null}>
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
        onOpenNotifications={() => setIsNotificationsDrawerOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenShareApp={() => setIsShareAppModalOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
          }
        }}
        getBlessingPraises={getBlessingPraises}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(''), 5500);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />
      </Suspense>)}

      {/* Permanent User Identity & Cloud Sync Modal (تسجيل الدخول وربط النعم بالسحاب) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          setToastMessage(currentLang === 'ar' ? 'أهلاً بك! تم حفظ نعمك وربطها بحسابك الدائم ✨' : 'Welcome! Your published blessings are now permanently synced.');
          setTimeout(() => setToastMessage(''), 4500);
        }}
        lang={currentLang}
      />

      {/* App Mission & Purpose Modal (رسالة وهدف منصة نِعْمَة) */}
      <AppMissionModal
        isOpen={isMissionOpen}
        onClose={handleCloseMissionModal}
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

      {/* Admin Global Broadcast Announcement Modal */}
      {activeAdminBroadcast && (
        <AdminBroadcastModal
          broadcast={activeAdminBroadcast}
          onClose={() => {
            try {
              localStorage.setItem('nemaa_dismissed_admin_broadcast_id', String(activeAdminBroadcast.id));
            } catch {}
            setActiveAdminBroadcast(null);
          }}
          lang={currentLang}
        />
      )}

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
        canShow={hasLanguageChosen && tourCompleted && !isTourOpen && !isLanguageModalOpen && !isMissionOpen} 
      />
    </div>
  );
}
