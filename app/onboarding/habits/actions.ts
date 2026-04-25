"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID } from "@/lib/db";

export async function updateChildHabits(habits: string[]): Promise<void> {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!child) throw new Error("No child profile yet — start onboarding from step 1.");

  await db.child.update({
    where: { id: child.id },
    data: { habits },
  });

  revalidatePath("/home");
}
