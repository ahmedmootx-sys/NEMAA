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
  Mail
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
  adminSendAuthorNotification
} from '../supabaseClient';
import EditSharedBlessingModal from './EditSharedBlessingModal';

export default function AdminScreen({ 
  isOpen, 
  onClose, 
  allBlessings = [], 
  onDeleteBlessing,
  onUpdateBlessing,
  lang = 'ar' 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'feedback' | 'blessings'
  
  // Reports
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Feedback (الشكاوى والمقترحات)
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'suggestion' | 'complaint'

  // Blessings Management
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

  // Open author messaging modal
  const handleOpenAuthorMessage = (item, defaultAction = 'message') => {
    setMessageRecipientBlessing({
      id: item.blessing_id || item.id || '',
      title: item.blessing_title || item.title || '',
      author: item.author || ''
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

  // Filtered blessings list for management tab
  const filteredBlessings = useMemo(() => {
    return allBlessings.filter(b => {
      if (filterCategory === 'shared' && !b.isShared) return false;
      if (filterCategory !== 'all' && filterCategory !== 'shared' && b.category !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (b.title || '').toLowerCase().includes(q);
        const inRef = (b.reflection || '').toLowerCase().includes(q);
        const inAuthor = (b.author || '').toLowerCase().includes(q);
        if (!inTitle && !inRef && !inAuthor) return false;
      }
      return true;
    });
  }, [allBlessings, filterCategory, searchQuery]);

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
          {/* Segmented Full-Width Tab Navigation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: 'var(--surface-sunken)',
            padding: '5px',
            borderRadius: '16px',
            gap: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Tab 1: Reports */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '10px 8px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'reports' ? '#C53030' : 'var(--text-muted)',
                fontWeight: activeTab === 'reports' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeTab === 'reports' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Flag size={15} color={activeTab === 'reports' ? '#C53030' : 'currentColor'} />
              <span>{isRtl ? 'البلاغات' : 'Reports'}</span>
              {reports.length > 0 && (
                <span style={{
                  background: '#E53E3E',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '1px 7px',
                  borderRadius: '10px'
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
                padding: '10px 8px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'feedback' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'feedback' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'feedback' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeTab === 'feedback' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={15} color={activeTab === 'feedback' ? 'var(--color-gold)' : 'currentColor'} />
              <span>{isRtl ? 'الشكاوى والمقترحات' : 'Feedback'}</span>
              {feedbackList.length > 0 && (
                <span style={{
                  background: 'var(--color-gold)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {feedbackList.length}
                </span>
              )}
            </button>

            {/* Tab 3: Blessings Management */}
            <button
              type="button"
              onClick={() => setActiveTab('blessings')}
              style={{
                padding: '10px 8px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'blessings' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'blessings' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'blessings' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeTab === 'blessings' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={15} color={activeTab === 'blessings' ? 'var(--color-primary)' : 'currentColor'} />
              <span>{isRtl ? 'إدارة النعم' : 'Blessings'}</span>
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

          {/* TAB 3: BLESSINGS MANAGEMENT CONTENT */}
          {activeTab === 'blessings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في النعم بالعنوان أو الشرح أو الكاتب...' : 'Search blessings...'}
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

              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '0 4px' }}>
                {isRtl ? `إجمالي النعم المعروضة: ${filteredBlessings.length}` : `Showing ${filteredBlessings.length} blessings`}
              </div>

              {filteredBlessings.map((b) => (
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
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: b.isShared ? 'rgba(212,175,55,0.15)' : 'var(--surface-sunken)', color: b.isShared ? 'var(--color-gold)' : 'var(--text-muted)' }}>
                          {b.isShared ? (isRtl ? 'متشارَكة' : 'Community') : (isRtl ? 'كتالوج التطبيق' : 'Built-in')}
                        </span>
                        {b.author && b.author !== 'محب للخير' && (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {isRtl ? `بقلم: ${b.author}` : `By: ${b.author}`}
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
                      onClick={() => handleOpenAuthorMessage(b, 'message')}
                      title={isRtl ? 'إرسال رسالة أو توضيح في بريد المؤلف' : 'Send message to author inbox'}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Send size={12} color="var(--color-gold)" />
                      <span>{isRtl ? 'مراسلة المؤلف' : 'Message'}</span>
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

      {/* Send Author Message Modal (بريد الإشعارات للمؤلف) */}
      {messageRecipientBlessing && (
        <div 
          className="modal-overlay" 
          onClick={() => setMessageRecipientBlessing(null)} 
          role="dialog" 
          aria-modal="true" 
          style={{ zIndex: 10010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface-card)',
              borderRadius: '24px',
              border: '1.5px solid var(--border-gold)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              animation: 'fadeIn 0.18s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(44,74,62,0.08) 100%)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)',
                  flexShrink: 0
                }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {isRtl ? 'إرسال إشعار إلى بريد صاحب النعمة' : 'Send Notification to Author Inbox'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {isRtl ? 'سيصل التنبيه مباشرة في بريد إشعارات المستخدم داخل التطبيق' : 'Delivered directly to user in-app notifications inbox'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessageRecipientBlessing(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form 
              onSubmit={handleSendAuthorMessage} 
              style={{ 
                padding: '16px 20px 20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* Target Blessing Summary */}
              <div style={{
                background: 'var(--surface-sunken)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12.5px'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>
                  {isRtl ? 'النعمة المستهدفة:' : 'Target Blessing:'}
                </div>
                <div style={{ fontWeight: '800', color: 'var(--color-primary-dark)', fontSize: '13.5px' }}>
                  «{messageRecipientBlessing.title || (isRtl ? 'نعمة منشورة' : 'Blessing')}»
                </div>
              </div>

              {/* Action Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {isRtl ? 'نوع الإشعار والتصنيف:' : 'Notification Category:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthorMessageAction('message')}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '10px',
                      border: authorMessageAction === 'message' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'message' ? 'rgba(44, 74, 62, 0.12)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'message' ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '11.5px',
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
                      padding: '7px 4px',
                      borderRadius: '10px',
                      border: authorMessageAction === 'edit' ? '1.5px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'edit' ? 'rgba(212, 175, 55, 0.15)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'edit' ? 'var(--color-gold)' : 'var(--text-muted)',
                      fontSize: '11.5px',
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
                      padding: '7px 4px',
                      borderRadius: '10px',
                      border: authorMessageAction === 'delete' ? '1.5px solid #E53E3E' : '1px solid var(--border-subtle)',
                      background: authorMessageAction === 'delete' ? 'rgba(229, 62, 62, 0.12)' : 'var(--surface-sunken)',
                      color: authorMessageAction === 'delete' ? '#E53E3E' : 'var(--text-muted)',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isRtl ? 'تنبيه بحذف' : 'Removal'}
                  </button>
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  {isRtl ? 'قوالب سريعة مقترحة (اضغط للتعبئة):' : 'Quick templates (click to apply):'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    isRtl ? 'تم تعديل صياغة النعمة لضبط المعنى والاستدلال المباشر بما يتوافق مع معايير المنصة.' : 'Blessing text was refined to match our verified standards.',
                    isRtl ? 'تم حذف النعمة بناءً على مراجعة ضوابط النشر، نشكر تفهمكم وحرصكم الدائم.' : 'Blessing was removed per publishing guidelines. Thank you for understanding.',
                    isRtl ? 'تم تصحيح بعض الأخطاء الإملائية مع تثبيت النعمة للجميع، جزاكم الله خيراً.' : 'Typographical corrections made while keeping your blessing published.',
                    isRtl ? 'جزاك الله خيراً وبارك فيك على مساهمتك الطيبة في إيقاظ وعي الشكر.' : 'Thank you for your blessed contribution to NEMAA community.'
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAuthorMessageText(tpl)}
                      style={{
                        padding: '6px 9px',
                        borderRadius: '8px',
                        background: 'var(--surface-sunken)',
                        border: '1px dashed var(--border-subtle)',
                        fontSize: '11px',
                        textAlign: isRtl ? 'right' : 'left',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        lineHeight: '1.4',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      «{tpl}»
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
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
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setMessageRecipientBlessing(null)}
                  disabled={isSendingMessage}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '12.5px',
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
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1b4535 0%, #0f2b21 100%)',
                    border: '1.5px solid var(--color-gold)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: (isSendingMessage || !authorMessageText.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isSendingMessage || !authorMessageText.trim()) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} color="var(--color-gold)" />
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

