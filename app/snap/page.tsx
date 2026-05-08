"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import PlateSvg from "@/components/PlateSvg";

type Phase = "idle" | "scanning" | "celebrating";
type Mode = "before" | "after";

type DetectedFood = {
  name: string;
  emoji: string;
  portionGrams: number;
  category: "vegetable" | "fruit" | "protein" | "grain" | "dairy" | "other";
  box: { x: number; y: number; width: number; height: number };
};

/* Helper to fire an mp3 from the /api/tts ElevenLabs proxy. The same
   <Audio> mechanism as the celebration chime, so if the chime plays
   through on the device, this should too. */
function playTts(text: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    audio.volume = 0.95;
    audio.play().catch((err) => {
      console.log("[snap] TTS not playing:", err);
    });
    return audio;
  } catch {
    return null;
  }
}

/* iOS Safari requires audio playback to be "unlocked" by initializing
   or resuming an AudioContext synchronously inside a user gesture. Once
   unlocked, subsequent HTMLAudioElement.play() calls (including async
   ones from setTimeout / promise-resolution callbacks) work normally.
   Idempotent — safe to call from every entry point. */
let audioContextRef: AudioContext | null = null;
function unlockAudioContext(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioContextRef) {
      const W = window as Window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = window.AudioContext || W.webkitAudioContext;
      if (Ctx) {
        audioContextRef = new Ctx();
      }
    }
    if (audioContextRef && audioContextRef.state === "suspended") {
      audioContextRef.resume().catch(() => {
        /* ignore */
      });
    }
  } catch {
    /* ignore */
  }
}

/* Resize + JPEG-encode the image client-side so it stays well under
   Anthropic's 5MB-after-base64 vision limit. Phone photos are routinely
   4-12 MB raw which would exceed the limit; downscaling to 1600px on
   the long edge with q=0.82 typically lands under 1 MB while preserving
   plenty of detail for food recognition. */
async function compressForVision(file: File): Promise<File> {
  const MAX_EDGE = 1600;
  const QUALITY = 0.82;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = objectUrl;
    });

    let { width, height } = img;
    if (width <= MAX_EDGE && height <= MAX_EDGE && file.size < 2 * 1024 * 1024) {
      /* Small enough already — skip the canvas round-trip. */
      return file;
    }
    const scale = Math.min(MAX_EDGE / width, MAX_EDGE / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", QUALITY);
    });
    if (!blob) throw new Error("Failed to encode image");

    const renamed = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], renamed, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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
  const incomingMealId = params.get("mealId");

  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [resultMealId, setResultMealId] = useState<string | null>(null);
  /* Two separate inputs: one with `capture` for the shutter (camera-only),
     one without for the library button (so iOS shows the gallery picker
     instead of locking to camera). */
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* Animate the Meal Power-Up bar while scanning. Curve approaches ~88% over
     ~7s — leaves headroom so the jump-to-100% on response feels earned. */
  useEffect(() => {
    if (phase !== "scanning") return;
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const target = 88 * (1 - Math.exp(-elapsed / 4));
      setProgress(target);
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  /* "Let's see!" while the AI is identifying foods. ElevenLabs voice
     via /api/tts. The shutter tap counts as the user gesture so the
     subsequent Audio.play() is allowed. */
  useEffect(() => {
    if (phase !== "scanning") return;
    let ttsAudio: HTMLAudioElement | null = null;
    const delay = setTimeout(() => {
      ttsAudio = playTts("Let me see what you have inside that plate!");
    }, 250);
    return () => {
      clearTimeout(delay);
      if (ttsAudio) ttsAudio.pause();
    };
  }, [phase]);

  /* Big finish: confetti + audio when we enter the celebrating phase. */
  useEffect(() => {
    if (phase !== "celebrating") return;
    console.log("[snap] celebrating with", detectedFoods.length, "characters:", detectedFoods.map((f) => f.name));

    const palette = ["#5A8073", "#D88463", "#E5B96A", "#FAF7F0", "#8B5A6B", "#B8E1B8"];
    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.45 },
      colors: palette,
    });
    const t1 = setTimeout(() => {
      confetti({ particleCount: 70, spread: 110, origin: { x: 0.15, y: 0.5 }, colors: palette });
    }, 220);
    const t2 = setTimeout(() => {
      confetti({ particleCount: 70, spread: 110, origin: { x: 0.85, y: 0.5 }, colors: palette });
    }, 440);

    /* Audio sequence:
         1. /HealthyPlate.mp4 chime (always, ~2-3s)
         2. ElevenLabs Mia line via /api/tts (only if veggies detected)
       Chained on the chime's `ended` event rather than a fixed
       setTimeout — iOS Safari serializes audio elements and the
       two audios on overlapping timers tend to cancel each other. */
    const hasVeggies = detectedFoods.some((f) => f.category === "vegetable");
    let ttsAudio: HTMLAudioElement | null = null;

    function fireVeggieLine() {
      if (!hasVeggies) return;
      ttsAudio = playTts(
        "Great job! You have veggies in your plate making you stronger!",
      );
    }

    const audio = new Audio("/HealthyPlate.mp4");
    audio.volume = 0.6;
    audio.onended = fireVeggieLine;
    audio.play().catch((err) => {
      console.log("[snap] HealthyPlate.mp4 not playing:", err);
      /* If the chime can't play, fall back to the TTS line directly so
         we still get the celebratory cue. */
      fireVeggieLine();
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      audio.pause();
      audio.onended = null;
      if (ttsAudio) ttsAudio.pause();
    };
  }, [phase, detectedFoods]);

  function handlePickFile(file: File) {
    unlockAudioContext();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPickedFile(file);
    setPreviewUrl(url);
    setError(null);
    triggerShutter(file);
  }

  function triggerShutter(fileForUpload: File | null) {
    if (phase !== "idle") return;
    setError(null);
    setPhase("scanning");

    (async () => {
      try {
        if (!fileForUpload) {
          throw new Error("Need a photo to identify foods. Tap the shutter to pick one.");
        }
        if (mode === "after" && !incomingMealId) {
          throw new Error("Missing mealId for after-shot. Start a new before-shot.");
        }

        const compressed = await compressForVision(fileForUpload);
        console.log(
          "[snap] compressed:",
          fileForUpload.size,
          "→",
          compressed.size,
          "bytes",
        );

        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("mode", mode);
        if (mode === "after" && incomingMealId) {
          formData.append("mealId", incomingMealId);
        }
        const res = await fetch("/api/blob/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Upload failed (${res.status}): ${errBody}`);
        }
        const data = (await res.json()) as { mealId: string; foods?: DetectedFood[] };
        console.log("[snap] processed, mealId:", data.mealId, "foods:", data.foods?.length);

        setProgress(100);
        setResultMealId(data.mealId);
        if (data.foods) setDetectedFoods(data.foods);

        /* Brief beat so the user sees the bar fill before the celebration. */
        setTimeout(() => setPhase("celebrating"), 350);
      } catch (e) {
        console.error("[snap] error:", e);
        setPhase("idle");
        setProgress(0);
        setDetectedFoods([]);
        setError(e instanceof Error ? e.message : "Something went wrong saving the snap.");
      }
    })();
  }

  function handleShutterClick() {
    if (phase !== "idle") return;
    /* Unlock audio synchronously inside the shutter tap — iOS Safari
       won't let later async <Audio>.play() calls produce sound unless
       an AudioContext was opened in this gesture. */
    unlockAudioContext();
    if (pickedFile) {
      triggerShutter(pickedFile);
    } else {
      cameraInputRef.current?.click();
    }
  }

  function resetPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPickedFile(null);
    setPreviewUrl(null);
  }

  function handleContinue() {
    if (!resultMealId) return;
    const nextHref =
      mode === "before"
        ? `/snap/confirm?mealId=${resultMealId}`
        : `/snap/analysis?mealId=${resultMealId}`;
    router.push(nextHref);
  }

  return (
    <div className="screen text-cream-soft" style={{ background: "#1A201E", paddingBottom: 0 }}>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePickFile(file);
        }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePickFile(file);
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 gap-2">
        <Link
          href="/home"
          aria-label="Close"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-cream-soft flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
        <div className="text-[13px] font-semibold flex-1 text-center">
          {phase === "celebrating" ? "Power-Up complete!" : "Snap a meal"}
        </div>
        {/* Opt-in registration. Always visible — copy is gentle so it doesn't
            nag returning users who already onboarded. */}
        <Link
          href="/onboarding"
          className="text-[11px] font-semibold text-cream-soft/80 hover:text-cream-soft px-3 py-1.5 rounded-full bg-white/10 flex-shrink-0 whitespace-nowrap"
        >
          Set up →
        </Link>
      </div>

      {/* Mode toggle — only when idle */}
      {phase === "idle" && (
        <div className="mx-5 mb-2 bg-white/[0.08] rounded-full p-1 grid grid-cols-2 gap-0.5">
          <button
            type="button"
            onClick={() => setMode("before")}
            className={
              "py-2 rounded-full text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all " +
              (mode === "before"
                ? "bg-cream-soft text-ink"
                : "text-white/60 hover:text-white/80")
            }
          >
            <span className={"w-1.5 h-1.5 rounded-full " + (mode === "before" ? "bg-sage-deep" : "bg-current opacity-50")} />
            Before
          </button>
          <button
            type="button"
            onClick={() => setMode("after")}
            className={
              "py-2 rounded-full text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all " +
              (mode === "after"
                ? "bg-cream-soft text-ink"
                : "text-white/60 hover:text-white/80")
            }
          >
            <span className={"w-1.5 h-1.5 rounded-full " + (mode === "after" ? "bg-sage-deep" : "bg-current opacity-50")} />
            After eating
          </button>
        </div>
      )}

      {/* Viewfinder + AR overlays */}
      <div
        className="mx-5 mt-2 rounded-[28px] relative overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "4/5",
          background: "linear-gradient(135deg, #2A3530 0%, #4A6B5F 100%)",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Meal preview"
            className={
              "w-full h-full " +
              (phase === "idle" ? "object-cover" : "object-contain")
            }
          />
        ) : (
          <PlateSvg className="w-[80%] h-auto" variant={mode === "after" ? "after" : "before"} />
        )}

        {/* Scan zone — corner brackets, dim, scan line — during scanning */}
        {phase === "scanning" && (
          <>
            <div className="absolute inset-0 bg-black/30 pointer-events-none animate-fade-in" />
            <div className="absolute top-3 left-3 w-7 h-7 border-t-[3px] border-l-[3px] border-[#B8E1B8] rounded-tl-[12px] pointer-events-none" />
            <div className="absolute top-3 right-3 w-7 h-7 border-t-[3px] border-r-[3px] border-[#B8E1B8] rounded-tr-[12px] pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-[3px] border-l-[3px] border-[#B8E1B8] rounded-bl-[12px] pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-[3px] border-r-[3px] border-[#B8E1B8] rounded-br-[12px] pointer-events-none" />
            <div
              className="absolute left-0 right-0 h-0.5 animate-scan pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, #B8E1B8, transparent)",
                boxShadow: "0 0 12px #B8E1B8",
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/40 rounded-full text-[11px] font-bold tracking-wider uppercase text-[#B8E1B8] backdrop-blur-sm">
              Scanning…
            </div>

            {/* Sweet mascot in the bottom-right with a "LET'S SEE!" speech
                bubble. Wiggles gently while the AI thinks. */}
            <div className="absolute bottom-4 right-4 flex items-end gap-2 pointer-events-none animate-fade-in">
              <div className="bg-cream-soft border-2 border-sage-pale rounded-[14px] px-3 py-2 shadow-md mb-3 relative">
                <div className="font-serif text-[12px] font-bold text-ink leading-tight max-w-[150px]">
                  LET ME SEE WHAT YOU HAVE!
                </div>
                {/* Tail pointing down-right at the carrot */}
                <div
                  className="absolute -bottom-[8px] right-3 w-0 h-0"
                  style={{
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: "9px solid var(--cream-soft)",
                  }}
                />
                <div
                  className="absolute -bottom-[10px] right-3 w-0 h-0 -z-10"
                  style={{
                    borderLeft: "9px solid transparent",
                    borderRight: "9px solid transparent",
                    borderTop: "10px solid var(--sage-pale)",
                  }}
                />
              </div>
              <div className="relative w-[60px] h-[60px] rounded-full bg-cream-soft border-[3px] border-sage-pale shadow-md flex items-center justify-center text-[34px] animate-wiggle">
                <span aria-hidden>🥕</span>
                {/* SVG eyes over the carrot to make it a character */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden
                >
                  <g transform="translate(50, 36)">
                    <circle cx="-10" cy="0" r="7" fill="#FAF7F0" stroke="#1A1A1A" strokeWidth="1.6" />
                    <circle cx="10" cy="0" r="7" fill="#FAF7F0" stroke="#1A1A1A" strokeWidth="1.6" />
                    <circle cx="-10" cy="2" r="3" fill="#1A1A1A" />
                    <circle cx="10" cy="2" r="3" fill="#1A1A1A" />
                    <circle cx="-8.5" cy="-1" r="1.2" fill="#FFFFFF" />
                    <circle cx="11.5" cy="-1" r="1.2" fill="#FFFFFF" />
                  </g>
                </svg>
              </div>
            </div>
          </>
        )}

        {/* AR characters — only fruits and vegetables get a dancing
            character; grains/proteins/dairy still appear in the meal
            list but don't get an AR overlay. */}
        {phase === "celebrating" &&
          detectedFoods
            .filter((f) => f.category === "vegetable" || f.category === "fruit")
            .map((food, i) => {
              const danceDelay = (i % 5) * 0.17;
              const driftDelay = (i % 4) * 0.6;
              return (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${food.box.x}%`,
                  top: `${food.box.y}%`,
                  width: `${food.box.width}%`,
                  height: `${food.box.height}%`,
                }}
              >
                {/* Flex-centered character inside the bounding box. */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="animate-float-drift"
                    style={{ animationDelay: `${driftDelay}s` }}
                  >
                    <div
                      className="relative animate-dance"
                      style={{ animationDelay: `${danceDelay}s` }}
                    >
                      <div
                        className="text-[80px] leading-none select-none"
                        style={{
                          filter:
                            "drop-shadow(0 6px 10px rgba(0,0,0,0.55)) drop-shadow(0 0 4px rgba(255,255,255,0.7))",
                        }}
                        aria-hidden
                      >
                        {food.emoji}
                      </div>
                      {/* Eyes + smile overlay with shine highlights. */}
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        aria-hidden
                      >
                        <g transform="translate(50, 38)">
                          <circle cx="-12" cy="0" r="8" fill="#FAF7F0" stroke="#1A1A1A" strokeWidth="2" />
                          <circle cx="12" cy="0" r="8" fill="#FAF7F0" stroke="#1A1A1A" strokeWidth="2" />
                          <circle cx="-11" cy="2" r="3.4" fill="#1A1A1A" />
                          <circle cx="13" cy="2" r="3.4" fill="#1A1A1A" />
                          <circle cx="-9.5" cy="-1.5" r="1.4" fill="#FFFFFF" />
                          <circle cx="14.5" cy="-1.5" r="1.4" fill="#FFFFFF" />
                          <path
                            d="M -10 17 Q 0 24 10 17"
                            fill="none"
                            stroke="#1A1A1A"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Name label tucked under the bounding box. */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-cream-soft px-2 py-0.5 rounded-full bg-black/65 whitespace-nowrap"
                  style={{ top: "100%", marginTop: "4px" }}
                >
                  {food.name}
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom panel: status / progress / shutter / continue */}
      <div className="flex flex-col gap-3 px-5 pt-4 pb-9">
        {phase === "idle" && (
          <>
            <div className="text-center text-[13px] min-h-[20px]">
              {error ? (
                <span className="text-[#F0C4A8] font-semibold">{error}</span>
              ) : (
                <span className="text-white/70">
                  {mode === "before"
                    ? "Tap the shutter to pick a meal photo — we'll detect food and portions."
                    : "Tap the shutter to snap how much was eaten."}
                </span>
              )}
            </div>
            <div className="flex justify-center items-center gap-9 pt-2">
              <button
                type="button"
                aria-label="Photo library"
                onClick={() => {
                  unlockAudioContext();
                  libraryInputRef.current?.click();
                }}
                className="w-11 h-11 rounded-[14px] bg-white/[0.08] text-cream-soft flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleShutterClick}
                aria-label="Take photo"
                className="w-[72px] h-[72px] rounded-full bg-cream-soft border-4 border-white/20 cursor-pointer hover:scale-95 active:scale-90 transition-transform"
                style={{ boxShadow: "0 0 0 6px rgba(255,255,255,0.05)" }}
              />
              <button
                type="button"
                aria-label="Reset preview"
                onClick={resetPreview}
                disabled={!pickedFile}
                className="w-11 h-11 rounded-[14px] bg-white/[0.08] text-cream-soft flex items-center justify-center disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
            </div>
          </>
        )}

        {phase === "scanning" && (
          <div className="px-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8E1B8] mb-1.5 flex items-center gap-1.5">
              <span aria-hidden>⚡</span> Meal Power-Up
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#B8E1B8] to-[#E5B96A] rounded-full transition-[width] duration-150 ease-out"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 10px rgba(184,225,184,0.6)",
                }}
              />
            </div>
            <div className="text-center text-[12px] text-white/60 pt-3">
              Identifying foods…
            </div>
          </div>
        )}

        {phase === "celebrating" && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="text-center font-serif text-[20px] text-cream-soft font-medium">
              {detectedFoods.length > 0
                ? `Found ${detectedFoods.length} ${detectedFoods.length === 1 ? "food" : "foods"}!`
                : "Snap saved!"}
              <span className="ml-1" aria-hidden>✨</span>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full bg-[#B8E1B8] hover:bg-cream-soft text-ink rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors active:scale-[0.97]"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
