import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentChild } from "@/lib/getCurrentChild";
import { FOODS } from "@/lib/mockData";
import { computeAnalysis } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  vegetable: "Vegetables",
  fruit: "Fruits",
  protein: "Proteins",
  grain: "Grains",
  dairy: "Dairy",
  snack: "Snacks",
  spice: "Spices",
  drink: "Drinks",
};

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: "🥦",
  fruit: "🍎",
  protein: "🍗",
  grain: "🌾",
  dairy: "🥛",
  snack: "🍪",
  spice: "🌿",
  drink: "🥤",
};

const CATEGORY_ORDER = [
  "vegetable",
  "fruit",
  "protein",
  "grain",
  "dairy",
  "snack",
  "spice",
  "drink",
];

const RATING_ORDER = [
  "love",
  "ok",
  "maybe",
  "not-really",
  "hard-no",
  "not-sure",
] as const;
type RatingId = (typeof RATING_ORDER)[number];

const RATING_META: Record<RatingId, { label: string; emoji: string; color: string }> = {
  love: { label: "Loves", emoji: "❤️", color: "#C95C4D" },
  ok: { label: "OK", emoji: "👍", color: "#5A8073" },
  maybe: { label: "Maybe", emoji: "🤷", color: "#E5B96A" },
  "not-really": { label: "Not really", emoji: "👎", color: "#D88463" },
  "hard-no": { label: "Hard no", emoji: "🚫", color: "#8B3A2D" },
  "not-sure": { label: "Not sure", emoji: "❓", color: "#A0A8A4" },
};

type RatingRow = {
  rating: string;
  food: { category: string; name: string; emoji: string };
};

type MealForAnalysis = {
  id: string;
  mealType: string;
  loggedAt: Date;
  detected: Array<{ foodKey: string; portionGrams: number; percentEaten: number | null }>;
};

export default async function InsightsPage() {
  const child = await getCurrentChild();

  let ratings: RatingRow[] = [];
  let recentMeals: MealForAnalysis[] = [];
  if (child.id) {
    [ratings, recentMeals] = await Promise.all([
      db.tasteRating.findMany({
        where: { childId: child.id },
        select: {
          rating: true,
          food: { select: { category: true, name: true, emoji: true } },
        },
        orderBy: { ratedAt: "desc" },
      }),
      db.meal.findMany({
        where: { childId: child.id, status: "complete" },
        orderBy: { loggedAt: "desc" },
        take: 7,
        select: {
          id: true,
          mealType: true,
          loggedAt: true,
          detected: {
            where: { phase: "after" },
            select: {
              foodKey: true,
              portionGrams: true,
              percentEaten: true,
            },
          },
        },
      }),
    ]);
  }

  /* Aggregate counts per category × rating. */
  const byCat: Record<string, Record<string, number>> = {};
  for (const cat of CATEGORY_ORDER) byCat[cat] = {};
  for (const r of ratings) {
    const cat = r.food.category;
    if (!byCat[cat]) byCat[cat] = {};
    byCat[cat][r.rating] = (byCat[cat][r.rating] ?? 0) + 1;
  }

  /* Catalog size per category — denominator for the "X of Y rated" copy. */
  const catalogTotals: Record<string, number> = {};
  for (const f of FOODS) {
    catalogTotals[f.category] = (catalogTotals[f.category] ?? 0) + 1;
  }

  const lovedFoods = ratings
    .filter((r) => r.rating === "love")
    .slice(0, 8)
    .map((r) => r.food);

  const totalRated = ratings.length;
  const titleSubject = child.id ? child.name : "Your child";

  /* Balance history — one analysis per recent meal, oldest → newest so
     the strip reads left-to-right like a timeline. */
  const balanceHistory = recentMeals
    .slice()
    .reverse()
    .map((m) => {
      const analysis = computeAnalysis(
        m.detected.map((d) => ({
          foodKey: d.foodKey,
          portionGrams: d.portionGrams,
          percentEaten: d.percentEaten ?? 0,
        })),
        m.mealType,
      );
      return {
        id: m.id,
        mealType: m.mealType,
        loggedAt: m.loggedAt,
        balanceScore: analysis.balanceScore,
        nutrients: analysis.nutrients,
      };
    });

  const avgBalance =
    balanceHistory.length > 0
      ? Math.round(
          balanceHistory.reduce((s, b) => s + b.balanceScore, 0) /
            balanceHistory.length,
        )
      : 0;

  /* Average per-nutrient pct across the same recent meals. Each
     `nutrients` array carries [{name, pct, tone}] for the six tracked
     nutrients in stable NUTRIENT_ORDER. */
  const NUTRIENT_NAMES = ["Protein", "Iron", "Fiber", "Vit. A", "Vit. D", "Calcium"];
  const nutrientTrend = NUTRIENT_NAMES.map((label) => {
    if (balanceHistory.length === 0) return { name: label, pct: 0 };
    let sum = 0;
    let count = 0;
    for (const b of balanceHistory) {
      const found = b.nutrients.find((n) => n.name === label);
      if (found) {
        sum += found.pct;
        count += 1;
      }
    }
    return {
      name: label,
      pct: count === 0 ? 0 : Math.round(sum / count),
    };
  });

  /* Loves / avoids — most-loved category and most-refused category
     by raw count (not proportion, since a category with one love but
     no other ratings would otherwise win). */
  const lovesByCat: Record<string, number> = {};
  const refusalsByCat: Record<string, number> = {};
  for (const r of ratings) {
    if (r.rating === "love") {
      lovesByCat[r.food.category] = (lovesByCat[r.food.category] ?? 0) + 1;
    } else if (r.rating === "hard-no" || r.rating === "not-really") {
      refusalsByCat[r.food.category] =
        (refusalsByCat[r.food.category] ?? 0) + 1;
    }
  }
  const topLoveCat = Object.entries(lovesByCat).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topRefuseCat = Object.entries(refusalsByCat).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return (
    <div className="screen">
      {/* Header */}
      <div className="px-6 pt-3 pb-4">
        <div className="text-[11px] tracking-[0.16em] uppercase text-sage-deep font-semibold">
          Insights
        </div>
        <h1 className="font-serif text-[26px] font-medium text-ink mt-1 leading-tight">
          {titleSubject}
          <span className="text-ink-soft">&apos;s</span> taste graph
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          {totalRated > 0
            ? `${totalRated} foods rated · the bars below show how ${titleSubject} feels about each category.`
            : `Rate foods to grow the taste graph.`}
        </p>
      </div>

      {totalRated === 0 ? (
        <div className="mx-5 px-4 py-7 bg-cream rounded-[20px] text-center">
          <div className="text-[32px] mb-2" aria-hidden>
            🌱
          </div>
          <div className="font-serif text-[15px] text-ink mb-1">
            No ratings yet
          </div>
          <div className="text-[12px] text-ink-soft mb-3 leading-[1.5]">
            Build the taste graph by rating foods, or fill in the food
            preferences during onboarding.
          </div>
          <Link
            href="/taste"
            className="inline-block bg-sage-deep text-cream-soft rounded-full px-5 py-2 text-[13px] font-semibold"
          >
            Open the taste test →
          </Link>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-2.5">
          {CATEGORY_ORDER.map((cat) => {
            const counts = byCat[cat] ?? {};
            const ratedInCat = Object.values(counts).reduce((a, b) => a + b, 0);
            if (ratedInCat === 0) return null;
            return (
              <div
                key={cat}
                className="bg-surface border border-line-soft rounded-[20px] px-4 py-3.5"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-[18px]">
                      {CATEGORY_EMOJI[cat]}
                    </div>
                    <div>
                      <div className="font-serif text-[14px] font-medium text-ink">
                        {CATEGORY_LABEL[cat]}
                      </div>
                      <div className="text-[11px] text-ink-mute">
                        {ratedInCat} of {catalogTotals[cat] ?? 0} rated
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stacked horizontal bar — proportions across this category */}
                <div className="h-2.5 rounded-full overflow-hidden flex bg-line">
                  {RATING_ORDER.map((r) => {
                    const count = counts[r] ?? 0;
                    if (count === 0) return null;
                    const pct = (count / ratedInCat) * 100;
                    return (
                      <div
                        key={r}
                        style={{
                          width: `${pct}%`,
                          background: RATING_META[r].color,
                        }}
                        title={`${RATING_META[r].label}: ${count}`}
                      />
                    );
                  })}
                </div>

                {/* Legend pills with counts (only ratings that fired) */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                  {RATING_ORDER.map((r) => {
                    const count = counts[r] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={r}
                        className="flex items-center gap-1.5 text-[11px] text-ink-soft"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: RATING_META[r].color }}
                          aria-hidden
                        />
                        <span>
                          {RATING_META[r].emoji} {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Top-loved foods strip */}
          {lovedFoods.length > 0 && (
            <div className="mt-1 px-4 py-3.5 rounded-[20px] bg-[#F8E2DE]">
              <div className="text-[10px] tracking-[0.16em] uppercase text-[#C95C4D] font-bold mb-2">
                {titleSubject}&apos;s top loves
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lovedFoods.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-[12px]"
                  >
                    <span aria-hidden>{f.emoji}</span>
                    <span className="font-medium text-ink">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/taste"
            className="mt-2 block w-full text-center bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-3.5 px-6 text-[14px] font-semibold transition-colors"
          >
            Rate more foods →
          </Link>
        </div>
      )}

      {/* Real insights — driven by recent meals + ratings */}
      {balanceHistory.length > 0 && (
        <>
          <div className="mx-5 mt-6 text-[11px] uppercase tracking-[0.14em] text-ink-mute font-bold">
            How meals are landing
          </div>
          <div className="px-5 mt-2 flex flex-col gap-2.5">
            {/* Balance history strip */}
            <div className="bg-surface border border-line-soft rounded-[20px] px-4 py-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="font-serif text-[14px] font-medium text-ink">
                    Balance history
                  </div>
                  <div className="text-[11px] text-ink-mute">
                    Last {balanceHistory.length}{" "}
                    {balanceHistory.length === 1 ? "meal" : "meals"} · avg{" "}
                    {avgBalance}%
                  </div>
                </div>
                <div className="font-serif text-[18px] font-medium text-ink">
                  {avgBalance}
                  <span className="text-[12px] text-ink-soft">%</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-12">
                {balanceHistory.map((b) => {
                  const heightPct = Math.max(8, b.balanceScore);
                  const color =
                    b.balanceScore >= 85
                      ? "var(--sage-deep)"
                      : b.balanceScore >= 70
                      ? "var(--sage)"
                      : b.balanceScore >= 50
                      ? "var(--gold)"
                      : "var(--carrot)";
                  return (
                    <div
                      key={b.id}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${b.mealType} · ${b.balanceScore}%`}
                    >
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-[4px]"
                          style={{
                            height: `${heightPct}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1.5 text-[9px] text-ink-mute uppercase tracking-[0.06em]">
                <span>{balanceHistory[0]?.mealType}</span>
                <span>most recent →</span>
              </div>
            </div>

            {/* Nutrient trend (averaged across the same window) */}
            <div className="bg-surface border border-line-soft rounded-[20px] px-4 py-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-serif text-[14px] font-medium text-ink">
                    Nutrient trend
                  </div>
                  <div className="text-[11px] text-ink-mute">
                    Average % of daily target across the last{" "}
                    {balanceHistory.length}{" "}
                    {balanceHistory.length === 1 ? "meal" : "meals"}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {nutrientTrend.map((n) => {
                  const tone =
                    n.pct >= 33 ? "good" : n.pct >= 15 ? "med" : "low";
                  const barColor =
                    tone === "good"
                      ? "var(--sage)"
                      : tone === "med"
                      ? "var(--gold)"
                      : "var(--carrot-soft)";
                  return (
                    <div
                      key={n.name}
                      className="grid grid-cols-[80px_1fr_44px] items-center gap-2.5"
                    >
                      <div className="text-[12px] text-ink font-medium">
                        {n.name}
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-line">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${n.pct}%`, background: barColor }}
                        />
                      </div>
                      <div className="text-[11px] text-ink-soft font-semibold text-right">
                        {n.pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loves + avoids by category */}
      {(topLoveCat || topRefuseCat) && (
        <>
          <div className="mx-5 mt-5 text-[11px] uppercase tracking-[0.14em] text-ink-mute font-bold">
            What they reach for
          </div>
          <div className="mx-5 mt-2 grid grid-cols-2 gap-2.5">
            {topLoveCat && (
              <div className="px-3 py-3.5 rounded-[20px] bg-[#F8E2DE]">
                <div className="text-[10px] tracking-[0.14em] uppercase text-[#C95C4D] font-bold">
                  Loves
                </div>
                <div className="font-serif text-[16px] font-medium text-ink mt-1">
                  {CATEGORY_LABEL[topLoveCat[0]] ?? topLoveCat[0]}
                </div>
                <div className="text-[11px] text-ink-soft mt-0.5">
                  {topLoveCat[1]}{" "}
                  {topLoveCat[1] === 1 ? "favorite" : "favorites"}
                </div>
              </div>
            )}
            {topRefuseCat && (
              <div className="px-3 py-3.5 rounded-[20px] bg-[#F0DFD2]">
                <div className="text-[10px] tracking-[0.14em] uppercase text-carrot font-bold">
                  Hardest sell
                </div>
                <div className="font-serif text-[16px] font-medium text-ink mt-1">
                  {CATEGORY_LABEL[topRefuseCat[0]] ?? topRefuseCat[0]}
                </div>
                <div className="text-[11px] text-ink-soft mt-0.5">
                  {topRefuseCat[1]}{" "}
                  {topRefuseCat[1] === 1 ? "refusal" : "refusals"}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Genuinely-stub features that need data we don't yet collect. */}
      <div className="mx-5 mt-5 text-[11px] uppercase tracking-[0.14em] text-ink-mute font-bold">
        Coming soon
      </div>
      <div className="mx-5 mt-2 mb-3 grid grid-cols-2 gap-2.5">
        {[
          { emoji: "📈", title: "Growth chart", note: "Needs WHO percentile data" },
          { emoji: "👥", title: "Peer comparison", note: "Needs cohort data" },
        ].map((it) => (
          <div
            key={it.title}
            className="bg-surface border border-line-soft rounded-[20px] px-3 py-3 text-center opacity-70"
          >
            <div className="text-[20px] mb-1" aria-hidden>
              {it.emoji}
            </div>
            <div className="text-[12px] font-semibold text-ink">{it.title}</div>
            <div className="text-[10px] text-ink-mute mt-0.5">{it.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
