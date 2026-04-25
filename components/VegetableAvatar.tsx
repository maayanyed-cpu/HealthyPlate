"use client";

import { useEffect, useState } from "react";
import { benefitFor } from "@/lib/foodBenefits";

export type AvatarFood = {
  id: string;
  name: string;
  emoji: string;
  portionGrams: number;
};

function portionLabel(grams: number): string {
  if (grams >= 70) return `≈ ½ cup · ~${grams} g`;
  if (grams >= 35) return `≈ ⅓ cup · ~${grams} g`;
  return `≈ ¼ cup · ~${grams} g`;
}

export function VegetableAvatar({
  food,
  index,
}: {
  food: AvatarFood;
  index: number;
}) {
  const [showBubble, setShowBubble] = useState(false);
  const { benefit, note } = benefitFor(food.name);

  useEffect(() => {
    if (!showBubble) return;
    const t = setTimeout(() => setShowBubble(false), 4500);
    return () => clearTimeout(t);
  }, [showBubble]);

  /* Each food dances on its own beat — staggered phase across the row. */
  const wiggleStyle = { animationDelay: `${(index % 4) * 0.18}s` };

  if (showBubble) {
    return (
      <button
        type="button"
        onClick={() => setShowBubble(false)}
        aria-label="Dismiss"
        className="w-full bg-cream border-2 border-sage-pale rounded-[20px] px-4 py-4 flex flex-col items-center gap-2 text-center animate-fade-in active:scale-[0.97] transition-transform shadow-sm"
      >
        <div className="text-[28px] animate-sparkle" aria-hidden>
          {note}
        </div>
        <div className="font-serif text-[13px] leading-snug text-ink">
          {benefit}
        </div>
        <div className="text-[10px] text-ink-mute uppercase tracking-wider mt-1">
          tap to close
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowBubble(true)}
      aria-label={`${food.name} — tap to hear me sing`}
      className="w-full bg-surface border border-line rounded-[20px] px-3 py-4 flex flex-col items-center gap-2 hover:border-sage-pale hover:shadow-sm transition-all active:scale-[0.97]"
    >
      <div
        className="relative w-[72px] h-[72px] rounded-full bg-sage-pale flex items-center justify-center text-[44px] animate-wiggle"
        style={wiggleStyle}
      >
        <span aria-hidden>{food.emoji}</span>
        {/* Layered SVG eyes turn every food into a little character. */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <g transform="translate(50, 30)">
            <circle cx="-10" cy="0" r="6.5" fill="#FAF7F0" stroke="#2D3A36" strokeWidth="1.5" />
            <circle cx="10" cy="0" r="6.5" fill="#FAF7F0" stroke="#2D3A36" strokeWidth="1.5" />
            <circle cx="-10" cy="2" r="2.6" fill="#2D3A36" />
            <circle cx="10" cy="2" r="2.6" fill="#2D3A36" />
            {/* Tiny smile arc */}
            <path
              d="M -8 14 Q 0 19 8 14"
              fill="none"
              stroke="#2D3A36"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      <div className="font-serif text-[14px] font-medium text-ink text-center leading-tight">
        {food.name}
      </div>
      <div className="text-[11px] text-ink-soft">
        {portionLabel(food.portionGrams)}
      </div>
    </button>
  );
}
