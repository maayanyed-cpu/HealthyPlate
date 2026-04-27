"use server";

import { revalidatePath } from "next/cache";
import { db, ensureFoodsSeeded } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";
import { FOODS } from "@/lib/mockData";
import { matchFoodPrefs } from "@/lib/matchFoodPrefs";

export type FoodPreferences = {
  foodLikes: string;
  foodDislikes: string;
  foodMaybes: string;
};

export async function updateChildHabits(
  habits: string[],
  prefs?: FoodPreferences,
): Promise<void> {
  const childId = await getCurrentChildId();
  if (!childId) throw new Error("No child profile yet — start onboarding from step 1.");
  const child = { id: childId };

  /* Trim and normalize empty strings to null so we don't litter the DB
     with whitespace-only placeholders. */
  const trimmed = (s: string | undefined): string | null => {
    const v = (s ?? "").trim();
    return v.length === 0 ? null : v;
  };

  await db.child.update({
    where: { id: child.id },
    data: {
      habits,
      foodLikes: trimmed(prefs?.foodLikes),
      foodDislikes: trimmed(prefs?.foodDislikes),
      foodMaybes: trimmed(prefs?.foodMaybes),
    },
  });

  /* Auto-derive taste ratings from the free-text fields.
     - LIKES → "love" rating
     - DISLIKES → "hard-no" rating
     - MAYBES → "maybe" rating
     skipDuplicates relies on the @@unique([childId, foodId]) constraint
     to preserve any rating the parent has already set (manually or via
     a prior habits submission). */
  if (prefs) {
    const matches = await matchFoodPrefs(prefs, FOODS);
    const total = matches.likes.length + matches.dislikes.length + matches.maybes.length;
    if (total > 0) {
      await ensureFoodsSeeded();
      const data = [
        ...matches.likes.map((foodId) => ({ childId: child.id, foodId, rating: "love" })),
        ...matches.dislikes.map((foodId) => ({ childId: child.id, foodId, rating: "hard-no" })),
        ...matches.maybes.map((foodId) => ({ childId: child.id, foodId, rating: "maybe" })),
      ];
      await db.tasteRating.createMany({ data, skipDuplicates: true });
    }
  }

  revalidatePath("/home");
}
