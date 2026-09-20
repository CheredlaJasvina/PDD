import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor to attach x-user-email header automatically
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = isLocal ? 'http://localhost:5000/api' : 'http://localhost:5000/api';

  let url = '';
  let isRequestObject = false;

  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = (input as any).url;
    isRequestObject = true;
  }

  if (url.includes('http://localhost:5000/api')) {
    // URL is already using localhost:5000, do nothing or handle mapping if needed
  }

  const cachedUser = localStorage.getItem('user');
  let email = '';
  if (cachedUser) {
    try {
      email = JSON.parse(cachedUser).email;
    } catch (e) {}
  }

  if (email && (url.includes('localhost:5000/api') || url.includes('/api/'))) {
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

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
