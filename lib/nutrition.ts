/* Per-food nutrient lookup + balance/recommendation computation.

   Values are approximate "% of a 4–8 year old's daily RDA delivered by 100 g
   of this food", consistent across all entries:
     • Protein   = 19 g/day
     • Iron      = 10 mg/day
     • Fiber     = 25 g/day
     • Vitamin A = 400 µg RAE/day
     • Vitamin D = 15 µg/day
     • Calcium   = 1000 mg/day

   The numbers below are curated approximations from common nutrition
   references — they're closer to USDA than the original v0 table but not
   strictly USDA-sourced. For foods not explicitly listed, we fall back to
   a per-category default. This is the scope-A choice from the backlog;
   real USDA FoodData Central wiring is a future sprint. */

import { FOODS, type FoodCategory } from "./mockData";

type NutrientName = "protein" | "iron" | "fiber" | "vitaminA" | "vitaminD" | "calcium";
type NutrientProfile = Record<NutrientName, number>;

const EMPTY: NutrientProfile = {
  protein: 0, iron: 0, fiber: 0, vitaminA: 0, vitaminD: 0, calcium: 0,
};

/* Sensible per-category fallback for foods we haven't curated explicitly.
   Tuned conservatively so unknown foods don't over-contribute. */
const CATEGORY_DEFAULTS: Record<FoodCategory, NutrientProfile> = {
  vegetable: { protein: 8,   iron: 4,  fiber: 8,  vitaminA: 20,  vitaminD: 0,  calcium: 4 },
  fruit:     { protein: 3,   iron: 2,  fiber: 8,  vitaminA: 5,   vitaminD: 0,  calcium: 2 },
  protein:   { protein: 70,  iron: 8,  fiber: 2,  vitaminA: 2,   vitaminD: 3,  calcium: 3 },
  grain:     { protein: 12,  iron: 5,  fiber: 6,  vitaminA: 0,   vitaminD: 0,  calcium: 2 },
  dairy:     { protein: 18,  iron: 1,  fiber: 0,  vitaminA: 8,   vitaminD: 20, calcium: 18 },
  snack:     { protein: 6,   iron: 2,  fiber: 3,  vitaminA: 1,   vitaminD: 0,  calcium: 3 },
  spice:     { protein: 2,   iron: 4,  fiber: 4,  vitaminA: 3,   vitaminD: 0,  calcium: 4 },
  drink:     { protein: 2,   iron: 0,  fiber: 0,  vitaminA: 1,   vitaminD: 2,  calcium: 4 },
};

/* Per-food overrides for foods with notable outlier nutrients. Anything
   not listed falls through to its CATEGORY_DEFAULT above. */
const FOOD_NUTRIENTS: Record<string, NutrientProfile> = {
  /* Original v0 entries (kept for stability) */
  carrot:         { protein: 5,   iron: 3,  fiber: 11, vitaminA: 200, vitaminD: 0,  calcium: 3 },
  broccoli:       { protein: 14,  iron: 7,  fiber: 10, vitaminA: 30,  vitaminD: 0,  calcium: 5 },
  cucumber:       { protein: 3,   iron: 2,  fiber: 2,  vitaminA: 1,   vitaminD: 0,  calcium: 2 },
  "sweet-potato": { protein: 8,   iron: 5,  fiber: 12, vitaminA: 280, vitaminD: 0,  calcium: 3 },
  spinach:        { protein: 12,  iron: 27, fiber: 9,  vitaminA: 120, vitaminD: 0,  calcium: 10 },
  strawberry:     { protein: 3,   iron: 4,  fiber: 8,  vitaminA: 0,   vitaminD: 0,  calcium: 2 },
  banana:         { protein: 5,   iron: 2,  fiber: 10, vitaminA: 0,   vitaminD: 0,  calcium: 1 },
  apple:          { protein: 2,   iron: 1,  fiber: 9,  vitaminA: 0,   vitaminD: 0,  calcium: 1 },
  egg:            { protein: 35,  iron: 12, fiber: 0,  vitaminA: 16,  vitaminD: 90, calcium: 5 },
  chicken:        { protein: 130, iron: 5,  fiber: 0,  vitaminA: 0,   vitaminD: 1,  calcium: 1 },
  couscous:       { protein: 18,  iron: 4,  fiber: 4,  vitaminA: 0,   vitaminD: 0,  calcium: 1 },

  /* High-vitA vegetables */
  pumpkin:           { protein: 5,  iron: 3,  fiber: 4,  vitaminA: 220, vitaminD: 0, calcium: 2 },
  "butternut-squash":{ protein: 5,  iron: 3,  fiber: 8,  vitaminA: 270, vitaminD: 0, calcium: 5 },
  kale:              { protein: 22, iron: 17, fiber: 14, vitaminA: 125, vitaminD: 0, calcium: 25 },
  "swiss-chard":     { protein: 10, iron: 18, fiber: 6,  vitaminA: 75,  vitaminD: 0, calcium: 5 },
  "collard-greens":  { protein: 16, iron: 5,  fiber: 16, vitaminA: 60,  vitaminD: 0, calcium: 23 },
  romaine:           { protein: 6,  iron: 10, fiber: 8,  vitaminA: 110, vitaminD: 0, calcium: 4 },
  arugula:           { protein: 14, iron: 15, fiber: 6,  vitaminA: 30,  vitaminD: 0, calcium: 16 },
  "bell-pepper":     { protein: 5,  iron: 4,  fiber: 8,  vitaminA: 12,  vitaminD: 0, calcium: 1 },
  tomato:            { protein: 5,  iron: 3,  fiber: 5,  vitaminA: 10,  vitaminD: 0, calcium: 1 },
  "cherry-tomato":   { protein: 5,  iron: 3,  fiber: 5,  vitaminA: 10,  vitaminD: 0, calcium: 1 },
  lettuce:           { protein: 7,  iron: 9,  fiber: 5,  vitaminA: 90,  vitaminD: 0, calcium: 4 },
  romaine_alias:     { protein: 6,  iron: 10, fiber: 8,  vitaminA: 110, vitaminD: 0, calcium: 4 },

  /* Other vegetables */
  potato:        { protein: 11, iron: 8,  fiber: 9,  vitaminA: 0,  vitaminD: 0, calcium: 1 },
  cauliflower:   { protein: 10, iron: 4,  fiber: 8,  vitaminA: 0,  vitaminD: 0, calcium: 2 },
  cabbage:       { protein: 7,  iron: 5,  fiber: 9,  vitaminA: 1,  vitaminD: 0, calcium: 4 },
  zucchini:      { protein: 6,  iron: 4,  fiber: 4,  vitaminA: 5,  vitaminD: 0, calcium: 2 },
  asparagus:     { protein: 12, iron: 21, fiber: 8,  vitaminA: 19, vitaminD: 0, calcium: 2 },
  corn:          { protein: 17, iron: 5,  fiber: 8,  vitaminA: 2,  vitaminD: 0, calcium: 0 },
  peas:          { protein: 27, iron: 15, fiber: 22, vitaminA: 19, vitaminD: 0, calcium: 3 },
  "snap-peas":   { protein: 14, iron: 21, fiber: 11, vitaminA: 27, vitaminD: 0, calcium: 4 },
  "snow-peas":   { protein: 14, iron: 21, fiber: 11, vitaminA: 27, vitaminD: 0, calcium: 4 },
  "green-beans": { protein: 10, iron: 10, fiber: 14, vitaminA: 17, vitaminD: 0, calcium: 4 },
  edamame:       { protein: 60, iron: 22, fiber: 20, vitaminA: 6,  vitaminD: 0, calcium: 6 },
  mushroom:      { protein: 16, iron: 5,  fiber: 4,  vitaminA: 0,  vitaminD: 5, calcium: 0 },
  portobello:    { protein: 16, iron: 5,  fiber: 5,  vitaminA: 0,  vitaminD: 5, calcium: 0 },
  beet:          { protein: 9,  iron: 8,  fiber: 11, vitaminA: 1,  vitaminD: 0, calcium: 2 },
  onion:         { protein: 5,  iron: 2,  fiber: 7,  vitaminA: 0,  vitaminD: 0, calcium: 2 },

  /* Fruits */
  blueberry:    { protein: 4,  iron: 3,  fiber: 10, vitaminA: 1,  vitaminD: 0, calcium: 1 },
  raspberry:    { protein: 7,  iron: 7,  fiber: 27, vitaminA: 1,  vitaminD: 0, calcium: 3 },
  blackberry:   { protein: 7,  iron: 6,  fiber: 21, vitaminA: 3,  vitaminD: 0, calcium: 3 },
  grape:        { protein: 4,  iron: 4,  fiber: 4,  vitaminA: 1,  vitaminD: 0, calcium: 1 },
  watermelon:   { protein: 3,  iron: 2,  fiber: 2,  vitaminA: 7,  vitaminD: 0, calcium: 1 },
  cantaloupe:   { protein: 4,  iron: 2,  fiber: 4,  vitaminA: 42, vitaminD: 0, calcium: 1 },
  pineapple:    { protein: 3,  iron: 3,  fiber: 5,  vitaminA: 0,  vitaminD: 0, calcium: 1 },
  mango:        { protein: 4,  iron: 2,  fiber: 7,  vitaminA: 14, vitaminD: 0, calcium: 1 },
  papaya:       { protein: 3,  iron: 1,  fiber: 8,  vitaminA: 12, vitaminD: 0, calcium: 2 },
  kiwi:         { protein: 6,  iron: 3,  fiber: 12, vitaminA: 2,  vitaminD: 0, calcium: 3 },
  peach:        { protein: 5,  iron: 2,  fiber: 6,  vitaminA: 4,  vitaminD: 0, calcium: 1 },
  orange:       { protein: 5,  iron: 1,  fiber: 10, vitaminA: 3,  vitaminD: 0, calcium: 4 },
  pear:         { protein: 2,  iron: 2,  fiber: 12, vitaminA: 0,  vitaminD: 0, calcium: 1 },
  cherry:       { protein: 5,  iron: 4,  fiber: 8,  vitaminA: 1,  vitaminD: 0, calcium: 2 },
  fig:          { protein: 4,  iron: 4,  fiber: 12, vitaminA: 2,  vitaminD: 0, calcium: 4 },
  avocado:      { protein: 11, iron: 5,  fiber: 27, vitaminA: 2,  vitaminD: 0, calcium: 1 },
  coconut:      { protein: 17, iron: 24, fiber: 36, vitaminA: 0,  vitaminD: 0, calcium: 1 },
  date:         { protein: 9,  iron: 9,  fiber: 27, vitaminA: 0,  vitaminD: 0, calcium: 4 },
  raisin:       { protein: 16, iron: 19, fiber: 15, vitaminA: 0,  vitaminD: 0, calcium: 5 },

  /* Proteins */
  turkey:        { protein: 155, iron: 11, fiber: 0,  vitaminA: 0,  vitaminD: 1,  calcium: 1 },
  beef:          { protein: 145, iron: 26, fiber: 0,  vitaminA: 0,  vitaminD: 1,  calcium: 2 },
  pork:          { protein: 145, iron: 9,  fiber: 0,  vitaminA: 0,  vitaminD: 5,  calcium: 2 },
  bacon:         { protein: 200, iron: 12, fiber: 0,  vitaminA: 1,  vitaminD: 4,  calcium: 1 },
  ham:           { protein: 100, iron: 8,  fiber: 0,  vitaminA: 0,  vitaminD: 5,  calcium: 1 },
  salmon:        { protein: 105, iron: 4,  fiber: 0,  vitaminA: 13, vitaminD: 75, calcium: 1 },
  tuna:          { protein: 130, iron: 10, fiber: 0,  vitaminA: 16, vitaminD: 25, calcium: 1 },
  cod:           { protein: 90,  iron: 4,  fiber: 0,  vitaminA: 4,  vitaminD: 6,  calcium: 2 },
  sardine:       { protein: 130, iron: 28, fiber: 0,  vitaminA: 8,  vitaminD: 33, calcium: 38 },
  shrimp:        { protein: 105, iron: 21, fiber: 0,  vitaminA: 5,  vitaminD: 1,  calcium: 7 },
  "hard-boiled-egg":{ protein: 35, iron: 12, fiber: 0, vitaminA: 16, vitaminD: 90, calcium: 5 },
  tofu:          { protein: 40,  iron: 27, fiber: 5,  vitaminA: 1,  vitaminD: 0,  calcium: 35 },
  tempeh:        { protein: 100, iron: 27, fiber: 0,  vitaminA: 0,  vitaminD: 0,  calcium: 11 },
  lentil:        { protein: 47,  iron: 33, fiber: 32, vitaminA: 0,  vitaminD: 0,  calcium: 2 },
  chickpea:      { protein: 47,  iron: 29, fiber: 30, vitaminA: 0,  vitaminD: 0,  calcium: 5 },
  "black-bean":  { protein: 45,  iron: 21, fiber: 34, vitaminA: 0,  vitaminD: 0,  calcium: 3 },
  "kidney-bean": { protein: 47,  iron: 29, fiber: 31, vitaminA: 0,  vitaminD: 0,  calcium: 4 },
  "white-bean":  { protein: 50,  iron: 36, fiber: 30, vitaminA: 0,  vitaminD: 0,  calcium: 9 },
  almonds:       { protein: 110, iron: 37, fiber: 50, vitaminA: 0,  vitaminD: 0,  calcium: 27 },
  walnuts:       { protein: 80,  iron: 29, fiber: 27, vitaminA: 0,  vitaminD: 0,  calcium: 10 },
  cashews:       { protein: 95,  iron: 60, fiber: 13, vitaminA: 0,  vitaminD: 0,  calcium: 4 },
  peanuts:       { protein: 130, iron: 45, fiber: 33, vitaminA: 0,  vitaminD: 0,  calcium: 9 },
  "peanut-butter":{ protein: 130, iron: 18, fiber: 24, vitaminA: 0,  vitaminD: 0,  calcium: 5 },
  "almond-butter":{ protein: 105, iron: 36, fiber: 41, vitaminA: 0,  vitaminD: 0,  calcium: 35 },
  hummus:        { protein: 40,  iron: 24, fiber: 24, vitaminA: 0,  vitaminD: 0,  calcium: 4 },

  /* Grains */
  rice:           { protein: 14, iron: 2,  fiber: 2,  vitaminA: 0, vitaminD: 0, calcium: 1 },
  "brown-rice":   { protein: 13, iron: 4,  fiber: 7,  vitaminA: 0, vitaminD: 0, calcium: 1 },
  "jasmine-rice": { protein: 14, iron: 2,  fiber: 2,  vitaminA: 0, vitaminD: 0, calcium: 1 },
  "wild-rice":    { protein: 21, iron: 6,  fiber: 7,  vitaminA: 0, vitaminD: 0, calcium: 1 },
  oat:            { protein: 90, iron: 47, fiber: 44, vitaminA: 0, vitaminD: 0, calcium: 5 },
  oatmeal:        { protein: 12, iron: 9,  fiber: 7,  vitaminA: 0, vitaminD: 0, calcium: 1 },
  granola:        { protein: 50, iron: 21, fiber: 28, vitaminA: 0, vitaminD: 0, calcium: 6 },
  quinoa:         { protein: 23, iron: 15, fiber: 11, vitaminA: 0, vitaminD: 0, calcium: 2 },
  bulgur:         { protein: 17, iron: 10, fiber: 28, vitaminA: 0, vitaminD: 0, calcium: 2 },
  pasta:          { protein: 28, iron: 13, fiber: 12, vitaminA: 0, vitaminD: 0, calcium: 1 },
  spaghetti:      { protein: 28, iron: 13, fiber: 12, vitaminA: 0, vitaminD: 0, calcium: 1 },
  bread:          { protein: 24, iron: 24, fiber: 16, vitaminA: 0, vitaminD: 0, calcium: 14 },
  sourdough:      { protein: 24, iron: 24, fiber: 14, vitaminA: 0, vitaminD: 0, calcium: 14 },
  bagel:          { protein: 25, iron: 30, fiber: 9,  vitaminA: 0, vitaminD: 0, calcium: 6 },
  tortilla:       { protein: 18, iron: 25, fiber: 13, vitaminA: 0, vitaminD: 0, calcium: 9 },
  pita:           { protein: 28, iron: 24, fiber: 11, vitaminA: 0, vitaminD: 0, calcium: 9 },

  /* Dairy */
  milk:          { protein: 18, iron: 0, fiber: 0, vitaminA: 12, vitaminD: 8,  calcium: 12 },
  "whole-milk":  { protein: 18, iron: 0, fiber: 0, vitaminA: 12, vitaminD: 8,  calcium: 12 },
  "skim-milk":   { protein: 18, iron: 0, fiber: 0, vitaminA: 5,  vitaminD: 8,  calcium: 13 },
  yogurt:        { protein: 19, iron: 0, fiber: 0, vitaminA: 8,  vitaminD: 0,  calcium: 12 },
  "greek-yogurt":{ protein: 50, iron: 0, fiber: 0, vitaminA: 5,  vitaminD: 0,  calcium: 11 },
  cheddar:       { protein: 130, iron: 1, fiber: 0, vitaminA: 75, vitaminD: 4,  calcium: 72 },
  mozzarella:    { protein: 110, iron: 1, fiber: 0, vitaminA: 45, vitaminD: 1,  calcium: 50 },
  parmesan:      { protein: 195, iron: 2, fiber: 0, vitaminA: 60, vitaminD: 4,  calcium: 120 },
  feta:          { protein: 75,  iron: 4, fiber: 0, vitaminA: 30, vitaminD: 3,  calcium: 50 },
  ricotta:       { protein: 60,  iron: 1, fiber: 0, vitaminA: 30, vitaminD: 0,  calcium: 21 },
  "cottage-cheese":{ protein: 60, iron: 1, fiber: 0, vitaminA: 6,  vitaminD: 0,  calcium: 8 },
  butter:        { protein: 4,   iron: 0, fiber: 0, vitaminA: 165, vitaminD: 10, calcium: 2 },

  /* Snacks */
  popcorn:       { protein: 65, iron: 33, fiber: 60, vitaminA: 4,  vitaminD: 0, calcium: 1 },
  pretzels:      { protein: 60, iron: 32, fiber: 12, vitaminA: 0,  vitaminD: 0, calcium: 3 },
  crackers:      { protein: 50, iron: 22, fiber: 10, vitaminA: 0,  vitaminD: 0, calcium: 5 },
  "rice-cakes":  { protein: 40, iron: 5,  fiber: 5,  vitaminA: 0,  vitaminD: 0, calcium: 1 },
  "cheese-stick":{ protein: 130, iron: 1, fiber: 0,  vitaminA: 35, vitaminD: 1, calcium: 60 },
  applesauce:    { protein: 1,   iron: 1, fiber: 5,  vitaminA: 0,  vitaminD: 0, calcium: 0 },
  jerky:         { protein: 175, iron: 26, fiber: 4, vitaminA: 0,  vitaminD: 1, calcium: 2 },
  "trail-mix":   { protein: 70,  iron: 16, fiber: 25, vitaminA: 0, vitaminD: 0, calcium: 9 },

  /* Drinks */
  water:           { protein: 0,  iron: 0, fiber: 0, vitaminA: 0,  vitaminD: 0,  calcium: 0 },
  "sparkling-water":{ protein: 0, iron: 0, fiber: 0, vitaminA: 0,  vitaminD: 0,  calcium: 0 },
  "orange-juice":  { protein: 4, iron: 1, fiber: 1, vitaminA: 5,  vitaminD: 0, calcium: 1 },
  "apple-juice":   { protein: 1, iron: 2, fiber: 1, vitaminA: 0,  vitaminD: 0, calcium: 1 },
  "chocolate-milk":{ protein: 18, iron: 3, fiber: 1, vitaminA: 13, vitaminD: 8, calcium: 12 },
  "coconut-water": { protein: 4, iron: 3, fiber: 4, vitaminA: 0,  vitaminD: 0, calcium: 6 },
};

const NUTRIENT_ORDER: NutrientName[] = [
  "protein", "iron", "fiber", "vitaminA", "vitaminD", "calcium",
];

const NUTRIENT_LABEL: Record<NutrientName, string> = {
  protein: "Protein",
  iron: "Iron",
  fiber: "Fiber",
  vitaminA: "Vit. A",
  vitaminD: "Vit. D",
  calcium: "Calcium",
};

const NUTRIENT_BOOSTER: Record<NutrientName, string> = {
  protein: "Greek yogurt or hummus",
  iron: "lentils or lean beef",
  fiber: "an apple slice or oats",
  vitaminA: "roasted carrot or sweet potato",
  vitaminD: "fortified milk or salmon",
  calcium: "cheese cubes or yogurt",
};

/* A meal is considered "balanced" if it provides ~1/3 of daily RDA per nutrient.
   Anything above 33% counts as a fully met nutrient for balance scoring. */
const TARGET_PCT_PER_MEAL = 33;

export type NutrientResult = {
  name: string;
  pct: number;                 // 0–100 (capped for display)
  tone: "good" | "med" | "low";
};

export type AnalysisResult = {
  balanceScore: number;        // 0–100
  balanceHeadline: string;
  nutrients: NutrientResult[];
  recommendation: string;
};

type FoodInput = {
  foodKey: string;
  portionGrams: number;
  percentEaten: number;        // 0–100 of the original portion
};

/* Find the nutrient profile for a food. Tries the explicit per-food
   override first, then the per-category default for the food's category,
   then a final empty fallback for completely unknown foodKeys. */
function getProfile(foodKey: string): NutrientProfile {
  const override = FOOD_NUTRIENTS[foodKey];
  if (override) return override;
  const food = FOODS.find((f) => f.id === foodKey);
  if (food) return CATEGORY_DEFAULTS[food.category];
  return EMPTY;
}

export function computeAnalysis(
  foods: FoodInput[],
  mealType: string,
): AnalysisResult {
  const totals: Record<NutrientName, number> = {
    protein: 0, iron: 0, fiber: 0, vitaminA: 0, vitaminD: 0, calcium: 0,
  };

  for (const food of foods) {
    const profile = getProfile(food.foodKey);
    const gramsEaten = food.portionGrams * (food.percentEaten / 100);
    const factor = gramsEaten / 100; // table is per 100g
    for (const n of NUTRIENT_ORDER) {
      totals[n] += profile[n] * factor;
    }
  }

  const nutrients: NutrientResult[] = NUTRIENT_ORDER.map((key) => {
    const raw = totals[key];
    return {
      name: NUTRIENT_LABEL[key],
      pct: Math.min(100, Math.round(raw)),
      tone: raw >= 33 ? "good" : raw >= 15 ? "med" : "low",
    };
  });

  const perNutrientScore = NUTRIENT_ORDER.map((key) =>
    Math.min(100, (totals[key] / TARGET_PCT_PER_MEAL) * 100),
  );
  const balanceScore = Math.round(
    perNutrientScore.reduce((a, b) => a + b, 0) / perNutrientScore.length,
  );

  const ranked = NUTRIENT_ORDER
    .map((key) => ({ key, raw: totals[key] }))
    .sort((a, b) => b.raw - a.raw);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  const balanceHeadline =
    balanceScore >= 85
      ? `Excellent ${mealType} — strong across the board.`
    : balanceScore >= 70
      ? `Solid ${mealType} — strong on ${NUTRIENT_LABEL[top.key]}, light on ${NUTRIENT_LABEL[bottom.key]}.`
    : balanceScore >= 50
      ? `Decent ${mealType}, but could use more ${NUTRIENT_LABEL[bottom.key]}.`
      : `${capitalize(mealType)} was light on key nutrients today.`;

  const recommendation = `Try adding ${NUTRIENT_BOOSTER[bottom.key]} next time — ${NUTRIENT_LABEL[bottom.key]} was the weakest spot at this meal.`;

  return { balanceScore, balanceHeadline, nutrients, recommendation };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
