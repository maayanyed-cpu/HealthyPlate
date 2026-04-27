import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";
import DietForm from "./DietForm";

export const dynamic = "force-dynamic";

export default async function DietPage() {
  const childId = await getCurrentChildId();
  if (!childId) redirect("/onboarding");
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      allergies: true,
      intolerances: true,
      dietStyle: true,
      notes: true,
    },
  });
  if (!child) redirect("/onboarding");

  return (
    <DietForm
      initial={{
        allergies: child.allergies,
        intolerances: child.intolerances,
        dietStyle: child.dietStyle ?? "no-restrictions",
        notes: child.notes ?? "",
      }}
    />
  );
}
