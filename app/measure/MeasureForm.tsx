"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMeasurements } from "./actions";

function formatLastMeasured(iso: string | null): string {
  if (!iso) return "Never measured yet";
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "Updated today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function MeasureForm({
  childName,
  initialHeight,
  initialWeight,
  lastMeasuredAt,
}: {
  childName: string;
  initialHeight: number | null;
  initialWeight: number | null;
  lastMeasuredAt: string | null;
}) {
  const router = useRouter();
  const [heightCm, setHeightCm] = useState(
    initialHeight !== null ? String(initialHeight) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initialWeight !== null ? String(initialWeight) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSave =
    heightCm.trim().length > 0 && weightKg.trim().length > 0 && !pending;

  function handleSave() {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!Number.isFinite(h) || !Number.isFinite(w)) {
      setError("Enter both height and weight as numbers.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateMeasurements({ heightCm: h, weightKg: w });
        router.push("/home");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="app-frame">
      <div className="screen px-7 pt-9 pb-7">
        <div className="flex justify-between items-center mb-5">
          <Link
            href="/home"
            className="text-ink-soft text-[13px] font-medium flex items-center gap-1 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </Link>
          <div className="text-[13px] font-semibold text-ink">Update measurements</div>
          <div className="w-[42px]" />
        </div>

        <div className="text-center mb-7">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-[28px]"
            style={{ background: "var(--sage-pale)" }}
            aria-hidden
          >
            📏
          </div>
          <h2 className="font-serif text-[26px] leading-[1.2] font-medium text-ink tracking-[-0.015em] mb-2">
            How&apos;s {childName} <em className="text-sage-deep">growing</em>?
          </h2>
          <p className="text-[13px] text-ink-soft leading-[1.5]">
            One minute now keeps {childName}&apos;s growth chart honest.
          </p>
          <div className="text-[11px] text-ink-mute mt-2 uppercase tracking-[0.14em] font-semibold">
            Last update: {formatLastMeasured(lastMeasuredAt)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-2">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">
              Height <span className="text-ink-mute font-medium text-[12px]">(cm)</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="e.g. 102"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-4 py-[14px] bg-surface border-[1.5px] border-line rounded-sm text-[15px] text-ink outline-none focus:border-sage transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-2">
              Weight <span className="text-ink-mute font-medium text-[12px]">(kg)</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="e.g. 16.4"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-4 py-[14px] bg-surface border-[1.5px] border-line rounded-sm text-[15px] text-ink outline-none focus:border-sage transition-colors"
            />
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
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Save measurements"}
          </button>
          <Link
            href="/home"
            className="w-full text-center text-ink-soft hover:text-ink py-3 text-[14px] font-medium"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
