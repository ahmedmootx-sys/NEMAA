import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// PWA Service Worker: تسجيل واحد فقط (كان يُسجَّل مرتين، من هنا ومن index.html).
// يحتوي عامل الخدمة نفسه على عامل OneSignal، فلا يوجد عاملان متنافسان على نفس النطاق.
// لا يُسجَّل أثناء التطوير حتى لا يخزّن ملفات التطوير.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}
