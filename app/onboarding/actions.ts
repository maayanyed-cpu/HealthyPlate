"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/db";
import { ACTIVE_CHILD_COOKIE } from "@/lib/getCurrentChild";

const VALID_GENDERS = new Set(["girl", "boy", "unspecified"]);

export type CreateChildInput = {
  name: string;
  age: number;
  gender: "girl" | "boy" | "unspecified";
  heightCm?: number | null;
  weightKg?: number | null;
};

function validHeight(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 30 && v <= 220;
}
function validWeight(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 2 && v <= 200;
}

export async function createChild(input: CreateChildInput): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!Number.isInteger(input.age) || input.age < 1 || input.age > 18) {
    throw new Error("Age must be between 1 and 18");
  }
  if (!VALID_GENDERS.has(input.gender)) {
    throw new Error("Invalid gender");
  }

  /* H/W are optional — only persist + stamp lastMeasuredAt when BOTH
     are provided and within plausible ranges. Skip-later writes nulls. */
  const hasH = validHeight(input.heightCm);
  const hasW = validWeight(input.weightKg);
  const measurementData =
    hasH && hasW
      ? {
          heightCm: input.heightCm as number,
          weightKg: input.weightKg as number,
          lastMeasuredAt: new Date(),
        }
      : {};

  await ensureDefaultUser();

  /* If the user previously snapped a meal as a guest, the upload route
     auto-created a placeholder child named "Your child". Claim it on
     onboarding submit so the guest's meals carry over instead of being
     orphaned on a hidden child. */
  const guestCookieId = cookies().get(ACTIVE_CHILD_COOKIE)?.value ?? null;
  let claimableGuestId: string | null = null;
  if (guestCookieId) {
    const candidate = await db.child.findFirst({
      where: { id: guestCookieId, userId: DEFAULT_USER_ID, name: "Your child" },
      select: { id: true },
    });
    claimableGuestId = candidate?.id ?? null;
  }

  const child = claimableGuestId
    ? await db.child.update({
        where: { id: claimableGuestId },
        data: {
          name,
          age: input.age,
          gender: input.gender,
          ...measurementData,
        },
        select: { id: true },
      })
    : await db.child.create({
        data: {
          name,
          age: input.age,
          gender: input.gender,
          userId: DEFAULT_USER_ID,
          ...measurementData,
        },
        select: { id: true },
      });

  /* Newly-created child becomes the active child for the rest of
     onboarding (and for the child-switcher on Home). */
  cookies().set(ACTIVE_CHILD_COOKIE, child.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath("/home");
  return { id: child.id };
}
