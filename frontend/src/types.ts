export interface FoodItem {
  _id: string;
  name: string;
  category: 'fruits' | 'vegetables' | 'cooked food' | 'packaged food';
  status: 'Fresh' | 'Slightly Spoiled' | 'Spoiled';
  state: 'Tracked' | 'Used' | 'Eaten' | 'Wasted';
  addedDate: string;
  predictedSpoilageDate: string;
  originalFreshness: number; // percentage
  imageUrl: string;
  isCooked: boolean;
  dietaryTags: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    vitamins: string[];
    healthNotes: string;
  };
  ocrInfo: {
    brand: string;
    expiryDate: string | null;
    hasOcrMatch: boolean;
  };
  storageGuidance: string;
  safetyAdvisory: string;
  compatibilityConflicts?: string[];
}

export interface User {
  email: string;
  name: string;
  dietaryPreferences: string[];
  audienceMode: 'Regular' | 'Kid-friendly' | 'Gourmet';
  servings: number;
  membersCount: number;
  notificationPref: {
    advanceNoticeDays: number;
    emailAlerts: boolean;
    inAppAlerts: boolean;
  };
  healthScore: number;
  streakCount: number;
  unlockedBadges: string[];
}

export interface UserPreference {
  dietaryPreferences: string[];
  audienceMode: 'Regular' | 'Kid-friendly' | 'Gourmet';
  servings: number;
  membersCount: number;
  notificationPref: {
    advanceNoticeDays: number;
    emailAlerts: boolean;
    inAppAlerts: boolean;
  };
  healthScore: number;
  streakCount: number;
  unlockedBadges: string[];
}

export interface Recipe {
  title: string;
  primaryIngredient: string;
  itemId: string;
  daysToExpiry: number;
  description: string;
  servings: number;
  ingredients: Array<{ name: string; qty: number; unit: string }>;
  steps: string[];
  audienceMode: string;
  chiliLevel: string;
  advice: string;
}

export interface AnalyticsReport {
  weeklyReport: {
    days: string[];
    consumed: number[];
    wasted: number[];
  };
  nutritionalRatio: {
    healthyCount: number;
    junkCount: number;
    healthyPercentage: number;
    junkPercentage: number;
  };
  buyingRecommendations: string[];
  calendarEvents: Array<{
    date: string;
    type: 'scan' | 'waste' | 'consumed';
    name: string;
    category: string;
    status: string;
  }>;
  wasteSummary?: WasteSummary;
}

export interface Household {
  code: string;
  members: string[];
  logs: Array<{ member: string; action: string; item: string; timestamp: string }>;
  chores: Array<{ id: string; task: string; assignee: string; done: boolean }>;
}

export interface Donation {
  _id: string;
  donor: string;
  name: string;
  quantity: string;
  daysLeft: number;
  distance: string;
  status: 'Available' | 'Requested';
}

export interface EcoMetrics {
  co2SavedKg: number;
  moneySaved: number;
  foodHealthLevel: string;
  ecoMilestones: Array<{ title: string; desc: string; unlocked: boolean }>;
  comparisonStats: { communityAvgKg: number; userSavingPct: number };
}

export interface NotificationLog {
  id: string;
  title: string;
  msg: string;
  timestamp: string;
  read: boolean;
}

export interface CatalogItem {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins: string[];
  storageAdvice: string;
}

export interface WasteAdviceItem {
  name: string;
  timesWasted: number;
  advice: string;
}

export interface WasteSummary {
  weeklyWastedCount: number;
  monthlyWastedCount: number;
  weeklyWastedItems: Array<{ name: string; category: string; addedDate: string }>;
  monthlyWastedItems: Array<{ name: string; category: string; addedDate: string }>;
  categoryBreakdown: Record<string, { count: number; names: string[] }>;
  buyAdvice: WasteAdviceItem[];
  membersCount: number;
}
