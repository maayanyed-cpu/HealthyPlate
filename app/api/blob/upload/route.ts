import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db, ensureDefaultUser } from "@/lib/db";
import { detectFoodsFromBytes, detectPercentEatenFromBytes } from "@/lib/vision";
import { getCurrentChildId } from "@/lib/getCurrentChild";

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

async function resolveChildId(): Promise<string | null> {
  await ensureDefaultUser();
  return getCurrentChildId();
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

  const childId = await resolveChildId();
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
  const [before, mealRow] = await Promise.all([
    db.detectedFood.findMany({
      where: { mealId: incomingMealId, phase: "before" },
    }),
    db.meal.findUnique({
      where: { id: incomingMealId },
      select: { beforePhotoUrl: true },
    }),
  ]);

  /* Run a second vision pass to estimate per-food consumption.
     If anything goes wrong (no before-photo, network blip, model
     error), we silently fall back to 50% so the analysis page still
     works. The map keys on lowercased food name. */
  const consumptionByName = new Map<string, number>();
  if (before.length > 0 && mealRow?.beforePhotoUrl) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const afterBytes = Buffer.from(arrayBuffer);

      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const upstream = await fetch(mealRow.beforePhotoUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!upstream.ok) {
        throw new Error(`before-photo fetch ${upstream.status}`);
      }
      const beforeBytes = Buffer.from(await upstream.arrayBuffer());
      const beforeContentType =
        upstream.headers.get("content-type") ?? "image/jpeg";

      const estimates = await detectPercentEatenFromBytes(
        beforeBytes,
        afterBytes,
        beforeContentType,
        mediaType,
        before.map((d) => ({ name: d.name })),
      );
      for (const e of estimates) {
        consumptionByName.set(e.name.toLowerCase(), e.percentEaten);
      }
    } catch (e) {
      console.error(
        "[snap-route] consumption vision failed, falling back to 50%:",
        e instanceof Error ? e.message : e,
      );
    }
  }

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
          percentEaten:
            consumptionByName.get(d.name.toLowerCase()) ?? 50,
        })),
      },
    },
  });
  console.log("[snap-route] after-shot saved for meal:", incomingMealId);
  return NextResponse.json({ mealId: incomingMealId });
}
