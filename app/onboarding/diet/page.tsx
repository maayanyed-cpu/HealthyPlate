import { redirect } from "next/navigation";
import { db, DEFAULT_USER_ID } from "@/lib/db";
import DietForm from "./DietForm";

export const dynamic = "force-dynamic";

export default async function DietPage() {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
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
