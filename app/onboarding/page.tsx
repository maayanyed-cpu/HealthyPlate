"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { DEFAULT_CHILD } from "@/lib/mockData";
import { createChild } from "./actions";

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const GENDERS = [
  { id: "girl", label: "👧 Girl" },
  { id: "boy", label: "👦 Boy" },
  { id: "unspecified", label: "Prefer not to say" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState(DEFAULT_CHILD.name);
  const [age, setAge] = useState<number>(DEFAULT_CHILD.age);
  const [gender, setGender] =
    useState<"girl" | "boy" | "unspecified">(DEFAULT_CHILD.gender);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.style.setProperty("background", "var(--cream-soft)");
  }, []);

  const canContinue = name.trim().length > 0 && !pending;

  function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      try {
        await createChild({ name: name.trim(), age, gender });
        router.push("/onboarding/diet");
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
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-line" />
        </div>

        <div className="text-center mb-7">
          <div className="w-16 h-16 mx-auto mb-4 bg-sage-pale rounded-full flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A6B5F"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="text-[12px] tracking-[0.16em] uppercase text-sage-deep mb-2 font-semibold">
            Step 1 of 4
          </div>
          <h2 className="font-serif text-[28px] leading-[1.2] font-medium text-ink tracking-[-0.015em] mb-2">
            Tell us about <em className="text-sage-deep">your little one</em>
          </h2>
          <p className="text-[14px] text-ink-soft leading-[1.5]">
            We&apos;ll personalize everything to fit their age and palate.
          </p>
        </div>

        {/* Name */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-ink mb-2">
            Child&apos;s first name
          </label>
          <input
            type="text"
            placeholder="e.g. Maya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-[14px] bg-surface border-[1.5px] border-line rounded-sm text-[15px] text-ink outline-none focus:border-sage transition-colors"
          />
        </div>

        {/* Age */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-ink mb-2">Age</label>
          <div className="grid grid-cols-5 gap-2">
            {AGES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAge(a)}
                className={
                  "py-3 rounded-sm text-[15px] font-semibold border-[1.5px] transition-all " +
                  (age === a
                    ? "bg-sage-deep text-cream-soft border-sage-deep"
                    : "bg-surface text-ink border-line hover:border-sage-soft")
                }
              >
                {a}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAge(11)}
              className={
                "py-3 rounded-sm text-[15px] font-semibold border-[1.5px] transition-all " +
                (age >= 11
                  ? "bg-sage-deep text-cream-soft border-sage-deep"
                  : "bg-surface text-ink border-line hover:border-sage-soft")
              }
            >
              +
            </button>
          </div>
        </div>

        {/* Gender */}
        <div className="mb-2">
          <label className="block text-[13px] font-semibold text-ink mb-2">
            Gender{" "}
            <span className="text-ink-mute font-medium text-[12px]">
              (used for growth comparison curves)
            </span>
          </label>
          <div className="flex flex-wrap gap-[6px]">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className={
                  "px-[14px] py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-all " +
                  (gender === g.id
                    ? "bg-sage-deep text-cream-soft border-sage-deep"
                    : "bg-surface text-ink border-line hover:border-sage-soft")
                }
              >
                {g.label}
              </button>
            ))}
          </div>
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
            disabled={!canContinue}
            className="w-full bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Continue →"}
          </button>
          <Link
            href="/"
            className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
