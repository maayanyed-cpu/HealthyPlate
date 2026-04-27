import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";
import HabitsForm from "./HabitsForm";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const childId = await getCurrentChildId();
  if (!childId) redirect("/onboarding");
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      habits: true,
      foodLikes: true,
      foodDislikes: true,
      foodMaybes: true,
    },
  });
  if (!child) redirect("/onboarding");

  return (
    <HabitsForm
      initial={child.habits}
      initialPrefs={{
        foodLikes: child.foodLikes ?? "",
        foodDislikes: child.foodDislikes ?? "",
        foodMaybes: child.foodMaybes ?? "",
      }}
    />
  );
}
