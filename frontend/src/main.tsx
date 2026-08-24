import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor to attach x-user-email header automatically
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const cachedUser = localStorage.getItem('user');
  let email = '';
  if (cachedUser) {
    try {
      email = JSON.parse(cachedUser).email;
    } catch (e) {}
  }

  if (email) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as any).url;
    }

    if (url.includes('pdd-9fqv.onrender.com/api') || url.includes('/api/')) {
      init = init || {};
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        init.headers.set('x-user-email', email);
      } else if (Array.isArray(init.headers)) {
        init.headers.push(['x-user-email', email]);
      } else {
        (init.headers as Record<string, string>)['x-user-email'] = email;
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
