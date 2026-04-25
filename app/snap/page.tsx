"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PlateSvg from "@/components/PlateSvg";
import { SNAP_DETECTION } from "@/lib/mockData";

type Phase = "idle" | "scanning" | "revealed";
type Mode = "before" | "after";

export default function SnapPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ background: "#1A201E" }} />}>
      <SnapInner />
    </Suspense>
  );
}

function SnapInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode: Mode = params.get("mode") === "after" ? "after" : "before";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<Phase>("idle");

  function handleShutter() {
    if (phase !== "idle") return;
    setPhase("scanning");

    /* Stage 1: scan animation (1.4s)
       Stage 2: reveal detection boxes for ~1.6s
       Stage 3: navigate forward */
    setTimeout(() => setPhase("revealed"), 1400);
    setTimeout(() => {
      router.push(mode === "before" ? "/snap/confirm" : "/snap/analysis");
    }, 3000);
  }

  const statusText =
    phase === "idle"
      ? mode === "before"
        ? "Center the plate in frame — we'll detect food and portions automatically."
        : "Snap the plate now — we'll calculate what was eaten."
      : phase === "scanning"
      ? "Identifying foods…"
      : "Found 3 items ✓";

  return (
    <div
      className="screen text-cream-soft"
      style={{ background: "#1A201E", paddingBottom: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          href="/home"
          aria-label="Close"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-cream-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
        <div className="text-[13px] font-semibold">Snap a meal</div>
        <button
          aria-label="Flash"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-cream-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
      </div>

      {/* Mode toggle */}
      <div className="mx-5 mb-2 bg-white/[0.08] rounded-full p-1 grid grid-cols-2 gap-0.5">
        <button
          type="button"
          onClick={() => setMode("before")}
          disabled={phase !== "idle"}
          className={
            "py-2 rounded-full text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all " +
            (mode === "before"
              ? "bg-cream-soft text-ink"
              : "text-white/60 hover:text-white/80")
          }
        >
          <span
            className={
              "w-1.5 h-1.5 rounded-full " +
              (mode === "before" ? "bg-sage-deep" : "bg-current opacity-50")
            }
          />
          Before
        </button>
        <button
          type="button"
          onClick={() => setMode("after")}
          disabled={phase !== "idle"}
          className={
            "py-2 rounded-full text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all " +
            (mode === "after"
              ? "bg-cream-soft text-ink"
              : "text-white/60 hover:text-white/80")
          }
        >
          <span
            className={
              "w-1.5 h-1.5 rounded-full " +
              (mode === "after" ? "bg-sage-deep" : "bg-current opacity-50")
            }
          />
          After eating
        </button>
      </div>

      {/* Viewfinder */}
      <div
        className="mx-5 mt-2 rounded-[28px] relative overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "4/5",
          background: "linear-gradient(135deg, #2A3530 0%, #4A6B5F 100%)",
        }}
      >
        <PlateSvg
          className="w-[80%] h-auto"
          variant={mode === "after" ? "after" : "before"}
        />

        {/* Detection boxes */}
        {phase === "revealed" &&
          SNAP_DETECTION.map((d, i) => (
            <div
              key={d.foodId}
              className="absolute border-2 rounded-[8px] animate-reveal-box"
              style={{
                top: d.box.top,
                left: d.box.left,
                width: d.box.width,
                height: d.box.height,
                borderColor: "#B8E1B8",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
                animationDelay: `${i * 0.12}s`,
                opacity: 0,
              }}
            >
              <span
                className="absolute -top-[22px] left-0 px-2 py-0.5 rounded-[6px] text-[10px] font-bold whitespace-nowrap"
                style={{ background: "#B8E1B8", color: "#1A201E" }}
              >
                {d.name.split(" ").slice(-1)[0]} · {d.confidence}%
              </span>
            </div>
          ))}

        {/* Scan line */}
        {phase === "scanning" && (
          <div
            className="absolute left-0 right-0 h-0.5 animate-scan"
            style={{
              background:
                "linear-gradient(90deg, transparent, #B8E1B8, transparent)",
              boxShadow: "0 0 12px #B8E1B8",
            }}
          />
        )}
      </div>

      {/* Status */}
      <div className="text-center px-5 pt-4 pb-3 text-[13px] text-white/70 min-h-[44px]">
        {phase === "scanning" || phase === "revealed" ? (
          <strong className="text-cream-soft font-semibold">{statusText}</strong>
        ) : (
          statusText
        )}
      </div>

      {/* Shutter */}
      <div className="flex justify-center items-center gap-9 px-5 pt-3 pb-9">
        <button
          aria-label="Photo library"
          className="w-11 h-11 rounded-[14px] bg-white/[0.08] text-cream-soft flex items-center justify-center"
          disabled={phase !== "idle"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleShutter}
          aria-label="Take photo"
          disabled={phase !== "idle"}
          className="w-[72px] h-[72px] rounded-full bg-cream-soft border-4 border-white/20 cursor-pointer hover:scale-95 active:scale-90 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 0 0 6px rgba(255,255,255,0.05)" }}
        />
        <button
          aria-label="Switch camera"
          className="w-11 h-11 rounded-[14px] bg-white/[0.08] text-cream-soft flex items-center justify-center"
          disabled={phase !== "idle"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
