import React, { useState, useEffect } from 'react';
import { FoodItem, User } from '../types';

interface EnterpriseScreenProps {
  screenId: string;
  screenName: string;
  inventory: FoodItem[];
  preferences: User;
  onUpdatePreferences: (updates: any) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export const EnterpriseScreen: React.FC<EnterpriseScreenProps> = ({
  screenId,
  screenName,
  inventory,
  preferences,
  onUpdatePreferences,
  theme,
  onThemeChange
}) => {
  // Common container style
  const cardStyle = { padding: '2rem', maxWidth: '800px', margin: '1.5rem auto' };
  const headerStyle = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.25rem' };
  
  // 1. AI Consumption Insights
  const [insightText, setInsightText] = useState("Analyzing your recent storage trends...");
  useEffect(() => {
    if (screenId === 'insights') {
      const spoiled = inventory.filter(i => i.status === 'Spoiled').length;
      if (spoiled > 0) {
        setInsightText(`Warning: You have ${spoiled} spoiled item(s) in your pantry. We recommend prioritizing cooked meal usage before fruits decay.`);
      } else {
        const freshItems = inventory.filter(i => i.status === 'Fresh');
        const recommendationItem = freshItems.length > 0 ? freshItems[0].name : "your fresh items";
        setInsightText(`Excellent work! Your pantry wastage is currently at 0%. Try planning recipes using ${recommendationItem} to maintain this streak.`);
      }
    }
  }, [inventory, screenId]);

  // 2. Pantry Scan History
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setScanHistory(inventory.map(item => ({
        date: item.addedDate ? new Date(item.addedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        item: item.name,
        method: item.imageUrl ? "Visual Laser Scan" : "Manual Entry Lookup",
        status: "Success"
      })));
    } else {
      setScanHistory([
        { date: "2026-08-22", item: "Gala Apples", method: "Visual Laser Scan", status: "Success" },
        { date: "2026-08-20", item: "Organic Whole Milk", method: "Manual Entry Lookup", status: "Success" },
        { date: "2026-08-19", item: "Spaghetti Bolognese", method: "Receipt OCR Scan", status: "Success" }
      ]);
    }
  }, [inventory]);

  const clearHistory = () => {
    setScanHistory([]);
  };

  // 3. Portion Scaler
  const [portionsServings, setPortionsServings] = useState(2);
  
  // 4. Kid-Friendly Adjuster
  const [kidsSpice, setKidsSpice] = useState("Mild");
  
  // 5. Gourmet Upgrade
  const [gourmetLevel, setGourmetLevel] = useState("Home Cook");
  const [gourmetMsg, setGourmetMsg] = useState("");

  const handleSelectSubstitution = (replacement: string) => {
    if (!wishlist.includes(replacement)) {
      setWishlist([...wishlist, replacement]);
    }
    setGourmetMsg(`✨ Selected ${replacement}! Added to your grocery wishlist.`);
    setTimeout(() => {
      setGourmetMsg("");
    }, 4000);
  };

  // 6. Leftovers Re-purposer
  const [leftoverSearch, setLeftoverSearch] = useState("");
  const [leftoverRecipe, setLeftoverRecipe] = useState("");
  const handleLeftoverCheck = () => {
    if (leftoverSearch.toLowerCase().includes("rice")) {
      setLeftoverRecipe("💡 Recipe Suggestion: Egg Fried Rice. Scale leftovers, add peas and green onions.");
    } else if (leftoverSearch.toLowerCase().includes("milk")) {
      setLeftoverRecipe("💡 Recipe Suggestion: Homemade French Toast. Blend with eggs and sugar.");
    } else {
      setLeftoverRecipe("💡 Recipe Suggestion: Leftover Stew. Simmer with potatoes and veggie broths.");
    }
  };

  // 7. Spice Customizer
  const [spiceLevel, setSpiceLevel] = useState(5);

  // 8. Allergen list
  const [allergens, setAllergens] = useState<string[]>(preferences.dietaryPreferences || []);
  const handleAllergenToggle = (alg: string) => {
    const next = allergens.includes(alg) ? allergens.filter(a => a !== alg) : [...allergens, alg];
    setAllergens(next);
    onUpdatePreferences({ dietaryPreferences: next });
  };

  // 9. Savings goals
  const [savingsGoal, setSavingsGoal] = useState(1000);

  // 10. Community Standing Leaderboard
  const standings = [
    { rank: 1, name: "Dr. Priskilla", score: "96 XP" },
    { rank: 2, name: "C. Jasvina", score: "88 XP" },
    { rank: 3, name: "Angel Rani", score: "72 XP" },
    { rank: 4, name: preferences.name || "You", score: `${preferences.healthScore || 100} XP`, current: true }
  ];

  // 11. Donation Form
  const [donateName, setDonateName] = useState("");
  const [donateQty, setDonateQty] = useState("1 kg");
  const handleRegisterDonation = () => {
    if (!donateName) return alert("Enter item name");
    alert(`Registered ${donateQty} of ${donateName} to neighborhood surplus market!`);
    setDonateName("");
  };

  // 12. Compost Safety check
  const [compostInput, setCompostInput] = useState("");
  const [compostSafety, setCompostSafety] = useState("");
  const checkCompostSafety = () => {
    const item = compostInput.toLowerCase();
    if (item.includes("apple") || item.includes("peel") || item.includes("veg") || item.includes("banana")) {
      setCompostSafety("✅ SAFE: Organic greens and browns compost perfectly.");
    } else if (item.includes("meat") || item.includes("dairy") || item.includes("fish") || item.includes("cheese")) {
      setCompostSafety("❌ UNSAFE: Meat and dairy attract pests and generate bad odors in standard compost bins.");
    } else {
      setCompostSafety("ℹ️ UNKNOWN: Try checking moisture level. Organic plant fibers are generally safe.");
    }
  };

  // 13. Bio-waste optimizer
  const [wasteWeight, setWasteWeight] = useState(0.5);

  // 14. Challenges checklist
  const [challenges, setChallenges] = useState([
    { id: 1, title: "Zero Waste Hero", desc: "Finish Gala Apples before Friday", done: false },
    { id: 2, title: "Healthy Habit", desc: "Scan 3 fresh items in a week", done: true },
    { id: 3, title: "Community Share", desc: "Claim 1 donation item", done: false }
  ]);
  const toggleChallenge = (id: number) => {
    setChallenges(challenges.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  // 15. Shared Co-op ledger
  const [ledgerExpenses, setLedgerExpenses] = useState([
    { id: 1, member: "Dr. Priskilla", item: "Organic Brocoli", cost: 120 },
    { id: 2, member: "C. Jasvina", item: "Fresh Gala Apples", cost: 250 },
    { id: 3, member: "Angel Rani", item: "Milk Carton", cost: 80 }
  ]);
  const [newExpItem, setNewExpItem] = useState("");
  const [newExpCost, setNewExpCost] = useState(100);
  const addExpense = () => {
    if (!newExpItem) return;
    setLedgerExpenses([...ledgerExpenses, {
      id: Date.now(),
      member: preferences.name || "You",
      item: newExpItem,
      cost: newExpCost
    }]);
    setNewExpItem("");
  };

  // 16. Shared Pantry log timeline
  const pantryLogs = [
    { name: "Dr. Priskilla", action: "Consumed Gala Apples", time: "10 mins ago" },
    { name: "Angel Rani", action: "Added Milk bottle", time: "2 hours ago" },
    { name: "C. Jasvina", action: "Removed Spaghetti", time: "1 day ago" }
  ];

  // 17. Expense Splitter calculator
  const [splitAmount, setSplitAmount] = useState(600);
  const [splitPeople, setSplitPeople] = useState(3);

  // 18. Shared Rules
  const [rules, setRules] = useState([
    { id: 1, text: "Label all containers with the purchase date.", active: true },
    { id: 2, text: "Move warning items to the top shelf.", active: true },
    { id: 3, text: "Always verify safety advisories before eating.", active: false }
  ]);

  // 19. Shared Wishlist
  const [wishlist, setWishlist] = useState<string[]>(["Fresh Bananas", "Organic Greek Yogurt"]);
  const [wishInput, setWishInput] = useState("");
  const addWishItem = () => {
    if (wishInput) {
      setWishlist([...wishlist, wishInput]);
      setWishInput("");
    }
  };

  // 20. Volunteer Dispatch
  const [isVolunteering, setIsVolunteering] = useState(false);

  // 21. Crop Storage Database
  const cropDb = [
    { name: "Apples", temp: "Cool (4°C)", shelf: "3-4 weeks", place: "Crisper Drawer" },
    { name: "Bananas", temp: "Warm (18°C)", shelf: "5-7 days", place: "Countertop" },
    { name: "Milk", temp: "Cold (2°C)", shelf: "7 days", place: "Fridge Center Shelf" },
    { name: "Potato", temp: "Cool Dark (10°C)", shelf: "2 months", place: "Pantry Bin" }
  ];

  // 22. Spoilage Science Library
  const scienceArticles = [
    { title: "Ethylene Gas Breakdown", desc: "Understanding how apples release gases that accelerate banana decay." },
    { title: "Mold Chemistry & Humidity", desc: "Why high humidity levels trigger mold spores in leafy greens." },
    { title: "Bacterial Fermentation in Cooked Rice", desc: "The risk of Bacillus cereus in leftover rice stored above 4°C." }
  ];

  // 23. Smart Meal Planner
  const [plannedMeals, setPlannedMeals] = useState<Record<string, string>>({
    "Monday": "Apple Oats",
    "Wednesday": "Leftover Pasta Stew",
    "Friday": "Broccoli Cheese Bake"
  });
  const [newMealDay, setNewMealDay] = useState("Tuesday");
  const [newMealName, setNewMealName] = useState("");
  const addPlannedMeal = () => {
    if (!newMealName) return;
    setPlannedMeals({
      ...plannedMeals,
      [newMealDay]: newMealName
    });
    setNewMealName("");
  };

  // 24. Expiry Advance slider
  const [advDays, setAdvDays] = useState(preferences.notificationPref?.advanceNoticeDays || 2);
  const handleAdvDaysChange = (val: number) => {
    setAdvDays(val);
    onUpdatePreferences({
      notificationPref: {
        ...preferences.notificationPref,
        advanceNoticeDays: val
      }
    });
  };

  // Switch statement rendering the corresponding custom tool
  const renderContent = () => {
    switch (screenId) {
      case 'insights':
        return (
          <div>
            <h3>🔮 Smart Pantry Analytics</h3>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{insightText}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '1.5rem' }}>📉</span>
                <h4 style={{ margin: '0.5rem 0' }}>Wastage Rate</h4>
                <strong>{(inventory.filter(i => i.status === 'Spoiled').length * 10).toFixed(0)}%</strong>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '1.5rem' }}>🔋</span>
                <h4 style={{ margin: '0.5rem 0' }}>Shelf Optimization</h4>
                <strong>88%</strong>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>📅 Recent Pantry Events</h3>
              <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={clearHistory}>Clear logs</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {scanHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No events logged.</p>
              ) : (
                scanHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <div>
                      <strong>{h.item}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.method}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem' }}>{h.date}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-fresh)' }}>{h.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'recipes-portions':
        const displayPortionItems = inventory.length > 0
          ? inventory.map(item => {
              let qty = 1;
              let unit = "unit(s)";
              if (item.category === 'fruits') {
                qty = 1;
              } else if (item.category === 'vegetables') {
                qty = 2;
                unit = "pcs";
              } else if (item.category === 'cooked food') {
                qty = 150;
                unit = "grams";
              }
              return { name: item.name, qty: qty * portionsServings, unit };
            })
          : [
              { name: "Gala Apples", qty: portionsServings * 1, unit: "unit(s)" },
              { name: "Milk Base", qty: portionsServings * 100, unit: "ml" },
              { name: "Flour mix", qty: portionsServings * 40, unit: "g" }
            ];

        return (
          <div>
            <h3>⚖️ Portions Quantity Calculator</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Adjust serving size to scale ingredients proportionally.</p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setPortionsServings(Math.max(1, portionsServings - 1))}>-</button>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{portionsServings} Servings</span>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setPortionsServings(portionsServings + 1)}>+</button>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <strong>Scaled Ingredients Needed:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {displayPortionItems.map((item, idx) => (
                  <li key={idx}>{item.name}: {item.qty} {item.unit}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'recipes-kids':
        const kidsAdaptItem = inventory.filter(i => !i.isCooked).length > 0 
          ? inventory.filter(i => !i.isCooked)[0].name 
          : "dish recipes";
        return (
          <div>
            <h3>👶 Kid-Friendly Flavor Safe-guard</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Adjust flavor profiles to match mild, kid-approved textures.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {["Mild", "Sweet", "Creamy"].map(mode => (
                <button
                  key={mode}
                  className="btn-secondary"
                  style={{ background: kidsSpice === mode ? 'rgba(0, 230, 118, 0.1)' : 'transparent', borderColor: kidsSpice === mode ? 'var(--color-fresh)' : 'var(--glass-border)' }}
                  onClick={() => setKidsSpice(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,230,118,0.03)', borderRadius: '8px', fontSize: '0.9rem' }}>
              💡 Selected configuration: <strong>{kidsSpice} Mode</strong>. Spices in recipe suggestions for <strong>{kidsAdaptItem}</strong> will be automatically scaled down.
            </p>
          </div>
        );

      case 'recipes-gourmet':
        const gourmetUpgrades: Record<string, Record<string, string>> = {
          "apple": { "Home Cook": "Apple Honey Drizzle", "Bistro Chef": "Caramel Drizzle Glaze", "Pro Master": "Sun-Dried Apple chips" },
          "carrot": { "Home Cook": "Rainbow Baby Carrots", "Bistro Chef": "Heritage Glazed Carrots", "Pro Master": "Charred Heirloom Carrots" },
          "cheese": { "Home Cook": "Sharp Cheddar", "Bistro Chef": "Aged Gouda", "Pro Master": "Truffle Infused Pecorino" },
          "rice": { "Home Cook": "Jasmine Rice", "Bistro Chef": "Basmati Pilaf", "Pro Master": "Saffron Risotto Rice" },
          "milk": { "Home Cook": "Organic Milk", "Bistro Chef": "Almond Milk", "Pro Master": "Macadamia Nut Milk" },
          "chicken": { "Home Cook": "Pan-Seared Chicken", "Bistro Chef": "Herb Butter Basted Chicken", "Pro Master": "Sous-Vide Truffle Chicken" },
          "biryani": { "Home Cook": "Basmati Chicken Pilaf", "Bistro Chef": "Dum Baked Biryani", "Pro Master": "Saffron Infused Biryani with Edible Gold" }
        };

        const substitutions: { original: string, replacement: string }[] = [];
        inventory.forEach(item => {
          const nameLower = item.name.toLowerCase();
          for (const key of Object.keys(gourmetUpgrades)) {
            if (nameLower.includes(key)) {
              substitutions.push({
                original: item.name,
                replacement: gourmetUpgrades[key][gourmetLevel] || gourmetUpgrades[key]["Home Cook"]
              });
              break;
            }
          }
        });

        if (substitutions.length === 0) {
          substitutions.push(
            { original: "Ordinary Cheddar Cheese", replacement: gourmetLevel === "Pro Master" ? "Truffle Infused Pecorino" : gourmetLevel === "Bistro Chef" ? "Aged Gouda" : "Sharp Cheddar" },
            { original: "Standard Apple Slice", replacement: gourmetLevel === "Pro Master" ? "Sun-Dried Apple chips" : gourmetLevel === "Bistro Chef" ? "Caramel Drizzle Glaze" : "Apple Honey Drizzle" }
          );
        }

        return (
          <div>
            <h3>🧑‍🍳 Gourmet Substitution Guide</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Upgrade simple grocery ingredients to professional chef alternatives. 
              <br />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-fresh)' }}>💡 Click on any gourmet option below to add it to your wishlist!</span>
            </p>
            
            {gourmetMsg && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid var(--color-fresh)',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'fadeIn 0.3s ease'
              }}>
                {gourmetMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {["Home Cook", "Bistro Chef", "Pro Master"].map(lvl => (
                <button
                  key={lvl}
                  className="btn-secondary"
                  style={{ background: gourmetLevel === lvl ? 'rgba(0, 230, 118, 0.1)' : 'transparent', borderColor: gourmetLevel === lvl ? 'var(--color-fresh)' : 'var(--glass-border)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setGourmetLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {substitutions.map((sub, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSubstitution(sub.replacement)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem 1rem', 
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  className="gourmet-item-hover"
                  title="Click to select and add to wishlist"
                >
                  <span style={{ color: 'var(--text-muted)' }}>{sub.original}</span>
                  <span style={{ 
                    color: 'var(--color-fresh)', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    ➔ {sub.replacement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'recipes-leftovers':
        return (
          <div>
            <h3>♻️ Leftovers Re-purposer</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter any leftover ingredient below to find an instant recipe.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="e.g. rice, milk, bread"
                value={leftoverSearch}
                onChange={e => setLeftoverSearch(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }}
              />
              <button className="btn-primary" onClick={handleLeftoverCheck}>Search</button>
            </div>
            {leftoverRecipe && (
              <div style={{ padding: '1rem', background: 'rgba(0, 230, 118, 0.05)', borderRadius: '8px', border: '1px solid var(--color-fresh)', fontSize: '0.9rem' }}>
                {leftoverRecipe}
              </div>
            )}
          </div>
        );

      case 'recipes-spice':
        return (
          <div>
            <h3>🌶️ Spice Level Customizer</h3>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Intensity: {spiceLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={spiceLevel}
                onChange={e => setSpiceLevel(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-fresh)' }}
              />
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Selected spiciness profile: {spiceLevel <= 3 ? 'Mild' : spiceLevel <= 7 ? 'Medium Spiced' : 'Extra Hot (Vindaloo)'}.
            </p>
          </div>
        );

      case 'recipes-allergens':
        return (
          <div>
            <h3>🚫 Allergen Safe-List Filter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Avoid recipes containing ingredients matching these tags.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {["Peanuts", "Gluten", "Dairy", "Soy", "Shellfish", "Egg"].map(alg => {
                const checked = allergens.includes(alg);
                return (
                  <label key={alg} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                    <input type="checkbox" checked={checked} onChange={() => handleAllergenToggle(alg)} />
                    <span>{alg}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'eco-savings':
        return (
          <div>
            <h3>₹ Financial Savings Meter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track food waste savings in Rupees.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ flex: 1, textAlign: 'center', background: 'rgba(0,230,118,0.04)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SAVED THIS WEEK</span>
                <h2 style={{ color: 'var(--color-fresh)', fontSize: '2.5rem', margin: '0.5rem 0' }}>₹250</h2>
              </div>
              <div className="glass-card" style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SAVINGS GOAL</span>
                <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>₹{savingsGoal}</h2>
              </div>
            </div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Adjust Goal Limit</label>
            <input type="range" min="500" max="5000" step="500" value={savingsGoal} onChange={e => setSavingsGoal(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-fresh)' }} />
          </div>
        );

      case 'eco-standings':
        return (
          <div>
            <h3>🏆 Leaderboard Rankings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {standings.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: s.current ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: s.current ? '1px solid var(--color-fresh)' : '1px solid var(--glass-border)' }}>
                  <span>#{s.rank} {s.name}</span>
                  <strong>{s.score}</strong>
                </div>
              ))}
            </div>
          </div>
        );

      case 'eco-donation':
        return (
          <div>
            <h3>🎁 surplus food donation registry</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Share fresh foods with local community catalogs.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Food Item Name</label>
                <input type="text" placeholder="e.g. Tomatoes" value={donateName} onChange={e => setDonateName(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Quantity</label>
                <input type="text" placeholder="e.g. 1.5 kg" value={donateQty} onChange={e => setDonateQty(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              </div>
              <button className="btn-primary" onClick={handleRegisterDonation}>Register surplus item</button>
            </div>
          </div>
        );

      case 'eco-compost':
        const checkableItems = inventory.map(i => i.name);
        return (
          <div>
            <h3>🍂 compost safety advisor</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter any raw ingredient to verify if it is safe for standard home composting.</p>
            {checkableItems.length > 0 && (
              <div style={{ margin: '0.5rem 0', fontSize: '0.8rem', color: 'var(--color-fresh)' }}>
                💡 Click to verify your inventory: {checkableItems.map((name, idx) => (
                  <span 
                    key={idx} 
                    onClick={() => { setCompostInput(name); }}
                    style={{ cursor: 'pointer', textDecoration: 'underline', marginRight: '0.75rem' }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="e.g. apple peel, egg shells, chicken" value={compostInput} onChange={e => setCompostInput(e.target.value)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              <button className="btn-primary" onClick={checkCompostSafety}>Verify</button>
            </div>
            {compostSafety && (
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.9rem' }}>
                {compostSafety}
              </div>
            )}
          </div>
        );

      case 'eco-waste':
        return (
          <div>
            <h3>🪱 Bio-waste biogas optimizer</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimate potential methane gas output from composting organic scrap.</p>
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Weekly Scrap Weight: {wasteWeight} kg</label>
              <input type="range" min="0.1" max="5.0" step="0.1" value={wasteWeight} onChange={e => setWasteWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-fresh)' }} />
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem' }}>
              🔋 Estimated Biogas Output: <strong>{(wasteWeight * 0.15).toFixed(3)} m³</strong>. This would charge a standard smartphone for <strong>{(wasteWeight * 12).toFixed(0)} hours</strong>.
            </div>
          </div>
        );

      case 'eco-scorecard':
        return (
          <div>
            <h3>💳 Green Citizen Scorecard</h3>
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, #13151b, #0F1420)', padding: '2rem', border: '1px solid var(--color-fresh)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '2rem', opacity: 0.1 }}>🌿</div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>FreshRadar Green Pass</span>
              <h2 style={{ margin: '1rem 0 0.5rem', fontSize: '1.8rem' }}>{preferences.name || 'GUEST USER'}</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>WASTE RATING</div>
                  <strong style={{ color: 'var(--color-fresh)' }}>EXCELLENT (A+)</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>EMISSIONS SAVED</div>
                  <strong>24.8 kg CO2</strong>
                </div>
              </div>
            </div>
          </div>
        );

      case 'eco-challenges':
        const challengeItems = inventory.filter(i => i.status !== 'Spoiled' && !i.isCooked);
        const focusItemName = challengeItems.length > 0 ? challengeItems[0].name : "fresh food items";
        const modifiedChallenges = challenges.map(c => {
          if (c.id === 1) {
            return { ...c, desc: `Finish ${focusItemName} before Friday` };
          }
          return c;
        });

        return (
          <div>
            <h3>🎯 Weekly Zero-Waste Challenges</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {modifiedChallenges.map(ch => (
                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', opacity: ch.done ? 0.6 : 1 }}>
                  <div>
                    <strong>{ch.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ch.desc}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: ch.done ? 'var(--color-fresh)' : '#fff' }} onClick={() => toggleChallenge(ch.id)}>
                    {ch.done ? '✓ Claimed' : 'Go'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coop-ledger':
        return (
          <div>
            <h3>📖 Fridge Co-op Ledger</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
              <input type="text" placeholder="Item name" value={newExpItem} onChange={e => setNewExpItem(e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              <input type="number" placeholder="Cost" value={newExpCost} onChange={e => setNewExpCost(Number(e.target.value))} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              <button className="btn-primary" onClick={addExpense}>Log</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ledgerExpenses.map((exp) => (
                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span>{exp.member} ({exp.item})</span>
                  <strong>₹{exp.cost}</strong>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coop-pantry':
        return (
          <div>
            <h3>🪵 Shared Pantry Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {pantryLogs.map((log, idx) => (
                <div key={idx} style={{ borderLeft: '2px solid var(--color-fresh)', paddingLeft: '1rem' }}>
                  <strong>{log.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.action}</div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coop-planner':
        return (
          <div>
            <h3>📝 Collaborative Shopping Calendar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '1rem' }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} style={{ padding: '1rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', textAlign: 'center', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '0.8rem' }}>{day}</strong>
                  <div style={{ fontSize: '0.6rem', marginTop: '0.5rem', color: 'var(--color-fresh)' }}>{i === 2 ? 'Grocery' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coop-splitter':
        return (
          <div>
            <h3>✂️ Grocery Expense Splitter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Total Cost (₹)</label>
                <input type="number" value={splitAmount} onChange={e => setSplitAmount(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Members split</label>
                <input type="number" value={splitPeople} onChange={e => setSplitPeople(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,230,118,0.04)', borderRadius: '8px', textAlign: 'center' }}>
                Per Member Cost: <strong>₹{(splitAmount / Math.max(1, splitPeople)).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        );

      case 'coop-rules':
        return (
          <div>
            <h3>⚖️ Co-Op Household Rules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {rules.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" checked={r.active} onChange={() => {
                    setRules(rules.map(rule => rule.id === r.id ? { ...rule, active: !rule.active } : rule));
                  }} />
                  <span style={{ fontSize: '0.9rem', textDecoration: r.active ? 'none' : 'line-through', color: r.active ? '#fff' : 'var(--text-muted)' }}>{r.text}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'coop-wishlist':
        return (
          <div>
            <h3>🛒 Shared Grocery Wishlist</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
              <input type="text" placeholder="e.g. Greek Yogurt" value={wishInput} onChange={e => setWishInput(e.target.value)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              <button className="btn-primary" onClick={addWishItem}>Add</button>
            </div>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {wishlist.map((w, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                  <span>{w}</span>
                  <button style={{ border: 'none', background: 'transparent', color: 'var(--color-spoiled)', cursor: 'pointer' }} onClick={() => setWishlist(wishlist.filter((_, idx) => idx !== i))}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'community-maps':
        return (
          <div>
            <h3>📍 Neighborhood Sharing Maps</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Mock Food Sharing Locations near you.</p>
            <div style={{ height: '220px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontSize: '3rem' }}>🗺️</span>
              <div style={{ position: 'absolute', top: '30px', left: '100px', background: 'var(--color-fresh)', width: '12px', height: '12px', borderRadius: '50%', boxShadow: '0 0 10px var(--color-fresh)' }} />
              <div style={{ position: 'absolute', bottom: '60px', right: '150px', background: 'var(--color-warning)', width: '12px', height: '12px', borderRadius: '50%', boxShadow: '0 0 10px var(--color-warning)' }} />
              <span style={{ position: 'absolute', bottom: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pins represent fresh food bags available for pickup.</span>
            </div>
          </div>
        );

      case 'community-claims':
        return (
          <div>
            <h3>🙋 Claim Requests log</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending food claim requests from neighbors.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                <div>
                  <strong>David K. requested Tomatoes</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.5 km away · 3 hrs ago</div>
                </div>
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => alert("Approved tomato pickup claim request")}>Approve</button>
              </div>
            </div>
          </div>
        );

      case 'community-catalogs':
        return (
          <div>
            <h3>📁 Public Pantry Index</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <strong>Center Street Community Box</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Status: 4 items inside (Apples, Bread, Bananas)</p>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <strong>Public Fridge - Park Lane</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Status: 1 item inside (Milk)</p>
              </div>
            </div>
          </div>
        );

      case 'community-standings':
        return (
          <div>
            <h3>🏅 Neighborhood eco standings</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Neighborhood leaders saving emission metrics.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(0,230,118,0.05)', borderRadius: '6px' }}>🥇 <strong>Valasaravakkam West</strong> - 1,240 kg CO2 Saved</div>
              <div style={{ padding: '0.5rem' }}>🥈 <strong>Alapakkam Center</strong> - 980 kg CO2 Saved</div>
              <div style={{ padding: '0.5rem' }}>🥉 <strong>Arcot Road Lane</strong> - 860 kg Saved</div>
            </div>
          </div>
        );

      case 'community-dispatch':
        return (
          <div>
            <h3>🚒 volunteer dispatch registry</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Join the team delivering food excess to neighborhood shelters.</p>
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', background: isVolunteering ? 'rgba(0, 230, 118, 0.15)' : 'var(--color-fresh)', border: isVolunteering ? '1px solid var(--color-fresh)' : 'none', color: isVolunteering ? '#fff' : '#000' }}
              onClick={() => setIsVolunteering(!isVolunteering)}
            >
              {isVolunteering ? '✓ Active Volunteer Node' : 'Register as Volunteer'}
            </button>
          </div>
        );

      case 'community-events':
        return (
          <div>
            <h3>🎪 Local Food Sharing Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(0,230,118,0.03)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '8px' }}>
                <strong>Zero Waste Potluck</strong>
                <div>Date: Saturday, August 29 · 4:00 PM</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Bring leftover dishes and trade with neighbors.</div>
              </div>
            </div>
          </div>
        );

      case 'adv-storage':
        return (
          <div>
            <h3>🗄️ crop storage handbook</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {cropDb.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                  <span><strong>{c.name}</strong> ({c.place})</span>
                  <span>{c.temp} · {c.shelf}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'adv-temp':
        const tempItemName = inventory.length > 0 ? inventory[0].name : "apples";
        return (
          <div>
            <h3>🌡️ Ambient Temperature adjuster</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimate storage lifespan reduction based on ambient temperature adjustments.</p>
            <div style={{ padding: '1rem', background: 'rgba(255,234,0,0.05)', border: '1px solid var(--color-warning)', borderRadius: '8px', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              ⚠️ Alert: Storing {tempItemName} above <strong>25°C</strong> reduces standard shelf-life by <strong>50%</strong>. Refrigerate to preserve.
            </div>
          </div>
        );

      case 'adv-science':
        return (
          <div>
            <h3>🔬 Spoilage chemistry library</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              {scienceArticles.map((art, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <strong>{art.title}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{art.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'adv-poisoning':
        return (
          <div>
            <h3>🧼 Hygiene & Food Poisoning Prevention</h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
              <li>Wash all fruits under clean running water.</li>
              <li>Discard cooked leftovers kept at room temperature for over 2 hours.</li>
              <li>Keep raw meat separated on the bottom drawer of the refrigerator.</li>
            </ul>
          </div>
        );

      case 'adv-meal':
        return (
          <div>
            <h3>📅 Smart Weekly Meal Planner</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              <select value={newMealDay} onChange={e => setNewMealDay(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="text" placeholder="Dish name" value={newMealName} onChange={e => setNewMealName(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              <button className="btn-primary" onClick={addPlannedMeal}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(plannedMeals).map(([day, meal]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <strong>{day}</strong>
                  <span>{meal}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'adv-nutrition':
        return (
          <div>
            <h3>🍎 nutrition profiler</h3>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '1rem' }}>
              <strong>Calculated Nutrient Targets (based on dietary preferences):</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <li>Calories target: 2000 kcal</li>
                <li>Protein: 75 g</li>
                <li>Carbs: 250 g</li>
                <li>Dietary Mode: {allergens.length > 0 ? allergens.join(', ') : 'No Restrictions'}</li>
              </ul>
            </div>
          </div>
        );

      case 'adv-preservatives':
        return (
          <div>
            <h3>⚠️ Preservatives Safety Guide</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Verify safety profiles of standard package additives.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span><strong>E211</strong> (Sodium Benzoate)</span>
                <span style={{ color: 'var(--color-warning)' }}>Caution (Chemical preservative)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span><strong>E300</strong> (Ascorbic Acid)</span>
                <span style={{ color: 'var(--color-fresh)' }}>Safe (Vitamin C)</span>
              </div>
            </div>
          </div>
        );

      case 'adv-preservation':
        return (
          <div>
            <h3>☀️ DIY Food Dehydration Guide</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Instructions for dehydrating excess crops to prolong storage.</p>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
              <strong>Dehydrated Gala Apple Rings:</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Slice apples thinly. Dehydrate at 57°C for 6 to 8 hours until leathery. Extends shelf-life by 6 months!</p>
            </div>
          </div>
        );

      case 'settings-notice':
        return (
          <div>
            <h3>⏰ Expiry Advance Warning schedule</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Define how many days prior to predicted decay you want to receive spoilage alerts.</p>
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.5rem' }}>Warning Window: {advDays} Day(s) advance</label>
              <input
                type="range"
                min="1"
                max="5"
                value={advDays}
                onChange={e => handleAdvDaysChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-fresh)' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-fresh)', fontWeight: 600 }}>
              ✓ Notifications will trigger {advDays} day(s) before predicted spoilage.
            </p>
          </div>
        );

      case 'settings-theme':
        return (
          <div>
            <h3>🎨 Color Theme Selector</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Select your preferred premium theme styling.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: 'emerald-aurora', name: 'Emerald Aurora (Default)', icon: '🍏' },
                { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', icon: '⚡' },
                { id: 'ocean-breeze', name: 'Ocean Breeze', icon: '🌊' },
                { id: 'sunset-glow', name: 'Sunset Glow', icon: '🌅' },
                { id: 'sakura-blossom', name: 'Sakura Blossom', icon: '🌸' },
                { id: 'light', name: 'Light Clean Mode', icon: '☀️' }
              ].map(t => (
                <button
                  key={t.id}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: theme === t.id ? 'rgba(0, 230, 118, 0.1)' : 'transparent', borderColor: theme === t.id ? 'var(--color-fresh)' : 'var(--glass-border)' }}
                  onClick={() => onThemeChange(t.id)}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'settings-alerts':
        return (
          <div>
            <h3>🔔 In-app Spoilage Alert toggles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Play Sound on urgent warning</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Show app badge count</span>
              </label>
            </div>
          </div>
        );

      case 'settings-email':
        return (
          <div>
            <h3>📧 Email Spoilage Alerts Config</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter warning alerts recipient email address.</p>
            <input
              type="email"
              value={preferences.email}
              disabled
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Emails are sent automatically to your verified registration email.</p>
          </div>
        );

      case 'settings-badges':
        return (
          <div>
            <h3>🎖️ Unlocked Achievement Badges</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
              {["Fresh Starter", "Waste Warrior", "Streak Seeker", "Consistency King"].map(badge => {
                const unlocked = preferences.unlockedBadges?.includes(badge) || badge === "Fresh Starter";
                return (
                  <div key={badge} className="glass-card" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', opacity: unlocked ? 1 : 0.4 }}>
                    <span style={{ fontSize: '2rem' }}>{unlocked ? '🎖️' : '🔒'}</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>{badge}</div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unlocked ? 'Unlocked' : 'Locked'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h3>💡 System Module Operational</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>This section represents the interactive portal of the module: {screenName}.</p>
          </div>
        );
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={cardStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: '2.5rem' }}>💡</span>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{screenName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>FreshRadar Enterprise Portal · Route: `{screenId}`</p>
        </div>
      </div>
      <div style={{ minHeight: '200px', lineHeight: 1.6 }}>
        {renderContent()}
      </div>
    </div>
  );
};
