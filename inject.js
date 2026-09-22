const fs = require('fs');
const file = 'backend/controllers/recipeController.js';
let content = fs.readFileSync(file, 'utf8');

const genericRecipes = Array.from({length: 10}, (_, i) => ({
  title: `Creative ${['Stir-fry', 'Bake', 'Salad', 'Soup', 'Casserole', 'Skillet', 'Roast', 'Bowl', 'Wrap', 'Curry'][i]} with {ingredient}`,
  description: 'A quick and easy way to utilize your fresh ingredients before they spoil.',
  baseServings: 2,
  baseIngredients: [
    { name: '{ingredient}', qty: 2, unit: 'pcs' },
    { name: 'Olive Oil', qty: 1, unit: 'tbsp' },
    { name: 'Garlic cloves', qty: 2, unit: 'pcs' },
    { name: 'Salt & Pepper', qty: 1, unit: 'pinch' },
    { name: 'Mixed Herbs', qty: 1, unit: 'tsp' }
  ],
  steps: [
    'Wash and prep the {ingredient}.',
    'Heat olive oil in a pan over medium heat and add minced garlic.',
    'Add the {ingredient} and sauté until tender.',
    'Season with salt, pepper, and mixed herbs.',
    'Serve warm and enjoy!'
  ],
  kidFriendlyNotes: 'Mild and simple flavors perfect for picky eaters.',
  gourmetNotes: 'Finish with a drizzle of truffle oil or a sprinkle of aged parmesan.',
  chiliLevel: 'none'
}));

const appleRecipes = Array.from({length: 8}, (_, i) => ({
  title: `Apple ${['Crisp', 'Tart', 'Muffins', 'Pancakes', 'Smoothie', 'Chutney', 'Slaw', 'Porridge'][i]}`,
  description: 'Delicious apple-based recipe to reduce waste.',
  baseServings: 2,
  baseIngredients: [
    { name: 'Apples', qty: 2, unit: 'pcs' },
    { name: 'Cinnamon', qty: 1, unit: 'tsp' },
    { name: 'Honey', qty: 1, unit: 'tbsp' }
  ],
  steps: ['Prep apples', 'Mix ingredients', 'Cook until golden', 'Serve warm.'],
  kidFriendlyNotes: 'Sweet and delicious.',
  gourmetNotes: 'Add fresh vanilla bean.',
  chiliLevel: 'none'
}));

const tomatoRecipes = Array.from({length: 8}, (_, i) => ({
  title: `Tomato ${['Bruschetta', 'Pasta Sauce', 'Salsa', 'Galette', 'Risotto', 'Curry', 'Salad', 'Stew'][i]}`,
  description: 'Savory tomato recipe to use up ripening tomatoes.',
  baseServings: 2,
  baseIngredients: [
    { name: 'Tomatoes', qty: 3, unit: 'pcs' },
    { name: 'Basil', qty: 5, unit: 'leaves' },
    { name: 'Olive Oil', qty: 2, unit: 'tbsp' }
  ],
  steps: ['Chop tomatoes', 'Toss with oil and basil', 'Cook or serve fresh depending on dish.', 'Enjoy!'],
  kidFriendlyNotes: 'Mild flavor.',
  gourmetNotes: 'Use heirloom tomatoes.',
  chiliLevel: 'none'
}));

// Insert generic into RECIPE_DATABASE
const replacement = `const RECIPE_DATABASE = {
  generic: ${JSON.stringify(genericRecipes, null, 2)},
  apple: [
    ... ${JSON.stringify(appleRecipes, null, 2)},
`;

content = content.replace(/const RECIPE_DATABASE = {\s*apple: \[/, replacement);

content = content.replace(
  /if \(matchedKey && RECIPE_DATABASE\[matchedKey\]\) {/g,
  `if (!matchedKey) matchedKey = 'generic';\n      if (matchedKey && RECIPE_DATABASE[matchedKey]) {`
);

// We must replace {ingredient} string dynamically
content = content.replace(
  /baseRecipes\.forEach\(recipe => {/,
  `baseRecipes.forEach(r => {
          // Clone recipe to replace generic placeholders
          let recipe = JSON.parse(JSON.stringify(r));
          if (matchedKey === 'generic') {
            recipe.title = recipe.title.replace('{ingredient}', item.name);
            recipe.baseIngredients[0].name = item.name;
            recipe.steps = recipe.steps.map(s => s.replace(/\\{ingredient\\}/g, item.name));
          }`
);

fs.writeFileSync(file, content);
console.log('Recipes injected successfully');
