import React, { useState, useEffect } from 'react';

interface EcoMilestone {
  title: string;
  desc: string;
  unlocked: boolean;
}

interface EcoMetrics {
  co2SavedKg: number;
  moneySaved: number;
  foodHealthLevel: string;
  ecoMilestones: EcoMilestone[];
  comparisonStats: { communityAvgKg: number; userSavingPct: number };
}

// Per-milestone config: threshold, unit, how to derive current progress, and unlock tip
const MILESTONE_META: Record<string, {
  threshold: number;
  unit: string;
  getProgress: (metrics: EcoMetrics) => number;
  tip: string;
}> = {
  'CO2 Savior 🌿': {
    threshold: 5,
    unit: 'kg CO₂',
    getProgress: (m) => m.co2SavedKg,
    tip: 'Mark food items as "Eaten" or "Used" in your inventory. Each item saves ~0.4 kg CO₂.',
  },
  'Zero Waste Hero 💎': {
    threshold: 100, // treated as a % goal — we show wastage % inverted
    unit: '% waste-free days',
    getProgress: (m) => Math.max(0, 100 - (m.comparisonStats?.userSavingPct ?? 100)),
    tip: 'Avoid marking items as "Wasted" for a full month. Scan items early and use them before they spoil.',
  },
};

export const EcoImpact: React.FC = () => {
  const [metrics, setMetrics] = useState<EcoMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEcoMetrics = async () => {
      try {
        const cachedUser = localStorage.getItem('user');
        const email = cachedUser ? JSON.parse(cachedUser).email : '';
        const response = await fetch('https://pdd-9fqv.onrender.com/api/eco', {
          headers: { 'x-user-email': email }
        });
        const data = await response.json();
        if (data.success && data.eco) {
          setMetrics(data.eco);
        }
      } catch (error) {
        console.error('Error fetching eco metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEcoMetrics();
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-fresh)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}/>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Calculating environmental footprint...</p>
      </div>
    );
  }

  const milestones: EcoMilestone[] = metrics?.ecoMilestones?.length ? metrics.ecoMilestones : [
    { title: 'CO2 Savior 🌿', desc: 'Saved 5kg of carbon emissions.', unlocked: false },
    { title: 'Zero Waste Hero 💎', desc: 'Keep wastage below 5% for one month.', unlocked: false },
  ];

  return (
    <div className="animate-fade-in" style={{ color: '#FFFFFF', padding: '1rem 0.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="eco-split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Milestones Panel */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, marginBottom: '0.4rem' }}>
              Eco-Impact Milestones
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Complete actions in your inventory to unlock badges.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {milestones.map((m, idx) => {
                const meta = MILESTONE_META[m.title];
                const current = meta && metrics ? Math.min(meta.getProgress(metrics), meta.threshold) : 0;
                const pct = meta ? Math.min(100, Math.round((current / meta.threshold) * 100)) : (m.unlocked ? 100 : 0);
                const remaining = meta ? Math.max(0, meta.threshold - current) : 0;
                const itemsNeeded = meta?.unit === 'kg CO₂' ? Math.ceil(remaining / 0.4) : null;

                return (
                  <div key={idx} style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: m.unlocked ? 'rgba(0, 230, 118, 0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${m.unlocked ? 'rgba(0,230,118,0.3)' : 'var(--glass-border)'}`,
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: m.unlocked ? 0 : '1rem' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                        background: m.unlocked ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${m.unlocked ? 'rgba(0,230,118,0.4)' : 'var(--glass-border)'}`,
                        fontSize: '1.4rem'
                      }}>
                        {m.unlocked ? '🔓' : '🔒'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '1rem', color: m.unlocked ? '#00E676' : '#FFFFFF' }}>
                          {m.title}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {m.desc}
                        </span>
                      </div>
                      {/* Progress pill */}
                      {!m.unlocked && meta && metrics && (
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                          borderRadius: '20px', background: 'rgba(255,179,0,0.12)',
                          color: '#ffb300', border: '1px solid rgba(255,179,0,0.3)',
                          whiteSpace: 'nowrap'
                        }}>
                          {meta.unit === 'kg CO₂'
                            ? `${current.toFixed(1)} / ${meta.threshold} kg`
                            : `${pct}%`}
                        </span>
                      )}
                      {m.unlocked && (
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                          borderRadius: '20px', background: 'rgba(0,230,118,0.15)',
                          color: '#00E676', border: '1px solid rgba(0,230,118,0.35)',
                          whiteSpace: 'nowrap'
                        }}>
                          ✅ Unlocked
                        </span>
                      )}
                    </div>

                    {/* Progress bar + hints — only for locked milestones */}
                    {!m.unlocked && (
                      <>
                        {/* Progress bar */}
                        <div style={{ marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            <span>Progress</span>
                            <span style={{ color: pct >= 75 ? '#00E676' : pct >= 40 ? '#ffb300' : 'var(--text-muted)' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: '4px',
                              background: pct >= 75
                                ? 'linear-gradient(90deg, #00c853, #00E676)'
                                : pct >= 40
                                ? 'linear-gradient(90deg, #ffb300, #ffd54f)'
                                : 'linear-gradient(90deg, #ff6d00, #ffb300)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>

                        {/* What you still need */}
                        {meta && metrics && (
                          <div style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.75rem',
                          }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                              {meta.unit === 'kg CO₂'
                                ? `${remaining.toFixed(1)} kg CO₂ still needed`
                                : `Goal: keep wastage ≤ 5% for 30 days`}
                            </span>
                            {itemsNeeded !== null && (
                              <span style={{ marginLeft: '0.4rem' }}>
                                — that's about <strong style={{ color: '#ffb300' }}>{itemsNeeded} more item{itemsNeeded !== 1 ? 's' : ''}</strong> eaten or used
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tip box */}
                        {meta && (
                          <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            padding: '0.65rem 0.85rem', borderRadius: '8px',
                            background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)',
                            fontSize: '0.8rem', color: 'var(--text-muted)',
                          }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                            <span><strong style={{ color: 'var(--color-fresh)' }}>How to unlock:</strong> {meta.tip}</span>
                          </div>
                        )}
                      </>
                    )}
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
