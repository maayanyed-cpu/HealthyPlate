import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentChild } from "@/lib/getCurrentChild";
import PlateSvg from "@/components/PlateSvg";

export const dynamic = "force-dynamic";

function portionLabel(grams: number): string {
  if (grams >= 70) return `≈ ½ cup · ~${grams} g`;
  if (grams >= 35) return `≈ ⅓ cup · ~${grams} g`;
  return `≈ ¼ cup · ~${grams} g`;
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { mealId?: string };
}) {
  const mealId = searchParams.mealId;
  if (!mealId) notFound();

  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      detected: { where: { phase: "before" }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!meal) notFound();

  const { name } = await getCurrentChild();

  return (
    <div className="screen bg-cream-soft">
      <div className="px-6 pt-4 pb-2 flex justify-between items-center">
        <Link
          href="/snap"
          className="text-ink-soft text-[13px] font-medium flex items-center gap-1 hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retake
        </Link>
        <div className="text-[13px] font-semibold text-ink">Before · confirm</div>
        <div className="w-[50px]" />
      </div>

      <div
        className="mx-6 mt-3 mb-5 rounded-[20px] relative overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "4/3",
          background: "linear-gradient(135deg, #2A3530 0%, #4A6B5F 100%)",
        }}
      >
        {meal.beforePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.beforePhotoUrl}
            alt={`${name}'s ${meal.mealType}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <PlateSvg className="w-[80%] h-auto" variant="before" />
        )}
      </div>

      <div className="px-6 pb-1 font-serif text-[22px] font-medium text-ink">
        We found {meal.detected.length} foods
      </div>
      <div className="px-6 pb-4 text-[13px] text-ink-soft">
        Tap any item to fix the name or portion. Every correction trains{" "}
        {name}&apos;s model.
      </div>

      <div className="px-5 flex flex-col gap-2">
        {meal.detected.map((d) => (
          <div
            key={d.id}
            className="bg-surface border border-line rounded-[20px] px-4 py-3.5 flex items-center gap-3"
          >
            <div className="w-[38px] h-[38px] bg-cream rounded-xl flex items-center justify-center text-[22px] flex-shrink-0">
              {d.emoji}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">{d.name}</div>
              <div className="text-[12px] text-ink-soft mt-0.5">
                {portionLabel(d.portionGrams)}
              </div>
            </div>
            <span className="text-[11px] font-semibold text-sage-deep bg-sage-pale px-2 py-0.5 rounded-full">
              {d.confidence}%
            </span>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 px-4 py-3.5 bg-sage-pale rounded-[20px] flex gap-3 items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-sage-deep rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAF7F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-[12px] text-ink leading-[1.5]">
          <strong className="font-serif text-[13px] block">
            Saved as {name}&apos;s {meal.mealType}.
          </strong>
          Snap again when she&apos;s done — we&apos;ll calculate what she actually
          ate.
        </div>
      </div>

      <div className="px-5 pt-5 pb-2 mt-auto flex flex-col gap-1">
        <Link
          href={`/snap?mode=after&mealId=${meal.id}`}
          className="block w-full text-center bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors"
        >
          Snap the after-shot →
        </Link>
        <Link
          href="/home"
          className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
        >
          I&apos;ll snap it later
        </Link>
      </div>
    </div>
  );
}
