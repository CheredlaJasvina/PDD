const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const foodController = require('../controllers/foodController');
const recipeController = require('../controllers/recipeController');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');
const fallbackDb = require('../models/fallbackDb');
const dbStatus = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// ── Public Auth routes (no auth required) ────────────────────────────────────
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

// ── Apply auth middleware to all routes below this point ─────────────────────
router.use(authMiddleware);

// ── Auth (protected) ─────────────────────────────────────────────────────────
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/logout', authController.logout);
router.put('/auth/profile', authController.updateProfile);

// Food Inventory Management
router.get('/inventory', foodController.getInventory);
router.post('/inventory', foodController.saveFoodItem);
router.post('/scan', upload.single('image'), foodController.scanFoodItem);
router.post('/manual', foodController.addManualItem);
router.put('/inventory/:id/status', foodController.updateItemState);
router.delete('/inventory/:id', foodController.deleteItem);

// Smart Recipe Generator
router.get('/recipes', recipeController.getSmartSuggestions);

// Wastage Calendar & Ratios Analytics
router.get('/analytics', analyticsController.getWastageAnalytics);

// Waste Summary: per-item weekly/monthly waste tracking + buy-less advice
router.get('/waste-summary', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];

    if (dbStatus.getDbStatus()) {
      const FoodItem = require('../models/FoodItem');
      const UserPreference = require('../models/UserPreference');

      const allItems = email ? await FoodItem.find({ owner: email }) : [];
      let pref = await UserPreference.findOne({ owner: email });
      if (!pref) pref = await new UserPreference({ owner: email }).save();
      const members = pref.membersCount || 2;

      const now = Date.now();
      const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const wastedItems   = allItems.filter(i => i.state === 'Wasted');
      const weeklyWasted  = wastedItems.filter(i => new Date(i.addedDate) >= sevenDaysAgo);
      const monthlyWasted = wastedItems.filter(i => new Date(i.addedDate) >= thirtyDaysAgo);

      const categoryBreakdown = {};
      monthlyWasted.forEach(item => {
        if (!categoryBreakdown[item.category]) categoryBreakdown[item.category] = { count: 0, names: [] };
        categoryBreakdown[item.category].count++;
        if (!categoryBreakdown[item.category].names.includes(item.name))
          categoryBreakdown[item.category].names.push(item.name);
      });

      const itemFrequency = {};
      monthlyWasted.forEach(item => {
        itemFrequency[item.name] = (itemFrequency[item.name] || 0) + 1;
      });

      const buyAdvice = Object.entries(itemFrequency).map(([name, count]) => ({
        name,
        timesWasted: count,
        advice: `You wasted "${name}" ${count} time(s) this month. For ${members} member(s), try buying only ${Math.max(1, Math.ceil(members * 0.5))} unit(s) at a time.`
      }));

      return res.json({
        success: true,
        weeklyWastedCount:  weeklyWasted.length,
        monthlyWastedCount: monthlyWasted.length,
        weeklyWastedItems:  weeklyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
        monthlyWastedItems: monthlyWasted.map(i => ({ name: i.name, category: i.category, addedDate: i.addedDate })),
        categoryBreakdown,
        buyAdvice,
        membersCount: members
      });
    }

    const summary = fallbackDb.getWasteSummary(email);
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Config Preferences & Badges
router.get('/settings', foodController.getSettings);
router.put('/settings', foodController.updateSettings);

// CO-OP HOUSEHOLD SHARING ROUTES
router.get('/household', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (dbStatus.getDbStatus() && email) {
      const Household = require('../models/Household');
      const household = await Household.findOne({
        $or: [{ owner: email }, { 'members.email': email }]
      });
      if (household) {
        return res.json({ success: true, household });
      }
    }
    res.json({ success: true, household: fallbackDb.getHousehold() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/household/join', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { code, name } = req.body;
    if (dbStatus.getDbStatus() && email) {
      const Household = require('../models/Household');
      const household = await Household.findOne({ code });
      if (!household) {
        return res.status(404).json({ success: false, message: 'Household code not found.' });
      }
      const alreadyMember = household.members.some(m => m.email === email);
      if (!alreadyMember) {
        household.members.push({ name: name || email, email, role: 'member' });
        household.logs.push({ action: 'joined', member: name || email });
        await household.save();
      }
      return res.json({ success: true, household });
    }
    const result = fallbackDb.joinHousehold(code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/household/chores', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { task, assignee } = req.body;
    if (dbStatus.getDbStatus() && email) {
      const Household = require('../models/Household');
      let household = await Household.findOne({ owner: email });
      if (!household) {
        // Create a household for this user if none exists
        household = await new Household({
          code: 'FRIDGE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          owner: email,
          members: [{ name: email, email, role: 'owner' }]
        }).save();
      }
      const chore = { title: task, assignedTo: assignee || email };
      household.chores.push(chore);
      await household.save();
      return res.json({ success: true, chore: household.chores[household.chores.length - 1] });
    }
    const chore = fallbackDb.addChore(task, assignee);
    res.json({ success: true, chore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/household/chores/:id/toggle', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const choreId = req.params.id;
    if (dbStatus.getDbStatus() && email) {
      const Household = require('../models/Household');
      const household = await Household.findOne({ owner: email });
      if (household) {
        const chore = household.chores.id(choreId);
        if (chore) {
          chore.completed = !chore.completed;
          await household.save();
          return res.json({ success: true, chore });
        }
      }
    }
    const chore = fallbackDb.toggleChore(choreId);
    res.json({ success: true, chore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEIGHBOR DONATION ROUTES
router.get('/donations', async (req, res) => {
  try {
    if (dbStatus.getDbStatus()) {
      const Donation = require('../models/Donation');
      const donations = await Donation.find().sort({ createdAt: -1 });
      return res.json({ success: true, donations });
    }
    res.json({ success: true, donations: fallbackDb.getDonations() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/donations', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (dbStatus.getDbStatus()) {
      const Donation = require('../models/Donation');
      const post = await new Donation({
        owner: email,
        foodName: req.body.name,
        quantity: req.body.quantity,
        expiresIn: req.body.daysLeft,
        location: req.body.location || ''
      }).save();
      return res.json({ success: true, post });
    }
    const post = fallbackDb.addDonationPost(req.body.name, req.body.quantity, req.body.daysLeft);
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/donations/:id/request', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { id } = req.params;
    if (dbStatus.getDbStatus()) {
      const Donation = require('../models/Donation');
      const post = await Donation.findByIdAndUpdate(
        id,
        { status: 'requested', requestedBy: email },
        { new: true }
      );
      return res.json({ success: true, post });
    }
    const post = fallbackDb.requestDonationItem(id);
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ECO IMPACT METRICS
router.get('/eco', async (req, res) => {
  const email = req.headers['x-user-email'];

  try {
    if (dbStatus.getDbStatus() && email) {
      const FoodItem = require('../models/FoodItem');

      const allItems = await FoodItem.find({ owner: email }).lean();
      const consumedItems = allItems.filter(i => i.state === 'Eaten' || i.state === 'Used');
      const wastedItems   = allItems.filter(i => i.state === 'Wasted');
      const totalActioned = consumedItems.length + wastedItems.length;

      const co2SavedKg  = parseFloat((consumedItems.length * 0.4).toFixed(1));
      const moneySaved  = parseFloat((consumedItems.length * 4.5).toFixed(1));

      const wastePct = totalActioned > 0
        ? Math.round((wastedItems.length / totalActioned) * 100)
        : 0;

      const foodHealthLevel =
        consumedItems.length >= 50 ? 'Level 5 eco champion' :
        consumedItems.length >= 30 ? 'Level 4 green guardian' :
        consumedItems.length >= 15 ? 'Level 3 waste warden' :
        consumedItems.length >= 5  ? 'Level 2 fresh keeper' :
                                     'Level 1 fresh starter';

      const ecoMilestones = [
        { title: 'CO2 Savior 🌿', desc: 'Saved 5kg of carbon emissions.', unlocked: co2SavedKg >= 5 },
        { title: 'Zero Waste Hero 💎', desc: 'Save ₹9 by consuming 2 food items.', unlocked: moneySaved >= 9 }
      ];

      const communityAvgKg = 15.2;
      const userSavingPct  = co2SavedKg > 0
        ? Math.min(100, Math.round((co2SavedKg / communityAvgKg) * 100))
        : 0;

      return res.json({
        success: true,
        eco: { co2SavedKg, moneySaved, foodHealthLevel, ecoMilestones, comparisonStats: { communityAvgKg, userSavingPct } }
      });
    }

    res.json({ success: true, eco: fallbackDb.getEcoMetrics(email) });
  } catch (err) {
    console.error('Eco metrics error:', err.message);
    res.json({ success: true, eco: fallbackDb.getEcoMetrics(email) });
  }
});

// IN-APP NOTIFICATION LOGS
router.get('/notifications', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (dbStatus.getDbStatus() && email) {
      const Notification = require('../models/Notification');
      const notifications = await Notification.find({ owner: email }).sort({ createdAt: -1 });
      return res.json({ success: true, notifications });
    }
    res.json({ success: true, notifications: fallbackDb.getNotifications(email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/read', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (dbStatus.getDbStatus() && email) {
      const Notification = require('../models/Notification');
      await Notification.updateMany({ owner: email, read: false }, { read: true });
      const notifications = await Notification.find({ owner: email }).sort({ createdAt: -1 });
      return res.json({ success: true, notifications });
    }
    const notifications = fallbackDb.markNotificationsRead(email);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FOOD CATALOG DATABASE SEARCH
router.get('/catalog', (req, res) => {
  res.json({ success: true, catalog: fallbackDb.getFoodCatalog() });
});
router.post('/catalog', (req, res) => {
  const item = fallbackDb.addCatalogCustom(req.body);
  res.json({ success: true, item });
});

module.exports = router;
