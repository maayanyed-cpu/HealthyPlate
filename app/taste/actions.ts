"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID } from "@/lib/db";

const VALID_RATINGS = new Set([
  "love", "ok", "maybe", "not-really", "hard-no", "not-sure",
]);

export type RatingInput = { foodId: string; rating: string };

export async function saveTasteRatings(ratings: RatingInput[]): Promise<void> {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!child) throw new Error("No child profile yet — start onboarding from step 1.");

  const cleaned = ratings.filter((r) => VALID_RATINGS.has(r.rating) && r.foodId);

  // Upsert each rating; child+food is unique
  await Promise.all(
    cleaned.map((r) =>
      db.tasteRating.upsert({
        where: { childId_foodId: { childId: child.id, foodId: r.foodId } },
        create: { childId: child.id, foodId: r.foodId, rating: r.rating },
        update: { rating: r.rating, ratedAt: new Date() },
      }),
    ),
  );

  revalidatePath("/home");
}
