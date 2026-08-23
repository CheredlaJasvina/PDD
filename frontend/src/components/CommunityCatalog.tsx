import React, { useState, useEffect } from 'react';
import { Donation, CatalogItem } from '../types';

export const CommunityCatalog: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [donationName, setDonationName] = useState('');
  const [donationQty, setDonationQty] = useState('');
  const [donationExpiry, setDonationExpiry] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Item Creator States
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState(100);
  const [customProtein, setCustomProtein] = useState(5);
  const customCarbs = 20;
  const customFat = 2;

  const [activeSubTab, setActiveSubTab] = useState<'board' | 'database' | 'locator'>('board');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommunityData = async () => {
    try {
      const donRes = await fetch('https://pdd-9fqv.onrender.com/api/donations');
      const catRes = await fetch('https://pdd-9fqv.onrender.com/api/catalog');
      
      const donData = await donRes.json();
      const catData = await catRes.json();

      if (donData.success) setDonations(donData.donations);
      if (catData.success) setCatalog(catData.catalog);
    } catch (err) {
      console.log('Error pulling community data. Falls back offline.');
      // Local seeding fallbacks
      setDonations([
        { _id: 'd-1', donor: 'C. Jasvina', name: 'Red Tomatoes', quantity: '3 pcs', daysLeft: 2, distance: '0.2 km', status: 'Available' },
        { _id: 'd-2', donor: 'David K.', name: 'Wheat Bread', quantity: '1 loaf', daysLeft: 1, distance: '1.5 km', status: 'Requested' }
      ]);
      setCatalog([
        { name: 'Bananas', category: 'fruits', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, vitamins: ['B6', 'C'], storageAdvice: 'Keep at room temp.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const handlePostDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationName.trim()) return;
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: donationName, quantity: donationQty, daysLeft: donationExpiry })
      });
      const data = await response.json();
      if (data.success) {
        fetchCommunityData();
        setDonationName('');
        setDonationQty('');
      }
    } catch (err) {
      alert('Post failed.');
    }
  };

  const handleRequestItem = async (id: string) => {
    try {
      const response = await fetch(`https://pdd-9fqv.onrender.com/api/donations/${id}/request`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        fetchCommunityData();
      }
    } catch (err) {
      // Local fallback
      const updated = donations.map(d => 
        d._id === id ? { ...d, status: d.status === 'Available' ? 'Requested' : 'Available' } as Donation : d
      );
      setDonations(updated);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customName, category: 'cooked food', calories: customCalories, protein: customProtein, carbs: customCarbs, fat: customFat, vitamins: ['C'], storageAdvice: 'Keep frozen.' })
      });
      const data = await response.json();
      if (data.success) {
        fetchCommunityData();
        alert('Custom item profile saved!');
        setCustomName('');
      }
    } catch (err) {
      alert('Failed to save profile.');
    }
  };

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Synching neighborhood food boards...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Community Food Sharing & Database</h1>
          <p style={{ color: 'var(--text-muted)' }}>Share ingredients, locate local food banks, and check food properties.</p>
        </div>
        
        {/* Sub tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
          <button 
            className="btn-secondary"
            style={{ border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: activeSubTab === 'board' ? 'var(--glass-border)' : 'transparent' }}
            onClick={() => setActiveSubTab('board')}
          >
            🤝 Share Board
          </button>
          <button 
            className="btn-secondary"
            style={{ border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: activeSubTab === 'database' ? 'var(--glass-border)' : 'transparent' }}
            onClick={() => setActiveSubTab('database')}
          >
            🔍 Food Database
          </button>
          <button 
            className="btn-secondary"
            style={{ border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: activeSubTab === 'locator' ? 'var(--glass-border)' : 'transparent' }}
            onClick={() => setActiveSubTab('locator')}
          >
            📍 Food Banks
          </button>
        </div>
      </div>

      {/* SUB TAB 1: SHARING BOARD */}
      {activeSubTab === 'board' && (
        <div className="dashboard-grid">
          {/* Post donation form */}
          <div className="glass-card">
            <h2>Post Surplus Food for Neighbors</h2>
            <form onSubmit={handlePostDonation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Food Item Name:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Red Tomatoes"
                  value={donationName}
                  onChange={(e) => setDonationName(e.target.value)}
                  required
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Quantity / Volume:</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 3 pcs"
                    value={donationQty}
                    onChange={(e) => setDonationQty(e.target.value)}
                    required
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Days Left before Spoilage:</label>
                  <input 
                    type="number" 
                    value={donationExpiry}
                    onChange={(e) => setDonationExpiry(Number(e.target.value))}
                    required
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">
                Post to Neighborhood Board
              </button>
            </form>
          </div>

          {/* Active donations list */}
          <div className="glass-card">
            <h2>Active Neighbor Donation Posts ({donations.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {donations.map(don => (
                <div 
                  key={don._id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.01)',
                    borderColor: don.status === 'Requested' ? 'var(--color-warning)' : 'var(--glass-border)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', display: 'block' }}>{don.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Surplus: {don.quantity} • Donor: {don.donor} ({don.distance})
                      </span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-spoiled)', marginTop: '0.25rem' }}>
                        ⚠️ Will spoil in {don.daysLeft} days
                      </span>
                    </div>
                    <button 
                      className={don.status === 'Requested' ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleRequestItem(don._id)}
                    >
                      {don.status === 'Requested' ? 'Cancel Request' : 'Claim Item'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: NUTRITIONAL DATABASE */}
      {activeSubTab === 'database' && (
        <div className="dashboard-grid">
          {/* Catalog search explorer */}
          <div className="glass-card">
            <h2>Search Calories & Preservation Guidelines</h2>
            <input 
              type="text" 
              placeholder="🔍 Search Catalog (e.g. Spinach, Bananas...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredCatalog.map((item, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{item.name}</h3>
                    <span className="user-score-badge fresh-badge" style={{ fontSize: '0.7rem' }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Calories: {item.calories} kcal</span>
                    <span>Protein: {item.protein}g</span>
                    <span>Carbs: {item.carbs}g</span>
                    <span>Fat: {item.fat}g</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', lineHeight: 1.4 }}>
                    💡 Preservation Advice: {item.storageAdvice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Presets Creator */}
          <div className="glass-card">
            <h2>Define Custom Food Preset Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Define a food profile for items missing from the automated visual parser.
            </p>
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Custom Item Name:</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  placeholder="e.g. Jackfruit"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Calories (kcal):</label>
                  <input 
                    type="number" 
                    value={customCalories}
                    onChange={(e) => setCustomCalories(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Protein (g):</label>
                  <input 
                    type="number" 
                    value={customProtein}
                    onChange={(e) => setCustomProtein(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">
                Save Preset to Database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB TAB 3: LOCATIONS MAP */}
      {activeSubTab === 'locator' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="glass-card">
          <h2>Nearby Bio-Waste & Food Donation Collection Centers</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Coordinate donation pickups with nearby municipal collection centers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '2rem' }}>🏢</span>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block' }}>Central City Food Bank donation center</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address: 122 Broadway Rd. | Distance: 1.2 km | Accepts: Dry goods, sealed packaged tins.</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-fresh)', marginTop: '0.25rem' }}>🟢 Open: 08:00 AM - 06:00 PM</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '2rem' }}>♻️</span>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block' }}>Municipal bio-waste composting center</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address: Sector 4 Wastage landfill. | Distance: 3.4 km | Accepts: Bio scrap, spoiled meats, rotten produce.</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-fresh)', marginTop: '0.25rem' }}>🟢 Open: 24 Hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
