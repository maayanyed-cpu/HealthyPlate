"use server";

import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/db";

const VALID_GENDERS = new Set(["girl", "boy", "unspecified"]);

export type CreateChildInput = {
  name: string;
  age: number;
  gender: "girl" | "boy" | "unspecified";
};

export async function createChild(input: CreateChildInput): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!Number.isInteger(input.age) || input.age < 1 || input.age > 18) {
    throw new Error("Age must be between 1 and 18");
  }
  if (!VALID_GENDERS.has(input.gender)) {
    throw new Error("Invalid gender");
  }

  await ensureDefaultUser();

  const child = await db.child.create({
    data: {
      name,
      age: input.age,
      gender: input.gender,
      userId: DEFAULT_USER_ID,
    },
    select: { id: true },
  });

  revalidatePath("/home");
  return { id: child.id };
}
