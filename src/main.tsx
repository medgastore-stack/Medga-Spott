import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

// Safely suppress cross-origin iframe security errors (such as $$typeof inspection on Window in sandboxed preview environments)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('$$typeof') ||
      msg.includes('cross-origin frame') ||
      msg.includes('Blocked a frame with origin') ||
      event.error?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('$$typeof') ||
      msg.includes('cross-origin frame') ||
      msg.includes('Blocked a frame with origin') ||
      reason?.name === 'SecurityError'
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);

