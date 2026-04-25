"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/db";
import { SNAP_DETECTION } from "@/lib/mockData";

function inferMealType(now = new Date()): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = now.getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
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

/* Creates a pending Meal and saves the (mock) detected foods as before-phase rows.
   Returns the new mealId so the caller can navigate forward with it.
   The photoUrl is the just-uploaded Vercel Blob URL, or null if the user
   skipped the file picker (legacy SVG-only mode). */
export async function saveBeforeSnap(photoUrl: string | null): Promise<{ mealId: string }> {
  const childId = await getCurrentChildId();
  if (!childId) throw new Error("No child profile yet — finish onboarding first.");

  const meal = await db.meal.create({
    data: {
      childId,
      mealType: inferMealType(),
      status: "pending",
      beforePhotoUrl: photoUrl,
      detected: {
        create: SNAP_DETECTION.map((d) => ({
          foodKey: d.foodId,
          name: d.name,
          emoji: d.emoji,
          portionGrams: d.portionGrams,
          confidence: d.confidence,
          phase: "before",
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/home");
  return { mealId: meal.id };
}

/* Adds after-phase rows with percentEaten and flips the meal to complete. */
export async function saveAfterSnap(
  mealId: string,
  photoUrl: string | null,
): Promise<void> {
  await db.meal.update({
    where: { id: mealId },
    data: {
      status: "complete",
      afterPhotoUrl: photoUrl ?? undefined,
      detected: {
        create: SNAP_DETECTION.map((d) => ({
          foodKey: d.foodId,
          name: d.name,
          emoji: d.emoji,
          portionGrams: d.portionGrams,
          confidence: d.confidence,
          phase: "after",
          percentEaten: d.percentEaten,
        })),
      },
    },
  });
  revalidatePath("/home");
}
