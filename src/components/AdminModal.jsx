import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Trash2, 
  Check, 
  AlertTriangle, 
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
  AlertCircle
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
  subscribeToFeedback
} from '../supabaseClient';
import EditSharedBlessingModal from './EditSharedBlessingModal';

export default function AdminModal({ 
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

  // Realtime subscription for incoming reports while admin modal is open
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

  // Realtime subscription for incoming feedback while admin modal is open
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const unsub = subscribeToFeedback(
      (newFb) => {
        setFeedbackList(prev => {
          if (prev.some(f => f.id === newFb.id)) return prev;
          return [newFb, ...prev];
        });
      },
      (deletedFb) => {
        setFeedbackList(prev => prev.filter(f => f.id !== deletedFb.id));
      },
      (updatedFb) => {
        setFeedbackList(prev => prev.map(f => f.id === updatedFb.id ? { ...f, ...updatedFb } : f));
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen, currentUser]);

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await fetchBlessingReports();
      setReports(data);
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadFeedbackData = async () => {
    setIsLoadingFeedback(true);
    try {
      const data = await fetchFeedback();
      setFeedbackList(data);
    } catch (err) {
      console.warn('Error loading feedback:', err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        setCurrentUser(res.user);
        setPassword('');
        loadReports();
        loadFeedbackData();
      } else {
        setAuthError(res.error || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
      }
    } catch (err) {
      setAuthError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

  // Delete blessing from Admin Panel
  const handleDeleteBlessingAction = async (blessingItem, reportIdToDismiss = null) => {
    const isObj = typeof blessingItem === 'object' && blessingItem !== null;
    const title = isObj ? (blessingItem.title || '') : String(blessingItem);
    const blessingId = isObj ? blessingItem.id : blessingItem;

    const promptMsg = lang === 'ar'
      ? `هل أنت متأكد من رغبتك في حذف نعمة «${title}» نهائياً من التطبيق وقاعدة البيانات لجميع المستخدمين؟`
      : `Are you sure you want to permanently delete "${title}" for all users?`;
    if (!window.confirm(promptMsg)) return;

    try {
      // 1. Delete from Supabase & notify app
      if (onDeleteBlessing) {
        await onDeleteBlessing(blessingItem, currentUser?.email || 'admin');
      } else {
        await deleteSharedBlessing(blessingItem);
      }

      // 2. If called from reports, dismiss the report
      if (reportIdToDismiss) {
        await dismissBlessingReport(reportIdToDismiss);
        setReports(prev => prev.filter(r => r.id !== reportIdToDismiss));
      }

      // Also clean any other reports matching this blessing
      setReports(prev => prev.filter(r => String(r.blessing_id) !== String(blessingId) && r.blessing_title !== title));

      setStatusNotice(lang === 'ar' ? 'تم حذف النعمة نهائياً وتطبيق ذلك لجميع المستخدمين' : 'Blessing permanently deleted for all users');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.warn('Failed to delete blessing:', err);
      setStatusNotice(lang === 'ar' ? 'حدث خطأ أثناء محاولة الحذف' : 'Failed to delete blessing');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Dismiss report without deleting blessing
  const handleDismissReport = async (reportId) => {
    await dismissBlessingReport(reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    setStatusNotice(lang === 'ar' ? 'تم حفظ وتجاهل البلاغ' : 'Report dismissed');
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

      // If this edit resolved an open report, dismiss it automatically
      if (associatedReportId) {
        await dismissBlessingReport(associatedReportId);
        setReports(prev => prev.filter(r => r.id !== associatedReportId));
        setAssociatedReportId(null);
      }

      setEditingBlessing(null);
      setStatusNotice(lang === 'ar' ? 'تم تعديل وتصحيح النعمة بنجاح لجميع المستخدمين' : 'Blessing updated successfully for all users');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.warn('Error saving blessing edit:', err);
      setStatusNotice(lang === 'ar' ? 'حدث خطأ أثناء حفظ التعديل' : 'Failed to save changes');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Feedback Actions
  const handleAcceptFeedback = async (id) => {
    await updateFeedbackStatus(id, 'accepted');
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'accepted' } : f));
    setStatusNotice(lang === 'ar' ? 'تمت الموافقة على الاقتراح بنجاح' : 'Feedback accepted');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const handleRejectFeedback = async (id) => {
    await updateFeedbackStatus(id, 'rejected');
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'rejected' } : f));
    setStatusNotice(lang === 'ar' ? 'تم رفض الملاحظة' : 'Feedback rejected');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  const handleDeleteFeedbackAction = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Delete this message?')) return;
    await deleteFeedback(id);
    setFeedbackList(prev => prev.filter(f => f.id !== id));
    setStatusNotice(lang === 'ar' ? 'تم حذف الرسالة بنجاح' : 'Message deleted');
    setTimeout(() => setStatusNotice(''), 3000);
  };

  // Filtered blessings list for management tab
  const filteredBlessings = useMemo(() => {
    return allBlessings.filter(b => {
      // Category filter
      if (filterCategory === 'shared' && !b.isShared) return false;
      if (filterCategory !== 'all' && filterCategory !== 'shared' && b.category !== filterCategory) return false;

      // Search query
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
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content admin-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '94%',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
          color: '#FFFFFF',
          borderBottom: '1.5px solid var(--border-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid #D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#D4AF37" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                لوحة المشرف والتحكم المركزي
              </h3>
              <span style={{ fontSize: '12px', color: '#D4AF37' }}>
                {currentUser ? `مرحباً بك: ${currentUser.email}` : 'تسجيل دخول المشرف المعتمد'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                title="تسجيل الخروج"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                <span>خروج</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              style={{ color: '#FFFFFF', position: 'static' }}
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Notice Toast if present */}
        {statusNotice && (
          <div style={{
            background: 'var(--color-gold-light)',
            color: 'var(--color-primary-dark)',
            borderBottom: '1px solid var(--color-gold)',
            padding: '10px 24px',
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

        {/* Content Body: Login screen vs Dashboard */}
        {!currentUser ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(44, 74, 62, 0.08)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Lock size={28} color="var(--color-primary)" />
            </div>

            <h4 style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--text-heading)' }}>
              تسجيل الدخول للوحة التحكم
            </h4>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '380px' }}>
              الوصول مقتصر على المشرف المصرح له بمراجعة البلاغات والشكاوى وإدارة محتوى النعم.
            </p>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  border: '1px solid #E53E3E',
                  color: '#C53030',
                  fontSize: '13px',
                  textAlign: 'center'
                }}>
                  {authError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  البريد الإلكتروني للأدمن
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
                  كلمة المرور
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
                  background: 'linear-gradient(135deg, #1A382B 0%, #2C4A3E 60%, #15261F 100%)',
                  color: '#FFFFFF',
                  border: '1.5px solid #D4AF37',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)'
                }}
              >
                {isLoggingIn ? 'جاري التحقق...' : 'دخول المشرف'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs Bar */}
            <div style={{ display: 'flex', gap: '8px', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', overflowX: 'auto' }}>
              
              {/* Tab 1: Reports */}
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                style={{
                  padding: '13px 14px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'reports' ? '700' : '500',
                  color: activeTab === 'reports' ? '#C53030' : 'var(--text-muted)',
                  borderBottom: activeTab === 'reports' ? '2.5px solid #C53030' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Flag size={15} color="#C53030" />
                <span>البلاغات الواردة</span>
                {reports.length > 0 && (
                  <span style={{ background: '#E53E3E', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', padding: '1px 7px', borderRadius: '9999px' }}>
                    {reports.length}
                  </span>
                )}
              </button>

              {/* Tab 2: Feedback & Suggestions (الشكاوى والمقترحات) */}
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                style={{
                  padding: '13px 14px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'feedback' ? '700' : '500',
                  color: activeTab === 'feedback' ? 'var(--color-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'feedback' ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <MessageSquare size={15} color="var(--color-gold)" />
                <span>الشكاوى والمقترحات</span>
                {feedbackList.length > 0 && (
                  <span style={{ background: 'var(--color-gold)', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', padding: '1px 7px', borderRadius: '9999px' }}>
                    {feedbackList.length}
                  </span>
                )}
              </button>

              {/* Tab 3: Blessings Management */}
              <button
                type="button"
                onClick={() => setActiveTab('blessings')}
                style={{
                  padding: '13px 14px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'blessings' ? '700' : '500',
                  color: activeTab === 'blessings' ? 'var(--color-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'blessings' ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Layers size={15} />
                <span>إدارة كافة النعم ({allBlessings.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              
              {/* TAB 1: REPORTS */}
              {activeTab === 'reports' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-title)' }}>
                      قائمة النعم المُبلّغ عنها للمراجعة:
                    </h4>
                    <button
                      type="button"
                      onClick={loadReports}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={13} />
                      <span>تحديث البلاغات</span>
                    </button>
                  </div>

                  {isLoadingReports ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      جاري تحميل البلاغات...
                    </div>
                  ) : reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '45px 16px', background: 'var(--surface-sunken)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                      <Check size={32} color="#38A169" style={{ margin: '0 auto 10px' }} />
                      <h4 style={{ margin: '0 0 4px', color: 'var(--color-primary)', fontSize: '16px' }}>
                        لا توجد أي بلاغات معلقة حالياً بحمد الله
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                        كافة النعم المعروضة في التطبيق نقية ومطابقة لمعايير الأدب والتدبر.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reports.map((rep) => (
                        <div 
                          key={rep.id}
                          style={{
                            background: 'var(--surface-sunken)',
                            border: '1.5px solid rgba(229, 62, 62, 0.25)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ background: 'rgba(229, 62, 62, 0.15)', color: '#C53030', border: '1px solid rgba(229, 62, 62, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                  {rep.reason || 'محتوى غير لائق'}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                                  {new Date(rep.created_at).toLocaleString('ar-EG')}
                                </span>
                              </div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-title)', fontFamily: 'var(--font-arabic-title)' }}>
                                «{rep.blessing_title || 'نعمة بدون عنوان'}»
                              </h4>
                              {rep.notes && (
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', background: 'var(--surface-card)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                  ملاحظة المبلّغ: {rep.notes}
                                </p>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                              <button
                                type="button"
                                onClick={() => handleDismissReport(rep.id)}
                                title="تجاهل البلاغ وإبقاؤه"
                                style={{
                                  background: 'var(--surface-card)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '7px 14px',
                                  fontSize: '12.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                تجاهل وحفظ
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEditFromReport(rep)}
                                title="تعديل وتصحيح الخطأ الإملائي للنعمة"
                                style={{
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  color: 'var(--color-gold-hover)',
                                  border: '1px solid var(--color-gold)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '7px 14px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <Edit3 size={13} />
                                <span>تعديل وتصحيح</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBlessingAction({ id: rep.blessing_id, title: rep.blessing_title }, rep.id)}
                                title="حذف النعمة نهائياً من التطبيق"
                                style={{
                                  background: '#C53030',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '7px 16px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 4px 12px rgba(197, 48, 48, 0.3)'
                                }}
                              >
                                <Trash2 size={13} />
                                <span>حذف النعمة فوراً</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FEEDBACK & SUGGESTIONS (الشكاوى والمقترحات) */}
              {activeTab === 'feedback' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('all')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: feedbackFilter === 'all' ? '1px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                          background: feedbackFilter === 'all' ? 'rgba(212,175,55,0.18)' : 'var(--surface-sunken)',
                          color: feedbackFilter === 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        الكل ({feedbackList.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('suggestion')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: feedbackFilter === 'suggestion' ? '1px solid var(--color-gold)' : '1px solid var(--border-subtle)',
                          background: feedbackFilter === 'suggestion' ? 'rgba(212,175,55,0.18)' : 'var(--surface-sunken)',
                          color: feedbackFilter === 'suggestion' ? 'var(--color-primary)' : 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        المقترحات ({feedbackList.filter(f => f.type === 'suggestion').length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('complaint')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: feedbackFilter === 'complaint' ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                          background: feedbackFilter === 'complaint' ? 'rgba(229,62,62,0.14)' : 'var(--surface-sunken)',
                          color: feedbackFilter === 'complaint' ? '#C53030' : 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        الشكاوى ({feedbackList.filter(f => f.type === 'complaint').length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={loadFeedbackData}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={13} />
                      <span>تحديث الرسائل</span>
                    </button>
                  </div>

                  {isLoadingFeedback ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      جاري تحميل الشكاوى والمقترحات...
                    </div>
                  ) : filteredFeedback.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '45px 16px', background: 'var(--surface-sunken)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                      <Check size={32} color="#38A169" style={{ margin: '0 auto 10px' }} />
                      <h4 style={{ margin: '0 0 4px', color: 'var(--color-primary)', fontSize: '16px' }}>
                        لا توجد رسائل في هذا القسم حالياً
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                        تصل هنا اقتراحات وتطويرات المستخدمين وملاحظاتهم فور إرسالها من صفحة الإعدادات.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {filteredFeedback.map((fb) => (
                        <div
                          key={fb.id}
                          style={{
                            background: 'var(--surface-sunken)',
                            border: fb.status === 'accepted' ? '1.5px solid #38A169' : fb.status === 'rejected' ? '1.5px solid #E53E3E' : '1px solid var(--border-subtle)',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{
                                  background: fb.type === 'suggestion' ? 'rgba(212,175,55,0.18)' : 'rgba(229,62,62,0.15)',
                                  color: fb.type === 'suggestion' ? 'var(--color-gold-hover)' : '#C53030',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {fb.type === 'suggestion' ? <Lightbulb size={11} /> : <AlertCircle size={11} />}
                                  <span>{fb.type === 'suggestion' ? 'اقتراح وتطوير' : 'شكوى وملاحظة'}</span>
                                </span>

                                <span style={{
                                  background: fb.status === 'accepted' ? 'rgba(56,161,105,0.15)' : fb.status === 'rejected' ? 'rgba(229,62,62,0.15)' : 'rgba(212,175,55,0.15)',
                                  color: fb.status === 'accepted' ? '#2F855A' : fb.status === 'rejected' ? '#C53030' : 'var(--color-gold-hover)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700'
                                }}>
                                  {fb.status === 'accepted' ? 'تم القبول ✅' : fb.status === 'rejected' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                                </span>

                                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                                  {new Date(fb.created_at).toLocaleString('ar-EG')}
                                </span>
                              </div>

                              <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--text-heading)' }}>
                                {fb.title}
                              </h4>

                              <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.6', background: 'var(--surface-card)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                                {fb.content}
                              </p>

                              {(fb.user_name || fb.contact) && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
                                  {fb.user_name && <span>المرسل: <strong>{fb.user_name}</strong></span>}
                                  {fb.contact && <span>وسيلة التواصل: <strong>{fb.contact}</strong></span>}
                                </div>
                              )}
                            </div>

                            {/* Actions: Accept, Reject, Delete */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                              <button
                                type="button"
                                onClick={() => handleAcceptFeedback(fb.id)}
                                title="قبول الاقتراح"
                                style={{
                                  background: fb.status === 'accepted' ? '#38A169' : 'var(--surface-card)',
                                  color: fb.status === 'accepted' ? '#FFFFFF' : '#38A169',
                                  border: '1px solid #38A169',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ThumbsUp size={13} />
                                <span>قبول</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectFeedback(fb.id)}
                                title="رفض الملاحظة"
                                style={{
                                  background: fb.status === 'rejected' ? '#C53030' : 'var(--surface-card)',
                                  color: fb.status === 'rejected' ? '#FFFFFF' : '#C53030',
                                  border: '1px solid #C53030',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ThumbsDown size={13} />
                                <span>رفض</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFeedbackAction(fb.id)}
                                title="حذف الرسالة"
                                style={{
                                  background: 'transparent',
                                  color: '#E53E3E',
                                  border: '1px solid rgba(229,62,62,0.3)',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ALL BLESSINGS MANAGEMENT */}
              {activeTab === 'blessings' && (
                <div>
                  {/* Search and Filters Bar */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                      <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن أي نعمة بالاسم أو النص..."
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-main)',
                          fontSize: '13.5px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">كافة النعم</option>
                      <option value="shared">النعم المتشارَكة فقط</option>
                      <option value="hidden">النعم الباطنة والخفية</option>
                      <option value="body">الصحة والجسد</option>
                      <option value="spiritual">نعم إيمانية وقلبية</option>
                      <option value="family">الأهل والمودة</option>
                      <option value="daily">نعم يومية معتادة</option>
                    </select>
                  </div>

                  {/* Blessings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredBlessings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        لا توجد نعم مطابقة للبحث أو التصنيف
                      </div>
                    ) : (
                      filteredBlessings.map((b) => (
                        <div 
                          key={b.id}
                          style={{
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '14px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: '700' }}>
                                {b.categoryName || 'نعم الله'}
                              </span>
                              {b.isShared && (
                                <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold-hover)', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                                  متشارَكة
                                </span>
                              )}
                              {b.author && b.author !== 'محب للخير' && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  بقلم: {b.author}
                                </span>
                              )}
                            </div>
                            <h5 style={{ margin: '0 0 2px', fontSize: '15px', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.title}
                            </h5>
                            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.reflection}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(b)}
                              title="تعديل وتصحيح هذه النعمة"
                              style={{
                                background: 'rgba(212, 175, 55, 0.12)',
                                border: '1px solid var(--color-gold)',
                                color: 'var(--color-gold-hover)',
                                borderRadius: 'var(--radius-full)',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={13} />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBlessingAction(b)}
                              title="حذف النعمة نهائياً"
                              style={{
                                background: 'rgba(229, 62, 62, 0.1)',
                                border: '1px solid rgba(229, 62, 62, 0.3)',
                                color: '#C53030',
                                borderRadius: 'var(--radius-full)',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Trash2 size={13} />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Sub-Modal for Editing Blessing */}
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
      </div>
    </div>
  );
}
