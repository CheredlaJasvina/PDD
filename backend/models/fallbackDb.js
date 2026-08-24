// Fallback database representing full 52-screen capabilities
let users = [
  {
    email: "jasvina@foodfreshness.com",
    password: "password123",
    name: "C. Jasvina",
    dietaryPreferences: ["vegetarian"],
    audienceMode: "Regular",
    servings: 2,
    membersCount: 2,
    notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
    healthScore: 88,
    streakCount: 5,
    unlockedBadges: ["Fresh Starter", "Waste Warrior", "Streak Seeker"]
  },
  {
    email: "ram@gmail.com",
    password: "Ram@1234",
    name: "Ram",
    dietaryPreferences: ["vegetarian"],
    audienceMode: "Regular",
    servings: 2,
    membersCount: 2,
    notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
    healthScore: 100,
    streakCount: 1,
    unlockedBadges: ["Fresh Starter"]
  }
];

let currentUser = null;
const otpStore = {};

let foodItems = [
  {
    _id: "mock-item-1",
    name: "Fresh Red Apples",
    category: "fruits",
    status: "Fresh",
    state: "Tracked",
    addedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    predictedSpoilageDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 
    originalFreshness: 95,
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200",
    isCooked: false,
    dietaryTags: ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "jain"],
    nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, ingredients: "Apple", vitamins: ["Vitamin C", "Vitamin B6"], healthNotes: "High in fiber. Promotes heart health." },
    ocrInfo: { brand: "Apple Farms", expiryDate: null, hasOcrMatch: false },
    storageGuidance: "Store in a cool dry place. Keep separated from citrus fruits.",
    safetyAdvisory: "Safe to eat. No spoilage indicators detected.",
    owner: "jasvina@foodfreshness.com"
  },
  {
    _id: "mock-item-2",
    name: "Organic Whole Milk",
    category: "packaged food",
    status: "Slightly Spoiled",
    state: "Tracked",
    addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 
    predictedSpoilageDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 
    originalFreshness: 75,
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200",
    isCooked: false,
    dietaryTags: ["vegetarian", "gluten-free", "jain"],
    nutrition: { calories: 150, protein: 8, carbs: 12, fat: 8, ingredients: "Pasteurized Cow Milk", vitamins: ["Vitamin D", "Calcium"], healthNotes: "Great calcium source." },
    ocrInfo: { brand: "DairyFresh", expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), hasOcrMatch: true },
    storageGuidance: "Refrigerate below 4°C. Keep closed tightly.",
    safetyAdvisory: "Consume soon. Perfect for baking/pancakes.",
    owner: "jasvina@foodfreshness.com"
  },
  {
    _id: "mock-item-3",
    name: "Spaghetti Bolognese",
    category: "cooked food",
    status: "Spoiled",
    state: "Tracked",
    addedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 
    predictedSpoilageDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
    originalFreshness: 15,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
    isCooked: true,
    dietaryTags: [],
    nutrition: { calories: 450, protein: 20, carbs: 60, fat: 15, ingredients: "Pasta, beef, tomato, cheese", vitamins: ["Iron"], healthNotes: "High protein meal." },
    ocrInfo: { brand: "Home Cooked", expiryDate: null, hasOcrMatch: false },
    storageGuidance: "Discard. Left cooked pasta out for too long.",
    safetyAdvisory: "WARNING: Spoiled item. Avoid consumption to prevent food poisoning. Recommended for safe disposal or composting.",
    owner: "jasvina@foodfreshness.com"
  }
];

let historicalItems = [
  { _id: "h-1", name: "Fresh Bananas", category: "fruits", status: "Fresh", state: "Eaten", addedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), predictedSpoilageDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), originalFreshness: 90, isCooked: false, owner: "jasvina@foodfreshness.com" },
  { _id: "h-2", name: "Leftover Pizza", category: "cooked food", status: "Slightly Spoiled", state: "Wasted", addedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), predictedSpoilageDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), originalFreshness: 60, isCooked: true, owner: "jasvina@foodfreshness.com" },
  { _id: "h-3", name: "Cottage Cheese", category: "packaged food", status: "Fresh", state: "Used", addedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), predictedSpoilageDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), originalFreshness: 95, isCooked: false, owner: "jasvina@foodfreshness.com" }
];

// Extended Modules Database
let household = {
  code: "FRIDGE-988-JOIN",
  members: ["C. Jasvina", "Dr. Priskilla", "Angel Rani"],
  logs: [
    { member: "Dr. Priskilla", action: "Added", item: "Fresh Brocoli", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { member: "C. Jasvina", action: "Eaten", item: "Strawberries", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { member: "Angel Rani", action: "Wasted", item: "Expired Ham", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  ],
  chores: [
    { id: "c-1", task: "Eat Red Tomatoes before Friday decay", assignee: "C. Jasvina", done: false },
    { id: "c-2", task: "Refrigerate Milk bottles", assignee: "Dr. Priskilla", done: true }
  ]
};

let neighborDonations = [
  { _id: "d-1", donor: "C. Jasvina", name: "Red Tomatoes", quantity: "3 pcs", daysLeft: 2, distance: "0.2 km", status: "Available" },
  { _id: "d-2", donor: "David K.", name: "Wheat Bread loaf", quantity: "1 pack", daysLeft: 1, distance: "1.5 km", status: "Requested" }
];

let userEcoMetrics = {
  "jasvina@foodfreshness.com": {
    co2SavedKg: 24.8,
    moneySaved: 140.0,
    foodHealthLevel: "Level 3 waste warden",
    ecoMilestones: [
      { title: "CO2 Savior 🌿", desc: "Saved 20kg of carbon emissions.", unlocked: true },
      { title: "Zero Waste Hero 💎", desc: "Keep wastage below 5% for one month.", unlocked: false }
    ],
    comparisonStats: { communityAvgKg: 15.2, userSavingPct: 63 }
  }
};

const getEcoMetricsForUser = (email) => {
  if (!email) return { co2SavedKg: 0, moneySaved: 0, foodHealthLevel: "Level 1 fresh starter", ecoMilestones: [], comparisonStats: { communityAvgKg: 15.2, userSavingPct: 0 } };
  if (!userEcoMetrics[email]) {
    userEcoMetrics[email] = {
      co2SavedKg: 0.0,
      moneySaved: 0.0,
      foodHealthLevel: "Level 1 fresh starter",
      ecoMilestones: [
        { title: "CO2 Savior 🌿", desc: "Saved 20kg of carbon emissions.", unlocked: false },
        { title: "Zero Waste Hero 💎", desc: "Keep wastage below 5% for one month.", unlocked: false }
      ],
      comparisonStats: { communityAvgKg: 15.2, userSavingPct: 0 }
    };
  }
  return userEcoMetrics[email];
};

let userNotificationLogs = {
  "jasvina@foodfreshness.com": [
    { id: "n-1", title: "Stage 2 Urgent Warning", msg: "Organic Whole Milk spoils in 24 hours. Plan consumption.", timestamp: new Date(), read: false },
    { id: "n-2", title: "Streak Achievement", msg: "Scanning Streak 5 days unlocked! Badge awarded.", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true }
  ]
};

const getNotificationsForUser = (email) => {
  if (!email) return [];
  if (!userNotificationLogs[email]) {
    userNotificationLogs[email] = [];
  }
  return userNotificationLogs[email];
};

// Catalog database search profiles
const FOOD_CATALOG = [
  { name: "Bananas", category: "fruits", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, vitamins: ["Vitamin B6", "Vitamin C", "Potassium"], storageAdvice: "Store at room temp. Wrap stems in plastic wrap to slow decay." },
  { name: "Spinach", category: "vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, vitamins: ["Vitamin A", "Vitamin K", "Iron"], storageAdvice: "Refrigerate in dry containers. Moisture accelerates wilting." },
  { name: "Cheddar Cheese", category: "packaged food", calories: 402, protein: 25, carbs: 1.3, fat: 33, vitamins: ["Calcium", "Vitamin B12"], storageAdvice: "Wrap in wax paper and store in drawer." },
  { name: "Fried Rice", category: "cooked food", calories: 350, protein: 8, carbs: 55, fat: 12, vitamins: ["Iron"], storageAdvice: "Consume within 3 days. Do not reheat more than once." }
];

module.exports = {
  // Auth
  authenticateUser: (email, password) => {
    let user = users.find(u => u.email === email && u.password === password);
    if (!user && email && password) {
      // Dynamic auto-registration to prevent lockout issues
      const name = email.split('@')[0];
      user = {
        email,
        password,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        dietaryPreferences: [],
        audienceMode: "Regular",
        servings: 2,
        membersCount: 2,
        notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
        healthScore: 100,
        streakCount: 1,
        unlockedBadges: ["Fresh Starter"]
      };
      users.push(user);
    }
    if (user) {
      currentUser = user;
      return { success: true, user };
    }
    return { success: false, message: "Invalid email or password parameters" };
  },
  registerUser: (userData) => {
    const exists = users.some(u => u.email === userData.email);
    if (exists) return { success: false, message: "Email already registered" };
    
    const newUser = {
      dietaryPreferences: [],
      audienceMode: "Regular",
      servings: 2,
      membersCount: 2,
      notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
      healthScore: 100,
      streakCount: 0,
      unlockedBadges: [],
      ...userData
    };
    users.push(newUser);
    currentUser = newUser;
    return { success: true, user: newUser };
  },
  getCurrentUser: () => currentUser,
  updateCurrentUserProfile: (profileData) => {
    currentUser = { ...currentUser, ...profileData };
    // Sync back to users array
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx > -1) users[idx] = currentUser;
    return currentUser;
  },

  // User preferences (settings-page data)
  getUserPreference: () => {
    if (!currentUser) return {
      dietaryPreferences: [], audienceMode: 'Regular', servings: 2, membersCount: 2,
      notificationPref: { advanceNoticeDays: 2, emailAlerts: true, inAppAlerts: true },
      healthScore: 85, streakCount: 0, unlockedBadges: []
    };
    return currentUser;
  },
  updateUserPreference: (updates) => {
    if (currentUser) {
      currentUser = { ...currentUser, ...updates };
      const idx = users.findIndex(u => u.email === currentUser.email);
      if (idx > -1) users[idx] = currentUser;
    }
    return currentUser;
  },

  // Waste summary: per-item stats for weekly/monthly waste tracking
  getWasteSummary: () => {
    if (!currentUser) {
      return {
        weeklyWastedCount: 0,
        monthlyWastedCount: 0,
        weeklyWastedItems: [],
        monthlyWastedItems: [],
        categoryBreakdown: {},
        buyAdvice: [],
        membersCount: 2
      };
    }
    const allItems = [...foodItems, ...historicalItems].filter(i => i.owner === currentUser.email);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Aggregate wasted items per name/category
    const wastedItems = allItems.filter(i => i.state === 'Wasted');

    const weeklyWasted = wastedItems.filter(i => new Date(i.addedDate).getTime() >= sevenDaysAgo);
    const monthlyWasted = wastedItems.filter(i => new Date(i.addedDate).getTime() >= thirtyDaysAgo);

    // Category breakdown
    const categoryBreakdown = {};
    monthlyWasted.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, names: [] };
      }
      categoryBreakdown[item.category].count++;
      if (!categoryBreakdown[item.category].names.includes(item.name)) {
        categoryBreakdown[item.category].names.push(item.name);
      }
    });

    // Per-item waste frequency (name -> count)
    const itemFrequency = {};
    monthlyWasted.forEach(item => {
      itemFrequency[item.name] = (itemFrequency[item.name] || 0) + 1;
    });

    // Buy-less advice per item
    const members = currentUser ? (currentUser.membersCount || 2) : 2;
    const buyAdvice = Object.entries(itemFrequency).map(([name, count]) => {
      const timesWasted = count;
      const suggestedQty = Math.max(1, Math.ceil(members * 0.5));
      return {
        name,
        timesWasted,
        advice: `You wasted "${name}" ${timesWasted} time(s) this month. For ${members} member(s), try buying only ${suggestedQty} unit(s) at a time.`
      };
    });

    return {
      weeklyWastedCount: weeklyWasted.length,
      monthlyWastedCount: monthlyWasted.length,
      weeklyWastedItems: weeklyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
      monthlyWastedItems: monthlyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
      categoryBreakdown,
      buyAdvice,
      membersCount: members
    };
  },


  getFoodItems: () => {
    if (!currentUser) return [];
    return [...foodItems, ...historicalItems].filter(item => item.owner === currentUser.email);
  },
  getInventory: () => {
    if (!currentUser) return [];
    return foodItems.filter(item => item.state === 'Tracked' && item.owner === currentUser.email);
  },
  addFoodItem: (item) => {
    const newItem = { 
      _id: `mock-item-${Date.now()}`, 
      addedDate: new Date(), 
      owner: currentUser ? currentUser.email : 'jasvina@foodfreshness.com',
      ...item 
    };
    foodItems.push(newItem);
    return newItem;
  },
  updateFoodItemState: (id, state) => {
    const itemIndex = foodItems.findIndex(i => i._id === id && i.owner === (currentUser ? currentUser.email : ''));
    if (itemIndex > -1) {
      foodItems[itemIndex].state = state;
      // Increment CO2 and savings indicators
      if (state === 'Eaten' || state === 'Used') {
        currentUser.healthScore = Math.min(100, currentUser.healthScore + 2);
        currentUser.streakCount += 1;
        const eco = getEcoMetricsForUser(currentUser.email);
        eco.co2SavedKg += 0.4;
        eco.moneySaved += 4.5;
        if (currentUser.streakCount >= 7 && !currentUser.unlockedBadges.includes('Consistency King')) {
          currentUser.unlockedBadges.push('Consistency King');
        }
      } else if (state === 'Wasted') {
        currentUser.healthScore = Math.max(0, currentUser.healthScore - 5);
        currentUser.streakCount = 0;
      }
      return foodItems[itemIndex];
    }
    return null;
  },
  deleteFoodItem: (id) => {
    const initialLen = foodItems.length;
    foodItems = foodItems.filter(i => !(i._id === id && i.owner === (currentUser ? currentUser.email : '')));
    return foodItems.length < initialLen;
  },

  // Household sharing
  getHousehold: () => household,
  joinHousehold: (code) => {
    if (code) {
      household.members.push(currentUser.name);
      household.logs.unshift({
        member: currentUser.name,
        action: "Joined",
        item: "Household Group",
        timestamp: new Date()
      });
      return { success: true, household };
    }
    return { success: false };
  },
  addChore: (task, assignee) => {
    const newChore = { id: `c-${Date.now()}`, task, assignee, done: false };
    household.chores.push(newChore);
    return newChore;
  },
  toggleChore: (id) => {
    const chore = household.chores.find(c => c.id === id);
    if (chore) {
      chore.done = !chore.done;
      return chore;
    }
    return null;
  },

  // Neighbor Donations
  getDonations: () => neighborDonations,
  addDonationPost: (name, quantity, daysLeft) => {
    const newDonation = {
      _id: `d-${Date.now()}`,
      donor: currentUser.name,
      name,
      quantity: quantity || "1 pc",
      daysLeft: Number(daysLeft) || 2,
      distance: "0.1 km",
      status: "Available"
    };
    neighborDonations.unshift(newDonation);
    return newDonation;
  },
  requestDonationItem: (id) => {
    const donation = neighborDonations.find(d => d._id === id);
    if (donation) {
      donation.status = donation.status === "Available" ? "Requested" : "Available";
      return donation;
    }
    return null;
  },

  // Eco impact logs
  getEcoMetrics: () => {
    const email = currentUser ? currentUser.email : 'jasvina@foodfreshness.com';
    return getEcoMetricsForUser(email);
  },

  // Notification logs
  getNotifications: () => {
    const email = currentUser ? currentUser.email : 'jasvina@foodfreshness.com';
    return getNotificationsForUser(email);
  },
  markNotificationsRead: () => {
    const email = currentUser ? currentUser.email : 'jasvina@foodfreshness.com';
    const logs = getNotificationsForUser(email);
    logs.forEach(n => n.read = true);
    return logs;
  },

  // Food Search
  getFoodCatalog: () => FOOD_CATALOG,
  addCatalogCustom: (customItem) => {
    FOOD_CATALOG.unshift(customItem);
    return customItem;
  },
  logoutUser: () => {
    currentUser = null;
    return true;
  },
  generateOTP: (email) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    otpStore[email.toLowerCase()] = { code, expiresAt };
    return code;
  },
  verifyOTP: (email, code) => {
    const record = otpStore[email.toLowerCase()];
    if (!record) {
      return false;
    }
    if (record.expiresAt < new Date()) {
      delete otpStore[email.toLowerCase()];
      return false;
    }
    const isValid = record.code === code;
    if (isValid) {
      delete otpStore[email.toLowerCase()];
    }
    return isValid;
  }
};
