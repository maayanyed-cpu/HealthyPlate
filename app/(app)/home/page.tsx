import Link from "next/link";
import { TODAYS_PLAN, STARTER_PLAN_THRESHOLD } from "@/lib/mockData";
import { getCurrentChild, listChildren } from "@/lib/getCurrentChild";
import { db } from "@/lib/db";
import ChildSwitcher from "./ChildSwitcher";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function HomePage() {
  const [child, kids] = await Promise.all([
    getCurrentChild(),
    listChildren(),
  ]);
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  let mealsToday = 0;
  let mealsTotal = 0;
  let pendingMeal: { id: string; mealType: string } | null = null;
  let ratedCount = 0;
  let lastMeasuredAt: Date | null = null;

  if (child.id) {
    const [a, b, c, ratings, fullChild] = await Promise.all([
      db.meal.count({
        where: { childId: child.id, loggedAt: { gte: startOfToday() } },
      }),
      db.meal.count({ where: { childId: child.id } }),
      db.meal.findFirst({
        where: { childId: child.id, status: "pending" },
        orderBy: { loggedAt: "desc" },
        select: { id: true, mealType: true },
      }),
      db.tasteRating.count({ where: { childId: child.id } }),
      db.child.findUnique({
        where: { id: child.id },
        select: { lastMeasuredAt: true },
      }),
    ]);
    mealsToday = a;
    mealsTotal = b;
    pendingMeal = c;
    ratedCount = ratings;
    lastMeasuredAt = fullChild?.lastMeasuredAt ?? null;
  }

  const pronoun = child.gender === "boy" ? "he" : "she";

  /* Profile-completion ring: progress toward the 30-rating starter-plan
     threshold. Hidden until at least one food has been rated so a fresh
     account doesn't get a 0% guilt trip on day one. */
  const showTasteRing = child.id !== null && ratedCount > 0;

  /* "Time to measure" banner: never measured, or last measured > 30 days ago. */
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const daysSinceMeasured = lastMeasuredAt
    ? Math.floor((Date.now() - lastMeasuredAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showMeasureBanner =
    child.id !== null &&
    (lastMeasuredAt === null ||
      Date.now() - lastMeasuredAt.getTime() > THIRTY_DAYS_MS);
  const tasteUnlocked = ratedCount >= STARTER_PLAN_THRESHOLD;
  const tastePct = Math.min(
    100,
    Math.round((ratedCount / STARTER_PLAN_THRESHOLD) * 100),
  );

  return (
    <div className="screen">
      {/* Header */}
      <div className="px-6 pt-3 pb-2 flex justify-between items-center">
        <div>
          <div className="text-[13px] text-ink-soft">{todayLabel}</div>
          <div className="font-serif text-[22px] font-medium mt-0.5">Good morning</div>
        </div>
        <ChildSwitcher
          active={{
            id: child.id,
            name: child.name,
            age: child.age,
            gender: child.gender,
          }}
          kids={kids}
        />
      </div>

      {/* "Time to measure" banner — sage gradient, gold pulse dot. Shown when
          the child has never been measured or was measured > 30 days ago. */}
      {showMeasureBanner && (
        <Link
          href="/measure"
          className="mx-5 mb-3.5 px-4 py-3.5 rounded-[20px] flex items-center gap-3 text-cream-soft shadow-[0_6px_16px_rgba(74,107,95,0.22)] relative overflow-hidden"
          style={{ background: "linear-gradient(120deg, #4A6B5F, #5A8073)" }}
        >
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gold animate-sparkle" aria-hidden />
          <span className="absolute -top-10 -right-8 w-[120px] h-[120px] rounded-full bg-white/[0.06]" aria-hidden />
          <span className="w-[38px] h-[38px] bg-white/20 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0 relative z-10">
            📏
          </span>
          <span className="flex-1 relative z-10">
            <span className="block text-[13px] font-bold">
              Time to measure {child.name}
            </span>
            <span className="block text-[11px] opacity-85 mt-0.5 leading-[1.3]">
              {daysSinceMeasured === null
                ? "Add height & weight — 1 minute, big difference for the plan"
                : `Last update was ${daysSinceMeasured} days ago — 1 minute, big difference for ${child.gender === "boy" ? "his" : "her"} plan`}
            </span>
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-85 relative z-10 flex-shrink-0"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Pending after-shot — only shown when there's actually a meal in progress */}
      {pendingMeal && (
        <Link
          href={`/snap?mode=after&mealId=${pendingMeal.id}`}
          className="mx-5 mb-3.5 px-4 py-3.5 rounded-[20px] flex items-center gap-3 text-white shadow-[0_6px_16px_rgba(216,132,99,0.25)]"
          style={{ background: "linear-gradient(120deg, #D88463, #E8946A)" }}
        >
          <span className="w-[38px] h-[38px] bg-white/20 rounded-xl flex items-center justify-center text-[20px]">
            📸
          </span>
          <span className="flex-1">
            <span className="block text-[13px] font-bold capitalize">
              {pendingMeal.mealType} is in progress
            </span>
            <span className="block text-[11px] opacity-90 mt-0.5">
              Snap how much {child.name} ate when {pronoun}&apos;s done
            </span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-85">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Hero card */}
      <div
        className="mx-5 mt-2 mb-3.5 rounded-[28px] text-cream-soft relative overflow-hidden px-[22px] py-[22px]"
        style={{ background: "linear-gradient(150deg, #4A6B5F 0%, #3A5648 100%)" }}
      >
        <div className="absolute -top-10 -right-12 w-[180px] h-[180px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-8 right-8 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />
        <div className="text-[11px] tracking-[0.18em] uppercase opacity-70 mb-2.5 font-medium relative">
          Today&apos;s nudge
        </div>
        <div className="font-serif text-[22px] font-medium leading-[1.25] mb-4 relative">
          {child.name}&apos;s ready to try roasted carrot — acceptance is up to 78%.
        </div>
        <div className="flex gap-6 relative">
          <div>
            <div className="font-serif text-[28px] font-medium leading-none">
              78<span className="text-[16px]">%</span>
            </div>
            <div className="text-[11px] opacity-75 mt-1">Acceptance prob.</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-medium leading-none">{mealsToday}</div>
            <div className="text-[11px] opacity-75 mt-1">Today</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-medium leading-none">{mealsTotal}</div>
            <div className="text-[11px] opacity-75 mt-1">All-time</div>
          </div>
        </div>
      </div>

      {/* Profile-completion ring — only after the parent has any ratings */}
      {showTasteRing && (
        <Link
          href="/taste"
          className="mx-5 mb-3.5 px-4 py-3.5 bg-surface border border-line-soft rounded-[20px] flex items-center gap-4 hover:border-sage-soft transition-colors"
        >
          <TasteRing pct={tastePct} unlocked={tasteUnlocked} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.16em] uppercase font-bold text-sage-deep">
              Taste profile
            </div>
            <div className="font-serif text-[15px] font-medium text-ink leading-tight mt-0.5">
              {tasteUnlocked
                ? `Starter plan unlocked ✓`
                : `Keep building ${child.name}'s starter plan`}
            </div>
            <div className="text-[12px] text-ink-soft mt-0.5">
              {tasteUnlocked
                ? `${ratedCount} foods rated · sharper every tap`
                : `${ratedCount} of ${STARTER_PLAN_THRESHOLD} foods rated`}
            </div>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-soft flex-shrink-0"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Quick actions */}
      <div className="px-5 grid grid-cols-2 gap-2.5 pb-1">
        <Link
          href="/snap"
          className="bg-surface border border-line-soft rounded-[20px] p-4 flex flex-col gap-1 hover:border-sage-soft hover:-translate-y-0.5 transition-all text-left"
        >
          <span className="w-8 h-8 rounded-[10px] bg-sage-pale text-sage-deep flex items-center justify-center mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          <span className="text-[13px] font-semibold text-ink">Snap a meal</span>
          <span className="text-[11px] text-ink-soft leading-tight">
            Before &amp; after — we analyze what was eaten
          </span>
        </Link>
        <button
          type="button"
          className="bg-surface border border-line-soft rounded-[20px] p-4 flex flex-col gap-1 hover:border-sage-soft hover:-translate-y-0.5 transition-all text-left opacity-70 cursor-not-allowed"
        >
          <span className="w-8 h-8 rounded-[10px] bg-[#F5E5D5] text-[#8B5A2B] flex items-center justify-center mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          <span className="text-[13px] font-semibold text-ink">Describe a meal</span>
          <span className="text-[11px] text-ink-soft leading-tight">Coming soon</span>
        </button>
      </div>

      {/* Today's plan */}
      <div className="px-6 pt-4 pb-2 flex justify-between items-baseline">
        <div className="font-serif text-[18px] font-medium text-ink">Today&apos;s plan</div>
        <span className="text-[12px] text-ink-mute font-semibold">3 meals</span>
      </div>
      <div className="px-5 flex flex-col gap-2">
        {TODAYS_PLAN.map((m) => (
          <div
            key={m.time}
            className="bg-surface border border-line-soft rounded-[20px] px-4 py-3.5 flex items-center gap-3.5"
          >
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0"
              style={{ background: m.bg }}
            >
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-mute font-semibold">
                {m.time}
              </div>
              <div className="text-[14px] font-semibold text-ink mt-0.5">{m.name}</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {m.tags.map((t) => (
                  <span
                    key={t.label}
                    className={
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold " +
                      (t.tone === "warm"
                        ? "bg-[#F5E5D5] text-[#8B5A2B]"
                        : t.tone === "berry"
                        ? "bg-[#F0DEE3] text-berry"
                        : "bg-sage-pale text-sage-deep")
                    }
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={
                "w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 " +
                (m.status === "done"
                  ? "bg-sage-deep border-sage-deep text-cream-soft"
                  : m.status === "partial"
                  ? "bg-gold border-gold text-ink text-[10px] font-bold"
                  : "border-line")
              }
            >
              {m.status === "done" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {m.status === "partial" && "½"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Small SVG ring used by the profile-completion card. The ring is
   rotated -90° so the arc starts at 12 o'clock and fills clockwise. */
function TasteRing({ pct, unlocked }: { pct: number; unlocked: boolean }) {
  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={unlocked ? "var(--sage-deep)" : "var(--sage)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-serif text-[14px] font-semibold text-ink">
        {unlocked ? "✓" : `${pct}%`}
      </div>
    </div>
  );
}
