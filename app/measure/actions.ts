"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";

function validHeight(v: number): boolean {
  return Number.isFinite(v) && v >= 30 && v <= 220;
}
function validWeight(v: number): boolean {
  return Number.isFinite(v) && v >= 2 && v <= 200;
}

export async function updateMeasurements(input: {
  heightCm: number;
  weightKg: number;
}): Promise<void> {
  const childId = await getCurrentChildId();
  if (!childId) throw new Error("No child profile yet — start onboarding first.");

  if (!validHeight(input.heightCm)) {
    throw new Error("Height must be between 30 and 220 cm.");
  }
  if (!validWeight(input.weightKg)) {
    throw new Error("Weight must be between 2 and 200 kg.");
  }

  await db.child.update({
    where: { id: childId },
    data: {
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      lastMeasuredAt: new Date(),
    },
  });

  revalidatePath("/home");
}
