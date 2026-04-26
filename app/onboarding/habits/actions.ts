"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID } from "@/lib/db";

export type FoodPreferences = {
  foodLikes: string;
  foodDislikes: string;
  foodMaybes: string;
};

export async function updateChildHabits(
  habits: string[],
  prefs?: FoodPreferences,
): Promise<void> {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!child) throw new Error("No child profile yet — start onboarding from step 1.");

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

  revalidatePath("/home");
}
