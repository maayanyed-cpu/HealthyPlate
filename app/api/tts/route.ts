import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* ElevenLabs TTS proxy.
   Looks up the "Mia" voice by name, caches its ID at the module level,
   and synthesizes the requested text. Falls back to a default ElevenLabs
   voice if Mia isn't in this account's library. Caches the resulting
   audio for 24 hours since text → audio is deterministic. */

const FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Bella — default pre-made voice
const DEFAULT_VOICE_NAME = "Mia";
const MAX_TEXT_LEN = 500;

let voiceIdCache: string | null = null;

function escapeRegexFirstWord(name: string): RegExp {
  /* Match a voice whose name starts with `name` followed by space, dash,
     comma, or end of string. So "Mia" matches "Mia - Lively, Crisp,
     Expressive" but not "Miami" or "Mialey". */
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\s|-|,|$)`, "i");
}

async function resolveVoiceId(apiKey: string): Promise<string> {
  if (voiceIdCache) return voiceIdCache;

  /* TTS_VOICE_ID env wins — bypasses lookup entirely if you have a
     specific voice_id in mind. Useful for cloned/private voices. */
  const explicitId = process.env.TTS_VOICE_ID?.trim();
  if (explicitId) {
    voiceIdCache = explicitId;
    console.log("[tts] using TTS_VOICE_ID:", explicitId);
    return voiceIdCache;
  }

  const targetName = (process.env.TTS_VOICE_NAME?.trim() || DEFAULT_VOICE_NAME);

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) {
      console.log("[tts] /v1/voices failed:", res.status);
      voiceIdCache = FALLBACK_VOICE_ID;
      return voiceIdCache;
    }
    const data = (await res.json()) as {
      voices: Array<{ voice_id: string; name: string }>;
    };
    /* ElevenLabs voice names often include a tagline (e.g. "Mia - Lively,
       Crisp, Expressive"). Match by first-word so the suffix doesn't
       break us. */
    const re = escapeRegexFirstWord(targetName);
    const found = data.voices.find((v) => re.test(v.name.trim()));
    if (found) {
      voiceIdCache = found.voice_id;
      console.log(`[tts] resolved '${targetName}' → ${found.name}`, found.voice_id);
    } else {
      voiceIdCache = FALLBACK_VOICE_ID;
      console.log(
        `[tts] no voice matching '${targetName}' in this account; using fallback`,
        FALLBACK_VOICE_ID,
        "available:",
        data.voices.map((v) => v.name).join(", "),
      );
    }
    return voiceIdCache;
  } catch (e) {
    console.log("[tts] voice lookup failed:", e);
    voiceIdCache = FALLBACK_VOICE_ID;
    return voiceIdCache;
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const text = (url.searchParams.get("text") ?? "").slice(0, MAX_TEXT_LEN).trim();
  if (!text) return new NextResponse("Missing text param", { status: 400 });

  /* Accept either spelling — Vercel UI doesn't normalize and the user
     may have typed ELEVEN_LABS_API_KEY (with underscore) or
     ELEVENLABS_API_KEY (joined). */
  const apiKey =
    process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.log("[tts] no ElevenLabs API key set");
    return new NextResponse("TTS disabled (no API key)", { status: 503 });
  }

  const voiceId = await resolveVoiceId(apiKey);

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.55, similarity_boost: 0.85 },
      }),
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error(
      "[tts] elevenlabs failed:",
      upstream.status,
      detail.slice(0, 200),
    );
    return new NextResponse("TTS upstream failed", { status: 502 });
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "private, max-age=86400",
    },
  });
}
