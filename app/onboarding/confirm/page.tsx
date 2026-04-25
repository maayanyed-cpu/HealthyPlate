import Link from "next/link";
import { redirect } from "next/navigation";
import { db, DEFAULT_USER_ID } from "@/lib/db";

export const dynamic = "force-dynamic";

const DIET_LABEL: Record<string, string> = {
  "no-restrictions": "No restrictions",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  halal: "Halal",
  kosher: "Kosher",
};

const HABIT_LABEL: Record<string, string> = {
  "refuses-vegetables": "Selective with vegetables",
  "rotation-eater": "Rotation eater",
  snacker: "Snacks > meals",
  "supplement-curious": "Supplement-curious",
};

const GENDER_EMOJI: Record<string, string> = { girl: "👧", boy: "👦" };

export default async function ConfirmPage() {
  const child = await db.child.findFirst({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { createdAt: "desc" },
  });
  if (!child) redirect("/onboarding");

  const genderEmoji = GENDER_EMOJI[child.gender] ?? "👤";
  const dietLabel = child.dietStyle ? DIET_LABEL[child.dietStyle] ?? child.dietStyle : "—";

  const habitLabels = child.habits.length
    ? child.habits.map((h) => HABIT_LABEL[h] ?? h).join(", ")
    : "—";

  const allergyLabel = child.allergies.length ? child.allergies.join(", ") : "None";

  return (
    <div className="app-frame">
      <div className="screen px-7 pt-9 pb-7">
        <div className="flex gap-[6px] mb-7">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          ))}
        </div>

        <div className="text-center mb-7">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "#F4E5C7" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5A2B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6m0 0l3-3m-3 3L9 5" />
              <path d="M5 12c0-3 3-4 7-4s7 1 7 4v5c0 2-2 3-7 3s-7-1-7-3v-5z" />
            </svg>
          </div>
          <div className="text-[12px] tracking-[0.16em] uppercase text-sage-deep mb-2 font-semibold">
            Step 4 of 4
          </div>
          <h2 className="font-serif text-[28px] leading-[1.2] font-medium text-ink tracking-[-0.015em] mb-2">
            {child.name}&apos;s profile is <em className="text-sage-deep">ready</em>
          </h2>
          <p className="text-[14px] text-ink-soft leading-[1.5]">
            Next up: the taste test. Even 30 ratings produce a usable plan.
          </p>
        </div>

        {/* Profile summary */}
        <div className="bg-surface border border-line rounded-[20px] p-[18px] mb-3.5">
          <div className="flex justify-between items-center mb-3">
            <strong className="font-serif text-[13px] font-semibold">
              Your starting profile
            </strong>
            <span className="text-[11px] text-ink-mute">Editable anytime</span>
          </div>
          <div className="text-[13px] text-ink-soft leading-[1.6]">
            <Row label="Child" value={`${genderEmoji} ${child.name}, age ${child.age}`} />
            <Row label="Allergies" value={allergyLabel} valueClass={child.allergies.length ? "text-carrot font-semibold" : "text-ink font-semibold"} />
            <Row label="Diet style" value={dietLabel} />
            <Row label="Eating pattern" value={habitLabels} last />
          </div>
        </div>

        {/* Taste test callout */}
        <div className="bg-sage-pale rounded-[20px] p-4 mb-3.5 flex gap-3 items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-sage-deep rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAF7F0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div className="text-[12px] text-ink leading-[1.5]">
            <strong className="font-serif text-[13px] block mb-0.5">
              The taste test
            </strong>
            Rate the foods we know — Love, OK, Doesn&apos;t like, Hard no, Maybe, or
            Not sure. The more you do, the sharper {child.name}&apos;s plan gets.
          </div>
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-1">
          <Link
            href="/taste"
            className="block w-full text-center bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors"
          >
            Start the taste test →
          </Link>
          <Link
            href="/home"
            className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
          >
            Skip for now — open app
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
  last,
}: {
  label: string;
  value: string;
  valueClass?: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        "flex justify-between gap-4 py-1.5 " +
        (last ? "" : "border-b border-dashed border-line-soft")
      }
    >
      <span>{label}</span>
      <span className={(valueClass ?? "text-ink font-semibold") + " text-right"}>
        {value}
      </span>
    </div>
  );
}
