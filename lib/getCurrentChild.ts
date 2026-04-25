import { db, DEFAULT_USER_ID } from "./db";
import { DEFAULT_CHILD } from "./mockData";
import type { ChildProfile } from "./mockData";

export type CurrentChild = ChildProfile & { id: string | null };

/* Returns the most recently created child for the singleton user.
   Falls back to DEFAULT_CHILD (with id=null) if onboarding hasn't run yet. */
export async function getCurrentChild(): Promise<CurrentChild> {
  try {
    const child = await db.child.findFirst({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, age: true, gender: true },
    });
    if (!child) return { ...DEFAULT_CHILD, id: null };
    return {
      id: child.id,
      name: child.name,
      age: child.age,
      gender:
        child.gender === "boy" || child.gender === "girl" ? child.gender : "unspecified",
    };
  } catch {
    return { ...DEFAULT_CHILD, id: null };
  }
}
