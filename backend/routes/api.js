const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const foodController = require('../controllers/foodController');
const recipeController = require('../controllers/recipeController');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');
const fallbackDb = require('../models/fallbackDb');

// User Session Authentication
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/logout', authController.logout);
router.put('/auth/profile', authController.updateProfile);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

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
// Uses MongoDB when connected (same as analyticsController), falls back to in-memory
router.get('/waste-summary', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const dbStatus = require('../config/db');

    if (dbStatus.getDbStatus()) {
      // MongoDB is connected — query it directly so numbers match the inventory
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

    // Fallback: in-memory store (used when MongoDB is unavailable)
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
router.get('/household', (req, res) => {
  res.json({ success: true, household: fallbackDb.getHousehold() });
});
router.post('/household/join', (req, res) => {
  const result = fallbackDb.joinHousehold(req.body.code);
  res.json(result);
});
router.post('/household/chores', (req, res) => {
  const chore = fallbackDb.addChore(req.body.task, req.body.assignee);
  res.json({ success: true, chore });
});
router.put('/household/chores/:id/toggle', (req, res) => {
  const chore = fallbackDb.toggleChore(req.params.id);
  res.json({ success: true, chore });
});

// NEIGHBOR DONATION ROUTES
router.get('/donations', (req, res) => {
  res.json({ success: true, donations: fallbackDb.getDonations() });
});
router.post('/donations', (req, res) => {
  const post = fallbackDb.addDonationPost(req.body.name, req.body.quantity, req.body.daysLeft);
  res.json({ success: true, post });
});
router.put('/donations/:id/request', (req, res) => {
  const post = fallbackDb.requestDonationItem(req.params.id);
  res.json({ success: true, post });
});

// ECO IMPACT METRICS
router.get('/eco', (req, res) => {
  const email = req.headers['x-user-email'];
  res.json({ success: true, eco: fallbackDb.getEcoMetrics(email) });
});

// IN-APP NOTIFICATION LOGS
router.get('/notifications', (req, res) => {
  const email = req.headers['x-user-email'];
  res.json({ success: true, notifications: fallbackDb.getNotifications(email) });
});
router.post('/notifications/read', (req, res) => {
  const email = req.headers['x-user-email'];
  const notifications = fallbackDb.markNotificationsRead(email);
  res.json({ success: true, notifications });
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
