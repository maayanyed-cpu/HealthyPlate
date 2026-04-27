"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";

const VALID_RATINGS = new Set([
  "love", "ok", "maybe", "not-really", "hard-no", "not-sure",
]);

export type RatingInput = { foodId: string; rating: string };

export async function saveTasteRatings(ratings: RatingInput[]): Promise<void> {
  const childId = await getCurrentChildId();
  if (!childId) throw new Error("No child profile yet — start onboarding from step 1.");

  const cleaned = ratings.filter((r) => VALID_RATINGS.has(r.rating) && r.foodId);

  // Upsert each rating; child+food is unique
  await Promise.all(
    cleaned.map((r) =>
      db.tasteRating.upsert({
        where: { childId_foodId: { childId, foodId: r.foodId } },
        create: { childId, foodId: r.foodId, rating: r.rating },
        update: { rating: r.rating, ratedAt: new Date() },
      }),
    ),
  );

  revalidatePath("/home");
}
