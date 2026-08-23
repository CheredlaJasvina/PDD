import React, { useState, useEffect } from 'react';
import { AnalyticsReport, WasteSummary } from '../types';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [wasteSummary, setWasteSummary] = useState<WasteSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wasteView, setWasteView] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsRes, wasteRes] = await Promise.all([
        fetch('http://localhost:5000/api/analytics'),
        fetch('http://localhost:5000/api/waste-summary')
      ]);
      const analyticsData = await analyticsRes.json();
      const wasteData = await wasteRes.json();
      if (analyticsData.success) setData(analyticsData);
      else setError('Failed to fetch analytics report.');
      if (wasteData.success) setWasteSummary(wasteData);
    } catch (err) {
      setError('Could not connect to database backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const changeMonth = (direction: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    setCurrentDate(nextDate);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-fresh)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}/>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Compiling wastage statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', borderColor: 'var(--color-spoiled)' }}>
        <p style={{ color: 'var(--color-spoiled)' }}>{error || 'No analytics loaded'}</p>
        <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={fetchAnalytics}>Retry Load</button>
      </div>
    );
  }

  // Generate days for interactive calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Padded days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthTotalDays - i).padStart(2, '0')}`
    });
  }

  // Active days of current month
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  // Calendar event parser
  const getDayEvents = (dateString: string) => {
    return data.calendarEvents.filter(ev => ev.date === dateString);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to render bar chart heights
  const maxWeeklyVal = Math.max(...data.weeklyReport.consumed, ...data.weeklyReport.wasted, 1);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Wastage & Consumption Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Visualize healthy food ratios, calendar grids, and waste prevention metrics.</p>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Weekly wastage + ratios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Weekly Histogram chart */}
          <div className="glass-card">
            <h2>Weekly Consumption vs. Wastage</h2>
            <div style={{ display: 'flex', height: '200px', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem 0', gap: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              {data.weeklyReport.days.map((day, idx) => {
                const eatenVal = data.weeklyReport.consumed[idx];
                const wastedVal = data.weeklyReport.wasted[idx];
                
                const eatenHeight = (eatenVal / maxWeeklyVal) * 100;
                const wastedHeight = (wastedVal / maxWeeklyVal) * 100;

                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', height: '80%', justifyContent: 'center' }}>
                      {/* Eaten Bar */}
                      <div 
                        style={{ 
                          width: '12px', 
                          height: `${eatenHeight}%`, 
                          background: 'var(--color-fresh)', 
                          borderRadius: '4px 4px 0 0',
                          minHeight: eatenVal > 0 ? '4px' : '0px'
                        }}
                        title={`Eaten: ${eatenVal}`}
                      />
                      {/* Wasted Bar */}
                      <div 
                        style={{ 
                          width: '12px', 
                          height: `${wastedHeight}%`, 
                          background: 'var(--color-spoiled)', 
                          borderRadius: '4px 4px 0 0',
                          minHeight: wastedVal > 0 ? '4px' : '0px'
                        }}
                        title={`Wasted: ${wastedVal}`}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>{day}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-fresh)', borderRadius: '2px' }}/>
                <span>Consumed / Eaten</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-spoiled)', borderRadius: '2px' }}/>
                <span>Discarded / Wasted</span>
              </div>
            </div>
          </div>

          {/* Healthy vs Packaged ratio */}
          <div className="glass-card">
            <h2>Healthy Produce vs. Packaged Junk Ratio</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginTop: '1.5rem' }}>
              {/* Circular Chart Ring */}
              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/>
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="var(--color-fresh)" 
                    strokeWidth="3.5" 
                    strokeDasharray={`${data.nutritionalRatio.healthyPercentage} ${100 - data.nutritionalRatio.healthyPercentage}`}
                  />
                </svg>
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{data.nutritionalRatio.healthyPercentage}%</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>HEALTHY</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <strong>🥦 Fresh Produce (Fruits & Veg)</strong>
                    <span>{data.nutritionalRatio.healthyCount} scans</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.nutritionalRatio.healthyPercentage}%`, height: '100%', background: 'var(--color-fresh)' }}/>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <strong>🍔 Processed & Packaged Foods</strong>
                    <span>{data.nutritionalRatio.junkCount} scans</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${data.nutritionalRatio.junkPercentage}%`, height: '100%', background: 'var(--color-spoiled)' }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Monthly Calendar View + Buying advice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Calendar Box */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2>Consumption History</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => changeMonth(-1)}>◀</button>
                <span style={{ minWidth: '110px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                  {monthNames[month]} {year}
                </span>
                <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => changeMonth(1)}>▶</button>
              </div>
            </div>

            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => (
                <div key={dIdx} className="calendar-day-label">{day}</div>
              ))}
              
              {calendarDays.map((dayItem, dIdx) => {
                const dayEvents = getDayEvents(dayItem.dateString);
                
                // Color dots depending on events on that day
                let dotColor = null;
                if (dayEvents.length > 0) {
                  const hasWaste = dayEvents.some(ev => ev.type === 'waste');
                  const hasScan = dayEvents.some(ev => ev.type === 'scan');
                  if (hasWaste) dotColor = 'var(--color-spoiled)';
                  else if (hasScan) dotColor = 'var(--color-fresh)';
                  else dotColor = 'var(--color-warning)';
                }

                return (
                  <div 
                    key={dIdx} 
                    className="calendar-cell"
                    style={{ 
                      opacity: dayItem.isCurrentMonth ? 1 : 0.25,
                      borderColor: dayEvents.length > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
                    }}
                    title={dayEvents.map(e => `${e.name} (${e.type})`).join(', ')}
                  >
                    <span>{dayItem.day}</span>
                    {dotColor && <span className="calendar-dot" style={{ background: dotColor }}/>}
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.7rem', justifyContent: 'center' }}>
              <span>🟢 Item Scanned</span>
              <span>🔴 Spoilage / Wasted</span>
              <span>🟡 Consumed</span>
            </div>
          </div>

          {/* Smart buying advice */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <h2>Smart Buying Recommendations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
              {data.buyingRecommendations.map((rec, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  <span>💡</span>
                  <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FOOD WASTE REPORT ── */}
          {wasteSummary && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-spoiled)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2>🗑️ Food Waste Report</h2>
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', border: 'none', background: wasteView === 'weekly' ? 'var(--glass-border)' : 'transparent', color: wasteView === 'weekly' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setWasteView('weekly')}>
                    This Week
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', border: 'none', background: wasteView === 'monthly' ? 'var(--glass-border)' : 'transparent', color: wasteView === 'monthly' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setWasteView('monthly')}>
                    This Month
                  </button>
                </div>
              </div>

              {/* Stat tiles */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,23,68,0.06)', borderRadius: '10px', border: '1px solid rgba(255,23,68,0.15)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-spoiled)' }}>{wasteView === 'weekly' ? wasteSummary.weeklyWastedCount : wasteSummary.monthlyWastedCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>ITEMS WASTED {wasteView === 'weekly' ? 'THIS WEEK' : 'THIS MONTH'}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(0,230,118,0.06)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.15)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-fresh)' }}>{wasteSummary.membersCount}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>HOUSEHOLD MEMBERS</div>
                </div>
              </div>

              {/* Wasted items list */}
              {(wasteView === 'weekly' ? wasteSummary.weeklyWastedItems : wasteSummary.monthlyWastedItems).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,230,118,0.04)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.12)' }}>
                  <p style={{ color: 'var(--color-fresh)', fontWeight: 600 }}>🎉 Zero waste {wasteView === 'weekly' ? 'this week' : 'this month'}!</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Keep using your items before they expire to maintain this streak.</p>
                </div>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 600 }}>Wasted items ({wasteView === 'weekly' ? 'last 7 days' : 'last 30 days'}):</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(wasteView === 'weekly' ? wasteSummary.weeklyWastedItems : wasteSummary.monthlyWastedItems).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.45rem 0.75rem', background: 'rgba(255,23,68,0.04)', borderRadius: '6px', border: '1px solid rgba(255,23,68,0.08)' }}>
                        <span>🗑️ <strong>{it.name}</strong></span>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{it.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy-less advice per item */}
              {wasteSummary.buyAdvice.length > 0 && (
                <div style={{ background: 'rgba(255,234,0,0.04)', border: '1px solid rgba(255,234,0,0.12)', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.75rem' }}>
                    🛒 Buy Less Next Time — Quantity Advice for {wasteSummary.membersCount} Member{wasteSummary.membersCount > 1 ? 's' : ''}:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {wasteSummary.buyAdvice.map((adv, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        <span>📦</span>
                        <span style={{ color: 'var(--text-muted)' }}>{adv.advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



        </div>
      </div>
    </div>
  );
};
