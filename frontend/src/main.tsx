import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor — automatically attaches x-user-email to every /api/ call
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.toString();
  else if (input && typeof input === 'object' && 'url' in input) url = (input as any).url;

  // Attach x-user-email to all calls to our backend
  if (url.includes('pdd-9fqv.onrender.com/api') || url.includes('/api/')) {
    const cachedUser = localStorage.getItem('user');
    let email = '';
    try { if (cachedUser) email = JSON.parse(cachedUser).email; } catch (_) {}

    if (email) {
      init = init || {};
      if (init.headers instanceof Headers) {
        if (!init.headers.has('x-user-email')) init.headers.set('x-user-email', email);
      } else if (Array.isArray(init.headers)) {
        if (!init.headers.find(([k]) => k === 'x-user-email'))
          init.headers.push(['x-user-email', email]);
      } else {
        init.headers = { 'x-user-email': email, ...(init.headers as Record<string, string> || {}) };
      }
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
