import React, { useState, useEffect } from 'react';
import { Household } from '../types';

export const CoOpHousehold: React.FC = () => {
  const [household, setHousehold] = useState<Household>({
    code: 'FRIDGE-988-JOIN',
    members: ['C. Jasvina', 'Dr. Priskilla', 'Angel Rani'],
    logs: [
      { member: 'Dr. Priskilla', action: 'Added', item: 'Fresh Broccoli', timestamp: new Date().toISOString() }
    ],
    chores: [
      { id: 'c-1', task: 'Eat tomatoes before decay', assignee: 'C. Jasvina', done: false }
    ]
  });

  const [joinCode, setJoinCode] = useState('');
  const [newChore, setNewChore] = useState('');
  const [choreAssignee, setChoreAssignee] = useState('C. Jasvina');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHousehold = async () => {
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/household');
      const data = await response.json();
      if (data.success) {
        setHousehold(data.household);
      }
    } catch (err) {
      console.log('Using local fallback for household.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/household/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode })
      });
      const data = await response.json();
      if (data.success) {
        setHousehold(data.household);
        setJoinCode('');
      }
    } catch (err) {
      alert('Failed to join household.');
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChore.trim()) return;
    try {
      const response = await fetch('https://pdd-9fqv.onrender.com/api/household/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newChore, assignee: choreAssignee })
      });
      const data = await response.json();
      if (data.success) {
        fetchHousehold();
        setNewChore('');
      }
    } catch (err) {
      alert('Failed to add chore.');
    }
  };

  const handleToggleChore = async (id: string) => {
    try {
      const response = await fetch(`https://pdd-9fqv.onrender.com/api/household/chores/${id}/toggle`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        fetchHousehold();
      }
    } catch (err) {
      // Local state fallback
      const updatedChores = household.chores.map(c => 
        c.id === id ? { ...c, done: !c.done } : c
      );
      setHousehold({ ...household, chores: updatedChores });
    }
  };

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Synchronizing fridge co-op...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Collaborative Household Co-Op</h1>
        <p style={{ color: 'var(--text-muted)' }}>Share fridge inventories with family members and track daily chores.</p>
      </div>

      <div className="dashboard-grid">
        {/* Left column: members & join */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Join Household */}
          <div className="glass-card">
            <h2>Active Household Profile</h2>
            <div style={{ margin: '1rem 0' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Group Invitation Code:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-fresh)', letterSpacing: '1px', marginTop: '0.25rem' }}>
                {household.code}
              </div>
            </div>

            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
              <input 
                type="text" 
                placeholder="Enter Code (e.g. FRIDGE-550)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Join Group
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="glass-card">
            <h2>Household Members ({household.members.length})</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
              {household.members.map((member, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '20px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-fresh)' }}/>
                  {member}
                </div>
              ))}
            </div>
          </div>

          {/* Household activity logs */}
          <div className="glass-card">
            <h2>Fridge Sync Activity Logs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {household.logs.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                  <strong>{log.member}</strong> {log.action.toLowerCase()}{' '}
                  <span style={{ color: '#fff', fontWeight: 600 }}>{log.item}</span>{' '}
                  <span style={{ fontSize: '0.75rem', float: 'right' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Chores list */}
        <div className="glass-card">
          <h2>Co-Op Chores Checklist</h2>
          
          <form onSubmit={handleAddChore} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Chore description (e.g. Eat Tomatoes)"
              value={newChore}
              onChange={(e) => setNewChore(e.target.value)}
              required
              style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
            <select 
              value={choreAssignee}
              onChange={(e) => setChoreAssignee(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {household.members.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Add
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {household.chores.map(chore => (
              <div 
                key={chore.id} 
                onClick={() => handleToggleChore(chore.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  opacity: chore.done ? 0.4 : 1,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={chore.done} 
                  readOnly 
                  style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', textDecoration: chore.done ? 'line-through' : 'none', fontWeight: 600 }}>
                    {chore.task}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Assignee: {chore.assignee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
