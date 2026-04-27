import type { Food } from "./mockData";

export type FoodPrefs = {
  foodLikes: string;
  foodDislikes: string;
  foodMaybes: string;
};

export type MatchedFoods = {
  likes: string[];
  dislikes: string[];
  maybes: string[];
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Generate plural/singular variants of a food name for fuzzy matching.
   Operates on the LAST word of multi-word names ("sweet potato" →
   "sweet potatoes"). Doesn't handle every irregular plural — we accept
   misses on rare cases like "tomato" → "tomatoes" (handled below) in
   exchange for staying simple. */
function variantsFor(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const last = words[words.length - 1];
  const otherWords = words.slice(0, -1).join(" ");
  const join = (last: string) => (otherWords ? `${otherWords} ${last}` : last);

  const variants = new Set<string>([lower]);

  /* Stem: try to derive the singular form */
  let stem = last;
  if (last.endsWith("ies") && last.length > 4) stem = last.slice(0, -3) + "y";
  else if (last.endsWith("oes") && last.length > 3) stem = last.slice(0, -2);
  else if (last.endsWith("ves") && last.length > 3) stem = last.slice(0, -3) + "f";
  else if (last.endsWith("s") && last.length > 1 && !last.endsWith("ss")) stem = last.slice(0, -1);

  /* Plural: try to derive the plural form */
  let plural: string;
  if (stem.endsWith("y") && stem.length > 1 && !/[aeiou]y$/.test(stem)) {
    plural = stem.slice(0, -1) + "ies";
  } else if (/[sxz]$|[cs]h$/.test(stem)) {
    plural = stem + "es";
  } else if (stem.endsWith("o") && stem.length > 1 && !/[aeiou]o$/.test(stem)) {
    plural = stem + "es"; // tomato → tomatoes, potato → potatoes
  } else {
    plural = stem + "s";
  }

  variants.add(join(stem));
  variants.add(join(plural));
  return Array.from(variants);
}

function matchesFoodInText(food: Food, text: string): boolean {
  for (const variant of variantsFor(food.name)) {
    /* Skip very short variants to dampen false positives; require at least
       3 chars on the last word so words like "a" or "is" can't match. */
    const lastWord = variant.split(/\s+/).slice(-1)[0];
    if (lastWord.length < 3) continue;
    const re = new RegExp(`\\b${escapeRegex(variant)}\\b`, "i");
    if (re.test(text)) return true;
  }
  return false;
}

function matchFoodsInText(text: string, foods: Food[]): string[] {
  if (!text.trim()) return [];
  const ids: string[] = [];
  for (const food of foods) {
    if (matchesFoodInText(food, text)) ids.push(food.id);
  }
  return ids;
}

/* Map free-text food preferences to food IDs from the catalog. A food can
   appear in multiple text fields by accident; we resolve in priority
   order: dislikes > likes > maybes. Negative signals are the most
   actionable and shouldn't be diluted by an accidental positive match. */
export function matchFoodPrefs(
  prefs: FoodPrefs,
  foods: Food[],
): MatchedFoods {
  const likesAll = matchFoodsInText(prefs.foodLikes, foods);
  const dislikesAll = matchFoodsInText(prefs.foodDislikes, foods);
  const maybesAll = matchFoodsInText(prefs.foodMaybes, foods);

  const taken = new Set<string>(dislikesAll);
  const dislikes = dislikesAll;
  const likes = likesAll.filter((id) => !taken.has(id));
  for (const id of likes) taken.add(id);
  const maybes = maybesAll.filter((id) => !taken.has(id));

  return { likes, dislikes, maybes };
}
