import React, { useState, useEffect } from 'react';

interface EcoImpactProps {
}

interface EcoMetrics {
  co2SavedKg: number;
  moneySaved: number;
  foodHealthLevel: string;
  ecoMilestones: Array<{ title: string; desc: string; unlocked: boolean }>;
  comparisonStats: { communityAvgKg: number; userSavingPct: number };
}

export const EcoImpact: React.FC<EcoImpactProps> = () => {
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

  // Fallbacks if data loading fails or doesn't exist
  const milestones = metrics?.ecoMilestones || [
    { title: "CO2 Savior 🌿", desc: "Saved 20kg of carbon emissions.", unlocked: false },
    { title: "Zero Waste Hero 💎", desc: "Keep wastage below 5% for one month.", unlocked: false }
  ];

  return (
    <div className="animate-fade-in" style={{ color: '#FFFFFF', padding: '1rem 0.5rem' }}>
      
      {/* Bottom Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }} className="eco-split-layout">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Milestones Panel */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, marginBottom: '1.5rem' }}>
              Eco-Impact Milestones
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {milestones.map((m, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  opacity: m.unlocked ? 1 : 0.5
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--glass-border)',
                    fontSize: '1.25rem'
                  }}>
                    {m.unlocked ? "🔓" : "🔒"}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: m.unlocked ? '#00E676' : '#FFFFFF' }}>
                      {m.title}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: '#8A99AD' }}>
                      {m.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
