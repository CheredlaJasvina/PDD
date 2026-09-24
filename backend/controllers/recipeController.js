const FoodItem       = require('../models/FoodItem');
const UserPreference = require('../models/UserPreference');
const dbStatus       = require('../config/db');
const fallbackDb     = require('../models/fallbackDb');

// ── DB helpers ────────────────────────────────────────────────────────────────
const getActiveUserEmail = (req) => {
  if (req && req.headers && req.headers['x-user-email']) return req.headers['x-user-email'];
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
    find: async (query) => {
      const all = fallbackDb.getFoodItemsByUser(email);
      return query && query.state ? all.filter(i => i.state === query.state) : all;
    },
    getPreferences: async () => fallbackDb.getUserPreferenceByEmail(email)
  };
};

// ── Non-cookable items that should never generate a recipe ────────────────────
const NON_COOKABLE = [
  'oreo', 'biscuit', 'cookie', 'chips', 'crisps', 'chocolate', 'candy', 'sweets',
  'soda', 'cola', 'pepsi', 'coke', 'sprite', 'energy drink', 'protein bar',
  'granola bar', 'cereal', 'cornflakes', 'crackers', 'popcorn', 'jam', 'ketchup',
  'sauce', 'mineral water', 'water bottle', 'soft drink', 'ice cream', 'chewing gum'
];

const isNonCookable = (name) => {
  const n = name.toLowerCase();
  return NON_COOKABLE.some(k => n.includes(k));
};

// ── Build the Groq prompt ─────────────────────────────────────────────────────
const buildPrompt = (items, mode, servings, dietaryPrefs) => {
  const ingredientList = items.map(i => `${i.name} (${i.category}, ${i.daysToExpiry} days left)`).join(', ');
  const dietNote = dietaryPrefs && dietaryPrefs.length > 0
    ? `User dietary preferences: ${dietaryPrefs.join(', ')}.`
    : '';

  const modeInstructions = {
    'Regular':      'Generate practical, everyday home-cook recipes. Clear steps, common ingredients.',
    'Kid-friendly': 'Generate mild, fun, child-approved recipes. No spicy ingredients. Use simple steps a parent can explain to a child. Add a fun fact or activity tip for kids in the advice field.',
    'Gourmet':      'Generate elevated, restaurant-quality recipes. Use sophisticated techniques, premium ingredient swaps, and plating tips. The advice field should include a chef-level finishing touch.'
  };

  return `You are an expert chef AI assistant. Generate exactly 3 unique recipes using the user's available ingredients.

Available ingredients: ${ingredientList}
Audience mode: ${mode} — ${modeInstructions[mode] || modeInstructions['Regular']}
Servings: ${servings}
${dietNote}

Rules:
- Each recipe MUST use at least one ingredient from the available list as the primary star.
- Recipes must be genuinely different from each other (not all stir-fries or all soups).
- Tailor ALL content (title, description, steps, advice) specifically to the "${mode}" mode.
- The "primaryIngredient" field must be the EXACT name of the item from the available list.
- chiliLevel must be "high" only if the recipe is genuinely spicy; otherwise "none".
- For Kid-friendly: absolutely no spicy ingredients, no alcohol, make steps fun and simple.
- For Gourmet: use professional culinary terms, suggest premium substitutions.
- steps should have 4–6 clear, numbered cooking steps.
- advice should be 1–2 sentences specific to the audience mode.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact structure:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "primaryIngredient": "Exact ingredient name from the list",
      "description": "1-2 sentence description of the dish",
      "servings": ${servings},
      "ingredients": [
        { "name": "ingredient name", "qty": 1.5, "unit": "cups" }
      ],
      "steps": [
        "Step 1: ...",
        "Step 2: ..."
      ],
      "chiliLevel": "none",
      "advice": "Audience-specific tip for ${mode} mode"
    }
  ]
}`;
};

// ── AI recipe generation with simple in-process cache ────────────────────────
// Cache key = sorted item names + mode + servings. TTL = 10 minutes.
const recipeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const getCacheKey = (items, mode, servings) => {
  const names = items.map(i => i.name.toLowerCase()).sort().join('|');
  return `${names}::${mode}::${servings}`;
};

const generateRecipesWithAI = async (items, mode, servings, dietaryPrefs) => {
  // Check cache first
  const cacheKey = getCacheKey(items, mode, servings);
  const cached = recipeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.recipes;
  }

  const { Groq } = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildPrompt(items, mode, servings, dietaryPrefs);

  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    temperature: 0.8,
    max_completion_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = completion.choices[0].message.content || '';
  // Strip any accidental markdown fences
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const result = JSON.parse(jsonStr);

  const recipes = (result.recipes || []).slice(0, 3);

  // Store in cache
  recipeCache.set(cacheKey, { recipes, ts: Date.now() });

  return recipes;
};

// ── Fallback static recipes when AI is unavailable ───────────────────────────
const buildFallbackRecipes = (items, mode, servings) => {
  return items.slice(0, 3).map((item, idx) => {
    const methods = ['Stir-fry', 'Soup', 'Roasted Salad'];
    const method = methods[idx % 3];
    const modePrefix = mode === 'Kid-friendly' ? '🧒 Kid-Friendly ' : mode === 'Gourmet' ? '👨‍🍳 Chef\'s ' : '';
    return {
      title: `${modePrefix}${item.name} ${method}`,
      primaryIngredient: item.name,
      description: `A simple ${method.toLowerCase()} using your ${item.name}. ${
        mode === 'Kid-friendly' ? 'Mild and child-approved!' :
        mode === 'Gourmet' ? 'Elevated with premium finishing touches.' :
        'Quick and practical for everyday cooking.'
      }`,
      servings,
      ingredients: [
        { name: item.name, qty: 2, unit: 'pcs' },
        { name: 'Olive Oil', qty: 1, unit: 'tbsp' },
        { name: 'Garlic', qty: 2, unit: 'cloves' },
        { name: 'Salt & Pepper', qty: 1, unit: 'pinch' }
      ],
      steps: [
        `Wash and prep the ${item.name}.`,
        'Heat olive oil in a pan over medium heat.',
        `Add the ${item.name} and cook until tender (about 5–8 minutes).`,
        'Season with garlic, salt, and pepper.',
        'Serve warm.'
      ],
      chiliLevel: 'none',
      advice: mode === 'Kid-friendly' ? `Let kids help wash the ${item.name} — it's a fun kitchen task!`
             : mode === 'Gourmet'     ? `Finish with fresh herbs and a drizzle of extra-virgin olive oil.`
             : `A great way to use up ${item.name} before it expires.`,
      daysToExpiry: item.daysToExpiry
    };
  });
};

// ── Main handler ──────────────────────────────────────────────────────────────
exports.getSmartSuggestions = async (req, res) => {
  try {
    const db = getDB(req);
    const prefs = await db.getPreferences();
    const inventory = await db.find({ state: 'Tracked' });

    const servings = req.query.servings ? parseInt(req.query.servings, 10) : (prefs.servings || 2);
    const mode = req.query.mode || prefs.audienceMode || 'Regular';
    const dietaryPrefs = prefs.dietaryPreferences || [];

    // Filter: raw, uncooked, unspoiled, tracked, not a packaged snack brand
    const cookableItems = inventory
      .filter(item => {
        if (item.isCooked || item.category === 'cooked food' || item.category === 'Cooked Food') return false;
        if (item.status === 'Spoiled' || item.state !== 'Tracked') return false;
        if (isNonCookable(item.name)) return false;

        const itemAddedTime = new Date(item.addedDate).getTime();
        const totalDuration  = new Date(item.predictedSpoilageDate).getTime() - itemAddedTime;
        const elapsed = Date.now() - itemAddedTime;
        let pct = item.originalFreshness;
        if (elapsed >= totalDuration) pct = 0;
        else if (elapsed > 0) pct = Math.max(0, Math.round(item.originalFreshness * (1 - elapsed / totalDuration)));
        return pct > 10;
      })
      .map(item => ({
        name: item.name,
        category: item.category,
        daysToExpiry: Math.max(0, Math.ceil((new Date(item.predictedSpoilageDate) - new Date()) / (1000 * 60 * 60 * 24))),
        originalFreshness: item.originalFreshness,
        _id: item._id
      }))
      .sort((a, b) => a.originalFreshness - b.originalFreshness) // most urgent first
      .slice(0, 8); // max 8 items sent to AI to keep prompt manageable

    if (cookableItems.length === 0) {
      return res.json({
        success: true,
        servings,
        audienceMode: mode,
        recipes: []
      });
    }

    let aiRecipes = [];
    let usedFallback = false;

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY') {
      try {
        aiRecipes = await generateRecipesWithAI(cookableItems, mode, servings, dietaryPrefs);
      } catch (aiErr) {
        console.error('AI recipe generation failed, using fallback:', aiErr.message);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (usedFallback || aiRecipes.length === 0) {
      aiRecipes = buildFallbackRecipes(cookableItems, mode, servings);
    }

    // Normalise: ensure daysToExpiry is on every recipe, map primaryIngredient
    // back to the inventory item to get _id for the filter bar
    const normalised = aiRecipes.map(r => {
      const match = cookableItems.find(i =>
        i.name.toLowerCase() === (r.primaryIngredient || '').toLowerCase() ||
        (r.primaryIngredient || '').toLowerCase().includes(i.name.toLowerCase()) ||
        i.name.toLowerCase().includes((r.primaryIngredient || '').toLowerCase())
      ) || cookableItems[0];

      return {
        title:             r.title,
        primaryIngredient: match ? match.name : (r.primaryIngredient || cookableItems[0].name),
        itemId:            match ? match._id : '',
        daysToExpiry:      match ? match.daysToExpiry : (r.daysToExpiry || 0),
        description:       r.description,
        servings:          r.servings || servings,
        ingredients:       r.ingredients || [],
        steps:             r.steps || [],
        audienceMode:      mode,
        chiliLevel:        r.chiliLevel || 'none',
        advice:            r.advice || ''
      };
    });

    res.json({
      success:      true,
      servings,
      audienceMode: mode,
      recipes:      normalised
    });

  } catch (error) {
    console.error('recipeController error:', error);
    res.status(500).json({ error: error.message });
  }
};
