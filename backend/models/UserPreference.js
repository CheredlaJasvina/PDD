const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema({
  dietaryPreferences: { 
    type: [String], 
    default: [] // vegan, vegetarian, gluten-free, dairy-free, keto, jain
  },
  audienceMode: { 
    type: String, 
    enum: ['Regular', 'Kid-friendly', 'Gourmet'], 
    default: 'Regular' 
  },
  servings: { type: Number, default: 2 },
  membersCount: { type: Number, default: 2 }, // How many people to cook for (quantity estimates)
  notificationPref: {
    advanceNoticeDays: { type: Number, default: 2 },
    emailAlerts: { type: Boolean, default: true },
    inAppAlerts: { type: Boolean, default: true }
  },
  healthScore: { type: Number, default: 85 }, // Gamified score out of 100
  streakCount: { type: Number, default: 3 },  // Daily scanning streak
  unlockedBadges: { 
    type: [String], 
    default: ['Fresh Starter', 'Waste Warrior'] 
  },
  owner: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);
