import React, { useState, useEffect } from 'react';
import { EcoMetrics } from '../types';

export const EcoImpact: React.FC = () => {
  const [eco, setEco] = useState<EcoMetrics>({
    co2SavedKg: 24.8,
    moneySaved: 140.0,
    foodHealthLevel: 'Waste Warden',
    ecoMilestones: [
      { title: 'CO2 Savior 🌿', desc: 'Saved 20kg of carbon emissions.', unlocked: true },
      { title: 'Zero Waste Hero 💎', desc: 'Keep wastage below 5% for one month.', unlocked: false }
    ],
    comparisonStats: { communityAvgKg: 15.2, userSavingPct: 63 }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEcoData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/eco');
      const data = await response.json();
      if (data.success) {
        setEco(data.eco);
      }
    } catch (err) {
      console.log('Error loading eco metrics from backend, using local fallback.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEcoData();
  }, []);

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Synching carbon calculators...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Eco-Impact & Cost Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor saved financial resources and evaluate carbon footprint reductions.</p>
      </div>

      <div className="grid-3-col" style={{ marginBottom: '2rem' }}>
        {/* Carbon savings */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-fresh)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CO2 EMISSIONS SAVED</span>
          <h2 style={{ fontSize: '2.25rem', margin: '0.5rem 0 0 0', color: 'var(--color-fresh)' }}>
            {eco.co2SavedKg.toFixed(1)} kg
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Equivalent to 120km car offset</p>
        </div>

        {/* Financial savings */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONEY SAVED (GROCERIES)</span>
          <h2 style={{ fontSize: '2.25rem', margin: '0.5rem 0 0 0', color: 'var(--color-warning)' }}>
            ₹{eco.moneySaved.toFixed(2)}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Derived from consumed inventory</p>
        </div>

        {/* Rating Level */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--cat-packaged)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNITY STANDING</span>
          <h2 style={{ fontSize: '1.8rem', margin: '0.5rem 0 0 0', color: '#fff' }}>
            Top {eco.comparisonStats.userSavingPct}%
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Outperforming local average of {eco.comparisonStats.communityAvgKg}kg</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Composting/Disposal advisor */}
        <div className="glass-card">
          <h2>Spoilage Disposal & Composting Advisor</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
            For food items flagged as Spoiled, follow these bio-safety steps to recycle nutrients safely.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>1. Unpack & Separate:</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remove all plastic wrappers, twist ties, and stickers before throwing into the bio-bin.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🍂</span>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>2. Maintain Browns & Greens:</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If adding to household compost, mix food scrap "greens" with dry leaves/cardboard "browns" (ratio 1:3).</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🥩</span>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>3. Avoid Meats & Oily Foods:</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avoid composting cooked fats, meat pieces, or dairy in open bins to prevent pests.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eco milestones */}
        <div className="glass-card">
          <h2>Eco-Impact Milestones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
            {eco.ecoMilestones.map((ms, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'center', 
                  opacity: ms.unlocked ? 1 : 0.4,
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  border: `1px solid ${ms.unlocked ? 'var(--color-fresh)' : 'transparent'}`
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>{ms.unlocked ? '🏆' : '🔒'}</span>
                <div>
                  <h3 style={{ fontSize: '0.9rem' }}>{ms.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{ms.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
