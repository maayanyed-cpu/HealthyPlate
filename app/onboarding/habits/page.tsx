import { redirect } from "next/navigation";
import { db, DEFAULT_USER_ID } from "@/lib/db";
import HabitsForm from "./HabitsForm";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
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
