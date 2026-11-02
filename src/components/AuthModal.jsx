import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  lang = 'ar'
}) {
  const isRtl = lang === 'ar';
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'magiclink'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }

    if (mode !== 'magiclink' && (!password || password.length < 6)) {
      setErrorMsg(isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;
        setSuccessMsg(isRtl ? 'تم تسجيل الدخول بنجاح! جاري مزامنة نعمك...' : 'Signed in successfully!');
        if (onAuthSuccess) onAuthSuccess(data?.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              registered_at: new Date().toISOString()
            }
          }
        });
        if (error) throw error;
        if (data?.session) {
          setSuccessMsg(isRtl ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح!' : 'Account created successfully!');
          if (onAuthSuccess) onAuthSuccess(data?.user);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setSuccessMsg(isRtl ? 'تم إنشاء الحساب! أرسلنا رابط تأكيد إلى بريدك الإلكتروني.' : 'Account created! Please check your email for confirmation link.');
        }
      } else if (mode === 'magiclink') {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined
          }
        });
        if (error) throw error;
        setSuccessMsg(isRtl ? 'أرسلنا رابط الدخول السريع إلى بريدك الإلكتروني!' : 'Magic link sent to your email!');
      }
    } catch (err) {
      console.warn('Auth error:', err);
      let msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        msg = isRtl ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
      } else if (msg.includes('User already registered')) {
        msg = isRtl ? 'هذا البريد مسجل مسبقاً، يرجى اختيار تسجيل الدخول' : 'Email already registered. Please sign in';
      } else if (msg.includes('Password should be at least')) {
        msg = isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      style={{
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--surface-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-sunken)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(212,175,55,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-heading)' }}>
                {isRtl ? 'حسابي في نِعْمَة' : 'My NEMAA Account'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isRtl ? 'حفظ نعمك المنشورة وإعداداتك سحابياً للأبد' : 'Preserve your blessings in the cloud permanently'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: '6px',
          background: 'var(--surface-sunken)',
          margin: '16px 20px 0',
          borderRadius: '14px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'signin' ? 'var(--surface-card)' : 'transparent',
              color: mode === 'signin' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'signin' ? '800' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: mode === 'signin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <LogIn size={14} />
            <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'signup' ? 'var(--surface-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'signup' ? '800' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={14} />
            <span>{isRtl ? 'إنشاء حساب جديد' : 'Sign Up'}</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleAuthSubmit} style={{ padding: '20px' }}>
          {/* Alerts */}
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '12.5px',
              fontWeight: '600',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(56, 161, 105, 0.12)',
              border: '1px solid rgba(56, 161, 105, 0.35)',
              color: '#2F855A',
              fontSize: '12.5px',
              fontWeight: '700',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: '700',
              color: 'var(--text-heading)',
              marginBottom: '6px'
            }}>
              {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  paddingLeft: isRtl ? '14px' : '38px',
                  paddingRight: isRtl ? '38px' : '14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-main)',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  direction: 'ltr',
                  textAlign: isRtl ? 'right' : 'left'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: isRtl ? '12px' : 'auto',
                left: isRtl ? 'auto' : '12px',
                color: 'var(--color-gold)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Mail size={16} />
              </div>
            </div>
          </div>

          {/* Password input (not shown for magiclink) */}
          {mode !== 'magiclink' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: 'var(--text-heading)'
                }}>
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('magiclink')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={mode !== 'magiclink'}
                  minLength={6}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    paddingLeft: isRtl ? '14px' : '38px',
                    paddingRight: isRtl ? '38px' : '14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border-subtle)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    direction: 'ltr'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: isRtl ? '12px' : 'auto',
                  left: isRtl ? 'auto' : '12px',
                  color: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock size={16} />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-gold) 0%, #b89326 100%)',
              color: '#071510',
              fontSize: '14px',
              fontWeight: '800',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(212,175,55,0.3)',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <span>{isRtl ? 'جاري المعالجة...' : 'Processing...'}</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={16} />
                <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={16} />
                <span>{isRtl ? 'إنشاء حساب جديد' : 'Create Account'}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{isRtl ? 'إرسال رابط الدخول السريع' : 'Send Magic Link'}</span>
              </>
            )}
          </button>

          {/* Quick link back to standard login if in magiclink mode */}
          {mode === 'magiclink' && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-gold)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {isRtl ? 'الرجوع إلى تسجيل الدخول بكلمة المرور' : 'Back to password sign in'}
              </button>
            </div>
          )}

          {/* Privacy & Cloud Promise Note */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {isRtl 
              ? '🔒 حسابك مجاني وآمن لوجه الله، يُستخدم فقط للحفاظ على نعمك المنشورة وإعجاباتك حتى لا تفقدها عند تغيير الهاتف أو مسح المتصفح.'
              : '🔒 Your account is free and secure, used solely to preserve your published blessings across devices.'}
          </div>
        </form>
      </div>
    </div>
  );
}
