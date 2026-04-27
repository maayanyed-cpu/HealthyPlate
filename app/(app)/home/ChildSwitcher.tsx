"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { setActiveChild } from "./actions";

type ChildOption = {
  id: string;
  name: string;
  age: number;
  gender: string;
};

const GENDER_EMOJI: Record<string, string> = {
  girl: "👧",
  boy: "👦",
};

export default function ChildSwitcher({
  active,
  kids,
}: {
  active: { id: string | null; name: string; age: number; gender: string };
  kids: ChildOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* Close the menu when tapping outside, hitting Escape, or scrolling
     enough that the anchored menu would float far from its trigger. */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handlePick(childId: string) {
    if (childId === active.id) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        await setActiveChild(childId);
        setOpen(false);
        router.refresh();
      } catch {
        setOpen(false);
      }
    });
  }

  const initial = active.name.charAt(0).toUpperCase();
  const showCaret = kids.length > 1 || active.id !== null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        className="bg-surface border border-line rounded-full pl-3 pr-1 py-1 flex items-center gap-2 text-[13px] font-semibold disabled:opacity-60"
      >
        {active.name} · {active.age}
        {showCaret && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={"text-ink-soft transition-transform " + (open ? "rotate-180" : "")}
            aria-hidden
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
        <span className="w-6 h-6 rounded-full bg-sage-pale flex items-center justify-center text-[12px] text-sage-deep font-bold">
          {initial}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 bg-surface border border-line rounded-[16px] shadow-md py-1.5 z-30 animate-fade-in"
        >
          <div className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-mute font-bold">
            My kids
          </div>
          {kids.map((c) => {
            const selected = c.id === active.id;
            const emoji = GENDER_EMOJI[c.gender] ?? "👤";
            return (
              <button
                key={c.id}
                type="button"
                role="menuitem"
                onClick={() => handlePick(c.id)}
                disabled={pending}
                className={
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors " +
                  (selected
                    ? "bg-sage-pale/60 text-ink"
                    : "text-ink hover:bg-cream-soft")
                }
              >
                <span className="text-[16px]" aria-hidden>{emoji}</span>
                <span className="flex-1 font-medium">
                  {c.name}
                  <small className="block text-[11px] text-ink-soft font-normal">
                    Age {c.age}
                  </small>
                </span>
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
          <div className="my-1.5 border-t border-line-soft" />
          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-sage-deep font-semibold hover:bg-sage-pale/40"
            onClick={() => setOpen(false)}
          >
            <span className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            Add another child
          </Link>
        </div>
      )}
    </div>
  );
}
