const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  dietaryPreferences: { type: String },
  audienceMode: { type: String },
  servings: { type: Number, default: 2 },
  membersCount: { type: Number, default: 1 },
  notificationPref: { type: String },
  healthScore: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  unlockedBadges: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
