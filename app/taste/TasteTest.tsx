"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveTasteRatings } from "./actions";
import { STARTER_PLAN_THRESHOLD } from "@/lib/mockData";

type Food = { id: string; name: string; emoji: string; category: string };

type Props = {
  childName: string;
  foods: Food[];
  initialRatings: Record<string, string>;
};

const RATINGS = [
  { id: "love", icon: "❤️", label: "Love", cls: "love" },
  { id: "ok", icon: "👍", label: "OK", cls: "ok" },
  { id: "maybe", icon: "🤷", label: "Maybe", cls: "meh" },
  { id: "not-really", icon: "👎", label: "Not really", cls: "no" },
  { id: "hard-no", icon: "🚫", label: "Hard no", cls: "hardno" },
  { id: "not-sure", icon: "❓", label: "Not sure", cls: "unsure" },
] as const;

const RATING_BADGE: Record<string, { label: string; cls: string }> = {
  love: { label: "❤️ Loves", cls: "bg-[#F8E2DE] text-[#C95C4D]" },
  ok: { label: "👍 OK", cls: "bg-sage-pale text-sage" },
  maybe: { label: "🤷 Maybe", cls: "bg-[#F4E5C7] text-[#8B5A2B]" },
  "not-really": { label: "👎 Not really", cls: "bg-[#F0DFD2] text-carrot" },
  "hard-no": { label: "🚫 Hard no", cls: "bg-[#EAD5CF] text-[#8B3A2D]" },
  "not-sure": { label: "❓ Not sure", cls: "bg-[#EFEEEA] text-ink-soft" },
};

const RATING_BTN_CLS: Record<string, { sel: string; selLbl: string }> = {
  love: { sel: "bg-[#F8E2DE] border-[#C95C4D]", selLbl: "text-[#C95C4D]" },
  ok: { sel: "bg-sage-pale border-sage", selLbl: "text-sage" },
  meh: { sel: "bg-[#F4E5C7] border-gold", selLbl: "text-[#8B5A2B]" },
  no: { sel: "bg-[#F0DFD2] border-carrot", selLbl: "text-carrot" },
  hardno: { sel: "bg-[#EAD5CF] border-[#8B3A2D]", selLbl: "text-[#8B3A2D]" },
  unsure: { sel: "bg-[#EFEEEA] border-[#A0A8A4]", selLbl: "text-ink-soft" },
};

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

/* Custom display order so the categories appear in the same sequence the
   prototype uses, regardless of the order Postgres returns them in. */
const CATEGORY_ORDER: string[] = [
  "vegetable",
  "fruit",
  "protein",
  "grain",
  "dairy",
  "snack",
  "spice",
  "drink",
];

export default function TasteTest({ childName, foods, initialRatings }: Props) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, string>>(initialRatings);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of foods) counts[f.category] = (counts[f.category] ?? 0) + 1;
    return Object.entries(counts)
      .map(([id, count]) => ({
        id,
        label: CATEGORY_LABEL[id] ?? id,
        count,
      }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.id);
        const bi = CATEGORY_ORDER.indexOf(b.id);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
  }, [foods]);

  const visibleFoods =
    activeCat === "all" ? foods : foods.filter((f) => f.category === activeCat);

  const ratedCount = Object.keys(ratings).length;
  const total = foods.length;
  const targetThreshold = Math.min(STARTER_PLAN_THRESHOLD, total);
  /* Progress bar fills toward the unlock threshold, not toward the full
     catalog — otherwise rating 30 of 300 would only show ~10% which
     feels punishing for what's actually a milestone moment. */
  const progressPct =
    targetThreshold === 0 ? 0 : Math.min(100, (ratedCount / targetThreshold) * 100);
  const milestoneHit = ratedCount >= targetThreshold;
  const remainingToUnlock = Math.max(0, targetThreshold - ratedCount);

  function setRating(foodId: string, rating: string) {
    setRatings((prev) => ({ ...prev, [foodId]: rating }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveTasteRatings(
          Object.entries(ratings).map(([foodId, rating]) => ({ foodId, rating })),
        );
        router.push("/home");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="app-frame">
      <div className="screen bg-cream-soft" style={{ paddingBottom: 0 }}>
        {/* Sticky topbar */}
        <div className="sticky top-0 bg-cream-soft z-20 px-5 pt-3.5 pb-3.5 border-b border-line-soft">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link
              href="/home"
              aria-label="Close"
              className="w-9 h-9 bg-surface border border-line rounded-full flex items-center justify-center text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Link>
            <div className="font-serif text-[16px] font-semibold text-ink flex-1 text-center">
              {childName}&apos;s taste profile
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="text-sage-deep font-semibold text-[13px] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-line rounded-[4px] overflow-hidden">
              <div
                className="h-full rounded-[4px] transition-[width] duration-300"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--sage), var(--moss))",
                }}
              />
            </div>
            <div className="font-serif text-[15px] font-semibold text-ink flex-shrink-0">
              {ratedCount}
              <span className="text-ink-mute font-medium text-[13px]"> / {total}</span>
            </div>
          </div>
          <div className="text-[11px] text-ink-soft mt-2 text-center">
            Tap how {childName} feels about each food.{" "}
            <strong className="text-sage-deep font-semibold">
              {milestoneHit
                ? "Starter plan unlocked ✓"
                : `+${remainingToUnlock} unlocks ${childName}'s starter plan ✨`}
            </strong>
          </div>
        </div>

        {/* Category strip */}
        <div className="sticky top-[120px] bg-cream-soft px-5 pt-3.5 pb-1.5 z-10 border-b border-line-soft overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            <CatPill
              active={activeCat === "all"}
              label="All"
              count={total}
              onClick={() => setActiveCat("all")}
            />
            {categories.map((c) => (
              <CatPill
                key={c.id}
                active={activeCat === c.id}
                label={c.label}
                count={c.count}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Milestone banner */}
        {milestoneHit && (
          <div
            className="mx-5 my-3 px-3.5 py-3 rounded-sm flex items-center gap-3 text-[12px] text-sage-deep"
            style={{ background: "linear-gradient(135deg, var(--sage-pale), #C8DDC9)" }}
          >
            <span className="text-[18px]">🎉</span>
            <div>
              <strong className="font-serif font-semibold">
                You&apos;ve unlocked {childName}&apos;s starter plan.
              </strong>{" "}
              Keep going — every rating sharpens her meal suggestions.
            </div>
          </div>
        )}

        {/* Food cards */}
        <div className="px-5 py-3 flex flex-col gap-2.5">
          {visibleFoods.map((f) => {
            const current = ratings[f.id];
            const badge = current ? RATING_BADGE[current] : null;
            return (
              <div
                key={f.id}
                className={
                  "bg-surface border rounded-[20px] px-3.5 pt-3.5 pb-3 " +
                  (current ? "border-sage-soft" : "border-line-soft")
                }
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-[42px] h-[42px] bg-cream rounded-xl flex items-center justify-center text-[22px] flex-shrink-0">
                    {f.emoji}
                  </div>
                  <div className="text-[14px] font-semibold text-ink flex-1">
                    {f.name}
                  </div>
                  {badge && (
                    <span
                      className={
                        "text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full " +
                        badge.cls
                      }
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {RATINGS.map((r) => {
                    const selected = current === r.id;
                    const cls = RATING_BTN_CLS[r.cls];
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRating(f.id, r.id)}
                        className={
                          "py-2 px-1 rounded-xl border-[1.5px] flex flex-col items-center gap-0.5 transition-all " +
                          (selected
                            ? cls.sel
                            : "bg-cream border-transparent hover:bg-cream-soft")
                        }
                      >
                        <span className="text-[16px] leading-none">{r.icon}</span>
                        <span
                          className={
                            "text-[10px] font-semibold " +
                            (selected ? cls.selLbl : "text-ink-soft")
                          }
                        >
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-cream-soft border-t border-line-soft px-5 py-4">
          {error && (
            <div className="text-[12px] text-tomato bg-[#F8E2DE] border border-tomato/20 rounded-sm px-3 py-2 mb-2">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="w-full bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save & continue building plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CatPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-[12px] font-medium border whitespace-nowrap transition-all " +
        (active
          ? "bg-ink text-cream-soft border-ink"
          : "bg-surface text-ink-soft border-line hover:border-sage-soft")
      }
    >
      {label}
      <span
        className={
          "ml-1.5 text-[10px] font-semibold " +
          (active ? "text-white/55" : "text-ink-mute")
        }
      >
        {count}
      </span>
    </button>
  );
}
