"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, DEFAULT_USER_ID } from "@/lib/db";
import { ACTIVE_CHILD_COOKIE } from "@/lib/getCurrentChild";

/* Switch the active child to the given ID. Verifies ownership before
   writing the cookie so a stale browser tab can't cross-mount someone
   else's child. */
export async function setActiveChild(childId: string): Promise<void> {
  const child = await db.child.findFirst({
    where: { id: childId, userId: DEFAULT_USER_ID },
    select: { id: true },
  });
  if (!child) throw new Error("That child doesn't exist anymore.");

  cookies().set(ACTIVE_CHILD_COOKIE, child.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    sameSite: "lax",
  });

  /* Refresh every server-rendered surface so the active child is
     consistent across tabs/screens. */
  revalidatePath("/", "layout");
}
