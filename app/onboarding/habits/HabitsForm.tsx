"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateChildHabits } from "./actions";

const HABITS = [
  {
    id: "refuses-vegetables",
    emoji: "🥦",
    title: "Refuses most vegetables",
    sub: "The classic standoff at every dinner",
  },
  {
    id: "rotation-eater",
    emoji: "🍝",
    title: "Eats the same 5 things on rotation",
    sub: "Plain pasta? Plain pasta.",
  },
  {
    id: "snacker",
    emoji: "🍪",
    title: "Snacks more than meals",
    sub: "Crackers, pouches, repeat",
  },
  {
    id: "supplement-curious",
    emoji: "🧴",
    title: "Curious about supplements",
    sub: "But unsure what they actually need",
  },
];

export default function HabitsForm({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      try {
        await updateChildHabits(selected);
        router.push("/onboarding/confirm");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="app-frame">
      <div className="screen px-7 pt-9 pb-7">
        <div className="flex gap-[6px] mb-7">
          <div className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-sage-deep" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
        </div>

        <div className="text-center mb-7">
          <div className="text-[12px] tracking-[0.16em] uppercase text-sage-deep mb-2 font-semibold">
            Step 3 of 4
          </div>
          <h2 className="font-serif text-[28px] leading-[1.2] font-medium text-ink tracking-[-0.015em] mb-2">
            What sounds like <em className="text-sage-deep">mealtime today</em>?
          </h2>
          <p className="text-[14px] text-ink-soft leading-[1.5]">
            Pick anything that fits. There are no wrong answers — and no judgement.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {HABITS.map((h) => {
            const on = selected.includes(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggle(h.id)}
                className={
                  "px-4 py-3.5 rounded-sm border-[1.5px] flex items-center gap-3.5 text-left w-full transition-all " +
                  (on
                    ? "border-sage-deep bg-sage-pale"
                    : "border-line bg-surface hover:border-sage-soft")
                }
              >
                <span
                  className={
                    "w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 " +
                    (on ? "bg-surface" : "bg-cream")
                  }
                >
                  {h.emoji}
                </span>
                <span className="text-[13px] font-medium text-ink">
                  {h.title}
                  <small className="block font-normal text-ink-soft mt-0.5 text-[12px]">
                    {h.sub}
                  </small>
                </span>
              </button>
            );
          })}
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
            href="/onboarding/diet"
            className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
