const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodfreshness';
  try {
    console.log(`Attempting to connect to MongoDB at ${dbUri}...`);
    // Set connection timeout to 3 seconds for quick local fallback if offline
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('MongoDB successfully connected!');

    // Seed initial clean sample items if empty or has duplicated test items
    const FoodItem = require('../models/FoodItem');
    const count = await FoodItem.countDocuments();
    const applesCount = await FoodItem.countDocuments({ name: "Fresh Gala Apples" });
    if (count === 0 || applesCount > 3) {
      console.log('Resetting and seeding clean initial inventory items...');
      await FoodItem.deleteMany({});
      await FoodItem.create([
        {
          name: "Fresh Gala Apples",
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
          safetyAdvisory: "Safe to eat. No spoilage indicators detected."
        },
        {
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
          safetyAdvisory: "Consume soon. Perfect for baking/pancakes."
        },
        {
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
          safetyAdvisory: "WARNING: Spoiled item. Avoid consumption to prevent food poisoning. Recommended for safe disposal or composting."
        }
      ]);
      console.log('Seeding completed successfully!');
    }
  } catch (error) {
    console.warn('------------------------------------------------------------');
    console.warn('WARNING: Failed to connect to MongoDB database.');
    console.warn('The system will dynamically use the local in-memory fallback database.');
    console.warn('All features, including scans, status tracking, and analytics,');
    console.warn('will remain fully functional for demonstration purposes.');
    console.warn('------------------------------------------------------------');
    isConnected = false;
  }
}

function getDbStatus() {
  return isConnected;
}

module.exports = {
  connectDB,
  getDbStatus
};
