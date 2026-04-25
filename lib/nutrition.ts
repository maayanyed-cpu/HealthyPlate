/* Per-food nutrient lookup + balance/recommendation computation.

   The table below is illustrative — values approximate the % of a 4–8 year
   old's daily RDA delivered by 100g of each food. Replace with real USDA
   FoodData Central numbers when we leave v0. */

type NutrientName = "protein" | "iron" | "fiber" | "vitaminA" | "vitaminD" | "calcium";

type NutrientProfile = Record<NutrientName, number>;

const FOOD_NUTRIENTS: Record<string, NutrientProfile> = {
  carrot:         { protein: 5,   iron: 3,  fiber: 11, vitaminA: 200, vitaminD: 0,  calcium: 3 },
  broccoli:       { protein: 14,  iron: 7,  fiber: 10, vitaminA: 30,  vitaminD: 0,  calcium: 5 },
  couscous:       { protein: 18,  iron: 4,  fiber: 4,  vitaminA: 0,   vitaminD: 0,  calcium: 1 },
  cucumber:       { protein: 3,   iron: 2,  fiber: 2,  vitaminA: 1,   vitaminD: 0,  calcium: 2 },
  "sweet-potato": { protein: 8,   iron: 5,  fiber: 12, vitaminA: 280, vitaminD: 0,  calcium: 3 },
  spinach:        { protein: 12,  iron: 27, fiber: 9,  vitaminA: 120, vitaminD: 0,  calcium: 10 },
  strawberry:     { protein: 3,   iron: 4,  fiber: 8,  vitaminA: 0,   vitaminD: 0,  calcium: 2 },
  banana:         { protein: 5,   iron: 2,  fiber: 10, vitaminA: 0,   vitaminD: 0,  calcium: 1 },
  apple:          { protein: 2,   iron: 1,  fiber: 9,  vitaminA: 0,   vitaminD: 0,  calcium: 1 },
  egg:            { protein: 35,  iron: 12, fiber: 0,  vitaminA: 16,  vitaminD: 90, calcium: 5 },
  chicken:        { protein: 130, iron: 5,  fiber: 0,  vitaminA: 0,   vitaminD: 1,  calcium: 1 },
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

export function computeAnalysis(
  foods: FoodInput[],
  mealType: string,
): AnalysisResult {
  const totals: Record<NutrientName, number> = {
    protein: 0, iron: 0, fiber: 0, vitaminA: 0, vitaminD: 0, calcium: 0,
  };

  for (const food of foods) {
    const profile = FOOD_NUTRIENTS[food.foodKey];
    if (!profile) continue;
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
