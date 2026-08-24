const FoodItem = require('../models/FoodItem');
const UserPreference = require('../models/UserPreference');
const dbStatus = require('../config/db');
const fallbackDb = require('../models/fallbackDb');

const getActiveUserEmail = () => {
  const user = fallbackDb.getCurrentUser();
  return user ? user.email : 'jasvina@foodfreshness.com';
};

const getDB = () => {
  const email = getActiveUserEmail();
  return dbStatus.getDbStatus() ? {
    find: async (query) => FoodItem.find({ ...query, owner: email }),
    getPreferences: async () => {
      let pref = await UserPreference.findOne({ owner: email });
      if (!pref) {
        pref = await new UserPreference({ owner: email }).save();
      }
      return pref;
    }
  } : {
    find: async (query) => fallbackDb.getInventory(),
    getPreferences: async () => fallbackDb.getUserPreference()
  };
};

// Base recipe repository indexed by ingredient keyword (lowercase matches)
const RECIPE_DATABASE = {
  apple: [
    {
      title: "Warm Cinnamon Baked Apples",
      description: "A cozy, caramelized sweet dessert perfect for utilizing slightly soft apples.",
      baseServings: 2,
      baseIngredients: [
        { name: "Gala or Fuji Apples", qty: 2, unit: "pcs" },
        { name: "Ground Cinnamon", qty: 1, unit: "tsp" },
        { name: "Brown Sugar or Honey", qty: 2, unit: "tbsp" },
        { name: "Rolled Oats", qty: 0.25, unit: "cup" },
        { name: "Unsalted Butter", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Preheat your oven to 180°C (350°F).",
        "Wash apples, cut them in half, and scoop out the center core/seeds to create a small cavity.",
        "In a small mixing bowl, stir together the cinnamon, brown sugar, oats, and melted butter.",
        "Stuff the oatmeal mixture evenly into the hollowed apple centers.",
        "Place apples in a baking dish with 2 tbsp water at the bottom, and bake for 30 minutes until soft and bubbly."
      ],
      kidFriendlyNotes: "Sweet & mild. Perfect snack for children - skip any nut toppings if preferred.",
      gourmetNotes: "Top with a drizzle of salted caramel sauce and a scoop of vanilla bean gelato.",
      chiliLevel: "none"
    },
    {
      title: "Crisp Apple Orchard Salad",
      description: "A fresh and crunchy salad utilizing fresh apples and crisp greens.",
      baseServings: 2,
      baseIngredients: [
        { name: "Fresh Apples sliced", qty: 1, unit: "pcs" },
        { name: "Mixed Salad Greens", qty: 4, unit: "cups" },
        { name: "Feta Cheese crumbled", qty: 0.25, unit: "cup" },
        { name: "Walnuts chopped", qty: 0.25, unit: "cup" },
        { name: "Olive oil & Honey Dressing", qty: 2, unit: "tbsp" }
      ],
      steps: [
        "Core and thinly slice the apples, keeping the skin on for maximum color and nutrition.",
        "Wash and spin-dry the salad greens, placing them in a large salad bowl.",
        "Scatter the apple slices, walnuts, and feta cheese over the greens.",
        "Whisk the olive oil and honey dressing and drizzle over the salad just before serving."
      ],
      kidFriendlyNotes: "Cut apple slices into smaller cubes and use mild cheddar instead of feta.",
      gourmetNotes: "Whisk apple cider vinegar and dijon mustard into the oil dressing, and serve with candied walnuts.",
      chiliLevel: "none"
    }
  ],
  tomato: [
    {
      title: "Rustic Roasted Tomato Soup",
      description: "A comforting soup using fresh ripe tomatoes and simple kitchen staples.",
      baseServings: 2,
      baseIngredients: [
        { name: "Ripe Red Tomatoes", qty: 4, unit: "pcs" },
        { name: "Olive Oil", qty: 1, unit: "tbsp" },
        { name: "Garlic cloves sliced", qty: 2, unit: "pcs" },
        { name: "Vegetable Broth", qty: 1, unit: "cup" },
        { name: "Fresh Basil leaves", qty: 4, unit: "pcs" }
      ],
      steps: [
        "Cut tomatoes into quarters and toss with olive oil and sliced garlic on a baking sheet.",
        "Roast at 200°C for 20 minutes until tomatoes are slightly charred and tender.",
        "Transfer roasted tomatoes and garlic to a pot, pour in vegetable broth, and bring to a simmer.",
        "Use an immersion blender to puree the soup until smooth.",
        "Season with salt and pepper, stir in fresh basil, and serve warm."
      ],
      kidFriendlyNotes: "Mild tomato soup. Serve with standard toasted cheddar cheese sticks for dipping.",
      gourmetNotes: "Stir in 1/4 cup heavy cream and top with roasted garlic croutons and a drizzle of truffle oil.",
      chiliLevel: "none"
    },
    {
      title: "Spicy Roasted Tomato & Chili Salsa",
      description: "A zesty, fiery salsa that uses ripe tomatoes and fresh peppers.",
      baseServings: 2,
      baseIngredients: [
        { name: "Red Tomatoes", qty: 3, unit: "pcs" },
        { name: "Jalapeno Pepper", qty: 1, unit: "pcs" },
        { name: "Lime Juice", qty: 1, unit: "tbsp" },
        { name: "Red Onion finely diced", qty: 0.25, unit: "cup" },
        { name: "Coriander leaves chopped", qty: 0.25, unit: "cup" },
        { name: "Chili Powder", qty: 0.5, unit: "tsp" }
      ],
      steps: [
        "Finely chop tomatoes, jalapeno (remove seeds for less heat), onion, and coriander.",
        "Combine all chopped ingredients in a mixing bowl.",
        "Pour fresh lime juice over the mixture and sprinkle with chili powder and salt.",
        "Mix thoroughly and let rest in the refrigerator for 10 minutes to allow flavors to combine."
      ],
      kidFriendlyNotes: "WARNING: Skip this recipe or replace jalapenos/chili powder with mild bell peppers for kids.",
      gourmetNotes: "Char the tomatoes and jalapeno on a grill first, and blend with smoked paprika and roasted garlic.",
      chiliLevel: "high"
    }
  ],
  broccoli: [
    {
      title: "Cheesy Broccoli & Cheddar Croquettes",
      description: "A crispy, baked vegetable croquette that kids absolutely love.",
      baseServings: 2,
      baseIngredients: [
        { name: "Fresh Broccoli florets", qty: 1.5, unit: "cups" },
        { name: "Cheddar Cheese shredded", qty: 0.75, unit: "cup" },
        { name: "Breadcrumbs", qty: 0.5, unit: "cup" },
        { name: "Large Egg beaten", qty: 1, unit: "pcs" },
        { name: "Garlic powder", qty: 0.25, unit: "tsp" }
      ],
      steps: [
        "Steam the broccoli florets until tender, then chop them into very fine bits.",
        "In a bowl, mix the broccoli, shredded cheddar, egg, breadcrumbs, and garlic powder.",
        "Shape the mixture into small cylinders or bite-sized balls.",
        "Place on a greased baking sheet and bake at 190°C (375°F) for 15-18 minutes until golden brown and crispy.",
        "Serve warm with a ketchup dip."
      ],
      kidFriendlyNotes: "Extremely popular with kids. Super cheesy, mild, and fun to grab.",
      gourmetNotes: "Serve with a side of homemade dijon mustard aioli and swap breadcrumbs for Panko.",
      chiliLevel: "none"
    },
    {
      title: "Szechuan Garlic Broccoli Stir-Fry",
      description: "A quick, spicy Asian-style broccoli dish with deep savory flavors.",
      baseServings: 2,
      baseIngredients: [
        { name: "Broccoli cut into florets", qty: 2, unit: "cups" },
        { name: "Garlic cloves minced", qty: 3, unit: "pcs" },
        { name: "Soy Sauce", qty: 1.5, unit: "tbsp" },
        { name: "Szechuan Chili Paste", qty: 1, unit: "tsp" },
        { name: "Sesame Oil", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Heat sesame oil in a large wok or skillet over high heat.",
        "Add broccoli florets and stir-fry for 3-4 minutes until bright green and crisp-tender.",
        "Reduce heat slightly, toss in the minced garlic, and stir for 30 seconds until fragrant.",
        "Pour in the soy sauce and Szechuan chili paste, tossing the broccoli to coat thoroughly.",
        "Remove from heat and garnish with sesame seeds before serving."
      ],
      kidFriendlyNotes: "WARNING: High spice levels. Adjust chili paste to a microscopic drop or skip for children.",
      gourmetNotes: "Top with toasted cashews and a splash of rice wine vinegar, and serve with jasmine rice.",
      chiliLevel: "high"
    }
  ],
  carrot: [
    {
      title: "Honey Glazed Roasted Carrots",
      description: "Sweet and tender oven-roasted carrots glazed in natural wild honey.",
      baseServings: 2,
      baseIngredients: [
        { name: "Fresh Carrots", qty: 4, unit: "pcs" },
        { name: "Honey", qty: 2, unit: "tbsp" },
        { name: "Olive Oil", qty: 1, unit: "tbsp" },
        { name: "Fresh Parsley chopped", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Preheat oven to 200°C (400°F).",
        "Wash, peel, and cut carrots diagonally into 1-inch pieces.",
        "Toss carrots with olive oil, salt, and pepper on a baking sheet.",
        "Roast for 20 minutes until tender, then drizzle honey and roast for 5 more minutes until caramelized.",
        "Garnish with chopped parsley and serve."
      ],
      kidFriendlyNotes: "Naturally sweet and soft. Kids love the honey glaze flavor.",
      gourmetNotes: "Add a splash of orange juice and top with toasted sesame seeds.",
      chiliLevel: "none"
    }
  ],
  banana: [
    {
      title: "Quick Golden Banana Pancakes",
      description: "Easy fluffy pancakes naturally sweetened with ripe mashed bananas.",
      baseServings: 2,
      baseIngredients: [
        { name: "Ripe Bananas", qty: 2, unit: "pcs" },
        { name: "All-Purpose Flour", qty: 1, unit: "cup" },
        { name: "Milk", qty: 0.75, unit: "cup" },
        { name: "Baking Powder", qty: 1, unit: "tsp" },
        { name: "Butter for cooking", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "In a bowl, mash bananas thoroughly using a fork.",
        "Whisk in the milk and egg, then fold in flour and baking powder until combined.",
        "Melt butter in a non-stick pan over medium heat.",
        "Pour batter in circular portions and cook until bubbles form, then flip and cook until golden brown.",
        "Serve warm with sliced fresh bananas and maple syrup."
      ],
      kidFriendlyNotes: "Perfect sweet breakfast for children. Easy to chew.",
      gourmetNotes: "Add a dash of vanilla extract and a pinch of nutmeg to the batter.",
      chiliLevel: "none"
    }
  ],
  orange: [
    {
      title: "Zesty Orange & Mint Fruit Salad",
      description: "A refreshing citrus salad with fresh mint dressing.",
      baseServings: 2,
      baseIngredients: [
        { name: "Oranges peeled & sliced", qty: 2, unit: "pcs" },
        { name: "Honey", qty: 1, unit: "tbsp" },
        { name: "Fresh Mint leaves", qty: 6, unit: "pcs" }
      ],
      steps: [
        "Peel oranges and segment them into clean bite-sized pieces.",
        "Finely chop the fresh mint leaves.",
        "Toss orange segments with honey and mint in a serving bowl.",
        "Chill in the fridge for 10 minutes before serving."
      ],
      kidFriendlyNotes: "Make sure to remove seeds and inner membranes for easy eating.",
      gourmetNotes: "Drizzle with a teaspoon of orange blossom water and garnish with pomegranate seeds.",
      chiliLevel: "none"
    }
  ],
  spinach: [
    {
      title: "Creamy Garlic Sautéed Spinach",
      description: "Quick sautéed spinach tossed in roasted garlic olive oil.",
      baseServings: 2,
      baseIngredients: [
        { name: "Fresh Baby Spinach", qty: 4, unit: "cups" },
        { name: "Garlic cloves sliced", qty: 2, unit: "pcs" },
        { name: "Olive Oil", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Heat olive oil in a large pan over medium heat.",
        "Add garlic slices and sauté for 1 minute until lightly golden.",
        "Add spinach in batches, tossing until wilted (about 2-3 minutes).",
        "Season with a pinch of salt and serve immediately."
      ],
      kidFriendlyNotes: "Wilt thoroughly and chop into small bits to make it child-friendly.",
      gourmetNotes: "Squeeze fresh lemon juice and grate fresh parmesan cheese on top.",
      chiliLevel: "none"
    }
  ],
  potato: [
    {
      title: "Crispy Garlic Potato Wedges",
      description: "Oven-baked potato wedges seasoned with garlic and herbs.",
      baseServings: 2,
      baseIngredients: [
        { name: "Potatoes cut into wedges", qty: 3, unit: "pcs" },
        { name: "Garlic Powder", qty: 1, unit: "tsp" },
        { name: "Olive Oil", qty: 1.5, unit: "tbsp" },
        { name: "Dried Rosemary", qty: 0.5, unit: "tsp" }
      ],
      steps: [
        "Preheat oven to 200°C (400°F).",
        "Wash potatoes and slice into even wedge pieces.",
        "Toss wedges with olive oil, garlic powder, rosemary, salt, and pepper.",
        "Spread in a single layer on a baking sheet and bake for 25-30 minutes until golden and crispy."
      ],
      kidFriendlyNotes: "Serve with ketchup or mild cheese dip.",
      gourmetNotes: "Top with grated Pecorino Romano and white truffle oil.",
      chiliLevel: "none"
    }
  ],
  onion: [
    {
      title: "Sweet Caramelized Onion Jam",
      description: "Slow-cooked sweet onions perfect as a spread or topping.",
      baseServings: 2,
      baseIngredients: [
        { name: "Onions thinly sliced", qty: 3, unit: "pcs" },
        { name: "Olive Oil", qty: 1, unit: "tbsp" },
        { name: "Brown Sugar", qty: 1, unit: "tbsp" },
        { name: "Balsamic Vinegar", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Heat olive oil in a skillet over medium-low heat.",
        "Add sliced onions and cook slowly for 20 minutes, stirring occasionally, until soft and golden brown.",
        "Stir in brown sugar and balsamic vinegar.",
        "Simmer for another 5 minutes until thick and syrupy."
      ],
      kidFriendlyNotes: "Sweet onion flavor is mild and goes great on homemade burgers.",
      gourmetNotes: "De-glaze the pan with red wine for a richer, deeper flavor profile.",
      chiliLevel: "none"
    }
  ],
  egg: [
    {
      title: "Classic Fluffy Scrambled Eggs",
      description: "Quick scrambled eggs cooked in unsalted farm butter.",
      baseServings: 2,
      baseIngredients: [
        { name: "Large Eggs", qty: 4, unit: "pcs" },
        { name: "Milk", qty: 2, unit: "tbsp" },
        { name: "Butter", qty: 1, unit: "tbsp" }
      ],
      steps: [
        "Whisk eggs and milk together in a bowl until frothy.",
        "Melt butter in a non-stick skillet over medium-low heat.",
        "Pour in eggs and let cook slightly, then sweep curds gently until soft and creamy.",
        "Season with salt and pepper and serve immediately."
      ],
      kidFriendlyNotes: "Super soft, warm, and highly nutritious breakfast.",
      gourmetNotes: "Fold in fresh chives and a spoonful of crème fraîche just before taking off heat.",
      chiliLevel: "none"
    }
  ],
  chicken: [
    {
      title: "Pan-Seared Garlic Herb Chicken Breast",
      description: "Juicy, tender chicken breast seared with garlic and fresh herbs.",
      baseServings: 2,
      baseIngredients: [
        { name: "Chicken Breasts", qty: 2, unit: "pcs" },
        { name: "Garlic cloves minced", qty: 2, unit: "pcs" },
        { name: "Olive Oil", qty: 1, unit: "tbsp" },
        { name: "Dried Thyme or Oregano", qty: 1, unit: "tsp" }
      ],
      steps: [
        "Pat chicken breasts dry and season with salt, pepper, and herbs.",
        "Heat olive oil in a skillet over medium-high heat.",
        "Add chicken and cook for 6-7 minutes on one side until golden.",
        "Flip, toss in garlic, and cook for another 5-6 minutes until cooked through (internal temp 74°C).",
        "Let rest for 5 minutes before slicing."
      ],
      kidFriendlyNotes: "Slice into small strips (chicken tenders) for kids.",
      gourmetNotes: "Baste with melted butter, fresh rosemary, and a squeeze of fresh lemon juice.",
      chiliLevel: "none"
    }
  ],
  cheese: [
    {
      title: "Gourmet Three-Cheese Grilled Toast",
      description: "Crispy toasted bread loaded with melted gourmet cheeses.",
      baseServings: 2,
      baseIngredients: [
        { name: "Sliced Bread", qty: 4, unit: "pcs" },
        { name: "Cheddar Cheese sliced", qty: 2, unit: "pcs" },
        { name: "Mozzarella Cheese shredded", qty: 0.5, unit: "cup" },
        { name: "Butter", qty: 1.5, unit: "tbsp" }
      ],
      steps: [
        "Butter one side of each slice of bread.",
        "Place cheese between the unbuttered sides of the bread slices.",
        "Cook in a skillet over medium heat until golden brown on one side (about 3-4 minutes).",
        "Flip and cook until the other side is golden and the cheese is fully melted."
      ],
      kidFriendlyNotes: "Standard ultimate comfort food. Highly popular with kids.",
      gourmetNotes: "Add sliced tomatoes, a spread of basil pesto, and a pinch of red pepper flakes.",
      chiliLevel: "none"
    }
  ]
};

// Main generator
exports.getSmartSuggestions = async (req, res) => {
  try {
    const db = getDB();
    const prefs = await db.getPreferences();
    const inventory = await db.find({ state: 'Tracked' });

    // 1. Filter: Restrict recommendations strictly to RAW (uncooked) items in the inventory
    const rawItems = inventory.filter(item => !item.isCooked && item.state === 'Tracked');

    // Sort raw items by remaining freshness (ascending) so items nearing expiry appear first
    rawItems.sort((a, b) => a.originalFreshness - b.originalFreshness);

    const recipesSuggested = [];
    const servingsMultiplier = prefs.servings || 2;
    const mode = prefs.audienceMode || 'Regular';

    // Loop through inventory items and check if we have recipes for them
    for (const item of rawItems) {
      // Find key matching item name (e.g. "Gala Apples" matches "apple")
      const itemNameLower = item.name.toLowerCase();
      let matchedKey = null;

      for (const dbKey of Object.keys(RECIPE_DATABASE)) {
        if (itemNameLower.includes(dbKey)) {
          matchedKey = dbKey;
          break;
        }
      }

      if (matchedKey && RECIPE_DATABASE[matchedKey]) {
        // Grab recipes for this item
        const baseRecipes = RECIPE_DATABASE[matchedKey];

        baseRecipes.forEach(recipe => {
          // Check if this recipe fits the audience mode (skip spicy things in kid-friendly mode)
          if (mode === 'Kid-friendly' && recipe.chiliLevel === 'high') {
            return; // Skip spicy recipes for kids
          }

          // 2. Dynamic servings scaling: scale ingredient quantity
          const scaledIngredients = recipe.baseIngredients.map(ing => {
            const scaledQty = (ing.qty / recipe.baseServings) * servingsMultiplier;
            return {
              name: ing.name,
              qty: parseFloat(scaledQty.toFixed(2)),
              unit: ing.unit
            };
          });

          // 3. Customize instructions and notes based on audience mode
          let audienceSteps = [...recipe.steps];
          let warningNote = "";

          if (mode === 'Kid-friendly') {
            warningNote = `Child Mode: ${recipe.kidFriendlyNotes}`;
            // Adjust step descriptions to make them milder if needed
            if (recipe.chiliLevel === 'high') {
              audienceSteps = audienceSteps.map(step => 
                step.replace("Szechuan chili paste", "sweet soy reduction")
                    .replace("jalapeno", "bell pepper")
              );
            }
          } else if (mode === 'Gourmet') {
            warningNote = `Chef Touch: ${recipe.gourmetNotes}`;
          }

          recipesSuggested.push({
            title: recipe.title,
            primaryIngredient: item.name,
            itemId: item._id,
            daysToExpiry: Math.max(0, Math.ceil((new Date(item.predictedSpoilageDate) - new Date()) / (1000 * 60 * 60 * 24))),
            description: recipe.description,
            servings: servingsMultiplier,
            ingredients: scaledIngredients,
            steps: audienceSteps,
            audienceMode: mode,
            chiliLevel: recipe.chiliLevel,
            advice: warningNote
          });
        });
      }
    }

    res.json({
      success: true,
      servings: servingsMultiplier,
      audienceMode: mode,
      recipes: recipesSuggested
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
