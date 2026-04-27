import { redirect } from "next/navigation";
import { db, ensureFoodsSeeded } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";
import TasteTest from "./TasteTest";

export const dynamic = "force-dynamic";

export default async function TastePage() {
  await ensureFoodsSeeded();

  const childId = await getCurrentChildId();
  if (!childId) redirect("/onboarding");
  const child = await db.child.findUnique({
    where: { id: childId },
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
