"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateChildDiet } from "./actions";

const ALLERGIES = [
  "Peanuts", "Tree nuts", "Dairy", "Eggs", "Soy",
  "Wheat / Gluten", "Shellfish", "Fish", "Sesame",
];
const INTOLERANCES = ["Lactose", "Gluten (non-celiac)", "FODMAP", "Histamine"];
const DIET_STYLES = [
  { id: "no-restrictions", label: "No restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

type Props = {
  initial: {
    allergies: string[];
    intolerances: string[];
    dietStyle: string;
    notes: string;
  };
};

export default function DietForm({ initial }: Props) {
  const router = useRouter();
  const [allergies, setAllergies] = useState<string[]>(initial.allergies);
  const [intolerances, setIntolerances] = useState<string[]>(initial.intolerances);
  const [dietStyle, setDietStyle] = useState<string>(initial.dietStyle);
  const [notes, setNotes] = useState<string>(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(setList: (next: string[]) => void, list: string[], item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      try {
        await updateChildDiet({ allergies, intolerances, dietStyle, notes });
        router.push("/onboarding/habits");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="app-frame">
      <div className="screen px-7 pt-9 pb-7">
        {/* Progress */}
        <div className="flex gap-[6px] mb-7">
          <div className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
        </div>

        {/* Hero */}
        <div className="text-center mb-7">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "#F4E5C7" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5A2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 22h20L12 2z" />
              <line x1="12" y1="9" x2="12" y2="14" />
              <circle cx="12" cy="18" r="0.6" fill="#8B5A2B" />
            </svg>
          </div>
          <div className="text-[12px] tracking-[0.16em] uppercase text-sage-deep mb-2 font-semibold">
            Step 2 of 4
          </div>
          <h2 className="font-serif text-[28px] leading-[1.2] font-medium text-ink tracking-[-0.015em] mb-2">
            Any <em className="text-sage-deep">dietary needs</em> we should know about?
          </h2>
          <p className="text-[14px] text-ink-soft leading-[1.5]">
            Anything you mark here, we&apos;ll never recommend.
          </p>
        </div>

        {/* Allergies */}
        <div className="mb-5">
          <div className="flex justify-between items-baseline mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-deep">
              Allergies
            </span>
            <small className="text-[11px] text-ink-mute font-medium">
              tap any that apply
            </small>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggle(setAllergies, allergies, a)}
                className={
                  "px-[14px] py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-all " +
                  (allergies.includes(a)
                    ? "bg-carrot text-cream-soft border-carrot"
                    : "bg-surface text-ink border-line hover:border-sage-soft")
                }
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Intolerances */}
        <div className="mb-5">
          <div className="flex justify-between items-baseline mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-deep">
              Intolerances
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INTOLERANCES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggle(setIntolerances, intolerances, a)}
                className={
                  "px-[14px] py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-all " +
                  (intolerances.includes(a)
                    ? "bg-carrot text-cream-soft border-carrot"
                    : "bg-surface text-ink border-line hover:border-sage-soft")
                }
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Diet style — single-select */}
        <div className="mb-5">
          <div className="flex justify-between items-baseline mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-deep">
              Diet style
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIET_STYLES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDietStyle(d.id)}
                className={
                  "px-[14px] py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-all " +
                  (dietStyle === d.id
                    ? "bg-sage-deep text-cream-soft border-sage-deep"
                    : "bg-surface text-ink border-line hover:border-sage-soft")
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-2">
          <label className="block text-[13px] font-semibold text-ink mb-2">
            Anything else we should know?
          </label>
          <textarea
            placeholder="e.g. dislikes anything spicy, sensitive to mushrooms, only drinks oat milk…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[70px] px-4 py-[14px] bg-surface border-[1.5px] border-line rounded-sm text-[15px] text-ink outline-none focus:border-sage transition-colors resize-none leading-[1.4]"
          />
        </div>

        <div className="mt-auto pt-5 flex flex-col gap-1">
          {error && (
            <div className="text-[12px] text-tomato bg-[#F8E2DE] border border-tomato/20 rounded-sm px-3 py-2 mb-1">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={pending}
            className="w-full bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Continue →"}
          </button>
          <Link
            href="/onboarding"
            className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
