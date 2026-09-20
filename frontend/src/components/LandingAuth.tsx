import React, { useState } from 'react';
import { User } from '../types';

interface LandingAuthProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LandingAuth: React.FC<LandingAuthProps> = ({ onLoginSuccess }) => {
  const [viewState, setViewState] = useState<'landing' | 'login' | 'signup' | 'forgot' | 'otp'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpPin, setOtpPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.message || 'Login credentials invalid');
      }
    } catch (err) {
      setErrorMsg('Cannot connect to backend server.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Name is required.');
      return;
    }
    const nameRegex = /^[A-Za-z\s.\-]+$/;
    if (!nameRegex.test(cleanName)) {
      setErrorMsg('Please enter a valid name (alphabetic characters only).');
      return;
    }

    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: cleanName })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Profile created! Entering security verification.');
        setViewState('otp');
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Cannot connect to backend.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpPin.length !== 4) {
      setErrorMsg('Verification code must be exactly 4 digits.');
      return;
    }
    setErrorMsg(null);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpPin })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess({
          email,
          name: name || email.split('@')[0],
          dietaryPreferences: [],
          audienceMode: 'Regular',
          servings: 2,
          membersCount: 2,
          notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
          healthScore: 100,
          streakCount: 1,
          unlockedBadges: ['Fresh Starter']
        }, 'mock-jwt-token-988-freshness');
      } else {
        setErrorMsg(data.message || 'Invalid verification code.');
      }
    } catch (err) {
      setErrorMsg('Cannot connect to backend server.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(data.message || 'OTP verification code sent to your email.');
        setViewState('otp');
      } else {
        setErrorMsg(data.message || 'Failed to send recovery OTP.');
      }
    } catch (err) {
      setErrorMsg('Cannot connect to backend server.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      
      {/* 1. MARKETING LANDING VIEW */}
      {viewState === 'landing' && (
        <div style={{ maxWidth: '1000px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <svg viewBox="0 0 120 120" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(0,230,118,0.35))' }}>
                <rect x="5" y="5" width="110" height="110" rx="28" fill="#0E1B18" stroke="#00E676" strokeWidth="1.5" strokeOpacity="0.5"/>
                {/* Background radar waves */}
                <circle cx="60" cy="70" r="45" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2,4" opacity="0.2"/>
                <circle cx="60" cy="70" r="35" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2,4" opacity="0.3"/>
                {/* Outline Apple Body with Bite */}
                <path d="M 60 40 C 53 40, 48 37, 43 40 C 33 46, 33 66, 38 78 C 43 90, 53 95, 60 90 C 67 95, 77 90, 82 78 C 84 72, 85 71, 80 68 C 74 65, 74 55, 80 52 C 85 49, 84 48, 82 46 C 77 40, 72 40, 67 40 C 63 37, 60 40, 60 40 Z" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {/* Radar Dot (Bite center) */}
                <circle cx="77" cy="62" r="3" fill="#00E676" />
                {/* Stem */}
                <path d="M 60 40 C 60 25, 70 20, 70 20" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                {/* Leaf */}
                <path d="M 70 20 C 80 20, 85 28, 75 32 Z" fill="#FFD700" />
                {/* Secondary Leaf/Accent */}
                <path d="M 60 40 C 55 35, 55 25, 63 25 Z" fill="#1B4332" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'left' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>
                  <span style={{ color: '#FFFFFF' }}>Fresh</span>
                  <span style={{ color: '#00E676' }}>Radar</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8A99AD', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '4px' }}>
                  Smart Food Freshness Tracking
                </span>
              </div>
            </div>
            <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, display: 'none' }}>AI-Powered Food Freshness & Shelf-Life Platform</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginTop: '1rem', maxWidth: '700px', margin: '1rem auto' }}>
              Reduce household wastage, calculate daily CO2 carbon offsets, discover fresh recipe combinations, and share inventory with your household.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => setViewState('signup')}>
              Get Started Free
            </button>
            <button className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => setViewState('login')}>
              Sign In to Fridge
            </button>
          </div>

          {/* Interactive Feature teaser grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem', textAlign: 'left' }}>
            <div className="glass-card">
              <span style={{ fontSize: '2rem' }}>📸</span>
              <h3 style={{ margin: '0.75rem 0' }}>AI Vision Recognition</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Instant deep learning freshness analysis. Identifies rot spots and isolates packaging labels. Rejects faces automatically.
              </p>
            </div>
            <div className="glass-card">
              <span style={{ fontSize: '2rem' }}>🥗</span>
              <h3 style={{ margin: '0.75rem 0' }}>Zero Waste Recipes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Auto-suggest recipes tailored strictly to raw food nearing decay. Adjusts portions and spice thresholds automatically.
              </p>
            </div>
            <div className="glass-card">
              <span style={{ fontSize: '2rem' }}>🌿</span>
              <h3 style={{ margin: '0.75rem 0' }}>Carbon Footprint Offset</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Tracks greenhouse gases offset by consuming food rather than discarding. Syncs household data instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOGIN VIEW */}
      {viewState === 'login' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Enter details to open your connected kitchen.
          </p>

          {errorMsg && <div style={{ color: 'var(--color-spoiled)', background: 'var(--color-spoiled-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
              Sign In
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setViewState('forgot')}>
              Forgot Password?
            </span>
            <span style={{ color: 'var(--color-fresh)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setViewState('signup')}>
              Create Account
            </span>
          </div>
        </div>
      )}

      {/* 3. SIGNUP VIEW */}
      {viewState === 'signup' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Get started on zero-waste household tracking.
          </p>

          {errorMsg && <div style={{ color: 'var(--color-spoiled)', background: 'var(--color-spoiled-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Your Name:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
              Create Account & Verify
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <span style={{ color: 'var(--color-fresh)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setViewState('login')}>
              Login
            </span>
          </p>
        </div>
      )}

      {/* 4. FORGOT PASSWORD RECOVERY VIEW */}
      {viewState === 'forgot' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2>Recover Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
            Enter your email to receive a 4-digit OTP verification code.
          </p>

          {errorMsg && <div style={{ color: 'var(--color-spoiled)', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
              Send Recovery Code
            </button>
          </form>
          <button className="btn-secondary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem' }} onClick={() => setViewState('login')}>
            Cancel
          </button>
        </div>
      )}

      {/* 5. OTP VERIFICATION SCREEN */}
      {viewState === 'otp' && (
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2>OTP Verification</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
            {successMsg || 'Enter the 4-digit code sent to your account.'}
          </p>

          {errorMsg && <div style={{ color: 'var(--color-spoiled)', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, textAlign: 'center' }}>Enter 4-Digit Code:</label>
              <input 
                type="text" 
                maxLength={4}
                value={otpPin} 
                onChange={(e) => setOtpPin(e.target.value.replace(/\D/g, ''))} 
                placeholder="0 0 0 0"
                required 
                style={{ width: '100%', textAlign: 'center', letterSpacing: '0.75rem', fontSize: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
              Verify & Complete Auth
            </button>
          </form>
          <button className="btn-secondary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.75rem' }} onClick={() => setViewState('login')}>
            Back to Login
          </button>
        </div>
      )}

    </div>
  );
};
