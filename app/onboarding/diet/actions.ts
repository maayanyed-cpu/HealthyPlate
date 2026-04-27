"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";

export type UpdateDietInput = {
  allergies: string[];
  intolerances: string[];
  dietStyle: string;
  notes: string;
};

export async function updateChildDiet(input: UpdateDietInput): Promise<void> {
  const childId = await getCurrentChildId();
  if (!childId) throw new Error("No child profile yet — start onboarding from step 1.");

  await db.child.update({
    where: { id: childId },
    data: {
      allergies: input.allergies,
      intolerances: input.intolerances,
      dietStyle: input.dietStyle || null,
      notes: input.notes.trim() || null,
    },
  });

  revalidatePath("/home");
}
