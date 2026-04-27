import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentChild } from "@/lib/getCurrentChild";
import { computeAnalysis } from "@/lib/nutrition";
import PlateSvg from "@/components/PlateSvg";

const RING_RADIUS = 34;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export const dynamic = "force-dynamic";

export default async function MealAnalysisPage({
  searchParams,
}: {
  searchParams: { mealId?: string };
}) {
  const mealId = searchParams.mealId;
  if (!mealId) notFound();

  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      detected: { where: { phase: "after" }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!meal) notFound();

  const { name } = await getCurrentChild();

  const analysis = computeAnalysis(
    meal.detected.map((d) => ({
      foodKey: d.foodKey,
      portionGrams: d.portionGrams,
      percentEaten: d.percentEaten ?? 0,
    })),
    meal.mealType,
  );
  const { balanceScore, balanceHeadline, nutrients, recommendation } = analysis;
  const ringOffset = RING_CIRC * (1 - balanceScore / 100);

  return (
    <div className="screen bg-cream-soft">
      {/* Header */}
      <div className="px-6 pt-4 pb-2 flex justify-between items-center">
        <Link
          href="/home"
          className="text-ink-soft text-[13px] font-medium flex items-center gap-1 hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Home
        </Link>
        <div className="text-[13px] font-semibold text-ink">Meal analyzed</div>
        <div className="w-[50px]" />
      </div>

      <div className="px-6 pt-4">
        <div className="font-serif text-[24px] font-medium text-ink">
          {name}&apos;s {meal.mealType}
        </div>
        <div className="text-[12px] text-ink-soft mt-0.5">
          Logged forever to her food history
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="px-5 mt-3.5 grid grid-cols-2 gap-2.5">
        {[
          {
            label: "Before",
            variant: "before" as const,
            photoUrl: meal.beforePhotoUrl,
            phase: "before" as const,
          },
          {
            label: "After",
            variant: "after" as const,
            photoUrl: meal.afterPhotoUrl,
            phase: "after" as const,
          },
        ].map((p) => (
          <div
            key={p.label}
            className="rounded-[20px] relative overflow-hidden flex items-center justify-center"
            style={{
              aspectRatio: "1/1",
              background: "linear-gradient(135deg, #2A3530 0%, #4A6B5F 100%)",
            }}
          >
            <span className="absolute top-2 left-2 bg-white/95 text-ink text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-md z-10">
              {p.label}
            </span>
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/snap-photo/${meal.id}?phase=${p.phase}`}
                alt={`${p.label} — ${name}'s ${meal.mealType}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <PlateSvg className="w-[80%] h-auto" variant={p.variant} />
            )}
          </div>
        ))}
      </div>

      {/* Balance score */}
      <div
        className="mx-5 mt-4 rounded-[28px] text-cream-soft p-[22px] relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #4A6B5F 0%, #3A5648 100%)" }}
      >
        <div className="absolute -top-12 -right-14 w-[180px] h-[180px] rounded-full bg-white/[0.04]" />
        <div className="flex items-center gap-[18px] relative">
          <div className="flex-shrink-0 w-[84px] h-[84px] relative">
            <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="42"
                cy="42"
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="6"
              />
              <circle
                cx="42"
                cy="42"
                r={RING_RADIUS}
                fill="none"
                stroke="#A8BFA8"
                strokeWidth="6"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-serif">
              <div className="text-[28px] font-semibold leading-none">
                {balanceScore}
              </div>
              <div className="text-[10px] opacity-70 mt-0.5 uppercase tracking-[0.1em]">
                Balance
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] tracking-[0.16em] uppercase opacity-75 font-medium">
              Today&apos;s score
            </div>
            <div className="font-serif text-[18px] font-medium leading-[1.25] mt-1.5">
              {balanceHeadline}
            </div>
          </div>
        </div>
      </div>

      {/* Nutrient bars */}
      <div className="mx-5 mt-4">
        <div className="font-serif text-[16px] font-semibold text-ink mb-2.5">
          Nutrient breakdown
        </div>
        <div className="bg-surface border border-line-soft rounded-[20px] px-[18px] py-4">
          {nutrients.map((n) => (
            <div key={n.name} className="flex items-center gap-3 py-1.5">
              <span className="w-[70px] text-[12px] font-semibold text-ink">
                {n.name}
              </span>
              <div className="flex-1 h-2 bg-line-soft rounded-[4px] overflow-hidden relative">
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${Math.min(n.pct, 100)}%`,
                    background:
                      n.tone === "good"
                        ? "linear-gradient(90deg, var(--sage), var(--moss))"
                        : n.tone === "med"
                        ? "linear-gradient(90deg, var(--gold), var(--carrot))"
                        : "var(--carrot-soft)",
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-ink-mute opacity-50"
                  style={{ left: "80%" }}
                />
              </div>
              <span className="text-[11px] font-semibold text-ink-soft w-10 text-right">
                {n.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-food consumption */}
      <div className="mx-5 mt-4">
        <div className="font-serif text-[16px] font-semibold text-ink mb-2.5">
          What {name} ate
        </div>
        <div className="bg-surface border border-line-soft rounded-[20px] px-4 py-3.5">
          {meal.detected.map((d, i) => {
            const pct = d.percentEaten ?? 0;
            return (
              <div
                key={d.id}
                className={
                  "flex items-center gap-3 py-1.5 " +
                  (i > 0 ? "border-t border-dashed border-line-soft pt-2.5 mt-1" : "")
                }
              >
                <span className="w-7 h-7 flex items-center justify-center text-[18px]">
                  {d.emoji}
                </span>
                <span className="flex-1 text-[13px] font-semibold text-ink">
                  {d.name}
                </span>
                <span className="text-[12px] text-ink-soft font-medium">
                  {Math.round((d.portionGrams * pct) / 100)} g of {d.portionGrams} g
                </span>
                <span
                  className={
                    "font-serif text-[14px] font-semibold w-10 text-right " +
                    (pct < 50 ? "text-carrot" : "text-sage-deep")
                  }
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div
        className="mx-5 mt-4 rounded-[20px] px-5 py-4 flex gap-3.5 items-start"
        style={{ background: "linear-gradient(135deg, #F4E5C7, #E8D5A8)" }}
      >
        <div className="w-[38px] h-[38px] bg-ink text-gold rounded-full flex items-center justify-center text-[18px] flex-shrink-0">
          💡
        </div>
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.16em] uppercase font-bold" style={{ color: "#8B5A2B" }}>
            Try this tomorrow
          </div>
          <div className="font-serif text-[15px] font-medium text-ink leading-[1.4] mt-1">
            {recommendation}
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-2 mt-auto">
        <Link
          href="/home"
          className="block w-full text-center bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
