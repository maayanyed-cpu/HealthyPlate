"use client";

import { useEffect } from "react";
import { VegetableAvatar, type AvatarFood } from "@/components/VegetableAvatar";

/* Synthesize a 3-note "ding ding ding" arpeggio via the Web Audio API.
   No asset to ship — just a tiny chime when foods are discovered. */
function playDiscoveryChime() {
  if (typeof window === "undefined") return;
  const W = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = W.AudioContext || W.webkitAudioContext;
  if (!Ctx) return;

  let ctx: AudioContext;
  try {
    ctx = new Ctx();
  } catch {
    return;
  }

  /* C5 → E5 → G5 — a happy major arpeggio */
  const notes = [523.25, 659.25, 783.99];
  const noteDuration = 0.18;
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.13;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + noteDuration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration + 0.05);
  });

  setTimeout(() => {
    ctx.close().catch(() => {});
  }, 1500);
}

export function DetectedFoodsGrid({ foods }: { foods: AvatarFood[] }) {
  useEffect(() => {
    /* Fired on confirm-page mount. Modern browsers gate audio on user
       interaction, but the snap-shutter tap counts — the context resumes
       cleanly here. Worst case it silently fails and we lose the chime. */
    playDiscoveryChime();
  }, []);

  if (foods.length === 0) {
    return (
      <div className="mx-5 mt-2 px-4 py-6 bg-cream rounded-[20px] text-center">
        <div className="text-[28px] mb-1" aria-hidden>🤔</div>
        <div className="font-serif text-[15px] text-ink">No foods spotted</div>
        <div className="text-[12px] text-ink-soft mt-1">
          Try retaking with the plate centered and well-lit.
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 grid grid-cols-2 gap-3">
      {foods.map((food, i) => (
        <VegetableAvatar key={food.id} food={food} index={i} />
      ))}
    </div>
  );
}
