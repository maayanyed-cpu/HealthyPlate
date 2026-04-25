export type FoodCategory = "vegetable" | "fruit" | "protein";

export type Food = {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
};

export const FOODS: Food[] = [
  { id: "carrot", name: "Carrot", emoji: "🥕", category: "vegetable" },
  { id: "broccoli", name: "Broccoli", emoji: "🥦", category: "vegetable" },
  { id: "cucumber", name: "Cucumber", emoji: "🥒", category: "vegetable" },
  { id: "sweet-potato", name: "Sweet potato", emoji: "🍠", category: "vegetable" },
  { id: "spinach", name: "Spinach", emoji: "🥬", category: "vegetable" },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", category: "fruit" },
  { id: "banana", name: "Banana", emoji: "🍌", category: "fruit" },
  { id: "apple", name: "Apple", emoji: "🍎", category: "fruit" },
  { id: "egg", name: "Scrambled egg", emoji: "🥚", category: "protein" },
  { id: "chicken", name: "Roast chicken", emoji: "🍗", category: "protein" },
];

/* The single hardcoded "lunch" we surface throughout the snap → confirm → analysis flow.
   Real vision API stub for v0 — same plate every time. */
export type DetectedFood = {
  foodId: string;
  name: string;
  emoji: string;
  portionLabel: string;
  portionGrams: number;
  confidence: number;
  /* % consumed when the after-shot is taken. Drives the analysis screen. */
  percentEaten: number;
  box: { top: string; left: string; width: string; height: string };
};

export const SNAP_DETECTION: DetectedFood[] = [
  {
    foodId: "carrot",
    name: "Roasted carrot",
    emoji: "🥕",
    portionLabel: "≈ ⅓ cup · ~45 g",
    portionGrams: 45,
    confidence: 92,
    percentEaten: 70,
    box: { top: "38%", left: "22%", width: "30%", height: "14%" },
  },
  {
    foodId: "broccoli",
    name: "Steamed broccoli",
    emoji: "🥦",
    portionLabel: "≈ ¼ cup · ~30 g",
    portionGrams: 30,
    confidence: 96,
    percentEaten: 25,
    box: { top: "36%", left: "55%", width: "22%", height: "14%" },
  },
  {
    foodId: "couscous",
    name: "Couscous",
    emoji: "🌾",
    portionLabel: "≈ ½ cup · ~80 g",
    portionGrams: 80,
    confidence: 88,
    percentEaten: 90,
    box: { top: "58%", left: "38%", width: "32%", height: "18%" },
  },
];

export const TODAYS_PLAN = [
  {
    time: "Breakfast · 8:00",
    name: "Banana oats with hidden spinach",
    emoji: "🥣",
    bg: "#F4E5C7",
    tags: [
      { label: "Iron+", tone: "sage" as const },
      { label: "Familiar", tone: "warm" as const },
    ],
    status: "done" as const,
  },
  {
    time: "Lunch · 12:30",
    name: "Roasted carrot ribbons + couscous",
    emoji: "🥗",
    bg: "#DCE8DD",
    tags: [
      { label: "Try new", tone: "sage" as const },
      { label: "Vit. A", tone: "berry" as const },
    ],
    status: "partial" as const,
  },
  {
    time: "Dinner · 18:00",
    name: "Tomato pasta with lentil sauce",
    emoji: "🍝",
    bg: "#F0DEE3",
    tags: [
      { label: "Iron+", tone: "sage" as const },
      { label: "Loved", tone: "warm" as const },
    ],
    status: "pending" as const,
  },
];

export const NUTRIENT_BREAKDOWN = [
  { name: "Protein", pct: 65, tone: "good" as const },
  { name: "Iron", pct: 42, tone: "med" as const },
  { name: "Fiber", pct: 88, tone: "good" as const },
  { name: "Vit. A", pct: 95, tone: "good" as const },
  { name: "Vit. D", pct: 28, tone: "low" as const },
  { name: "Calcium", pct: 55, tone: "med" as const },
];

export const BALANCE_SCORE = 78;
export const BALANCE_HEADLINE =
  "Solid lunch — strong on Vit. A and fiber, light on Vit. D.";
export const RECOMMENDATION =
  "Try adding cucumber slices at dinner — Maya rated it ❤️ and it pairs with the tomato pasta.";

export type ChildProfile = {
  name: string;
  age: number;
  gender: "girl" | "boy" | "unspecified";
};

export const DEFAULT_CHILD: ChildProfile = {
  name: "Maya",
  age: 4,
  gender: "girl",
};
