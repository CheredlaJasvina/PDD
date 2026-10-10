import React, { useState } from 'react';
import { User } from '../types';

interface LandingAuthProps {
  onLoginSuccess: (user: User, token: string) => void;
}

// ── Shared password validator — returns error string or null if valid ─────────
const validatePassword = (pw: string): string | null => {
  if (!pw || pw.length === 0)      return 'Password is required.';
  if (pw.length < 8)               return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(pw))           return 'Password must contain at least one uppercase letter (A–Z).';
  if (!/[0-9]/.test(pw))           return 'Password must contain at least one digit (0–9).';
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pw))
                                   return 'Password must contain at least one special character (e.g. @, #, $, !).';
  return null;
};

export const LandingAuth: React.FC<LandingAuthProps> = ({ onLoginSuccess }) => {
  const [viewState, setViewState] = useState<'landing' | 'login' | 'signup' | 'forgot'>('landing');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    // Basic field checks
    if (!email.trim()) { setErrorMsg('Email address is required.'); return; }
    if (!password)     { setErrorMsg('Password is required.'); return; }

    // Password strength check on login too
    const pwErr = validatePassword(password);
    if (pwErr) { setErrorMsg(pwErr); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch {
      setErrorMsg('Cannot connect to backend server. Check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SIGNUP ────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    // Name validation
    const cleanName = name.trim();
    if (!cleanName) { setErrorMsg('Full name is required.'); return; }
    if (!/^[A-Za-z\s.\-]+$/.test(cleanName)) {
      setErrorMsg('Name must contain alphabetic characters only.');
      return;
    }

    // Email validation
    if (!email.trim()) { setErrorMsg('Email address is required.'); return; }

    // Password strength validation
    const pwErr = validatePassword(password);
    if (pwErr) { setErrorMsg(pwErr); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: cleanName })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess({
          email: email.trim(),
          name: cleanName,
          dietaryPreferences: [],
          audienceMode: 'Regular',
          servings: 2,
          membersCount: 2,
          notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
          healthScore: 100,
          streakCount: 1,
          unlockedBadges: ['Fresh Starter']
        }, data.token || 'mock-jwt-token-988-freshness');
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setErrorMsg('Cannot connect to backend. Check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) { setErrorMsg('Email address is required.'); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Recovery code sent to your email. Please check your inbox.');
      } else {
        setErrorMsg(data.message || 'Failed to send recovery code.');
      }
    } catch {
      setErrorMsg('Cannot connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── shared error banner ───────────────────────────────────────────────────
  const ErrorBanner = () => errorMsg ? (
    <div style={{
      color: 'var(--color-spoiled)', background: 'var(--color-spoiled-bg)',
      padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
      marginBottom: '1.25rem', border: '1px solid var(--color-spoiled)',
      display: 'flex', gap: '0.5rem', alignItems: 'flex-start'
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span>{errorMsg}</span>
    </div>
  ) : null;

  // ── shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    padding: '0.75rem',
    borderRadius: '8px',
    color: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      {/* ── 1. LANDING ── */}
      {viewState === 'landing' && (
        <div style={{ maxWidth: '1000px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <svg viewBox="0 0 120 120" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(0,230,118,0.35))' }}>
                <rect x="5" y="5" width="110" height="110" rx="28" fill="#0E1B18" stroke="#00E676" strokeWidth="1.5" strokeOpacity="0.5"/>
                <circle cx="60" cy="70" r="45" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2,4" opacity="0.2"/>
                <circle cx="60" cy="70" r="35" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2,4" opacity="0.3"/>
                <path d="M 60 40 C 53 40, 48 37, 43 40 C 33 46, 33 66, 38 78 C 43 90, 53 95, 60 90 C 67 95, 77 90, 82 78 C 84 72, 85 71, 80 68 C 74 65, 74 55, 80 52 C 85 49, 84 48, 82 46 C 77 40, 72 40, 67 40 C 63 37, 60 40, 60 40 Z" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="77" cy="62" r="3" fill="#00E676"/>
                <path d="M 60 40 C 60 25, 70 20, 70 20" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 70 20 C 80 20, 85 28, 75 32 Z" fill="#FFD700"/>
                <path d="M 60 40 C 55 35, 55 25, 63 25 Z" fill="#1B4332"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>
                  <span style={{ color: '#FFF' }}>Fresh</span><span style={{ color: '#00E676' }}>Radar</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8A99AD', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '4px' }}>
                  Smart Food Freshness Tracking
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '1rem auto' }}>
              Reduce household wastage, calculate daily CO2 carbon offsets, discover fresh recipe combinations, and share inventory with your household.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => setViewState('signup')}>Get Started Free</button>
            <button className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => setViewState('login')}>Sign In to Fridge</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem', textAlign: 'left' }}>
            {[
              { icon: '📸', title: 'AI Vision Recognition', desc: 'Instant deep learning freshness analysis. Identifies rot spots and isolates packaging labels.' },
              { icon: '🥗', title: 'Zero Waste Recipes', desc: 'Auto-suggest recipes tailored strictly to raw food nearing decay. Adjusts portions automatically.' },
              { icon: '🌿', title: 'Carbon Footprint Offset', desc: 'Tracks greenhouse gases offset by consuming food rather than discarding.' }
            ].map(f => (
              <div key={f.title} className="glass-card">
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h3 style={{ margin: '0.75rem 0' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. LOGIN ── */}
      {viewState === 'login' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Enter your credentials to access your kitchen.
          </p>

          <ErrorBanner />

          <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" style={inputStyle} />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Must be 8+ chars · uppercase · digit · special char
              </p>
            </div>
            <button type="submit" className="btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.25rem', opacity: isSubmitting ? 0.7 : 1 }}
              disabled={isSubmitting}>
              {isSubmitting ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => { setViewState('forgot'); setErrorMsg(null); setSuccessMsg(null); }}>
              Forgot Password?
            </span>
            <span style={{ color: 'var(--color-fresh)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setViewState('signup'); setErrorMsg(null); setPassword(''); }}>
              Create Account
            </span>
          </div>
        </div>
      )}

      {/* ── 3. SIGNUP ── */}
      {viewState === 'signup' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Get started on zero-waste household tracking.
          </p>

          <ErrorBanner />

          <form onSubmit={handleSignup} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password" style={inputStyle} />
              {/* Live password strength indicators */}
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {[
                  { test: password.length >= 8,            label: 'At least 8 characters' },
                  { test: /[A-Z]/.test(password),          label: 'One uppercase letter (A–Z)' },
                  { test: /[0-9]/.test(password),          label: 'One digit (0–9)' },
                  { test: /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password), label: 'One special character (@, #, $, ! etc.)' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                    <span style={{ color: r.test ? 'var(--color-fresh)' : 'var(--color-spoiled)', fontSize: '0.8rem' }}>
                      {r.test ? '✅' : '❌'}
                    </span>
                    <span style={{ color: r.test ? 'var(--color-fresh)' : 'var(--text-muted)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.25rem', opacity: isSubmitting ? 0.7 : 1 }}
              disabled={isSubmitting}>
              {isSubmitting ? '⏳ Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <span style={{ color: 'var(--color-fresh)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setViewState('login'); setErrorMsg(null); setPassword(''); }}>
              Login
            </span>
          </p>
        </div>
      )}

      {/* ── 4. FORGOT PASSWORD ── */}
      {viewState === 'forgot' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2>Recover Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem' }}>
            Enter your email to receive a recovery code.
          </p>

          <ErrorBanner />
          {successMsg && (
            <div style={{ color: 'var(--color-fresh)', background: 'var(--color-fresh-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleForgotPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Sending...' : 'Send Recovery Code'}
            </button>
          </form>
          <button className="btn-secondary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem' }}
            onClick={() => { setViewState('login'); setErrorMsg(null); setSuccessMsg(null); }}>
            Back to Login
          </button>
        </div>
      )}

    </div>
  );
};
