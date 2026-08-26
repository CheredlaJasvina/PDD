import React, { useState } from 'react';
import { FoodItem } from '../types';

interface InventoryProps {
  inventory: FoodItem[];
  onUpdateState: (id: string, state: 'Used' | 'Eaten' | 'Wasted') => void;
  onDeleteItem: (id: string) => void;
  initialStatusFilter?: string;
  onClearStatusFilter?: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({
  inventory,
  onUpdateState,
  onDeleteItem,
  initialStatusFilter,
  onClearStatusFilter
}) => {
  const [ambientTemp, setAmbientTemp] = useState<'Cool' | 'Hot'>('Cool');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [markedUsed, setMarkedUsed] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // GPS Live temperature weather states
  const [liveTemp, setLiveTemp] = useState<number | null>(null);
  const [isDetectingTemp, setIsDetectingTemp] = useState(false);
  const [detectedLoc, setDetectedLoc] = useState<string | null>(null);

  const detectLiveTemperature = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingTemp(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setDetectedLoc(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
          
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const data = await response.json();
          if (data && data.current_weather) {
            const temp = data.current_weather.temperature;
            setLiveTemp(temp);
            setAmbientTemp(temp > 25 ? 'Hot' : 'Cool');
          }
        } catch (err) {
          alert("Error fetching live weather: " + err);
        } finally {
          setIsDetectingTemp(false);
        }
      },
      () => {
        alert("Location access denied or unavailable. Using default temperature modes.");
        setIsDetectingTemp(false);
      }
    );
  };

  const getFreshnessPercentage = (item: FoodItem) => {
    const totalDuration = new Date(item.predictedSpoilageDate).getTime() - new Date(item.addedDate).getTime();
    const elapsed = Date.now() - new Date(item.addedDate).getTime();
    if (elapsed >= totalDuration) return 0;
    if (elapsed <= 0) return item.originalFreshness;
    return Math.max(0, Math.round(item.originalFreshness * (1 - elapsed / totalDuration)));
  };

  const getDynamicStorageAdvisory = (item: FoodItem) => {
    if (ambientTemp === 'Hot') {
      if (item.category === 'fruits' || item.category === 'vegetables')
        return '⚠️ Weather Advisory: High ambient temperature (32°C) detected. Produce will spoil twice as fast. Move to the refrigerator immediately!';
      if (item.category === 'cooked food')
        return '⚠️ Weather Advisory: Critical heat (32°C). Cooked food left outside will bacteria-spoil within 2 hours. Freeze or discard.';
      return '⚠️ Weather Advisory: Packaged seal degradation risk. Store in a dark, cooled cupboard.';
    }
    return item.storageGuidance;
  };

  const getDaysLeft = (item: FoodItem) =>
    Math.max(0, Math.ceil((new Date(item.predictedSpoilageDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleUsed = (id: string) => {
    setMarkedUsed(prev => new Set(prev).add(id));
    onUpdateState(id, 'Used');
  };



  const filteredInventory = inventory.filter(item => {
    const matchesCategory = categoryFilter === 'all' ? true : item.category === categoryFilter;
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const itemStatus = item.status === 'Slightly Spoiled' ? 'Warning' : item.status;
      matchesStatus = itemStatus === statusFilter;
    }
    return matchesCategory && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Smart Pantry (Contained Food)</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage saved foods using the checkboxes below. Checking either option will update your pantry.
          </p>
        </div>

        {/* Weather toggle */}
        <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.6rem 1.2rem', borderColor: ambientTemp === 'Hot' ? 'var(--color-warning)' : 'var(--glass-border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🌡️ Ambient Temperature:</span>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px' }}>
            <button
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: 'none', background: ambientTemp === 'Cool' ? 'var(--glass-border)' : 'transparent', color: ambientTemp === 'Cool' ? '#fff' : 'var(--text-muted)' }}
              onClick={() => { setAmbientTemp('Cool'); setLiveTemp(null); }}>
              Cool (18°C)
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', border: 'none', background: ambientTemp === 'Hot' ? 'rgba(255,234,0,0.15)' : 'transparent', color: ambientTemp === 'Hot' ? 'var(--color-warning)' : 'var(--text-muted)' }}
              onClick={() => { setAmbientTemp('Hot'); setLiveTemp(null); }}>
              Hot (32°C)
            </button>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--color-fresh)', color: 'var(--color-fresh)' }}
            onClick={detectLiveTemperature}
            disabled={isDetectingTemp}
          >
            {isDetectingTemp ? '🛰️ Detecting...' : '🛰️ Use GPS Live Temp'}
          </button>
          {liveTemp !== null && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-fresh)', fontWeight: 600 }}>
              Detected: {liveTemp}°C ({detectedLoc})
            </span>
          )}
        </div>
      </div>

      {/* Status filter active banner */}
      {statusFilter !== 'all' && (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(0, 230, 118, 0.05)', borderColor: 'var(--color-fresh)', padding: '0.8rem 1.25rem' }}>
          <span style={{ fontSize: '0.88rem' }}>
            🔍 Showing only <strong>{statusFilter.toUpperCase()}</strong> items (selected from Dashboard).
          </span>
          <button
            className="btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--color-spoiled)', color: 'var(--color-spoiled)', cursor: 'pointer' }}
            onClick={() => {
              setStatusFilter('all');
              if (onClearStatusFilter) onClearStatusFilter();
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['all', 'fruits', 'vegetables', 'cooked food', 'packaged food'].map(cat => (
          <button
            key={cat}
            className="btn-secondary"
            style={{ textTransform: 'capitalize', padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: categoryFilter === cat ? 'var(--color-fresh)' : 'var(--glass-border)', background: categoryFilter === cat ? 'rgba(0,230,118,0.05)' : 'var(--glass-bg)' }}
            onClick={() => setCategoryFilter(cat)}>
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {filteredInventory.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No items found in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredInventory.map(item => {
            const currentPct = getFreshnessPercentage(item);
            const daysLeft = getDaysLeft(item);
            const statusClass = currentPct > 70 ? 'fresh-badge' : currentPct > 30 ? 'warning-badge' : 'spoiled-badge';
            const isAlreadyUsed = markedUsed.has(item._id);
            const isExpiringSoon = daysLeft <= 2;

            return (
              <div
                key={item._id}
                className="glass-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 2fr 1fr',
                  gap: '2rem',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  borderColor: isExpiringSoon && !isAlreadyUsed
                    ? (daysLeft <= 1 ? 'var(--color-spoiled)' : 'var(--color-warning)')
                    : 'var(--glass-border)'
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '120px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--glass-border)', opacity: isAlreadyUsed ? 0.5 : 1 }}
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='100%' height='100%' fill='%2313151b'/><text x='50%' y='55%' font-family='sans-serif' font-size='24' fill='%2300E676' text-anchor='middle'>🍏</text></svg>";
                    }}
                  />
                  <span style={{
                    position: 'absolute', bottom: '4px', left: '4px', fontSize: '0.65rem', padding: '0.2rem 0.4rem',
                    borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700,
                    background: item.category === 'fruits' ? 'var(--cat-fruits)' : item.category === 'vegetables' ? 'var(--cat-vegetables)' : item.category === 'cooked food' ? 'var(--cat-cooked)' : 'var(--cat-packaged)',
                    color: item.category === 'fruits' ? '#0b0c10' : '#fff'
                  }}>
                    {item.category}
                  </span>
                  {isAlreadyUsed && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--color-fresh)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#0b0c10' }}>✓</div>
                  )}
                </div>

                {/* Info + freshness bar */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', opacity: isAlreadyUsed ? 0.6 : 1 }}>{item.name}</h3>
                    <span className={`user-score-badge ${statusClass}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                      {item.status} ({currentPct}%)
                    </span>
                    {isExpiringSoon && !isAlreadyUsed && (
                      <span style={{
                        fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700,
                        background: daysLeft <= 1 ? 'rgba(255,23,68,0.1)' : 'rgba(255,145,0,0.1)',
                        border: `1px solid ${daysLeft <= 1 ? 'var(--color-spoiled)' : 'var(--color-warning)'}`,
                        color: daysLeft <= 1 ? 'var(--color-spoiled)' : 'var(--color-warning)'
                      }}>
                        {daysLeft === 0 ? '⚠️ Expired' : `⏰ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                      </span>
                    )}
                    {isAlreadyUsed && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--color-fresh)', color: 'var(--color-fresh)', fontWeight: 700 }}>
                        ✅ Marked as Used
                      </span>
                    )}
                  </div>

                  <div className="progress-container" style={{ margin: '0.5rem 0' }}>
                    <div className="progress-bar" style={{
                      width: `${currentPct}%`,
                      background: currentPct > 70 ? 'var(--color-fresh)' : currentPct > 30 ? 'var(--color-warning)' : 'var(--color-spoiled)'
                    }} />
                  </div>

                  {currentPct <= 50 || item.status === 'Spoiled' ? (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 23, 68, 0.08)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-spoiled)',
                      color: 'var(--color-spoiled)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      ⚠️ WARNING: This item is spoiled. Do not eat!
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.8rem', color: ambientTemp === 'Hot' ? 'var(--color-warning)' : 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.5rem', fontStyle: ambientTemp === 'Hot' ? 'italic' : 'normal' }}>
                        💡 {getDynamicStorageAdvisory(item)}
                      </p>
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.75rem', fontWeight: 600 }}>
                          <span>🔥 {item.nutrition.calories} kcal</span>
                          <span>💪 Prot: {item.nutrition.protein}g</span>
                          <span>🍞 Carb: {item.nutrition.carbs}g</span>
                          <span>💧 Fat: {item.nutrition.fat}g</span>
                          <span>• Vitamins: {item.nutrition.vitamins.join(', ')}</span>
                        </div>
                        {item.nutrition.healthNotes && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            ℹ️ {item.nutrition.healthNotes}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Action Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {currentPct > 50 && item.status !== 'Spoiled' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-fresh)' }}
                        onChange={() => handleUsed(item._id)}
                      />
                      <span>Used</span>
                    </label>
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-spoiled)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ❌ Don't Use
                    </span>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-spoiled)', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-spoiled)' }}
                      onChange={() => onDeleteItem(item._id)}
                    />
                    <span>Remove</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
