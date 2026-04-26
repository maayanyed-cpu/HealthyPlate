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

/* Idempotent — upserts the canonical Food list (~300 items from
   mockData.FOODS) on first call per server boot. Batched in groups of
   25 so we don't saturate the Postgres connection pool. */
export async function ensureFoodsSeeded() {
  if (foodsSeeded) return;
  const BATCH_SIZE = 25;
  for (let i = 0; i < FOODS.length; i += BATCH_SIZE) {
    const batch = FOODS.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((f) =>
        db.food.upsert({
          where: { id: f.id },
          create: { id: f.id, name: f.name, emoji: f.emoji, category: f.category },
          update: { name: f.name, emoji: f.emoji, category: f.category },
        }),
      ),
    );
  }
  foodsSeeded = true;
}
