import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type FoodBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FoodCategory =
  | "vegetable"
  | "fruit"
  | "protein"
  | "grain"
  | "dairy"
  | "other";

export type AiDetectedFood = {
  name: string;
  emoji: string;
  portionGrams: number;
  category: FoodCategory;
  box: FoodBox;
};

const FOOD_LIST_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["foods"],
  properties: {
    foods: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "emoji", "portionGrams", "category", "box"],
        properties: {
          name: {
            type: "string",
            description:
              "Short, parent-friendly name for the food (e.g. 'Roasted carrot', 'Steamed broccoli', 'Lettuce').",
          },
          emoji: {
            type: "string",
            description: "A single emoji character that visually represents this food.",
          },
          portionGrams: {
            type: "number",
            description: "Estimated portion size in grams (whole number).",
          },
          category: {
            type: "string",
            enum: ["vegetable", "fruit", "protein", "grain", "dairy", "other"],
            description:
              "High-level food category. 'vegetable' for veggies (carrot, broccoli, lettuce, pumpkin, sweet potato, tomato, etc.); 'fruit' for fruits (apple, banana, berry); 'protein' for meat, fish, eggs, beans, tofu; 'grain' for rice, pasta, bread, couscous; 'dairy' for cheese, yogurt, milk; 'other' for anything else.",
          },
          box: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y", "width", "height"],
            description:
              "Bounding box around this food in the image, as percentages of image size (0-100).",
            properties: {
              x: { type: "number", description: "Left edge as % of image width (0-100)." },
              y: { type: "number", description: "Top edge as % of image height (0-100)." },
              width: { type: "number", description: "Box width as % of image width (0-100)." },
              height: { type: "number", description: "Box height as % of image height (0-100)." },
            },
          },
        },
      },
    },
  },
} as const;

const PROMPT =
  "Identify the foods in this image. For each food, give me the name, a representative emoji, an estimated portion size in grams, a category (one of 'vegetable', 'fruit', 'protein', 'grain', 'dairy', 'other'), and a bounding box around it. The bounding box should be expressed as percentages of the image size (x and y are the top-left corner, both 0-100; width and height are also 0-100). Return the results in a clean list.";

type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function normalizeMediaType(mediaType: string): SupportedMediaType {
  if (mediaType === "image/png") return "image/png";
  if (mediaType === "image/webp") return "image/webp";
  if (mediaType === "image/gif") return "image/gif";
  return "image/jpeg";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeBox(box: FoodBox): FoodBox {
  const x = clamp(box.x, 0, 100);
  const y = clamp(box.y, 0, 100);
  const width = clamp(box.width, 0, 100 - x);
  const height = clamp(box.height, 0, 100 - y);
  return { x, y, width, height };
}

export async function detectFoodsFromBytes(
  bytes: Buffer,
  mediaType: string,
): Promise<AiDetectedFood[]> {
  const safeType = normalizeMediaType(mediaType);
  const base64 = bytes.toString("base64");
  console.log(
    "[vision] calling Anthropic, mediaType:",
    safeType,
    "bytes:",
    bytes.byteLength,
  );

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: safeType, data: base64 },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: FOOD_LIST_SCHEMA },
    },
  });
  console.log(
    "[vision] response stop_reason:",
    response.stop_reason,
    "blocks:",
    response.content.map((b) => b.type),
  );

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    console.log(
      "[vision] no text block in response:",
      JSON.stringify(response.content),
    );
    throw new Error("Vision API returned no text block");
  }
  console.log("[vision] text block:", textBlock.text);

  const parsed = JSON.parse(textBlock.text) as { foods: AiDetectedFood[] };
  const foods = parsed.foods.map((f) => ({ ...f, box: sanitizeBox(f.box) }));
  console.log(
    "[vision] parsed foods:",
    foods.length,
    foods.map((f) => f.name),
  );
  return foods;
}

/* ------------------------------------------------------------------
   After-shot consumption estimator. Takes BEFORE + AFTER photos plus
   the list of foods we identified in the before-shot, returns a
   per-food percent-eaten estimate (0 = untouched, 100 = all gone).
   ------------------------------------------------------------------ */

export type ConsumptionEstimate = {
  name: string;
  percentEaten: number;
};

const CONSUMPTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["consumption"],
  properties: {
    consumption: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "percentEaten"],
        properties: {
          name: {
            type: "string",
            description:
              "Name of the food. MUST exactly match one of the names from the input list.",
          },
          percentEaten: {
            type: "number",
            description:
              "Percentage of that food that was consumed: 0 means untouched, 100 means completely gone, 50 means roughly half eaten. Whole numbers preferred.",
          },
        },
      },
    },
  },
} as const;

const CONSUMPTION_PROMPT_HEADER =
  "Compare the BEFORE and AFTER photos of a child's meal. For each food in the list below, estimate what percentage was eaten — 0 means untouched, 100 means completely gone, 50 means roughly half. Be honest: kids often refuse one food entirely while finishing another. Some foods may not be visible in the after-photo because they were eaten or because the angle changed; if a food is plausibly gone, score it high. Return exactly one estimate per food in the list.";

export async function detectPercentEatenFromBytes(
  beforeBytes: Buffer,
  afterBytes: Buffer,
  beforeMediaType: string,
  afterMediaType: string,
  knownFoods: Array<{ name: string }>,
): Promise<ConsumptionEstimate[]> {
  if (knownFoods.length === 0) return [];

  const beforeBase64 = beforeBytes.toString("base64");
  const afterBase64 = afterBytes.toString("base64");
  const safeBefore = normalizeMediaType(beforeMediaType);
  const safeAfter = normalizeMediaType(afterMediaType);

  console.log(
    "[vision/consumption] calling Anthropic, foods:",
    knownFoods.length,
    "beforeBytes:",
    beforeBytes.byteLength,
    "afterBytes:",
    afterBytes.byteLength,
  );

  const foodList = knownFoods.map((f) => `- ${f.name}`).join("\n");
  const userText =
    `${CONSUMPTION_PROMPT_HEADER}\n\nFoods on the plate (use these exact names in your response):\n${foodList}`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "BEFORE photo:" },
          { type: "image", source: { type: "base64", media_type: safeBefore, data: beforeBase64 } },
          { type: "text", text: "AFTER photo:" },
          { type: "image", source: { type: "base64", media_type: safeAfter, data: afterBase64 } },
          { type: "text", text: userText },
        ],
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: CONSUMPTION_SCHEMA },
    },
  });
  console.log(
    "[vision/consumption] response stop_reason:",
    response.stop_reason,
    "blocks:",
    response.content.map((b) => b.type),
  );

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("Vision API returned no text block");
  }

  const parsed = JSON.parse(textBlock.text) as {
    consumption: ConsumptionEstimate[];
  };
  const cleaned = parsed.consumption.map((c) => ({
    name: c.name,
    percentEaten: Math.max(0, Math.min(100, Math.round(c.percentEaten))),
  }));
  console.log(
    "[vision/consumption] estimates:",
    cleaned.map((c) => `${c.name}=${c.percentEaten}%`).join(" "),
  );
  return cleaned;
}
