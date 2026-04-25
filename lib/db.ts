import { PrismaClient } from "@prisma/client";
import { FOODS } from "./mockData";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const DEFAULT_USER_ID = "default-user";

/* Idempotent — guarantees the singleton parent row exists.
   Called from any server action that needs to reference a User. */
export async function ensureDefaultUser() {
  await db.user.upsert({
    where: { id: DEFAULT_USER_ID },
    create: { id: DEFAULT_USER_ID },
    update: {},
  });
}

let foodsSeeded = false;

/* Idempotent — upserts the canonical Food list (currently 10 items
   from mockData.FOODS) on first call per server boot. */
export async function ensureFoodsSeeded() {
  if (foodsSeeded) return;
  await Promise.all(
    FOODS.map((f) =>
      db.food.upsert({
        where: { id: f.id },
        create: { id: f.id, name: f.name, emoji: f.emoji, category: f.category },
        update: { name: f.name, emoji: f.emoji, category: f.category },
      }),
    ),
  );
  foodsSeeded = true;
}
