const FoodItem = require('../models/FoodItem');
const UserPreference = require('../models/UserPreference');
const dbStatus = require('../config/db');
const fallbackDb = require('../models/fallbackDb');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const foodSpecificImages = {
  // Fruits
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200',
  'orange': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=200',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200',
  'grape': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=200',
  'blueberry': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200',
  'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=200',
  'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200',
  'lemon': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=200',
  'peach': 'https://images.unsplash.com/photo-1629986349942-835688b598d1?w=200',
  'pear': 'https://images.unsplash.com/photo-1514813482567-285886c0066c?w=200',
  'cherry': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200',
  'kiwi': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200',
  'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=200',

  // Vegetables
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200',
  'broccoli': 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?w=200',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200',
  'tomato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200',
  'onion': 'https://images.unsplash.com/photo-1508747703725-719ae25db3e4?w=200',
  'garlic': 'https://images.unsplash.com/photo-1594911772028-170cf95f4cfd?w=200',
  'cucumber': 'https://images.unsplash.com/photo-1449339091482-421c6997e04a?w=200',
  'bell pepper': 'https://images.unsplash.com/photo-1563565080-6ca5d8787f96?w=200',
  'lettuce': 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=200',
  'cabbage': 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200',
  'mushroom': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200',
  'corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200',

  // Packaged
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
  'cheese': 'https://images.unsplash.com/photo-1486887396153-fa416526c13b?w=200',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
  'egg': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=200',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200',
  'beef': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=200',
  'fish': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200',

  // Cooked
  'rice': 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=200',
  'pasta': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200',
  'soup': 'https://images.unsplash.com/photo-1547592165-e1d17ffd2661?w=200',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
};

const getFoodImageUrl = (foodName, category) => {
  const nameLower = (foodName || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(foodSpecificImages)) {
    if (nameLower.includes(key)) {
      return url;
    }
  }
  const categoryImages = {
    'fruits': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=200',
    'vegetables': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200',
    'cooked food': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
    'packaged food': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200'
  };
  return categoryImages[category] || categoryImages['fruits'];
};

// Helper to get currently active user email
const getActiveUserEmail = (req) => {
  if (req && req.headers && req.headers['x-user-email']) {
    return req.headers['x-user-email'];
  }
  const user = fallbackDb.getCurrentUser();
  return user ? user.email : 'jasvina@foodfreshness.com';
};

// Helper to determine active DB service
const getDB = (req) => {
  const email = getActiveUserEmail(req);
  return dbStatus.getDbStatus() ? {
    find: async (query) => FoodItem.find({ ...query, owner: email }),
    create: async (data) => new FoodItem({ ...data, owner: email }).save(),
    findByIdAndUpdate: async (id, update) => FoodItem.findOneAndUpdate({ _id: id, owner: email }, update, { new: true }),
    findByIdAndDelete: async (id) => FoodItem.findOneAndDelete({ _id: id, owner: email }),
    getPreferences: async () => {
      let pref = await UserPreference.findOne({ owner: email });
      if (!pref) {
        pref = await new UserPreference({ owner: email }).save();
      }
      return pref;
    },
    updatePreferences: async (updates) => UserPreference.findOneAndUpdate({ owner: email }, { ...updates, owner: email }, { new: true, upsert: true, setDefaultsOnInsert: true })
  } : {
    find: async (query) => {
      const all = fallbackDb.getFoodItemsByUser(email);
      if (query && query.state) {
        return all.filter(item => item.state === query.state);
      }
      return all;
    },
    create: async (data) => fallbackDb.addFoodItem(data),
    findByIdAndUpdate: async (id, update) => fallbackDb.updateFoodItemState(id, update.state),
    findByIdAndDelete: async (id) => fallbackDb.deleteFoodItem(id),
    getPreferences: async () => fallbackDb.getUserPreferenceByEmail(email),
    updatePreferences: async (updates) => fallbackDb.updateUserPreference(updates)
  };
};

// Get active inventory
exports.getInventory = async (req, res) => {
  try {
    const db = getDB(req);
    const items = await db.find({ state: 'Tracked' });
    // Filter active items from local db if needed
    const activeItems = items.filter(item => item.state === 'Tracked');
    res.json(activeItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Scan food item (Groq Vision API with local python fallback)
exports.scanFoodItem = async (req, res) => {
  try {
    const db = getDB(req);
    const prefs = await db.getPreferences();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Scan Rejected: No image file uploaded. Please upload a crop photograph."
      });
    }

    const imagePath = req.file.path;

    // Check if Groq API Key is configured in environment
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY') {
      try {
        const { Groq } = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // Convert uploaded image to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';

        // Prompt Groq to return JSON output matching our database structure
        const chatCompletion = await groq.chat.completions.create({
          model: "qwen/qwen3.6-27b",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze the uploaded food image. You MUST return a JSON object with the following fields:
                  {
                    "success": true (or false if the image is NOT food, or skin/face/non-food is detected),
                    "message": "reason for failure or success message",
                    "name": "Specific Food Name (e.g., Red Apple, Cauliflower, Broccoli, Banana, Pizza)",
                    "category": "one of: 'fruits', 'vegetables', 'cooked food', 'packaged food'",
                    "status": "one of: 'Fresh', 'Slightly Spoiled', 'Spoiled' based on visual decay/browning status",
                    "originalFreshness": 100 (a percentage score from 5 to 100 estimating overall freshness, e.g. fresh=95%, browning=50%, rotten=10%),
                    "shelfLifeDays": 5 (average shelf-life days left before this item completely spoils),
                    "nutrition": {
                      "calories": 100,
                      "protein": 5,
                      "carbs": 20,
                      "fat": 2,
                      "vitamins": ["Vitamin C", "Calcium"],
                      "healthNotes": "A short sentence highlighting the health benefits of this specific food item."
                    },
                    "storageGuidance": "Detailed storage instruction.",
                    "safetyAdvisory": "Detailed safety advisory about consumption."
                  }`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        });

        // Clean up temp file
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

        const responseContent = chatCompletion.choices[0].message.content;
        const result = JSON.parse(responseContent);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message || "Visual analysis rejected: Non-food item detected."
          });
        }

        const shelfLifeDays = result.shelfLifeDays || (result.category === 'fruits' ? 7 : (result.category === 'vegetables' ? 5 : 3));
        const addedDate = new Date();
        const predictedSpoilageDate = new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000);

        const imageUrl = getFoodImageUrl(result.name, result.category);

        const newItemData = {
          name: result.name,
          category: result.category,
          status: result.status,
          state: 'Tracked',
          addedDate,
          predictedSpoilageDate,
          originalFreshness: result.originalFreshness,
          imageUrl,
          isCooked: result.category === 'cooked food',
          dietaryTags: ["vegan", "vegetarian", "gluten-free", "dairy-free"],
          nutrition: {
            calories: result.nutrition.calories || 100,
            protein: result.nutrition.protein || 1,
            carbs: result.nutrition.carbs || 10,
            fat: result.nutrition.fat || 0,
            ingredients: result.name,
            vitamins: result.nutrition.vitamins || ["Vitamin C"],
            healthNotes: result.nutrition.healthNotes || `Freshly analyzed ${result.name}.`
          },
          storageGuidance: result.storageGuidance,
          safetyAdvisory: result.safetyAdvisory
        };

        return res.json({
          success: true,
          scannedItems: [newItemData]
        });

      } catch (groqErr) {
        console.error("Groq vision API failed, falling back to local Python classifier:", groqErr);
      }
    }

    // --- FALLBACK TO LOCAL PYTHON CLASSIFIER ---
    const scriptPath = path.join(__dirname, '..', 'scripts', 'classify_food.py');
    exec(`python "${scriptPath}" "${imagePath}"`, async (error, stdout, stderr) => {
      // Clean up local temp file to avoid clutter
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (cleanupErr) {
        console.error("Temp file cleanup error:", cleanupErr);
      }

      if (error) {
        console.error("Python Model classification error:", stderr || error);
        return res.status(500).json({
          success: false,
          message: "AI Model classification failed. Make sure Python dependencies (Pillow) are configured."
        });
      }

      try {
        const trimOutput = stdout.trim();
        const startIdx = trimOutput.indexOf('{');
        const endIdx = trimOutput.lastIndexOf('}');
        
        if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
          throw new Error("No JSON substring found in Python model outputs.");
        }
        
        const jsonString = trimOutput.substring(startIdx, endIdx + 1);
        const result = JSON.parse(jsonString);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message || "Visual analysis rejected: Non-food item detected."
          });
        }

        // Shelf life is determined dynamically based on the category
        const shelfLifeDays = result.category === 'fruits' ? 7 : (result.category === 'vegetables' ? 5 : 3);
        const addedDate = new Date();
        const predictedSpoilageDate = new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000);

        // Specific image lookup based on food name
        const imageUrl = getFoodImageUrl(result.name, result.category);

        // Prepopulate detailed nutrition profiles matching the python analysis results
        const mockNutrition = {
          calories: result.category === 'fruits' ? 95 : (result.category === 'vegetables' ? 35 : (result.category === 'cooked food' ? 320 : 180)),
          protein: result.category === 'fruits' ? 0.8 : (result.category === 'vegetables' ? 2.5 : (result.category === 'cooked food' ? 12 : 8)),
          carbs: result.category === 'fruits' ? 25 : (result.category === 'vegetables' ? 7 : (result.category === 'cooked food' ? 45 : 12)),
          fat: result.category === 'fruits' ? 0.3 : (result.category === 'vegetables' ? 0.2 : (result.category === 'cooked food' ? 10 : 6)),
          ingredients: result.name,
          vitamins: result.category === 'fruits' ? ["Vitamin C", "Potassium"] : ["Vitamin A", "Vitamin K", "Iron"],
          healthNotes: `Analyzed item: ${result.name}. High in vitamins and natural organic contents.`
        };

        const newItemData = {
          name: result.name,
          category: result.category,
          status: result.status,
          state: 'Tracked',
          addedDate,
          predictedSpoilageDate,
          originalFreshness: result.originalFreshness,
          imageUrl,
          isCooked: result.category === 'cooked food',
          dietaryTags: ["vegan", "vegetarian", "gluten-free", "dairy-free"],
          nutrition: mockNutrition,
          storageGuidance: result.storageGuidance,
          safetyAdvisory: result.safetyAdvisory
        };

        res.json({
          success: true,
          scannedItems: [newItemData]
        });

      } catch (parseError) {
        console.error("JSON parse error from Python:", parseError, stdout);
        res.status(500).json({
          success: false,
          message: "Failed to parse classification model outputs."
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add manual food item (Fallback when visual recognition fails)
exports.addManualItem = async (req, res) => {
  try {
    const { name, category, shelfLifeDays, isCooked, calories, dietaryPreferences } = req.body;
    const db = getDB(req);

    const addedDate = new Date();
    const predictedSpoilageDate = new Date(Date.now() + Number(shelfLifeDays || 5) * 24 * 60 * 60 * 1000);

    // Determine status based on shelf life days
    let status = 'Fresh';
    if (shelfLifeDays <= 0) status = 'Spoiled';
    else if (shelfLifeDays <= 2) status = 'Slightly Spoiled';

    // Mock dietary tags matching the input
    const dietaryTags = dietaryPreferences || ["vegan", "vegetarian", "gluten-free", "dairy-free", "jain"];

    // Specific image lookup based on food name
    const imageUrl = getFoodImageUrl(name, category);

    const matchedCategory = category || 'fruits';

    const itemData = {
      name,
      category: matchedCategory,
      status,
      state: 'Tracked',
      addedDate,
      predictedSpoilageDate,
      originalFreshness: status === 'Fresh' ? 95 : (status === 'Slightly Spoiled' ? 50 : 10),
      imageUrl,
      isCooked: isCooked || false,
      dietaryTags,
      nutrition: {
        calories: Number(calories) || 100,
        protein: matchedCategory === 'fruits' ? 1.0 : (matchedCategory === 'vegetables' ? 3.0 : (matchedCategory === 'cooked food' ? 15.0 : 7.0)),
        carbs: matchedCategory === 'fruits' ? 20.0 : (matchedCategory === 'vegetables' ? 8.0 : (matchedCategory === 'cooked food' ? 40.0 : 15.0)),
        fat: matchedCategory === 'fruits' ? 0.5 : (matchedCategory === 'vegetables' ? 0.3 : (matchedCategory === 'cooked food' ? 12.0 : 5.0)),
        ingredients: `${name}`,
        vitamins: ["Vitamin C"],
        healthNotes: "Manually entered food item. High nutritional properties."
      },
      storageGuidance: "Store in normal temperature. Keep checked.",
      safetyAdvisory: status === 'Spoiled' ? "Discard safely." : "Safe to consume."
    };

    const saved = await db.create(itemData);
    res.json({ success: true, item: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark food item as Used, Eaten, or Wasted
exports.updateItemState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body; // 'Used', 'Eaten', 'Wasted'
    const db = getDB(req);

    const updated = await db.findByIdAndUpdate(id, { state });
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ success: true, item: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete food item from inventory
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB(req);

    const deleted = await db.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ success: true, message: "Item successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user preferences and gamification metrics
exports.getSettings = async (req, res) => {
  try {
    const db = getDB(req);
    const prefs = await db.getPreferences();
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user preferences
exports.updateSettings = async (req, res) => {
  try {
    const db = getDB(req);
    const updated = await db.updatePreferences(req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save a scanned food item to inventory
exports.saveFoodItem = async (req, res) => {
  try {
    const db = getDB(req);
    const saved = await db.create(req.body);
    res.json({ success: true, item: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

