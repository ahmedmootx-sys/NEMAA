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
  Edit3
} from 'lucide-react';
import { 
  adminLogin, 
  adminLogout, 
  getAdminUser, 
  fetchBlessingReports, 
  dismissBlessingReport,
  deleteSharedBlessing 
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
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'blessings'
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
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
      }
    }
    checkAuth();
  }, [isOpen]);

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
      ? `هل أنت متأكد من رغبتك في حذف نعمة «${title}» نهائياً من التطبيق وقاعدة البيانات؟`
      : `Are you sure you want to permanently delete "${title}"?`;
    if (!window.confirm(promptMsg)) return;

    try {
      // 1. Delete from Supabase & notify app
      if (onDeleteBlessing) {
        await onDeleteBlessing(blessingItem);
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

      setStatusNotice(lang === 'ar' ? 'تم حذف النعمة نهائياً بنجاح' : 'Blessing permanently deleted');
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
      isShared: true
    };
    setEditingBlessing(match);
    setAssociatedReportId(rep.id);
  };

  // Start editing a blessing directly from the Management list
  const handleStartEdit = (blessing) => {
    setEditingBlessing(blessing);
    setAssociatedReportId(null);
  };

  // Save the edited blessing (updates Supabase & local state, auto-resolves report if from report)
  const handleSaveBlessingEdit = async (updatedFields) => {
    if (!editingBlessing) return;
    try {
      if (onUpdateBlessing) {
        await onUpdateBlessing(editingBlessing, updatedFields);
      }

      // If the edit came from a report, auto-dismiss the resolved report
      if (associatedReportId) {
        await dismissBlessingReport(associatedReportId);
        setReports(prev => prev.filter(r => r.id !== associatedReportId));
      }

      setStatusNotice(lang === 'ar' ? 'تم تصحيح وحفظ النعمة بنجاح ✨' : 'Blessing updated successfully ✨');
      setTimeout(() => setStatusNotice(''), 4000);
      setEditingBlessing(null);
      setAssociatedReportId(null);
    } catch (err) {
      console.warn('Admin edit save error:', err);
      setStatusNotice(lang === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to update blessing');
      setTimeout(() => setStatusNotice(''), 4000);
    }
  };

  // Filtered blessings list for Management tab
  const filteredBlessings = useMemo(() => {
    return allBlessings.filter(b => {
      const matchesSearch = !searchQuery.trim() || 
        (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.reflection || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = filterCategory === 'all' ||
        (filterCategory === 'shared' && b.isShared) ||
        (b.category === filterCategory);

      return matchesSearch && matchesCat;
    });
  }, [allBlessings, searchQuery, filterCategory]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content guide-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'var(--surface-card)',
          border: '2px solid #D4AF37',
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.25)',
          overflow: 'hidden'
        }}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="var(--color-gold)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '19px', fontFamily: 'var(--font-arabic-heading)', color: 'var(--text-title)' }}>
                  {lang === 'ar' ? 'لوحة تحكم إدارة منصة نِعْمَة' : 'NEMAA Admin Moderation Panel'}
                </h3>
                {currentUser && (
                  <span style={{ fontSize: '11px', background: 'rgba(56, 161, 105, 0.15)', color: '#38A169', border: '1px solid rgba(56, 161, 105, 0.3)', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                    مشرف نشط
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {lang === 'ar' ? 'إدارة النعم ومراجعة البلاغات والحذف الفوري' : 'Manage blessings, review reports, and moderate content'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                title="تسجيل الخروج من لوحة الإدارة"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogOut size={13} />
                <span>خروج</span>
              </button>
            )}

            <button 
              type="button" 
              className="btn-icon" 
              onClick={onClose}
              aria-label="إغلاق"
              style={{ width: '36px', height: '36px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Notice Toast Banner */}
        {statusNotice && (
          <div style={{ background: 'rgba(56, 161, 105, 0.14)', borderBottom: '1px solid rgba(56, 161, 105, 0.3)', padding: '10px 20px', fontSize: '13px', color: '#276749', fontWeight: '700', textAlign: 'center' }}>
            {statusNotice}
          </div>
        )}

        {/* View Content: Login Form vs Admin Dashboard */}
        {!currentUser ? (
          <div style={{ padding: '36px 24px', maxWidth: '420px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.12)', border: '1.5px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Lock size={26} color="var(--color-gold)" />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--text-title)' }}>
                تسجيل دخول المشرف
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                أدخل بيانات حساب الأدمن المعتمد على Supabase للوصول إلى أدوات الإدارة
              </p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(229, 62, 62, 0.12)', border: '1px solid rgba(229, 62, 62, 0.3)', color: '#E53E3E', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    direction: 'ltr',
                    textAlign: 'right'
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
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                style={{
                  flex: 1,
                  padding: '13px 10px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: activeTab === 'reports' ? '700' : '500',
                  color: activeTab === 'reports' ? '#C53030' : 'var(--text-muted)',
                  borderBottom: activeTab === 'reports' ? '2.5px solid #C53030' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Flag size={16} color="#C53030" />
                <span>البلاغات الواردة</span>
                {reports.length > 0 && (
                  <span style={{ background: '#E53E3E', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', padding: '1px 7px', borderRadius: '9999px' }}>
                    {reports.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blessings')}
                style={{
                  flex: 1,
                  padding: '13px 10px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: activeTab === 'blessings' ? '700' : '500',
                  color: activeTab === 'blessings' ? 'var(--color-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'blessings' ? '2.5px solid var(--color-gold)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Layers size={16} />
                <span>إدارة كافة النعم ({allBlessings.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {activeTab === 'reports' ? (
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
              ) : (
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

                  {/* List of Blessings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredBlessings.map(b => (
                      <div 
                        key={b.id}
                        style={{
                          background: 'var(--surface-sunken)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-gold)', background: 'rgba(212, 175, 55, 0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                              {b.categoryName || 'نعمة'}
                            </span>
                            {b.isShared && (
                              <span style={{ fontSize: '11px', color: '#3182CE', background: 'rgba(49, 130, 206, 0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                متشاركة
                              </span>
                            )}
                            {b.author && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                بقلم: {b.author}
                              </span>
                            )}
                          </div>
                          <h4 style={{ margin: '0 0 3px', fontSize: '15px', color: 'var(--text-title)', fontFamily: 'var(--font-arabic-title)' }}>
                            «{b.title}»
                          </h4>
                          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {b.reflection}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(b)}
                            title="تعديل وتصحيح محتوى النعمة"
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
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBlessingAction(b)}
                            style={{
                              background: 'rgba(229, 62, 62, 0.12)',
                              color: '#E53E3E',
                              border: '1px solid rgba(229, 62, 62, 0.3)',
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
                            <Trash2 size={13} />
                            <span>حذف نهائي</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Modal: Admin Edit Blessing */}
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
    </div>
  );
}
