import { useState, useEffect } from 'react';
import { FoodItem, User } from './types';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { Inventory } from './components/Inventory';
import { Recipes } from './components/Recipes';
import { Analytics } from './components/Analytics';
import { ProfileSettings } from './components/ProfileSettings';
import { LandingAuth } from './components/LandingAuth';
import { EcoImpact } from './components/EcoImpact';
import { CoOpHousehold } from './components/CoOpHousehold';
import { CommunityCatalog } from './components/CommunityCatalog';
import { EnterpriseScreen } from './components/EnterpriseScreens';

interface SidebarScreen {
  id: string;
  name: string;
  icon: string;
}

interface SidebarCategory {
  title: string;
  icon: string;
  screens: SidebarScreen[];
}

const sidebarCategories: SidebarCategory[] = [
  {
    title: "Dashboard & Overview",
    icon: "📊",
    screens: [
      { id: "dashboard", name: "Dashboard Summary", icon: "📈" },
      { id: "scanner", name: "Visual laser scan", icon: "📸" },
      { id: "inventory", name: "Dynamic Pantry Inventory", icon: "📦" },
      { id: "analytics", name: "Waste Cost Tracker", icon: "📉" },
      { id: "alerts", name: "Real-time Spoilage Alerts", icon: "🚨" },
      { id: "insights", name: "AI Consumption Insights", icon: "🧠" }
    ]
  },
  {
    title: "Smart Recipe Engine",
    icon: "🥗",
    screens: [
      { id: "recipes", name: "Dish Suggestion Hub", icon: "🥣" },
      { id: "recipes-portions", name: "Cooking Portion Scaler", icon: "⚖️" },
      { id: "recipes-kids", name: "Kid-Friendly Adjuster", icon: "👶" },
      { id: "recipes-gourmet", name: "Gourmet Upgrade Guide", icon: "🧑‍🍳" },
      { id: "recipes-leftovers", name: "Leftovers Re-purposer", icon: "♻️" },
      { id: "recipes-spice", name: "Spice Customizer", icon: "🌶️" },
      { id: "recipes-allergens", name: "Allergen Warning Safe-List", icon: "🚫" }
    ]
  },
  {
    title: "Eco & Sustainability",
    icon: "🌿",
    screens: [
      { id: "eco", name: "Eco & Carbon Tracker", icon: "🌱" },
      { id: "eco-savings", name: "Financial Savings Meter", icon: "₹" },
      { id: "eco-standings", name: "Community Standing", icon: "🏆" },
      { id: "eco-donation", name: "Food Donation Registry", icon: "🎁" },
      { id: "eco-compost", name: "Compost Safety Advisor", icon: "🍂" },
      { id: "eco-waste", name: "Bio-waste Optimizer", icon: "🪱" },
      { id: "eco-scorecard", name: "Green Citizen Scorecard", icon: "💳" },
      { id: "eco-challenges", name: "Weekly Zero-Waste Challenges", icon: "🎯" }
    ]
  },
  {
    title: "Co-Op & Sharing",
    icon: "👥",
    screens: [
      { id: "household", name: "Household Members Manager", icon: "🏠" },
      { id: "coop-ledger", name: "Fridge Co-op Ledger", icon: "📖" },
      { id: "coop-pantry", name: "Shared Pantry Log", icon: "🪵" },
      { id: "coop-planner", name: "Shopping Co-op Planner", icon: "📝" },
      { id: "coop-splitter", name: "Expense Splitter", icon: "✂️" },
      { id: "coop-rules", name: "Co-Op Household Rules", icon: "⚖️" },
      { id: "coop-wishlist", name: "Shared Grocery Wishlist", icon: "🛒" }
    ]
  },
  {
    title: "Community Catalog",
    icon: "🤝",
    screens: [
      { id: "community", name: "Surplus Catalog Market", icon: "🛒" },
      { id: "community-maps", name: "Local Food Donation Maps", icon: "📍" },
      { id: "community-claims", name: "Claim Food Requests", icon: "🙋" },
      { id: "community-catalogs", name: "Public Food Catalogs", icon: "📁" },
      { id: "community-standings", name: "Neighborhood Standings", icon: "🏅" },
      { id: "community-dispatch", name: "Volunteer Dispatch Hub", icon: "🚒" },
      { id: "community-events", name: "Local Food Sharing Events", icon: "🎪" }
    ]
  },
  {
    title: "Advisories & Library",
    icon: "📖",
    screens: [
      { id: "adv-storage", name: "Crop Storage Database", icon: "🗄️" },
      { id: "adv-temp", name: "Ambient Temp Adjuster", icon: "🌡️" },
      { id: "adv-science", name: "Spoilage Science Library", icon: "🔬" },
      { id: "adv-poisoning", name: "Food Poisoning Prevention", icon: "🧼" },
      { id: "adv-meal", name: "Smart Meal Planner", icon: "📅" },
      { id: "adv-nutrition", name: "Nutrition Profiler", icon: "🍎" },
      { id: "adv-preservatives", name: "Preservatives Warning Guide", icon: "⚠️" },
      { id: "adv-preservation", name: "DIY Food Dehydrator Guide", icon: "☀️" }
    ]
  },
  {
    title: "Theme & Profiles",
    icon: "⚙️",
    screens: [
      { id: "settings", name: "Main Dietary Profile", icon: "👤" },
      { id: "settings-notice", name: "Expiry Advance Schedule", icon: "⏰" },
      { id: "settings-theme", name: "Color Theme Switcher", icon: "🎨" },
      { id: "settings-alerts", name: "In-app Alert Controls", icon: "🔔" },
      { id: "settings-email", name: "Email Warning Config", icon: "📧" },
      { id: "settings-badges", name: "Achievement Badges", icon: "🎖️" }
    ]
  }
];

function App() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [pantryStatusFilter, setPantryStatusFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Dashboard & Overview": true
  });

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'emerald-aurora';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'emerald-aurora' : 'light');
  };

  const fetchInventory = async () => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const response = await fetch('https://pdd-9fqv.onrender.com/api/inventory', {
        headers: { 'x-user-email': email }
      });
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/me', {
        headers: { 'x-user-email': email }
      });
      const data = await response.json();
      if (data.success && data.user) {
        setLoggedInUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    }
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      setIsLoading(true);
      const cachedUserStr = localStorage.getItem('user');
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          setLoggedInUser(cachedUser);
        } catch (e) {
          console.error(e);
        }
      }
      await fetchInventory();
      setIsLoading(false);
    };
    bootstrapSession();
  }, []);

  const handleLoginSuccess = (user: User, _token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    setLoggedInUser(user);
    fetchInventory();
  };

  const handleLogout = async () => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      await fetch('https://pdd-9fqv.onrender.com/api/auth/logout', { 
        method: 'POST',
        headers: { 'x-user-email': email }
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setActiveTab('dashboard');
  };

  // Update item consumed/wasted state
  const handleUpdateItemState = async (id: string, state: 'Used' | 'Eaten' | 'Wasted') => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const response = await fetch(`https://pdd-9fqv.onrender.com/api/inventory/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({ state })
      });
      const data = await response.json();
      if (data.success) {
        await fetchInventory();
        await fetchCurrentUser(); // streak/badges might unlock
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  // Delete item permanently
  const handleDeleteItem = async (id: string) => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const response = await fetch(`https://pdd-9fqv.onrender.com/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': email }
      });
      const data = await response.json();
      if (data.success) {
        await fetchInventory();
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  // Callback when scanner saves a scanned item
  const handleScanComplete = (_scannedItems: FoodItem[]) => {
    fetchInventory();
    fetchCurrentUser();
  };

  // Add manual item fallback
  const handleAddManual = async (manualData: any) => {
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const response = await fetch('https://pdd-9fqv.onrender.com/api/manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({
          ...manualData,
          dietaryPreferences: loggedInUser?.dietaryPreferences || []
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchInventory();
        setActiveTab('inventory'); 
      }
    } catch (error) {
      console.error('Error adding manual item:', error);
    }
  };

  // Update preferences & Profile edit parameters in backend
  const handleUpdatePreferences = async (updates: Partial<User>) => {
    if (!loggedInUser) return;
    try {
      const cachedUser = localStorage.getItem('user');
      const email = cachedUser ? JSON.parse(cachedUser).email : '';
      const updatedUser = { ...loggedInUser, ...updates };
      const response = await fetch('https://pdd-9fqv.onrender.com/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify(updatedUser)
      });
      const data = await response.json();
      if (data.success) {
        setLoggedInUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error saving settings profile:', error);
    }
  };

  const getScreenName = (id: string): string => {
    for (const cat of sidebarCategories) {
      const match = cat.screens.find(s => s.id === id);
      if (match) return match.name;
    }
    return "Unknown Module";
  };

  const renderActiveTab = () => {
    if (!loggedInUser) return null;
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            inventory={inventory} 
            preferences={loggedInUser} 
            onUpdateState={handleUpdateItemState} 
            onNavigate={(tab: string, status?: string) => {
              setActiveTab(tab);
              if (status) setPantryStatusFilter(status);
            }}
          />
        );
      case 'scanner':
        return (
          <Scanner 
            onScanComplete={handleScanComplete}
            onAddManual={handleAddManual}
          />
        );
      case 'inventory':
        return (
          <Inventory 
            inventory={inventory} 
            onUpdateState={handleUpdateItemState} 
            onDeleteItem={handleDeleteItem}
            initialStatusFilter={pantryStatusFilter}
            onClearStatusFilter={() => setPantryStatusFilter('all')}
          />
        );
      case 'recipes':
        return (
          <Recipes 
            preferences={loggedInUser} 
            onUpdatePreferences={handleUpdatePreferences}
            inventory={inventory}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'eco':
        return <EcoImpact />;
      case 'household':
        return <CoOpHousehold />;
      case 'community':
        return <CommunityCatalog />;
      case 'settings':
        return (
          <ProfileSettings 
            preferences={loggedInUser} 
            onUpdatePreferences={handleUpdatePreferences}
            theme={theme}
            onThemeChange={setTheme}
          />
        );
      default:
        const screenName = getScreenName(activeTab);
        return (
          <EnterpriseScreen
            screenId={activeTab}
            screenName={screenName}
            inventory={inventory}
            preferences={loggedInUser}
            onUpdatePreferences={handleUpdatePreferences}
            theme={theme}
            onThemeChange={setTheme}
          />
        );
    }
  };

  // Authenticate wrapper check
  if (!loggedInUser) {
    return <LandingAuth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Mobile top bar */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
          ☰
        </button>
        <div className="logo-container" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 120 120" width="36" height="36" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
            <rect x="5" y="5" width="110" height="110" rx="28" fill="#0E1B18" stroke="#00E676" strokeWidth="1.5" strokeOpacity="0.5"/>
            <circle cx="35" cy="35" r="25" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.3"/>
            <circle cx="35" cy="35" r="35" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.2"/>
            <circle cx="35" cy="35" r="45" fill="none" stroke="#00E676" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.1"/>
            <path d="M 60 40 C 53 40, 48 37, 43 40 C 33 46, 33 66, 38 78 C 43 90, 53 95, 60 90 C 67 95, 77 90, 82 78 C 84 72, 85 71, 80 68 C 74 65, 74 55, 80 52 C 85 49, 84 48, 82 46 C 77 40, 72 40, 67 40 C 63 37, 60 40, 60 40 Z" fill="none" stroke="#00E676" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="70" cy="65" r="2" fill="#00E676"/>
            <path d="M 60 40 C 60 32, 65 28, 65 28" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M 65 28 C 72 26, 76 30, 70 34 C 66 36, 64 32, 65 28 Z" fill="#FFE200"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              <span style={{ color: '#FFFFFF' }}>Fresh</span>
              <span style={{ color: '#00E676' }}>Radar</span>
            </div>
            <span style={{ fontSize: '0.5rem', fontWeight: 600, color: '#8A99AD', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>
              Smart Food Freshness Tracking
            </span>
          </div>
        </div>
        <div style={{ width: '36px' }}></div>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Dynamic Sidebar Navigation */}
      <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 120 120" width="40" height="40" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
            <rect x="5" y="5" width="110" height="110" rx="28" fill="#0E1B18" stroke="#00E676" strokeWidth="1.5" strokeOpacity="0.5"/>
            {/* Solid Apple Body */}
            <path d="M 60 42 C 48 42, 33 50, 33 75 C 33 98, 48 108, 60 108 C 72 108, 87 98, 87 75 C 87 50, 72 42, 60 42 Z" fill="#00E676" />
            {/* Highlight */}
            <ellipse cx="48" cy="62" rx="5" ry="11" fill="#FFFFFF" opacity="0.4" transform="rotate(-15 48 62)" />
            {/* Stem */}
            <path d="M 60 42 C 60 27, 70 22, 70 22" fill="none" stroke="#8B5A2B" strokeWidth="4" strokeLinecap="round" />
            {/* Leaf */}
            <path d="M 70 22 C 80 22, 85 30, 75 34 C 68 37, 66 30, 70 22 Z" fill="#2E7D32" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              <span style={{ color: '#FFFFFF' }}>Fresh</span>
              <span style={{ color: '#00E676' }}>Radar</span>
            </div>
            <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#8A99AD', letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: '2px' }}>
              Smart Food Freshness Tracking
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
          {sidebarCategories.map((cat) => {
            const isExpanded = !!expandedCategories[cat.title];
            return (
              <div key={cat.title} style={{ marginBottom: '0.5rem' }}>
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(cat.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: isExpanded ? 'var(--text-main)' : 'var(--text-muted)',
                    transition: 'var(--transition-smooth)',
                    userSelect: 'none',
                    marginBottom: '0.25rem'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{cat.icon}</span>
                    <span>{cat.title}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {isExpanded ? '▼' : '►'}
                  </span>
                </div>

                {/* Sub-menu links */}
                {isExpanded && (
                  <ul className="nav-menu" style={{ listStyle: 'none', margin: '0.25rem 0 0.5rem 0.5rem', padding: 0 }}>
                    {cat.screens.map((screen) => {
                      const isActive = activeTab === screen.id;
                      return (
                        <li
                          key={screen.id}
                          className={`nav-item ${isActive ? 'active' : ''}`}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                            background: isActive ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                            border: isActive ? '1px solid var(--color-fresh)' : '1px solid transparent',
                            transition: 'var(--transition-smooth)'
                          }}
                          onClick={() => {
                            setActiveTab(screen.id);
                            setIsMobileSidebarOpen(false);
                          }}
                        >
                          <span>{screen.icon}</span>
                          <span>{screen.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}

          <ul className="nav-menu" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', listStyle: 'none', paddingLeft: 0 }}>
            <li className="nav-item" onClick={() => { toggleTheme(); setIsMobileSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span> {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </li>
            <li className="nav-item" onClick={() => { handleLogout(); setIsMobileSidebarOpen(false); }} style={{ color: 'var(--color-spoiled)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              <span className="nav-icon">🚪</span> Sign Out
            </li>
          </ul>
        </nav>

        {/* User Sidebar Profile Widget */}
        <div className="user-widget">
          <div className="user-header">
            <div className="user-avatar" style={{ textTransform: 'uppercase' }}>{loggedInUser.name.substring(0, 2)}</div>
            <div className="user-info">
              <strong style={{ display: 'block' }}>{loggedInUser.name}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Streak: 🔥 {loggedInUser.streakCount}d</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Screen Content panel */}
      <main className="main-content">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-fresh)', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' }}/>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Synching inventory with database...</p>
          </div>
        ) : (
          renderActiveTab()
        )}
      </main>
    </div>
  );
}

export default App;
