import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentChildId } from "@/lib/getCurrentChild";
import MeasureForm from "./MeasureForm";

export const dynamic = "force-dynamic";

export default async function MeasurePage() {
  const childId = await getCurrentChildId();
  if (!childId) redirect("/onboarding");
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      name: true,
      heightCm: true,
      weightKg: true,
      lastMeasuredAt: true,
    },
  });
  if (!child) redirect("/onboarding");

  return (
    <MeasureForm
      childName={child.name}
      initialHeight={child.heightCm ?? null}
      initialWeight={child.weightKg ?? null}
      lastMeasuredAt={child.lastMeasuredAt?.toISOString() ?? null}
    />
  );
}
