import React, { useState, useEffect } from 'react';
import { FoodItem, UserPreference, WasteSummary } from '../types';

interface DashboardProps {
  inventory: FoodItem[];
  preferences: UserPreference;
  onUpdateState: (id: string, state: 'Used' | 'Eaten' | 'Wasted') => void;
  onNavigate: (tab: string, status?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  inventory,
  preferences,
  onUpdateState,
  onNavigate
}) => {
  const [wasteSummary, setWasteSummary] = useState<WasteSummary | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('http://localhost:5000/api/waste-summary')
      .then(r => r.json())
      .then(d => { if (d.success) setWasteSummary(d); })
      .catch(() => null);
  }, [inventory]); // refresh when inventory changes

  // Compute key metrics
  const totalTracked = inventory.length;
  const freshCount = inventory.filter(item => item.status === 'Fresh').length;
  const warningCount = inventory.filter(item => item.status === 'Slightly Spoiled').length;
  const spoiledCount = inventory.filter(item => item.status === 'Spoiled').length;

  // Two-stage proactive spoilage alerts
  const activeAlerts = inventory
    .map(item => {
      const timeDiff = new Date(item.predictedSpoilageDate).getTime() - new Date().getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      const daysSinceAdded = Math.floor((Date.now() - new Date(item.addedDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceAdded >= 2) {
        return { id: item._id, name: item.name, type: 'critical', daysDiff: 0,
          message: `"${item.name}" will become spoil today, use it before!` };
      } else if (item.status === 'Spoiled' || daysDiff <= 0) {
        return { id: item._id, name: item.name, type: 'critical', daysDiff,
          message: `"${item.name}" has expired and is marked Spoiled. Avoid consumption!` };
      } else if (daysDiff === 1) {
        return { id: item._id, name: item.name, type: 'urgent', daysDiff,
          message: `"${item.name}" spoils in 1 day — use it today!` };
      } else if (daysDiff === 2) {
        return { id: item._id, name: item.name, type: 'warning', daysDiff,
          message: `"${item.name}" will spoil in 2 days. Plan to use it soon.` };
      }
      return null;
    })
    .filter(Boolean)
    .filter(a => !dismissedAlerts.has(a!.id)) as Array<{
      id: string; name: string; type: string; message: string; daysDiff: number;
    }>;

  const getFreshnessPercentage = (item: FoodItem) => {
    const totalDuration = new Date(item.predictedSpoilageDate).getTime() - new Date(item.addedDate).getTime();
    const elapsed = Date.now() - new Date(item.addedDate).getTime();
    if (elapsed >= totalDuration) return 0;
    if (elapsed <= 0) return item.originalFreshness;
    return Math.max(0, Math.round(item.originalFreshness * (1 - elapsed / totalDuration)));
  };

  const handleUsed = (id: string) => {
    onUpdateState(id, 'Used');
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  const handleWasted = (id: string) => {
    onUpdateState(id, 'Wasted');
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  const alertBg = (type: string) =>
    type === 'critical' ? 'var(--color-spoiled-bg)' :
    type === 'urgent'   ? 'rgba(255,145,0,0.1)' :
                          'var(--color-warning-bg)';
  const alertBorder = (type: string) =>
    type === 'critical' ? 'var(--color-spoiled)' :
    type === 'urgent'   ? 'var(--color-warning)' :
                          'var(--glass-border)';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Smart Freshness Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            AI-powered shelf-life predictions &amp; wastage prevention
          </p>
        </div>
        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Streak:</span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>🔥 {preferences.streakCount} Days</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Health Score:</span>
            <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: 'var(--color-fresh)' }}>⭐ {preferences.healthScore}/100</span>
          </div>
        </div>
      </div>

      {/* ── SPOILAGE ALERTS with Used / Not Used ── */}
      {activeAlerts.length > 0 && (
        <div className="glass-card" style={{ borderColor: 'var(--color-spoiled)', borderLeftWidth: '5px', marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--color-spoiled)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            🚨 Active Spoilage Notifications ({activeAlerts.length})
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Mark each item as <strong>Used</strong> (you consumed it — notification dismissed, waste not counted) or <strong>Not Used / Wasted</strong> (counts toward your waste report).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className="glass-card"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', background: alertBg(alert.type), borderColor: alertBorder(alert.type)
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {alert.type === 'critical' ? '🔴' : alert.type === 'urgent' ? '🟠' : '🟡'} {alert.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tap <em>Used</em> if you already consumed it — the notification disappears and no waste is recorded.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', background: 'var(--color-fresh)', color: '#0b0c10' }}
                    onClick={() => handleUsed(alert.id)}
                    title="I already used / ate this item"
                  >
                    ✅ Used
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderColor: 'var(--color-spoiled)', color: 'var(--color-spoiled)' }}
                    onClick={() => handleWasted(alert.id)}
                    title="This item was not used — counts as wasted"
                  >
                    🗑️ Not Used
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── METRIC TILES ── */}
      <div className="grid-3-col" style={{ marginBottom: '2.5rem' }}>
        <div
          className="glass-card"
          onClick={() => onNavigate('inventory', 'Fresh')}
          style={{ borderLeft: '4px solid var(--color-fresh)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>FRESH ITEMS</span>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0', color: 'var(--color-fresh)' }}>{freshCount}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Optimal storage conditions</p>
        </div>
        <div
          className="glass-card"
          onClick={() => onNavigate('inventory', 'Warning')}
          style={{ borderLeft: '4px solid var(--color-warning)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>WARNING ITEMS</span>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0', color: 'var(--color-warning)' }}>{warningCount}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Nearing decay thresholds</p>
        </div>
        <div
          className="glass-card"
          onClick={() => onNavigate('inventory', 'Spoiled')}
          style={{ borderLeft: '4px solid var(--color-spoiled)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SPOILED ITEMS</span>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0', color: 'var(--color-spoiled)' }}>{spoiledCount}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Requires immediate safety check</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Inventory list */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Real-Time Inventory Status</h2>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => onNavigate('scanner')}>
              + Scan New Food
            </button>
          </div>

          {totalTracked === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your inventory is currently empty.</p>
              <button className="btn-secondary" onClick={() => onNavigate('scanner')}>Scan your first item to begin tracking!</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {inventory.slice(0, 5).map(item => {
                const currentPct = getFreshnessPercentage(item);
                const statusClass = currentPct > 70 ? 'fresh-badge' : currentPct > 30 ? 'warning-badge' : 'spoiled-badge';
                return (
                  <div key={item._id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='100%' height='100%' fill='%2313151b'/><text x='50%' y='65%' font-family='sans-serif' font-size='20' fill='%2300E676' text-anchor='middle'>🍏</text></svg>";
                          }}
                        />
                        <div>
                          <h3 style={{ fontSize: '1rem' }}>{item.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {item.category} • {item.isCooked ? 'Cooked' : 'Raw'} • {item.nutrition.calories} kcal • {item.nutrition.protein}g Prot
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`user-score-badge ${statusClass}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                          {item.status} ({currentPct}%)
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Spoils in {Math.max(0, Math.ceil((new Date(item.predictedSpoilageDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                        </div>
                      </div>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${currentPct}%`, background: currentPct > 70 ? 'var(--color-fresh)' : currentPct > 30 ? 'var(--color-warning)' : 'var(--color-spoiled)' }} />
                    </div>
                  </div>
                );
              })}
              {totalTracked > 5 && (
                <button className="btn-secondary" style={{ width: '100%', padding: '0.6rem' }} onClick={() => onNavigate('inventory')}>
                  View All {totalTracked} Inventoried Items
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── WASTE SUMMARY WIDGET ── */}
          <div
            className="glass-card"
            onClick={() => onNavigate('analytics')}
            style={{ borderLeft: '4px solid var(--color-spoiled)', cursor: 'pointer' }}
          >
            <h2 style={{ marginBottom: '1rem' }}>🗑️ Waste Report This Week</h2>
            {wasteSummary ? (
              <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,23,68,0.06)', borderRadius: '10px', border: '1px solid rgba(255,23,68,0.15)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-spoiled)' }}>{wasteSummary.weeklyWastedCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>WASTED THIS WEEK</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,145,0,0.06)', borderRadius: '10px', border: '1px solid rgba(255,145,0,0.15)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>{wasteSummary.monthlyWastedCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>WASTED THIS MONTH</div>
                  </div>
                </div>

                {wasteSummary.weeklyWastedItems.length > 0 ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Items wasted this week:</p>
                    {wasteSummary.weeklyWastedItems.slice(0, 3).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <span>🗑️ {it.name}</span>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{it.category}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-fresh)', marginBottom: '1rem' }}>✅ Zero waste this week — great job!</p>
                )}

                {wasteSummary.buyAdvice.length > 0 && (
                  <div style={{ background: 'rgba(255,234,0,0.04)', border: '1px solid rgba(255,234,0,0.12)', borderRadius: '8px', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.4rem' }}>💡 Buy Less Next Time:</p>
                    {wasteSummary.buyAdvice.slice(0, 2).map((adv, i) => (
                      <p key={i} style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.3rem' }}>{adv.advice}</p>
                    ))}
                  </div>
                )}

                <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => onNavigate('analytics')}>
                  View Full Waste Report →
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading waste data...</p>
            )}
          </div>

          {/* Weekly score summary */}
          <div className="glass-card">
            <h2>Weekly Scan Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Healthy vs Packaged Scans:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-fresh)' }}>⭐ Outstanding Balance</span>
              </div>
              <div style={{ display: 'flex', height: '18px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: '70%', background: 'linear-gradient(90deg, var(--cat-vegetables), var(--cat-fruits))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#0b0c10', fontWeight: 700 }}>Healthy (70%)</div>
                <div style={{ width: '30%', background: 'linear-gradient(90deg, var(--cat-packaged), var(--cat-cooked))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>Processed (30%)</div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Keep eating whole food elements like fresh fruits and vegetables to keep your scores high.
              </p>
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => onNavigate('analytics')}>
                Open Detailed Analytics
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card">
            <h2>Unlocked Achievement Badges</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {preferences.unlockedBadges.map((badge, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0.8rem', borderRadius: '12px', background: 'rgba(255,234,0,0.05)', border: '1px solid rgba(255,234,0,0.15)', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  🏅 {badge}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
