import React from 'react';
import { UserPreference } from '../types';

interface ProfileSettingsProps {
  preferences: UserPreference;
  onUpdatePreferences: (updates: Partial<UserPreference>) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  preferences,
  onUpdatePreferences,
  theme,
  onThemeChange
}) => {
  const dietaryOptions = [
    { key: 'vegetarian', label: 'Vegetarian 🥦' },
    { key: 'vegan', label: 'Vegan 🌱' },
    { key: 'gluten-free', label: 'Gluten-Free 🌾' },
    { key: 'dairy-free', label: 'Dairy-Free 🥛' },
    { key: 'keto', label: 'Keto 🥩' },
    { key: 'jain', label: 'Jain 🧅' }
  ];

  const handleDietaryToggle = (key: string) => {
    const active = [...preferences.dietaryPreferences];
    const idx = active.indexOf(key);
    if (idx > -1) {
      active.splice(idx, 1);
    } else {
      active.push(key);
    }
    onUpdatePreferences({ dietaryPreferences: active });
  };

  const handleNotificationToggle = (field: 'emailAlerts' | 'inAppAlerts', val: boolean) => {
    onUpdatePreferences({
      notificationPref: {
        ...preferences.notificationPref,
        [field]: val
      }
    });
  };

  const handleNoticeDaysChange = (days: number) => {
    onUpdatePreferences({
      notificationPref: {
        ...preferences.notificationPref,
        advanceNoticeDays: Math.max(1, Math.min(7, days))
      }
    });
  };

  // Badge checklist mapping
  const badgeDatabase = [
    { id: 'Fresh Starter', name: 'Fresh Starter 🚀', desc: 'Successfully scanned your first food item.' },
    { id: 'Waste Warrior', name: 'Waste Warrior 🛡️', desc: 'Kept wastage below 10% in a week.' },
    { id: 'Streak Seeker', name: 'Streak Seeker ⚡', desc: 'Achieved a 5-day food scanning streak.' },
    { id: 'Consistency King', name: 'Consistency King 👑', desc: 'Achieved a 7-day food tracking streak.' }
  ];

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Settings & Gamified Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure dietary profiles, notification schedules, and unlock scan streak achievements.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        {/* Left column: configurations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Dietary Configurations */}
          <div className="glass-card">
            <h2>Dietary Profile Config</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Items failing selected parameters will flag conflict warnings during ML vision scans.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {dietaryOptions.map(opt => {
                const isChecked = preferences.dietaryPreferences.includes(opt.key);
                return (
                  <div 
                    key={opt.key} 
                    onClick={() => handleDietaryToggle(opt.key)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '12px', 
                      background: isChecked ? 'var(--color-fresh-bg)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isChecked ? 'var(--color-fresh)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      readOnly
                      style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme aesthetics configuration */}
          <div className="glass-card">
            <h2>App Theme &amp; Aesthetics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Choose a custom color theme profile for the FreshRadar interface.
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Select Visual Theme</label>
              <select
                value={theme}
                onChange={(e) => onThemeChange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                <option value="emerald-aurora">🟢 Emerald Aurora (Default)</option>
                <option value="neon-cyberpunk">⚡ Neon Cyberpunk (Electric)</option>
                <option value="ocean-breeze">🔵 Ocean Breeze (Deep Water)</option>
                <option value="sunset-glow">🟠 Sunset Glow (Warm Fire)</option>
                <option value="sakura-blossom">🌸 Sakura Blossom (Plum Rose)</option>
                <option value="light">☀️ Classical Light Mode</option>
              </select>
            </div>
          </div>

          {/* Notifications Schedule */}
          <div className="glass-card">
            <h2>Expiry Notifications Setup</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Configure when the visual analyzer should prompt warnings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Household members count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,230,118,0.04)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.12)' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>👨‍👩‍👧 How many members to cook for?</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Used to calculate how much food to buy &amp; recipe quantities.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '1rem' }}
                    onClick={() => onUpdatePreferences({ membersCount: Math.max(1, (preferences.membersCount || 2) - 1) })}>
                    −
                  </button>
                  <strong style={{ minWidth: '2rem', textAlign: 'center', fontSize: '1.2rem' }}>{preferences.membersCount || 2}</strong>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '1rem' }}
                    onClick={() => onUpdatePreferences({ membersCount: Math.min(20, (preferences.membersCount || 2) + 1) })}>
                    +
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>member{(preferences.membersCount || 2) > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>Advance Warning Notice:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>How many days before spoilage to trigger alerts.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none' }}
                    onClick={() => handleNoticeDaysChange(preferences.notificationPref.advanceNoticeDays - 1)}
                  >
                    -
                  </button>
                  <strong>{preferences.notificationPref.advanceNoticeDays} Days</strong>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none' }}
                    onClick={() => handleNoticeDaysChange(preferences.notificationPref.advanceNoticeDays + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="inAppAlerts" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>In-App Browser Alerts</label>
                  <input 
                    type="checkbox" 
                    id="inAppAlerts"
                    checked={preferences.notificationPref.inAppAlerts}
                    onChange={(e) => handleNotificationToggle('inAppAlerts', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="emailAlerts" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Email Spoilage Alerts</label>
                  <input 
                    type="checkbox" 
                    id="emailAlerts"
                    checked={preferences.notificationPref.emailAlerts}
                    onChange={(e) => handleNotificationToggle('emailAlerts', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right column: gamified elements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Gamification Dashboard */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(15,20,32,0.8), rgba(270,75,60,0.05))' }}>
            <h2>Food Health Dashboard</h2>
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                User Score Rating
              </span>
              <h2 style={{ fontSize: '4.5rem', margin: '0.25rem 0', color: 'var(--color-fresh)', textShadow: '0 0 15px rgba(0, 230, 118, 0.2)' }}>
                {preferences.healthScore}
              </h2>
              <span className="user-score-badge fresh-badge" style={{ display: 'inline-block' }}>
                Level 3 Fresh Explorer
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Active Streak</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-warning)' }}>⚡ {preferences.streakCount} Scans</strong>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Rewards Won</span>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>🏆 {preferences.unlockedBadges.length} Badges</strong>
              </div>
            </div>
          </div>

          {/* Badge Gallery */}
          <div className="glass-card">
            <h2>Unlockable Achievements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
              {badgeDatabase.map(badge => {
                const isUnlocked = preferences.unlockedBadges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'center', 
                      opacity: isUnlocked ? 1 : 0.4,
                      padding: '0.75rem',
                      background: isUnlocked ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderRadius: '12px',
                      border: `1px solid ${isUnlocked ? 'var(--glass-border)' : 'transparent'}`
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{isUnlocked ? '🏅' : '🔒'}</span>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', color: isUnlocked ? '#fff' : 'var(--text-muted)' }}>{badge.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
