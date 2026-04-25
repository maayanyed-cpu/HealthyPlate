import { db, DEFAULT_USER_ID } from "./db";
import { DEFAULT_CHILD } from "./mockData";
import type { ChildProfile } from "./mockData";

/* Returns the most recently created child for the singleton user.
   Falls back to DEFAULT_CHILD if onboarding hasn't run yet. */
export async function getCurrentChild(): Promise<ChildProfile> {
  try {
    const child = await db.child.findFirst({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
      select: { name: true, age: true, gender: true },
    });
    if (!child) return DEFAULT_CHILD;
    return {
      name: child.name,
      age: child.age,
      gender:
        child.gender === "boy" || child.gender === "girl" ? child.gender : "unspecified",
    };
  } catch {
    return DEFAULT_CHILD;
  }
}
