import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Food } from "./mockData";

const client = new Anthropic();

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

const PROMPT_INTRO =
  "A parent has filled three textareas about their child's food preferences. Map their wording to specific food IDs from the catalog below. Handle synonyms and group phrases generously: \"berries\" → strawberry/blueberry/raspberry/blackberry; \"anything green\" → leafy greens + green vegetables; \"no fish\" → all seafood proteins (salmon/tuna/cod/sardine/anchovy/etc); \"any cheese\" → every dairy cheese in the catalog. Return ONLY food IDs that exist in the catalog — do not invent IDs. If a food appears across multiple text fields by accident, prefer dislikes > likes > maybes (the parent's negative signals are most actionable).";

const FOOD_PREFS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["likes", "dislikes", "maybes"],
  properties: {
    likes: {
      type: "array",
      items: { type: "string" },
      description: "Food IDs the child likes / loves.",
    },
    dislikes: {
      type: "array",
      items: { type: "string" },
      description: "Food IDs the child dislikes / refuses.",
    },
    maybes: {
      type: "array",
      items: { type: "string" },
      description: "Food IDs the child might eat with the right conditions.",
    },
  },
} as const;

function buildCatalogBlock(foods: Food[]): string {
  const grouped: Record<string, Array<{ id: string; name: string }>> = {};
  for (const f of foods) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push({ id: f.id, name: f.name });
  }
  return Object.entries(grouped)
    .map(
      ([cat, items]) =>
        `${cat}:\n${items.map((i) => `  ${i.id}\t${i.name}`).join("\n")}`,
    )
    .join("\n\n");
}

function dedupeAcrossBuckets(
  raw: Partial<MatchedFoods>,
  validIds: Set<string>,
): MatchedFoods {
  const filterValid = (arr: string[] | undefined): string[] =>
    (arr ?? []).filter((id) => validIds.has(id));
  const dislikes = filterValid(raw.dislikes);
  const taken = new Set<string>(dislikes);
  const likes = filterValid(raw.likes).filter((id) => !taken.has(id));
  for (const id of likes) taken.add(id);
  const maybes = filterValid(raw.maybes).filter((id) => !taken.has(id));
  return { likes, dislikes, maybes };
}

/* PUBLIC: best-effort LLM extraction with a regex fallback. The action
   layer awaits this once per habits-form submission. */
export async function matchFoodPrefs(
  prefs: FoodPrefs,
  foods: Food[],
): Promise<MatchedFoods> {
  const hasAnyText =
    prefs.foodLikes.trim() ||
    prefs.foodDislikes.trim() ||
    prefs.foodMaybes.trim();
  if (!hasAnyText) return { likes: [], dislikes: [], maybes: [] };

  try {
    const userMessage =
      `${PROMPT_INTRO}\n\n` +
      `PARENT'S TEXT\n` +
      `LIKES: ${prefs.foodLikes.trim() || "(blank)"}\n` +
      `DISLIKES: ${prefs.foodDislikes.trim() || "(blank)"}\n` +
      `MAYBES: ${prefs.foodMaybes.trim() || "(blank)"}\n\n` +
      `FOOD CATALOG (id and human name, grouped by category)\n` +
      buildCatalogBlock(foods);

    /* Haiku 4.5 — extraction task; ~5-10x cheaper and faster than
       Opus for this shape of work. Structured outputs constrain the
       reply to the schema we need. */
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: userMessage }],
      output_config: {
        format: { type: "json_schema", schema: FOOD_PREFS_SCHEMA },
      },
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) throw new Error("No text block in response");

    const parsed = JSON.parse(textBlock.text) as Partial<MatchedFoods>;
    const validIds = new Set(foods.map((f) => f.id));
    const matched = dedupeAcrossBuckets(parsed, validIds);
    console.log(
      "[matchFoodPrefs/llm] matched",
      `likes=${matched.likes.length}`,
      `dislikes=${matched.dislikes.length}`,
      `maybes=${matched.maybes.length}`,
    );
    return matched;
  } catch (e) {
    console.error(
      "[matchFoodPrefs/llm] failed, falling back to regex matcher:",
      e instanceof Error ? e.message : e,
    );
    return matchFoodPrefsViaRegex(prefs, foods);
  }
}

/* ------------------------------------------------------------------
   Regex fallback. Kept as a deterministic safety net in case the
   Anthropic call fails (network, rate limit, model error). Also
   exported so it can be used in tests or offline contexts.
   ------------------------------------------------------------------ */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Generate plural/singular variants of a food name for fuzzy matching. */
function variantsFor(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const last = words[words.length - 1];
  const otherWords = words.slice(0, -1).join(" ");
  const join = (last: string) => (otherWords ? `${otherWords} ${last}` : last);

  const variants = new Set<string>([lower]);

  let stem = last;
  if (last.endsWith("ies") && last.length > 4) stem = last.slice(0, -3) + "y";
  else if (last.endsWith("oes") && last.length > 3) stem = last.slice(0, -2);
  else if (last.endsWith("ves") && last.length > 3) stem = last.slice(0, -3) + "f";
  else if (last.endsWith("s") && last.length > 1 && !last.endsWith("ss")) stem = last.slice(0, -1);

  let plural: string;
  if (stem.endsWith("y") && stem.length > 1 && !/[aeiou]y$/.test(stem)) {
    plural = stem.slice(0, -1) + "ies";
  } else if (/[sxz]$|[cs]h$/.test(stem)) {
    plural = stem + "es";
  } else if (stem.endsWith("o") && stem.length > 1 && !/[aeiou]o$/.test(stem)) {
    plural = stem + "es";
  } else {
    plural = stem + "s";
  }

  variants.add(join(stem));
  variants.add(join(plural));
  return Array.from(variants);
}

function matchesFoodInText(food: Food, text: string): boolean {
  for (const variant of variantsFor(food.name)) {
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

export function matchFoodPrefsViaRegex(
  prefs: FoodPrefs,
  foods: Food[],
): MatchedFoods {
  const validIds = new Set(foods.map((f) => f.id));
  return dedupeAcrossBuckets(
    {
      likes: matchFoodsInText(prefs.foodLikes, foods),
      dislikes: matchFoodsInText(prefs.foodDislikes, foods),
      maybes: matchFoodsInText(prefs.foodMaybes, foods),
    },
    validIds,
  );
}
