"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID } from "@/lib/db";

export type UpdateDietInput = {
  allergies: string[];
  intolerances: string[];
  dietStyle: string;
  notes: string;
};

export async function updateChildDiet(input: UpdateDietInput): Promise<void> {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!child) throw new Error("No child profile yet — start onboarding from step 1.");

  await db.child.update({
    where: { id: child.id },
    data: {
      allergies: input.allergies,
      intolerances: input.intolerances,
      dietStyle: input.dietStyle || null,
      notes: input.notes.trim() || null,
    },
  });

  revalidatePath("/home");
}
