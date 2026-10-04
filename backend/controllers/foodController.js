const FoodItem = require('../models/FoodItem');
const UserPreference = require('../models/UserPreference');
const dbStatus = require('../config/db');
const fallbackDb = require('../models/fallbackDb');
const path = require('path');
const fs = require('fs');

const foodSpecificImages = {
  // Fruits
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200',
  'orange': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=200',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200',
  'grapefruit': 'https://images.unsplash.com/photo-1529408686214-37b3e0ebd73a?w=200',
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
  'eggplant': 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=200',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200',
  'broccoli': 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?w=200',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200',
  'tomato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200',
  // FIX: potato had a duplicate of tomato's URL — corrected to an actual potato photo
  'potato': 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=200',
  'onion': 'https://images.unsplash.com/photo-1508747703725-719ae25db3e4?w=200',
  'garlic': 'https://images.unsplash.com/photo-1594911772028-170cf95f4cfd?w=200',
  'cucumber': 'https://images.unsplash.com/photo-1449339091482-421c6997e04a?w=200',
  'bell pepper': 'https://images.unsplash.com/photo-1563565080-6ca5d8787f96?w=200',
  'lettuce': 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=200',
  'cabbage': 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200',
  'mushroom': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200',
  'corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200',

  // Packaged / dairy / meat
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
  'cheese': 'https://images.unsplash.com/photo-1486887396153-fa416526c13b?w=200',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
  // FIX: 'egg' listed before longer keys — moved after 'eggplant' guard above
  //      and kept as a whole-word-style check via the exact-key path in getFoodImageUrl
  'egg': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=200',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200',
  'beef': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=200',
  'fish': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200',
  'pork': 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=200',
  'lamb': 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=200',

  // Cooked
  'rice': 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=200',
  'pasta': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200',
  'soup': 'https://images.unsplash.com/photo-1547592165-e1d17ffd2661?w=200',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',

  // Liquids
  'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200',
  'water': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200',
  'smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200',
  'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200',
  'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
  'wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200',
  'beer': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200',
};

// Longer / more specific keys must be checked before shorter ones that are
// substrings of them (e.g. "eggplant" before "egg", "grapefruit" before "grape").
// We sort entries by key length descending so longer keys win the match first.
const _sortedFoodImageEntries = Object.entries(foodSpecificImages)
  .sort((a, b) => b[0].length - a[0].length);

const getFoodImageUrl = (foodName, category) => {
  const nameLower = (foodName || '').toLowerCase().trim();
  for (const [key, url] of _sortedFoodImageEntries) {
    if (nameLower.includes(key)) {
      return url;
    }
  }
  const categoryImages = {
    'fruits': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=200',
    'vegetables': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200',
    'cooked food': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
    'packaged food': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200',
    // FIX: non-veg and liquid were missing — they fell back to the fruit image
    'non-veg': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200',
    'liquid': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200',
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
    findByIdAndUpdate: async (id, update) => fallbackDb.updateFoodItemState(id, update.state, email),
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

// Scan food item (Groq Vision API with base64 inline image)
exports.scanFoodItem = async (req, res) => {
  try {
    const db = getDB(req);
    await db.getPreferences();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Scan Rejected: No image file uploaded. Please upload a food photograph."
      });
    }

    const imagePath = req.file.path;

    // Helper: clean up temp file
    const cleanupFile = () => {
      try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (_) {}
    };

    // Helper: build item data from Groq result
    const buildItemData = (result, modelUsed) => {
      const shelfLifeDays = result.shelfLifeDays || (
        result.category === 'fruits' ? 7 :
        result.category === 'vegetables' ? 5 :
        result.category === 'non-veg' ? 2 : 3
      );
      return {
        name:              result.name,
        category:          result.category,
        status:            result.status,
        state:             'Tracked',
        addedDate:         new Date(),
        predictedSpoilageDate: new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000),
        originalFreshness: result.originalFreshness || 90,
        imageUrl:          getFoodImageUrl(result.name, result.category),
        isCooked:          result.category === 'cooked food',
        dietaryTags:       ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
        nutrition: {
          calories:    result.nutrition?.calories    || 100,
          protein:     result.nutrition?.protein     || 1,
          carbs:       result.nutrition?.carbs       || 10,
          fat:         result.nutrition?.fat         || 0,
          ingredients: result.name,
          vitamins:    result.nutrition?.vitamins    || ['Vitamin C'],
          healthNotes: result.nutrition?.healthNotes || `Freshly analysed ${result.name}.`
        },
        storageGuidance: result.storageGuidance || 'Store appropriately.',
        safetyAdvisory:  result.safetyAdvisory  || 'Safe to eat.',
        _model:          modelUsed
      };
    };

    const FOOD_PROMPT = `You are a food freshness analysis AI. Look at this food image carefully and return a JSON object.

Rules:
- Return ONLY valid JSON — no markdown, no explanation.
- "success" must be true if the image contains food, false otherwise.
- Identify the EXACT food (e.g. "Carrot", "Red Apple", "Broccoli") not just "vegetable".
- "category" must be one of: fruits | vegetables | cooked food | packaged food | liquid | non-veg
- "status" must be one of: Fresh | Slightly Spoiled | Spoiled
- "originalFreshness" is a number 5-100 (100 = perfectly fresh, 5 = fully rotten)
- "shelfLifeDays" is estimated days remaining before spoilage

Required JSON structure:
{
  "success": true,
  "message": "Food identified successfully",
  "name": "Carrot",
  "category": "vegetables",
  "status": "Fresh",
  "originalFreshness": 92,
  "shelfLifeDays": 14,
  "nutrition": {
    "calories": 41,
    "protein": 0.9,
    "carbs": 9.6,
    "fat": 0.2,
    "vitamins": ["Vitamin A", "Vitamin K"],
    "healthNotes": "High in beta-carotene, supports vision and immune health."
  },
  "storageGuidance": "Refrigerate in water with tops removed. Keeps up to 3 weeks.",
  "safetyAdvisory": "Safe to eat raw or cooked. Wash thoroughly before use."
}`;

    // ── Groq Vision API ───────────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey !== 'YOUR_GROQ_API_KEY') {
      try {
        const { Groq } = require('groq-sdk');
        const groq = new Groq({ apiKey: groqKey });

        // Read file and encode as base64 data URL — no public URL needed,
        // works reliably on Render's ephemeral filesystem
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        const completion = await groq.chat.completions.create({
          model: 'qwen/qwen3.8-27b',
          temperature: 0.1,
          max_completion_tokens: 1024,
          response_format: { type: 'json_object' },
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: FOOD_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }]
        });

        cleanupFile();

        const raw = completion.choices[0].message.content || '';
        const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const result = JSON.parse(jsonStr);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message || 'Visual analysis rejected: Non-food item detected.'
          });
        }

        return res.json({ success: true, scannedItems: [buildItemData(result, 'qwen/qwen3.8-27b')] });

      } catch (groqErr) {
        console.error('Groq vision error:', groqErr.message || groqErr);
        cleanupFile();
        return res.status(500).json({
          success: false,
          message: "AI Scanner encountered an error. Please try again or use Manual Entry."
        });
      }
    }

    // ── No API key configured ─────────────────────────────────────────────
    cleanupFile();
    return res.status(503).json({
      success: false,
      message: "AI Visual Scanner is temporarily unavailable. Please use Manual Entry to add your food item."
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add manual food item (Fallback when visual recognition fails)
exports.addManualItem = async (req, res) => {
  try {
    const { name, category, shelfLifeDays, isCooked, calories, protein, carbs, fat, dietaryPreferences, spiceLevel } = req.body;
    const db = getDB(req);
    const email = getActiveUserEmail(req);

    const addedDate = new Date();
    const predictedSpoilageDate = new Date(Date.now() + Number(shelfLifeDays || 5) * 24 * 60 * 60 * 1000);

    // Determine status based on shelf life days
    let status = 'Fresh';
    if (shelfLifeDays <= 0) status = 'Spoiled';
    else if (shelfLifeDays <= 2) status = 'Slightly Spoiled';

    const dietaryTags = dietaryPreferences || ["vegan", "vegetarian", "gluten-free", "dairy-free", "jain"];
    const imageUrl = getFoodImageUrl(name, category);
    const matchedCategory = category || 'fruits';

    // Use protein/carbs/fat from the request if provided; fall back to category defaults
    const nutritionProtein = protein !== undefined ? Number(protein) : (matchedCategory === 'fruits' ? 1.0 : (matchedCategory === 'vegetables' ? 3.0 : (matchedCategory === 'cooked food' ? 15.0 : 7.0)));
    const nutritionCarbs   = carbs   !== undefined ? Number(carbs)   : (matchedCategory === 'fruits' ? 20.0 : (matchedCategory === 'vegetables' ? 8.0 : (matchedCategory === 'cooked food' ? 40.0 : 15.0)));
    const nutritionFat     = fat     !== undefined ? Number(fat)     : (matchedCategory === 'fruits' ? 0.5  : (matchedCategory === 'vegetables' ? 0.3  : (matchedCategory === 'cooked food' ? 12.0 : 5.0)));

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
      owner: email,
      nutrition: {
        calories:   Number(calories) || 100,
        protein:    nutritionProtein,
        carbs:      nutritionCarbs,
        fat:        nutritionFat,
        ingredients: name,
        vitamins:    ["Vitamin C"],
        healthNotes: `Manually entered: ${name}. Check nutrition label for exact values.`
      },
      storageGuidance: "Store appropriately based on category. Check expiry dates.",
      safetyAdvisory: status === 'Spoiled' ? "Discard safely." : "Safe to consume.",
      spiceLevel: spiceLevel !== undefined ? Number(spiceLevel) : 0
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
    const email = getActiveUserEmail(req);
    const db = getDB(req);
    // Always stamp the correct owner from the request header so
    // updateFoodItemState can find the item even after a server cold-start
    // (in-memory currentUser is null after Render restarts).
    const itemData = { ...req.body, owner: email };
    const saved = await db.create(itemData);
    res.json({ success: true, item: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

