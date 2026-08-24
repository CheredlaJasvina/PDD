const FoodItem = require('../models/FoodItem');
const UserPreference = require('../models/UserPreference');
const dbStatus = require('../config/db');
const fallbackDb = require('../models/fallbackDb');

const getActiveUserEmail = (req) => {
  if (req && req.headers && req.headers['x-user-email']) {
    return req.headers['x-user-email'];
  }
  const user = fallbackDb.getCurrentUser();
  return user ? user.email : 'jasvina@foodfreshness.com';
};

const getDB = (req) => {
  const email = getActiveUserEmail(req);
  return dbStatus.getDbStatus() ? {
    find: async (query) => FoodItem.find({ ...query, owner: email }),
    getPreferences: async () => {
      let pref = await UserPreference.findOne({ owner: email });
      if (!pref) pref = await new UserPreference({ owner: email }).save();
      return pref;
    }
  } : {
    find: async (query) => fallbackDb.getFoodItems(),
    getPreferences: async () => fallbackDb.getUserPreference()
  };
};

exports.getWastageAnalytics = async (req, res) => {
  try {
    const db = getDB(req);
    const allItems = await db.find();
    const prefs = await db.getPreferences();
    const members = prefs.membersCount || 2;

    // 1. Weekly wastage report (Last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = {
      Eaten: [0, 0, 0, 0, 0, 0, 0],
      Wasted: [0, 0, 0, 0, 0, 0, 0]
    };
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    allItems.forEach(item => {
      const itemDate = new Date(item.addedDate);
      if (itemDate >= sevenDaysAgo) {
        const dayIdx = itemDate.getDay();
        if (item.state === 'Eaten' || item.state === 'Used') {
          weeklyData.Eaten[dayIdx]++;
        } else if (item.state === 'Wasted') {
          weeklyData.Wasted[dayIdx]++;
        }
      }
    });

    // 2. Healthy vs packaged ratio
    let healthyCount = 0;
    let junkCount = 0;
    allItems.forEach(item => {
      if (item.category === 'fruits' || item.category === 'vegetables') healthyCount++;
      else if (item.category === 'packaged food' || item.category === 'cooked food') junkCount++;
    });
    const totalScanned = healthyCount + junkCount || 1;
    const healthyPercentage = Math.round((healthyCount / totalScanned) * 100);
    const junkPercentage = Math.round((junkCount / totalScanned) * 100);

    // 3. Smart buying recommendations based on wastage patterns
    const wastedCountsByCategory = {};
    allItems.forEach(item => {
      if (item.state === 'Wasted') {
        wastedCountsByCategory[item.category] = (wastedCountsByCategory[item.category] || 0) + 1;
      }
    });

    const recommendations = [
      "Buy fruits in smaller batches. Analysis shows fruits have a 4-day average shelf-life in your ambient temperature.",
      "Check expiration tags before purchasing dairy items to align with weekly consumption."
    ];

    let maxWastedCategory = null;
    let maxWastedCount = 0;
    Object.keys(wastedCountsByCategory).forEach(cat => {
      if (wastedCountsByCategory[cat] > maxWastedCount) {
        maxWastedCount = wastedCountsByCategory[cat];
        maxWastedCategory = cat;
      }
    });

    if (maxWastedCategory && maxWastedCount > 0) {
      if (maxWastedCategory === 'cooked food') {
        recommendations.unshift(`CRITICAL TIP: Cooked food has been wasted ${maxWastedCount} times. Try portioning leftovers in airtight freezing bags immediately after dinner.`);
      } else if (maxWastedCategory === 'packaged food') {
        recommendations.unshift(`SAVINGS ALERT: Packaged foods represent your highest waste sector. Check package seals and buy standard mini-packs instead of family-sized volumes.`);
      } else {
        recommendations.unshift(`FRESHNESS TIP: Organic fresh produce is decaying before usage. Separate apples and bananas to stop ethylene gas from rapidly spoiling nearby greens.`);
      }
    } else {
      recommendations.unshift("Excellent job! Your wastage patterns are minimal. Maintain this balance to keep your Food Health score high!");
    }

    // 4. Calendar events
    const calendarEvents = [];
    allItems.forEach(item => {
      const addedDate = new Date(item.addedDate);
      calendarEvents.push({
        date: addedDate.toISOString().split('T')[0],
        type: item.state === 'Tracked' ? 'scan' : (item.state === 'Wasted' ? 'waste' : 'consumed'),
        name: item.name,
        category: item.category,
        status: item.status
      });
    });

    // 5. Per-item waste frequency (monthly) + member-based buy-less advice
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyWasted = allItems.filter(i => i.state === 'Wasted' && new Date(i.addedDate) >= thirtyDaysAgo);
    const weeklyWasted = allItems.filter(i => i.state === 'Wasted' && new Date(i.addedDate) >= sevenDaysAgo);

    const itemFrequency = {};
    monthlyWasted.forEach(item => {
      itemFrequency[item.name] = (itemFrequency[item.name] || 0) + 1;
    });

    const buyAdvice = Object.entries(itemFrequency).map(([name, count]) => {
      const suggestedQty = Math.max(1, Math.ceil(members * 0.5));
      return {
        name,
        timesWasted: count,
        advice: `You wasted "${name}" ${count} time(s) this month. For ${members} member(s), try buying only ${suggestedQty} unit(s) at a time.`
      };
    });

    res.json({
      success: true,
      weeklyReport: {
        days: daysOfWeek,
        consumed: weeklyData.Eaten,
        wasted: weeklyData.Wasted
      },
      nutritionalRatio: { healthyCount, junkCount, healthyPercentage, junkPercentage },
      buyingRecommendations: recommendations,
      calendarEvents,
      wasteSummary: {
        weeklyWastedCount: weeklyWasted.length,
        monthlyWastedCount: monthlyWasted.length,
        weeklyWastedItems: weeklyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
        monthlyWastedItems: monthlyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
        buyAdvice,
        membersCount: members
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
