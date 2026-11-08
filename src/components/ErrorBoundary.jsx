import React from 'react';

/**
 * شبكة أمان للتطبيق كله: أي خطأ غير متوقع أثناء العرض كان يترك شاشة بيضاء فارغة.
 * هنا تظهر رسالة واضحة مع زرّي «إعادة التحميل» و«إصلاح وإعادة التحميل».
 * لا يمسح بيانات المستخدم (نعمه المحفوظة وإعداداته) أبداً.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[NEMAA] UI crash:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  // يمسح ذاكرة التخزين المؤقت للتطبيق وعامل الخدمة فقط (لا بيانات المستخدم) ثم يعيد التحميل
  handleRepair = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const names = await window.caches.keys();
        await Promise.all(names.map((n) => window.caches.delete(n)));
      }
    } catch (err) {
      console.warn('[NEMAA] repair notice:', err);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const btn = {
      padding: '12px 22px',
      borderRadius: '999px',
      border: '1.5px solid #d4af37',
      fontSize: '15px',
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit'
    };

    return (
      <div
        role="alert"
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0d241b',
          color: '#f5efe0',
          fontFamily: "'Cairo','Tajawal',system-ui,sans-serif",
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '420px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🌿</div>
          <h1 style={{ fontSize: '22px', margin: '0 0 10px' }}>حدث خطأ غير متوقع</h1>
          <p style={{ fontSize: '15px', lineHeight: 1.8, margin: '0 0 22px', opacity: 0.9 }}>
            نعتذر عن هذا. نعمك المحفوظة وإعداداتك بخير ولم تتأثر. جرّب إعادة تحميل التطبيق،
            وإن تكرر الخطأ فاضغط «إصلاح وإعادة التحميل».
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={this.handleReload} style={{ ...btn, background: '#d4af37', color: '#0d241b' }}>
              إعادة التحميل
            </button>
            <button type="button" onClick={this.handleRepair} style={{ ...btn, background: 'transparent', color: '#f5efe0' }}>
              إصلاح وإعادة التحميل
            </button>
          </div>
          <details style={{ marginTop: '22px', fontSize: '12px', opacity: 0.7, textAlign: 'left' }} dir="ltr">
            <summary style={{ cursor: 'pointer' }}>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
