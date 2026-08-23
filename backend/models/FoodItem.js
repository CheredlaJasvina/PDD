const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['fruits', 'vegetables', 'cooked food', 'packaged food'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Fresh', 'Slightly Spoiled', 'Spoiled'], 
    required: true 
  },
  state: { 
    type: String, 
    enum: ['Tracked', 'Used', 'Eaten', 'Wasted'], 
    default: 'Tracked' 
  },
  addedDate: { type: Date, default: Date.now },
  predictedSpoilageDate: { type: Date, required: true },
  originalFreshness: { type: Number, default: 100 }, // Percentage at scan
  imageUrl: { type: String, default: '' },
  isCooked: { type: Boolean, default: false },
  dietaryTags: { type: [String], default: [] },
  nutrition: {
    calories: { type: Number, default: 0 },
    ingredients: { type: String, default: '' },
    vitamins: { type: [String], default: [] },
    healthNotes: { type: String, default: '' }
  },
  ocrInfo: {
    brand: { type: String, default: '' },
    expiryDate: { type: Date, default: null },
    hasOcrMatch: { type: Boolean, default: false }
  },
  storageGuidance: { type: String, default: '' },
  safetyAdvisory: { type: String, default: '' }
});

module.exports = mongoose.model('FoodItem', FoodItemSchema);
