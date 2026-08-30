import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor to attach x-user-email header automatically
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = isLocal ? 'http://localhost:5000/api' : 'https://pdd-9fqv.onrender.com/api';

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

  if (url.includes('pdd-9fqv.onrender.com/api')) {
    const relativePath = url.split('pdd-9fqv.onrender.com/api')[1];
    const newUrl = `${apiBase}${relativePath}`;
    if (isRequestObject) {
      input = new Request(newUrl, input as Request);
    } else {
      input = newUrl;
    }
    url = newUrl;
  }

  const cachedUser = localStorage.getItem('user');
  let email = '';
  if (cachedUser) {
    try {
      email = JSON.parse(cachedUser).email;
    } catch (e) {}
  }

  if (email && (url.includes('pdd-9fqv.onrender.com/api') || url.includes('localhost:5000/api') || url.includes('/api/'))) {
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
