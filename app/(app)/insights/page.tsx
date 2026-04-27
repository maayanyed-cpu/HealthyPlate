import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentChild } from "@/lib/getCurrentChild";
import { FOODS } from "@/lib/mockData";

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

export default async function InsightsPage() {
  const child = await getCurrentChild();

  let ratings: RatingRow[] = [];
  if (child.id) {
    ratings = await db.tasteRating.findMany({
      where: { childId: child.id },
      select: {
        rating: true,
        food: { select: { category: true, name: true, emoji: true } },
      },
      orderBy: { ratedAt: "desc" },
    });
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

      {/* Coming-soon strip for the other Insights features */}
      <div className="mx-5 mt-6 text-[11px] uppercase tracking-[0.14em] text-ink-mute font-bold">
        More insights coming
      </div>
      <div className="mx-5 mt-2 mb-3 grid grid-cols-2 gap-2.5">
        {[
          { emoji: "📈", title: "Growth chart" },
          { emoji: "⚖️", title: "Balance history" },
          { emoji: "👥", title: "Peer comparison" },
          { emoji: "🏆", title: "Veggie collection" },
        ].map((it) => (
          <div
            key={it.title}
            className="bg-surface border border-line-soft rounded-[20px] px-3 py-3 text-center opacity-70"
          >
            <div className="text-[20px] mb-1" aria-hidden>
              {it.emoji}
            </div>
            <div className="text-[12px] font-semibold text-ink">{it.title}</div>
            <div className="text-[10px] text-ink-mute mt-0.5">After v0</div>
          </div>
        ))}
      </div>
    </div>
  );
}
