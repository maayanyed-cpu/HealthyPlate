import { redirect } from "next/navigation";
import { db, DEFAULT_USER_ID, ensureFoodsSeeded } from "@/lib/db";
import TasteTest from "./TasteTest";

export const dynamic = "force-dynamic";

export default async function TastePage() {
  await ensureFoodsSeeded();

  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  if (!child) redirect("/onboarding");

  const [foods, existing] = await Promise.all([
    db.food.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.tasteRating.findMany({
      where: { childId: child.id },
      select: { foodId: true, rating: true },
    }),
  ]);

  const initialRatings = Object.fromEntries(
    existing.map((r) => [r.foodId, r.rating]),
  );

  return <TasteTest childName={child.name} foods={foods} initialRatings={initialRatings} />;
}
