import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  Check, 
  LogOut, 
  Search, 
  Flag, 
  Globe, 
  Sparkles,
  Layers,
  Heart,
  User,
  RefreshCw,
  Edit3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  AlertCircle,
  X,
  Send,
  Mail,
  Megaphone
} from 'lucide-react';
import { 
  adminLogin, 
  adminLogout, 
  getAdminUser, 
  fetchBlessingReports, 
  dismissBlessingReport,
  deleteSharedBlessing,
  subscribeToReports,
  fetchFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  subscribeToFeedback,
  recordAdminDeletedBlessing,
  adminSendAuthorNotification,
  publishAdminGlobalBroadcast,
  fetchLatestAdminBroadcast
} from '../supabaseClient';
import EditSharedBlessingModal from './EditSharedBlessingModal';

export default function AdminScreen({ 
  isOpen, 
  onClose, 
  allBlessings = [], 
  sharedBlessings = [],
  onDeleteBlessing,
  onUpdateBlessing,
  getBlessingPraises,
  lang = 'ar' 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state: 'reports' | 'feedback' | 'published' | 'blessings'
  const [activeTab, setActiveTab] = useState('reports');
  
  // Reports
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Feedback (الشكاوى والمقترحات)
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'suggestion' | 'complaint'

  // Published Blessings Management (النعم المنشورة من المجتمع)
  const [publishedSearchQuery, setPublishedSearchQuery] = useState('');

  // Catalog Blessings Management (كتالوج المنصة)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [statusNotice, setStatusNotice] = useState('');
  const [editingBlessing, setEditingBlessing] = useState(null);
  const [associatedReportId, setAssociatedReportId] = useState(null);

  // Author direct messaging state (إشعار للمؤلف في بريد الإشعارات)
  const [messageRecipientBlessing, setMessageRecipientBlessing] = useState(null);
  const [authorMessageText, setAuthorMessageText] = useState('');
  const [authorMessageAction, setAuthorMessageAction] = useState('message'); // 'message' | 'edit' | 'delete'
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Global Broadcast Announcement State (إذاعة رسالة لجميع المستخدمين)
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);
  const [activeBroadcastInfo, setActiveBroadcastInfo] = useState(null);

  async function loadBroadcastData() {
    try {
      const latest = await fetchLatestAdminBroadcast();
      setActiveBroadcastInfo(latest);
    } catch (err) {
      console.warn('Failed to load broadcast data:', err);
    }
  }

  const handlePublishBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsPublishingBroadcast(true);
    try {
      const res = await publishAdminGlobalBroadcast({
        title: broadcastTitle.trim() || (isRtl ? 'إعلان وتنبيه عام من إدارة نِعْمَة' : 'Global Announcement from NEMAA Team'),
        message: broadcastMessage.trim(),
        adminEmail: currentUser?.email || 'admin'
      });
      if (res.success) {
        setActiveBroadcastInfo(res.data);
        setBroadcastMessage('');
        setBroadcastTitle('');
        setStatusNotice(isRtl ? 'تم نشر الرسالة وإذاعتها بنجاح لجميع مستخدمي المنصة ✨' : 'Announcement broadcasted to all users successfully ✨');
        setTimeout(() => setStatusNotice(''), 4500);
      }
    } catch (err) {
      console.warn('Error broadcasting announcement:', err);
    } finally {
      setIsPublishingBroadcast(false);
    }
  };

  const isRtl = lang === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  async function loadReports() {
    setIsLoadingReports(true);
    try {
      const list = await fetchBlessingReports();
      setReports(list);
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  }

  async function loadFeedbackData() {
    setIsLoadingFeedback(true);
    try {
      const list = await fetchFeedback();
      setFeedbackList(list);
    } catch (err) {
      console.warn('Failed to load feedback:', err);
    } finally {
      setIsLoadingFeedback(false);
    }
  }

  // Check admin session on mount / open
  useEffect(() => {
    if (!isOpen) return;
    async function checkAuth() {
      const user = await getAdminUser();
      setCurrentUser(user);
      if (user) {
        loadReports();
        loadFeedbackData();
        loadBroadcastData();
      }
    }
    checkAuth();
  }, [isOpen]);

  // Realtime subscription for incoming reports
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const unsub = subscribeToReports(
      (newRep) => {
        setReports(prev => {
          if (prev.some(r => r.id === newRep.id)) return prev;
          return [newRep, ...prev];
        });
      },
      (deletedRep) => {
        setReports(prev => prev.filter(r => r.id !== deletedRep.id));
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen, currentUser]);

  // Realtime subscription for feedback
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const unsub = subscribeToFeedback(
      (newFeedback) => {
        setFeedbackList(prev => {
          if (prev.some(f => f.id === newFeedback.id)) return prev;
          return [newFeedback, ...prev];
        });
      },
      (deletedFeedback) => {
        setFeedbackList(prev => prev.filter(f => f.id !== deletedFeedback.id));
      },
      (updatedFeedback) => {
        setFeedbackList(prev => prev.map(f => f.id === updatedFeedback.id ? { ...f, ...updatedFeedback } : f));
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen, currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        setCurrentUser(res.user);
        loadReports();
        loadFeedbackData();
      } else {
        setAuthError(res.error || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid admin credentials'));
      }
    } catch (err) {
      setAuthError(err.message || (isRtl ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login failed'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setCurrentUser(null);
    setPassword('');
  };

  // Delete blessing permanently (Admin Action)
  const handleDeleteBlessingAction = async (blessing, reportIdToDismiss = null) => {
    const title = blessing.title || (typeof blessing === 'string' ? blessing : '');
    const blessingId = blessing.id || (typeof blessing === 'string' ? blessing : '');

    const confirmPrompt = isRtl
      ? `هل أنت متأكد من رغبتك في حذف نعمة «${title}» نهائياً من قاعدة البيانات والتطبيق؟`
      : `Are you sure you want to permanently delete "${title}"?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      // 1. Delete from Supabase & record in admin_deleted_blessings
      await recordAdminDeletedBlessing(blessing, currentUser?.email || 'admin');
      await deleteSharedBlessing(blessing);

      if (onDeleteBlessing) {
        onDeleteBlessing(blessing);
      }

      // 2. If called from reports, dismiss the report
      if (reportIdToDismiss) {
        await dismissBlessingReport(reportIdToDismiss);
        setReports(prev => prev.filter(r => r.id !== reportIdToDismiss));
      }

      setReports(prev => prev.filter(r => String(r.blessing_id) !== String(blessingId) && r.blessing_title !== title));

      setStatusNotice(isRtl ? 'تم حذف النعمة نهائياً وتطبيق ذلك لجميع المستخدمين' : 'Blessing permanently deleted');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.warn('Failed to delete blessing:', err);
      setStatusNotice(isRtl ? 'حدث خطأ أثناء محاولة الحذف' : 'Failed to delete blessing');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Dismiss report without deleting blessing
  const handleDismissReport = async (reportId) => {
    await dismissBlessingReport(reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    setStatusNotice(isRtl ? 'تم حفظ وتجاهل البلاغ' : 'Report dismissed');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  // Start editing a blessing from the Reports tab
  const handleStartEditFromReport = (rep) => {
    const match = allBlessings.find(b => 
      String(b.id) === String(rep.blessing_id) || 
      (b.title || '').trim() === (rep.blessing_title || '').trim()
    ) || {
      id: rep.blessing_id,
      title: rep.blessing_title || '',
      reflection: '',
      author: '',
      proof: '',
      proofSource: ''
    };

    setAssociatedReportId(rep.id);
    setEditingBlessing(match);
  };

  // Start editing directly from the Blessings tab
  const handleStartEdit = (b) => {
    setAssociatedReportId(null);
    setEditingBlessing(b);
  };

  // Save edited blessing
  const handleSaveBlessingEdit = async (newFields) => {
    if (!editingBlessing) return;
    try {
      if (onUpdateBlessing) {
        await onUpdateBlessing(editingBlessing, newFields);
      }

      if (associatedReportId) {
        await dismissBlessingReport(associatedReportId);
        setReports(prev => prev.filter(r => r.id !== associatedReportId));
        setAssociatedReportId(null);
      }

      setEditingBlessing(null);
      setStatusNotice(isRtl ? 'تم تعديل وتصحيح النعمة بنجاح لجميع المستخدمين' : 'Blessing updated successfully');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.warn('Error saving blessing edit:', err);
      setStatusNotice(isRtl ? 'حدث خطأ أثناء حفظ التعديل' : 'Failed to save changes');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Open author messaging modal (with smart resolution of live blessing details)
  const handleOpenAuthorMessage = (item, defaultAction = 'message') => {
    if (!item) return;
    const targetId = String(item.blessing_id || item.id || '').trim();
    const targetTitle = (item.blessing_title || item.title || '').trim();
    const targetTitleLower = targetTitle.toLowerCase();

    // Helper to normalize arabic strings for fuzzy matching
    const norm = (str) => (str || '').replace(/[.,!؟،؛ـ«»"']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const targetNorm = norm(targetTitle);

    // Look up in allBlessings or sharedBlessings
    const pool = [...(sharedBlessings || []), ...(allBlessings || [])];
    const match = pool.find(b => {
      if (!b) return false;
      const bId = String(b.id || '').trim().toLowerCase();
      const bTitle = (b.title || '').trim().toLowerCase();
      const bNorm = norm(b.title);

      if (targetId && bId === targetId.toLowerCase()) return true;
      if (targetTitleLower && bTitle === targetTitleLower) return true;
      if (targetNorm && (bNorm === targetNorm || bNorm.includes(targetNorm) || targetNorm.includes(bNorm))) return true;
      return false;
    });

    const resolvedId = match ? String(match.id) : targetId;
    const resolvedTitle = match ? match.title : targetTitle;
    const resolvedAuthor = match?.author || item.author || '';

    setMessageRecipientBlessing({
      id: resolvedId,
      title: resolvedTitle,
      author: resolvedAuthor
    });
    setAuthorMessageAction(defaultAction);
    setAuthorMessageText('');
  };

  // Send direct message / notification to author
  const handleSendAuthorMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageRecipientBlessing || !authorMessageText.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await adminSendAuthorNotification({
        blessingId: messageRecipientBlessing.id,
        blessingTitle: messageRecipientBlessing.title,
        author: messageRecipientBlessing.author,
        message: authorMessageText.trim(),
        actionType: authorMessageAction,
        adminEmail: currentUser?.email || 'admin@nemaa.com'
      });

      if (res && res.success) {
        setStatusNotice(isRtl ? 'تم إرسال الإشعار إلى بريد صاحب النعمة بنجاح ✨' : 'Notification sent to author inbox ✨');
        setTimeout(() => setStatusNotice(''), 4000);
        setMessageRecipientBlessing(null);
        setAuthorMessageText('');
      } else {
        setStatusNotice(isRtl ? 'تعذر إرسال الإشعار، يرجى المحاولة ثانية' : 'Failed to send notification');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.warn('Error sending author notification:', err);
      setStatusNotice(isRtl ? 'حدث خطأ أثناء إرسال الإشعار' : 'Error sending notification');
      setTimeout(() => setStatusNotice(''), 4000);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Feedback Actions
  const handleAcceptFeedback = async (id) => {
    await updateFeedbackStatus(id, 'accepted');
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'accepted' } : f));
    setStatusNotice(isRtl ? 'تمت الموافقة على الاقتراح بنجاح' : 'Feedback accepted');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const handleRejectFeedback = async (id) => {
    await updateFeedbackStatus(id, 'rejected');
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'rejected' } : f));
    setStatusNotice(isRtl ? 'تم رفض الملاحظة' : 'Feedback rejected');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const handleDeleteFeedbackAction = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Delete this message?')) return;
    await deleteFeedback(id);
    setFeedbackList(prev => prev.filter(f => f.id !== id));
    setStatusNotice(isRtl ? 'تم حذف الرسالة بنجاح' : 'Message deleted');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  // Raw list of community published blessings (authoritative live community blessings)
  const rawPublishedList = useMemo(() => {
    if (sharedBlessings && sharedBlessings.length > 0) return sharedBlessings;
    return allBlessings.filter(b => b.isShared);
  }, [sharedBlessings, allBlessings]);

  // Filtered published blessings list for Tab 3 «النعم المنشورة»
  const filteredPublishedBlessings = useMemo(() => {
    return rawPublishedList.filter(b => {
      if (!publishedSearchQuery.trim()) return true;
      const q = publishedSearchQuery.toLowerCase();
      const inTitle = (b.title || '').toLowerCase().includes(q);
      const inRef = (b.reflection || '').toLowerCase().includes(q);
      const inAuthor = (b.author || '').toLowerCase().includes(q);
      const inProof = (b.proof || '').toLowerCase().includes(q);
      return inTitle || inRef || inAuthor || inProof;
    });
  }, [rawPublishedList, publishedSearchQuery]);

  // Platform catalog blessings (100 curated platform blessings)
  const catalogBlessings = useMemo(() => {
    return allBlessings.filter(b => !b.isShared);
  }, [allBlessings]);

  // Filtered catalog blessings list for Tab 4 «كتالوج المنصة»
  const filteredCatalogBlessings = useMemo(() => {
    return catalogBlessings.filter(b => {
      if (filterCategory !== 'all' && b.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (b.title || '').toLowerCase().includes(q);
        const inRef = (b.reflection || '').toLowerCase().includes(q);
        if (!inTitle && !inRef) return false;
      }
      return true;
    });
  }, [catalogBlessings, filterCategory, searchQuery]);

  // Filtered feedback list
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter(f => {
      if (feedbackFilter !== 'all' && f.type !== feedbackFilter) return false;
      return true;
    });
  }, [feedbackList, feedbackFilter]);

  if (!isOpen) return null;

  return (
    <div 
      className="admin-screen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'var(--bg-main)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.22s ease-out'
      }}
    >
      {/* Sticky Header Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(135deg, #0e241c 0%, #17382c 100%)',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(212,175,55,0.3)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
      }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'رجوع' : 'Back'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <BackArrow size={20} />
        </button>

        {/* Center Title & Verified Badge */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#D4AF37" />
            <h1 style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '800',
              fontFamily: 'var(--font-arabic-heading)',
              color: '#FFFFFF'
            }}>
              {isRtl ? 'لوحة المشرف والتحكم المركزي' : 'Admin Control Center'}
            </h1>
          </div>
          {currentUser && (
            <span style={{ fontSize: '11.5px', color: '#D4AF37', marginTop: '2px', direction: 'ltr' }}>
              {currentUser.email}
            </span>
          )}
        </div>

        {/* Logout Button */}
        {currentUser ? (
          <button
            type="button"
            onClick={handleLogout}
            title={isRtl ? 'تسجيل الخروج' : 'Log out'}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(229,62,62,0.2)',
              border: '1px solid rgba(229,62,62,0.4)',
              color: '#FEB2B2',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <LogOut size={14} />
            <span>{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
        ) : (
          <div style={{ width: '40px' }} />
        )}
      </header>

      {/* Global Status Toast if present */}
      {statusNotice && (
        <div style={{
          background: 'rgba(212,175,55,0.18)',
          color: 'var(--color-primary-dark)',
          borderBottom: '1px solid var(--color-gold)',
          padding: '10px 16px',
          fontSize: '13.5px',
          fontWeight: '700',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} color="var(--color-gold)" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Body: Authentication vs Admin Dashboard */}
      {!currentUser ? (
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            background: 'var(--surface-card)',
            borderRadius: '24px',
            border: '1.5px solid var(--border-gold)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
            padding: '32px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.14)',
              border: '1px solid var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-gold)'
            }}>
              <Lock size={26} />
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: '800', color: 'var(--text-heading)' }}>
              {isRtl ? 'تسجيل دخول المشرف' : 'Admin Login'}
            </h2>
            <p style={{ margin: '0 0 22px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {isRtl ? 'لوحة تحكم مخصصة لإدارة بلاغات النعم والشكاوى وتعديل المحتوى.' : 'Admin control for reports, suggestions & blessings.'}
            </p>

            {authError && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(229, 62, 62, 0.1)',
                border: '1px solid #E53E3E',
                color: '#C53030',
                fontSize: '13px'
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: isRtl ? 'right' : 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {isRtl ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    direction: 'ltr'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    direction: 'ltr'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #1b4535 0%, #0f2b21 100%)',
                  border: '1.5px solid var(--color-gold)',
                  color: '#FFFFFF',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                  opacity: isLoggingIn ? 0.7 : 1
                }}
              >
                {isLoggingIn ? (isRtl ? 'جاري التحقق...' : 'Checking...') : (isRtl ? 'دخول المشرف المعتمد' : 'Log In')}
              </button>
            </form>
          </div>
        </main>
      ) : (
        <main style={{
          maxWidth: '780px',
          width: '100%',
          margin: '0 auto',
          padding: '16px 14px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxSizing: 'border-box'
        }}>
          {/* Segmented Full-Width Tab Navigation (5 Tabs) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            background: 'var(--surface-sunken)',
            padding: '4px',
            borderRadius: '16px',
            gap: '4px',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Tab 1: Reports */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '9px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'reports' ? '#C53030' : 'var(--text-muted)',
                fontWeight: activeTab === 'reports' ? '800' : '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: activeTab === 'reports' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0
              }}
            >
              <Flag size={13} color={activeTab === 'reports' ? '#C53030' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isRtl ? 'البلاغات' : 'Reports'}</span>
              {reports.length > 0 && (
                <span style={{
                  background: '#E53E3E',
                  color: '#FFFFFF',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  flexShrink: 0
                }}>
                  {reports.length}
                </span>
              )}
            </button>

            {/* Tab 2: Feedback & Suggestions */}
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              style={{
                padding: '9px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'feedback' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'feedback' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'feedback' ? '800' : '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: activeTab === 'feedback' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0
              }}
            >
              <MessageSquare size={13} color={activeTab === 'feedback' ? 'var(--color-gold)' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isRtl ? 'الشكاوى' : 'Feedback'}</span>
              {feedbackList.length > 0 && (
                <span style={{
                  background: 'var(--color-gold)',
                  color: '#FFFFFF',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  flexShrink: 0
                }}>
                  {feedbackList.length}
                </span>
              )}
            </button>

            {/* Tab 3: Published Community Blessings */}
            <button
              type="button"
              onClick={() => setActiveTab('published')}
              style={{
                padding: '9px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'published' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'published' ? 'var(--color-gold)' : 'var(--text-muted)',
                fontWeight: activeTab === 'published' ? '800' : '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: activeTab === 'published' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0
              }}
            >
              <Globe size={13} color={activeTab === 'published' ? 'var(--color-gold)' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isRtl ? 'المنشورة' : 'Published'}</span>
              {rawPublishedList.length > 0 && (
                <span style={{
                  background: 'var(--color-gold)',
                  color: '#FFFFFF',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  flexShrink: 0
                }}>
                  {rawPublishedList.length}
                </span>
              )}
            </button>

            {/* Tab 4: Platform Catalog (100 Curated Blessings) */}
            <button
              type="button"
              onClick={() => setActiveTab('blessings')}
              style={{
                padding: '9px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'blessings' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'blessings' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'blessings' ? '800' : '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: activeTab === 'blessings' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0
              }}
            >
              <Layers size={13} color={activeTab === 'blessings' ? 'var(--color-primary)' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isRtl ? 'الكتالوج' : 'Catalog'}</span>
            </button>

            {/* Tab 5: Global Broadcast Announcement (إذاعة عامة) */}
            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              style={{
                padding: '9px 4px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'broadcast' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'broadcast' ? '#3182ce' : 'var(--text-muted)',
                fontWeight: activeTab === 'broadcast' ? '800' : '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                boxShadow: activeTab === 'broadcast' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0
              }}
            >
              <Megaphone size={13} color={activeTab === 'broadcast' ? '#3182ce' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isRtl ? 'إذاعة عامة' : 'Broadcast'}</span>
            </button>
          </div>

          {/* TAB 1: REPORTS CONTENT */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                  {isRtl ? 'قائمة النعم المُبلّغ عنها للمراجعة:' : 'Reported Blessings for Review:'}
                </span>
                <button
                  type="button"
                  onClick={loadReports}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} className={isLoadingReports ? 'spinner-icon' : ''} />
                  <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingReports ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {isRtl ? 'جاري جلب البلاغات...' : 'Loading reports...'}
                </div>
              ) : reports.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(56,161,105,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38A169',
                    margin: '0 auto 12px'
                  }}>
                    <Check size={26} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لا توجد أي بلاغات حالياً' : 'No Pending Reports'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'جميع النعم ومشاركات المجتمع منضبطة ومباركة بحمد الله.' : 'All community content is clean.'}
                  </p>
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: '20px',
                      border: '1.5px solid rgba(229, 62, 62, 0.25)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header Row: Reason & Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{
                        background: 'rgba(229, 62, 62, 0.12)',
                        color: '#C53030',
                        border: '1px solid rgba(229, 62, 62, 0.25)',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}>
                        {rep.reason || (isRtl ? 'محتوى غير لائق' : 'Inappropriate')}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {new Date(rep.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>

                    {/* Quoted Blessing Title */}
                    <h3 style={{
                      margin: '2px 0 0',
                      fontSize: '17px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-arabic-heading)',
                      color: 'var(--text-heading)',
                      lineHeight: '1.4'
                    }}>
                      «{rep.blessing_title || (isRtl ? 'نعمة بدون عنوان' : 'Untitled')}»
                    </h3>

                    {/* Reporter Notes if present */}
                    {rep.notes && (
                      <div style={{
                        background: 'var(--surface-sunken)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12.5px',
                        color: 'var(--text-main)'
                      }}>
                        <strong>{isRtl ? 'ملاحظة المبلّغ:' : 'Note:'}</strong> {rep.notes}
                      </div>
                    )}

                    {/* Clean Action Buttons Row (Completely inside card, no overflow!) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      marginTop: '6px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap'
                    }}>
                      {/* Button 1: Dismiss / Keep */}
                      <button
                        type="button"
                        onClick={() => handleDismissReport(rep.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'var(--surface-sunken)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Check size={14} />
                        <span>{isRtl ? 'تجاهل وحفظ' : 'Dismiss'}</span>
                      </button>

                      {/* Button 2: Edit & Correct Typo */}
                      <button
                        type="button"
                        onClick={() => handleStartEditFromReport(rep)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'rgba(212,175,55,0.14)',
                          border: '1px solid var(--color-gold)',
                          color: 'var(--color-primary)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Edit3 size={14} />
                        <span>{isRtl ? 'تعديل وتصحيح' : 'Edit & Fix'}</span>
                      </button>

                      {/* Button 2.5: Direct Message / Notice to Author */}
                      <button
                        type="button"
                        onClick={() => handleOpenAuthorMessage(rep, 'edit')}
                        title={isRtl ? 'إرسال إشعار أو رسالة توضيحية لصاحب النعمة' : 'Send notification to author'}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'rgba(44, 74, 62, 0.08)',
                          border: '1px solid rgba(44, 74, 62, 0.25)',
                          color: 'var(--color-primary)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Send size={13} color="var(--color-gold)" />
                        <span>{isRtl ? 'مراسلة المؤلف' : 'Message Author'}</span>
                      </button>

                      {/* Button 3: Delete Blessing Permanently */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBlessingAction({ id: rep.blessing_id, title: rep.blessing_title }, rep.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: '#C53030',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(197, 48, 48, 0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{isRtl ? 'حذف النعمة نهائياً' : 'Delete Permanently'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: FEEDBACK & SUGGESTIONS CONTENT */}
          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-sunken)', padding: '3px', borderRadius: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackFilter('all')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: feedbackFilter === 'all' ? 'var(--surface-card)' : 'transparent',
                      color: feedbackFilter === 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? `الكل (${feedbackList.length})` : `All (${feedbackList.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackFilter('suggestion')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: feedbackFilter === 'suggestion' ? 'var(--surface-card)' : 'transparent',
                      color: feedbackFilter === 'suggestion' ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'اقتراحات' : 'Suggestions'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackFilter('complaint')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: feedbackFilter === 'complaint' ? 'var(--surface-card)' : 'transparent',
                      color: feedbackFilter === 'complaint' ? '#C53030' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'شكاوى' : 'Issues'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadFeedbackData}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} className={isLoadingFeedback ? 'spinner-icon' : ''} />
                  <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
                </button>
              </div>

              {isLoadingFeedback ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {isRtl ? 'جاري جلب الرسائل...' : 'Loading feedback...'}
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold)',
                    margin: '0 auto 12px'
                  }}>
                    <MessageSquare size={26} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'لا توجد أي رسائل واردة حالياً' : 'No Feedback Received'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'ستظهر هنا مقترحات الزوار وشكاويهم فور إرسالها.' : 'User feedback will appear here instantly.'}
                  </p>
                </div>
              ) : (
                filteredFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: '20px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: fb.type === 'complaint' ? 'rgba(229,62,62,0.12)' : 'rgba(212,175,55,0.14)',
                          color: fb.type === 'complaint' ? '#C53030' : 'var(--color-gold-hover, #B38F26)',
                          border: `1px solid ${fb.type === 'complaint' ? 'rgba(229,62,62,0.25)' : 'rgba(212,175,55,0.3)'}`,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {fb.type === 'complaint' ? <AlertCircle size={13} /> : <Lightbulb size={13} />}
                          <span>{fb.type === 'complaint' ? (isRtl ? 'شكوى أو مشكلة' : 'Issue') : (isRtl ? 'اقتراح وتطوير' : 'Suggestion')}</span>
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: fb.status === 'accepted' ? 'rgba(56,161,105,0.15)' : (fb.status === 'rejected' ? 'rgba(229,62,62,0.15)' : 'rgba(160,174,192,0.15)'),
                          color: fb.status === 'accepted' ? '#38A169' : (fb.status === 'rejected' ? '#E53E3E' : 'var(--text-muted)')
                        }}>
                          {fb.status === 'accepted' ? (isRtl ? 'تم القبول ✓' : 'Accepted') : (fb.status === 'rejected' ? (isRtl ? 'تم الرفض ✕' : 'Rejected') : (isRtl ? 'قيد المراجعة' : 'Pending'))}
                        </span>
                      </div>

                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {new Date(fb.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {fb.title}
                    </h4>

                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {fb.content}
                    </p>

                    {(fb.user_name || fb.contact) && (
                      <div style={{
                        background: 'var(--surface-sunken)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        {fb.user_name && <span>{isRtl ? 'المرسل:' : 'From:'} <strong>{fb.user_name}</strong></span>}
                        {fb.contact && <span>{isRtl ? 'التواصل:' : 'Contact:'} <strong>{fb.contact}</strong></span>}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleAcceptFeedback(fb.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: fb.status === 'accepted' ? 'rgba(56,161,105,0.2)' : 'var(--surface-sunken)',
                          border: '1px solid rgba(56,161,105,0.3)',
                          color: '#38A169',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ThumbsUp size={13} />
                        <span>{isRtl ? 'قبول الاقتراح' : 'Accept'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectFeedback(fb.id)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: fb.status === 'rejected' ? 'rgba(229,62,62,0.15)' : 'var(--surface-sunken)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ThumbsDown size={13} />
                        <span>{isRtl ? 'رفض' : 'Reject'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeedbackAction(fb.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'rgba(229,62,62,0.08)',
                          border: '1px solid rgba(229,62,62,0.2)',
                          color: '#C53030',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{isRtl ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PUBLISHED BLESSINGS MANAGEMENT CONTENT (النعم المنشورة من المجتمع) */}
          {activeTab === 'published' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Informative Guidance Banner */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: 'var(--text-main)',
                lineHeight: '1.5'
              }}>
                <Globe size={18} color="var(--color-gold)" style={{ flexShrink: 0 }} />
                <span>
                  {isRtl 
                    ? 'قسم النعم المنشورة من مجتمع المنصة (السيرفر الحي): أي نعمة يتم حذفها من هنا تُحذف فوراً ونهائياً من قاعدة البيانات ومن جميع الأجهزة بما فيها جهاز صاحب النعمة.'
                    : 'Community published blessings (Live Server): Any blessing deleted from here is permanently purged from the database and all devices.'}
                </span>
              </div>

              {/* Search Bar for Published Blessings */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={publishedSearchQuery}
                  onChange={e => setPublishedSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في النعم المنشورة بالعنوان أو الكاتب أو التدبر...' : 'Search published blessings...'}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: isRtl ? '14px' : 'auto', left: isRtl ? 'auto' : '14px', top: '12px' }} />
                {publishedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPublishedSearchQuery('')}
                    style={{ position: 'absolute', left: isRtl ? '12px' : 'auto', right: isRtl ? 'auto' : '12px', top: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>
                  {isRtl ? `إجمالي النعم المنشورة: ${rawPublishedList.length}` : `Total Published Blessings: ${rawPublishedList.length}`}
                </span>
                {publishedSearchQuery && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isRtl ? `نتائج البحث: ${filteredPublishedBlessings.length}` : `Search results: ${filteredPublishedBlessings.length}`}
                  </span>
                )}
              </div>

              {filteredPublishedBlessings.length === 0 ? (
                <div style={{
                  background: 'var(--surface-card)',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-subtle)',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Globe size={36} color="var(--color-gold)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '6px' }}>
                    {isRtl ? 'لا توجد نعم منشورة حالياً من المجتمع' : 'No community published blessings yet'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {isRtl ? 'كل نعمة يشاركها الزوار ستظهر هنا فوراً للإدارة والتعديل والمراسلة.' : 'Shared blessings will appear here live for management.'}
                  </div>
                </div>
              ) : (
                filteredPublishedBlessings.map((b) => {
                  const praises = getBlessingPraises ? getBlessingPraises(b) : (b.praisesCount || 0);
                  return (
                    <div
                      key={b.id || b.title}
                      style={{
                        background: 'var(--surface-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(212,175,55,0.15)',
                              color: 'var(--color-gold)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Globe size={11} />
                              <span>{isRtl ? 'نعمة متشارَكة' : 'Community'}</span>
                            </span>

                            <span style={{
                              fontSize: '11.5px',
                              fontWeight: '600',
                              color: 'var(--color-primary)',
                              background: 'var(--surface-sunken)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <User size={11} />
                              <span>{isRtl ? `بقلم: ${b.author || 'محب للخير'}` : `By: ${b.author || 'Contributor'}`}</span>
                            </span>

                            <span style={{
                              fontSize: '11.5px',
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Heart size={11} color="var(--color-gold)" />
                              <span>{isRtl ? `${praises} حمدوا الله عليها` : `${praises} praises`}</span>
                            </span>
                          </div>

                          <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: 'var(--text-heading)' }}>
                            {b.title}
                          </h4>
                          <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                            {b.reflection}
                          </p>

                          {b.proof && (
                            <div style={{
                              padding: '8px 12px',
                              background: 'var(--surface-sunken)',
                              borderRadius: '10px',
                              borderRight: isRtl ? '3px solid var(--color-gold)' : 'none',
                              borderLeft: !isRtl ? '3px solid var(--color-gold)' : 'none',
                              fontSize: '12.5px',
                              color: 'var(--text-main)'
                            }}>
                              <div style={{ fontFamily: 'Amiri, serif', fontSize: '13.5px', marginBottom: '2px' }}>
                                {b.proof}
                              </div>
                              {b.proofSource && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {b.proofSource}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--color-primary)',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Edit3 size={13} />
                          <span>{isRtl ? 'تعديل وتصحيح' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAuthorMessage(b, 'message')}
                          title={isRtl ? 'إرسال رسالة في بريد إشعارات الناشر' : 'Send message to author inbox'}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            color: 'var(--color-primary)',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Send size={12} color="var(--color-gold)" />
                          <span>{isRtl ? 'مراسلة المؤلف' : 'Message Author'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBlessingAction(b)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            background: 'rgba(229,62,62,0.08)',
                            border: '1px solid rgba(229,62,62,0.2)',
                            color: '#C53030',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>{isRtl ? 'حذف نهائي' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: PLATFORM CATALOG CONTENT (كتالوج الـ 100 نعمة الأصلية) */}
          {activeTab === 'blessings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-heading)' }}>
                  {isRtl ? 'كتالوج نعم المنصة الأصلية (100 نعمة)' : 'Platform Blessings Catalog (100 Blessings)'}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {isRtl ? `المعروض: ${filteredCatalogBlessings.length}` : `Showing ${filteredCatalogBlessings.length}`}
                </span>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في نعم الكتالوج بالعنوان أو الشرح...' : 'Search catalog blessings...'}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: isRtl ? '14px' : 'auto', left: isRtl ? 'auto' : '14px', top: '12px' }} />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', left: isRtl ? '12px' : 'auto', right: isRtl ? 'auto' : '12px', top: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {filteredCatalogBlessings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                          {isRtl ? 'كتالوج المنصة' : 'Built-in'}
                        </span>
                        {b.categoryName && (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {b.categoryName}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                        {b.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {b.reflection}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(b)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlessingAction(b)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(229,62,62,0.08)',
                        border: '1px solid rgba(229,62,62,0.2)',
                        color: '#C53030',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{isRtl ? 'حذف' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: GLOBAL BROADCAST ANNOUNCEMENT CONTENT */}
          {activeTab === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Guidance Banner */}
              <div style={{
                background: 'rgba(49, 130, 206, 0.08)',
                border: '1px solid rgba(49, 130, 206, 0.25)',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--surface-card)',
                  border: '1px solid rgba(49, 130, 206, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3182ce',
                  flexShrink: 0
                }}>
                  <Megaphone size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'إذاعة رسالة وتنبيه عام لكافة مستخدمي التطبيق' : 'Broadcast Announcement to All App Users'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {isRtl 
                      ? 'الرسالة التي تنشرها هنا ستظهر لجميع مستخدمي منصة نِعْمَة دفعة واحدة فوراً في شاشة التطبيق.'
                      : 'Messages published here appear immediately to all active NEMAA users worldwide.'}
                  </p>
                </div>
              </div>

              {/* Active Broadcast Preview if exists */}
              {activeBroadcastInfo && (
                <div style={{
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        color: 'var(--color-gold)',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '8px'
                      }}>
                        {isRtl ? 'الإعلان النشط حالياً' : 'Currently Active Broadcast'}
                      </span>
                    </div>
                    {activeBroadcastInfo.createdAt && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(activeBroadcastInfo.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                      </span>
                    )}
                  </div>
                  <h5 style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {activeBroadcastInfo.title}
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {activeBroadcastInfo.message}
                  </p>
                </div>
              )}

              {/* Compose New Broadcast Form */}
              <form onSubmit={handlePublishBroadcast} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '18px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-heading)' }}>
                  {isRtl ? 'كتابة ونشر رسالة جديدة للجميع:' : 'Compose New Global Broadcast:'}
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>
                    {isRtl ? 'عنوان الإعلان أو التنبيه (اختياري)' : 'Announcement Title (optional)'}
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    placeholder={isRtl ? 'مثال: تحديث مبارك في المنصة، أو تذكير بفضل الشكر...' : 'e.g. New spiritual features or community notice...'}
                    maxLength={100}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Quick Templates */}
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    {isRtl ? 'قوالب مقترحة للسرعة (اضغط للتعبئة):' : 'Suggested quick templates:'}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      {
                        title: isRtl ? 'تذكير بفضل الشكر والحمد' : 'Gratitude Reminder',
                        msg: isRtl ? '«اللَّهُمَّ أَعِنَّا عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ».. نذكركم ونفسنا باستشعار نعم الله الظاهرة والباطنة في هذا اليوم المبارك، وجعل لسانك رطباً بحمده سبحانه.' : 'A gentle reminder to pause and thank Allah for endless blessings.'
                      },
                      {
                        title: isRtl ? 'تحديث مبارك وإضافات جديدة' : 'New Platform Update',
                        msg: isRtl ? 'تم بحمد الله وتوفيقه إضافة وتحديث مجموعة من النعم والتدبرات المحررة في المنصة، مع تسريع التصفح وتحسين تجربة المشاركة. تقبل الله طاعاتكم ونفع بكم.' : 'New curated reflections and features have been added to NEMAA platform.'
                      },
                      {
                        title: isRtl ? 'دعوة للمشاركة في نشر النعم' : 'Community Participation',
                        msg: isRtl ? 'يسرنا استقبال تدبراتكم واستشعاركم للنعم عبر زر «انشر نعمة» لتكون لكم صدقة جارية وينتفع بها إخوانكم في كل مكان. جزاكم الله خيراً.' : 'We welcome your shared blessings to inspire Muslims worldwide.'
                      },
                      {
                        title: isRtl ? 'صيانة دورية وتطوير' : 'Maintenance Notice',
                        msg: isRtl ? 'نعمل حالياً على تحسين الخوادم والخدمات لضمان أسرع استجابة وتجربة مريحة في المنصة، نشكر تفهمكم ودعواتكم الكريمة.' : 'Platform servers are undergoing maintenance to ensure the best experience.'
                      }
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBroadcastTitle(tpl.title);
                          setBroadcastMessage(tpl.msg);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: 'var(--surface-sunken)',
                          border: '1px dashed var(--border-subtle)',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          color: 'var(--text-main)',
                          textAlign: isRtl ? 'right' : 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        «{tpl.title}»
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>
                    {isRtl ? 'نص الرسالة العامة *' : 'Broadcast Message *'}
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder={isRtl ? 'اكتب الرسالة التي ستصل لجميع مستخدمي المنصة...' : 'Type message to be broadcasted to all users...'}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPublishingBroadcast || !broadcastMessage.trim()}
                  className="form-submit-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    cursor: (isPublishingBroadcast || !broadcastMessage.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isPublishingBroadcast || !broadcastMessage.trim()) ? 0.6 : 1,
                    background: 'linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  <Megaphone size={16} />
                  <span>{isPublishingBroadcast ? (isRtl ? 'جاري الإذاعة والنشر...' : 'Broadcasting...') : (isRtl ? '📢 نشر وإذاعة للجميع فوراً' : 'Broadcast to All Now')}</span>
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* Edit Modal (Admin Correction) */}
      {editingBlessing && (
        <EditSharedBlessingModal
          isOpen={Boolean(editingBlessing)}
          onClose={() => {
            setEditingBlessing(null);
            setAssociatedReportId(null);
          }}
          blessing={editingBlessing}
          onSave={handleSaveBlessingEdit}
          isAdmin={true}
          lang={lang}
        />
      )}

      {/* Send Author Message Modal (بريد الإشعارات للمؤلف - مصمم للهاتف دون أي قص) */}
      {messageRecipientBlessing && (
        <div 
          className="modal-overlay" 
          onClick={() => setMessageRecipientBlessing(null)} 
          role="dialog" 
          aria-modal="true" 
          style={{ zIndex: 10010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'min(92vh, calc(100dvh - 20px))',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface-card)',
              borderRadius: '22px',
              border: '1.5px solid var(--border-gold)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              animation: 'fadeIn 0.18s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(44,74,62,0.08) 100%)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)',
                  flexShrink: 0
                }}>
                  <Send size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'إرسال إشعار إلى بريد صاحب النعمة' : 'Send Notification to Author Inbox'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'سيصل التنبيه مباشرة في بريد إشعارات المستخدم داخل التطبيق' : 'Delivered directly to user in-app notifications inbox'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessageRecipientBlessing(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form 
              onSubmit={handleSendAuthorMessage} 
              style={{ 
                padding: '14px 18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* Target Blessing Summary */}
              <div style={{
                background: 'var(--surface-sunken)',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginBottom: '2px' }}>
                  {isRtl ? 'النعمة المستهدفة:' : 'Target Blessing:'}
                </div>
                <div style={{ fontWeight: '800', color: 'var(--color-primary-dark)', fontSize: '13px' }}>
                  «{messageRecipientBlessing.title || (isRtl ? 'نعمة منشورة' : 'Blessing')}»
                </div>
              </div>

              {/* Action Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>
                  {isRtl ? 'نوع الإشعار والتصنيف:' : 'Notification Category:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthorMessageAction('message')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: authorMessageAction === 'message' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'message' ? 'rgba(44, 74, 62, 0.12)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'message' ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'رسالة توضيحية' : 'Notice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthorMessageAction('edit')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: authorMessageAction === 'edit' ? '1.5px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'edit' ? 'rgba(212, 175, 55, 0.15)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'edit' ? 'var(--color-gold)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'تنبيه بتعديل' : 'Edit Notice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthorMessageAction('delete')}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: authorMessageAction === 'delete' ? '1.5px solid #E53E3E' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'delete' ? 'rgba(229, 62, 62, 0.12)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'delete' ? '#E53E3E' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'تنبيه بحذف' : 'Removal'}
                  </button>
                </div>
              </div>

              {/* Quick Template Chips (Compact 2x2 Grid) */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isRtl ? 'قوالب سريعة مقترحة (اضغط للتعبئة):' : 'Quick templates (click to apply):'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { label: isRtl ? 'تعديل صياغة المعنى' : 'Wording refinement', text: isRtl ? 'تم تعديل صياغة النعمة لضبط المعنى والاستدلال المباشر بما يتوافق مع معايير المنصة.' : 'Blessing text was refined to match our verified standards.' },
                    { label: isRtl ? 'حذف وفق الضوابط' : 'Removal notice', text: isRtl ? 'تم حذف النعمة بناءً على مراجعة ضوابط النشر، نشكر تفهمكم وحرصكم الدائم.' : 'Blessing was removed per publishing guidelines. Thank you for understanding.' },
                    { label: isRtl ? 'تصحيح أخطاء إملائية' : 'Typo correction', text: isRtl ? 'تم تصحيح بعض الأخطاء الإملائية مع تثبيت النعمة للجميع، جزاكم الله خيراً.' : 'Typographical corrections made while keeping your blessing published.' },
                    { label: isRtl ? 'شكر وتقدير للمؤلف' : 'Thank you', text: isRtl ? 'جزاك الله خيراً وبارك فيك على مساهمتك الطيبة في إيقاظ وعي الشكر.' : 'Thank you for your blessed contribution to NEMAA community.' }
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAuthorMessageText(tpl.text)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: 'var(--surface-sunken)',
                        border: '1px dashed var(--border-subtle)',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>
                  {isRtl ? 'نص الرسالة للمؤلف:' : 'Message to Author:'}
                </label>
                <textarea
                  value={authorMessageText}
                  onChange={e => setAuthorMessageText(e.target.value)}
                  placeholder={isRtl ? 'اكتب سبب التعديل أو الحذف، أو رسالة التقدير والتوجيه للمؤلف...' : 'Type message explaining the edit, removal or feedback...'}
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-main)',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Submit / Cancel Buttons (Fixed at bottom) */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setMessageRecipientBlessing(null)}
                  disabled={isSendingMessage}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage || !authorMessageText.trim()}
                  style={{
                    flex: 2,
                    padding: '9px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1b4535 0%, #0f2b21 100%)',
                    border: '1.5px solid var(--color-gold)',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: (isSendingMessage || !authorMessageText.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isSendingMessage || !authorMessageText.trim()) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={13} color="var(--color-gold)" />
                  <span>{isSendingMessage ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الإشعار فوراً' : 'Send Notification')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

