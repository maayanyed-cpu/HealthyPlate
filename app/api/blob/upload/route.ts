import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db, DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/db";
import { detectFoodsFromBytes } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
const MAX_BYTES = 10 * 1024 * 1024;

function inferMealType(now = new Date()): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = now.getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
}

function foodKeyFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function getCurrentChildId(): Promise<string | null> {
  await ensureDefaultUser();
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return child?.id ?? null;
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log("[snap-route] POST received");
  const form = await request.formData();
  const mode = form.get("mode");
  const file = form.get("file");
  const incomingMealId = form.get("mealId");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (mode !== "before" && mode !== "after") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const filename = (file as File).name || "snap.jpg";
  const mediaType = file.type || "image/jpeg";
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const childId = await getCurrentChildId();
  if (!childId) {
    return NextResponse.json(
      { error: "No child profile yet — finish onboarding first." },
      { status: 400 },
    );
  }

  console.log("[snap-route] uploading to blob, mode:", mode, "size:", file.size);
  /* Try public first (the Vercel Blob default). If the store is configured for
     private-only access, retry with private. Either way we have the bytes
     locally to send to vision, so we don't depend on the URL being reachable
     by Anthropic. */
  let blob;
  try {
    blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: mediaType,
      allowOverwrite: false,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("private store")) throw e;
    console.log("[snap-route] store is private — retrying with access: private");
    blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: mediaType,
      allowOverwrite: false,
    } as Parameters<typeof put>[2]);
  }
  console.log("[snap-route] blob uploaded, url:", blob.url);

  if (mode === "before") {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const detected = await detectFoodsFromBytes(bytes, mediaType);
    console.log("[snap-route] vision returned", detected.length, "foods");

    const meal = await db.meal.create({
      data: {
        childId,
        mealType: inferMealType(),
        status: "pending",
        beforePhotoUrl: blob.url,
        detected: {
          create: detected.map((d) => ({
            foodKey: foodKeyFromName(d.name) || "unknown",
            name: d.name,
            emoji: d.emoji,
            portionGrams: Math.max(0, Math.round(d.portionGrams)),
            confidence: 90,
            phase: "before",
          })),
        },
      },
      select: { id: true },
    });
    console.log("[snap-route] meal created:", meal.id);
    /* Return the detected foods (with box coordinates) so the snap page
       can render the AR overlay before navigating to confirm. Boxes
       aren't persisted — the confirm page reads from DB without them. */
    return NextResponse.json({ mealId: meal.id, foods: detected });
  }

  /* mode === "after" */
  if (typeof incomingMealId !== "string") {
    return NextResponse.json(
      { error: "Missing mealId for after-shot" },
      { status: 400 },
    );
  }
  const before = await db.detectedFood.findMany({
    where: { mealId: incomingMealId, phase: "before" },
  });
  await db.meal.update({
    where: { id: incomingMealId },
    data: {
      status: "complete",
      afterPhotoUrl: blob.url,
      detected: {
        create: before.map((d) => ({
          foodKey: d.foodKey,
          name: d.name,
          emoji: d.emoji,
          portionGrams: d.portionGrams,
          confidence: d.confidence,
          phase: "after",
          percentEaten: 50,
        })),
      },
    },
  });
  console.log("[snap-route] after-shot saved for meal:", incomingMealId);
  return NextResponse.json({ mealId: incomingMealId });
}
