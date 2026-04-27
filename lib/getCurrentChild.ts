import { cookies } from "next/headers";
import { db, DEFAULT_USER_ID } from "./db";
import { DEFAULT_CHILD } from "./mockData";
import type { ChildProfile } from "./mockData";

export const ACTIVE_CHILD_COOKIE = "hp_active_child";
export type CurrentChild = ChildProfile & { id: string | null };

async function readActiveChildCookie(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
}

/* Active-child resolution:
   1. If the cookie points at a child still owned by the default user → use it.
   2. Otherwise fall back to the most recently created child for the user.
   3. Returns null if no children exist yet (onboarding hasn't run). */
export async function getCurrentChildId(): Promise<string | null> {
  const cookieId = await readActiveChildCookie();
  if (cookieId) {
    const valid = await db.child.findFirst({
      where: { id: cookieId, userId: DEFAULT_USER_ID },
      select: { id: true },
    });
    if (valid) return valid.id;
  }
  const fallback = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return fallback?.id ?? null;
}

/* Returns the active child's profile. Falls back to DEFAULT_CHILD with
   id=null if onboarding hasn't run yet. */
export async function getCurrentChild(): Promise<CurrentChild> {
  try {
    const id = await getCurrentChildId();
    if (!id) return { ...DEFAULT_CHILD, id: null };
    const child = await db.child.findUnique({
      where: { id },
      select: { id: true, name: true, age: true, gender: true },
    });
    if (!child) return { ...DEFAULT_CHILD, id: null };
    return {
      id: child.id,
      name: child.name,
      age: child.age,
      gender:
        child.gender === "boy" || child.gender === "girl"
          ? child.gender
          : "unspecified",
    };
  } catch {
    return { ...DEFAULT_CHILD, id: null };
  }
}

/* Lists all children for the default user, newest first. Used by the
   child-switcher on Home. */
export async function listChildren(): Promise<
  Array<{ id: string; name: string; age: number; gender: string }>
> {
  return db.child.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, age: true, gender: true },
  });
}
