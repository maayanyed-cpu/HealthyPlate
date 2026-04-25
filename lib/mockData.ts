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
