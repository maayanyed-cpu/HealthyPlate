import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* ElevenLabs TTS proxy.
   Looks up the "Mia" voice by name, caches its ID at the module level,
   and synthesizes the requested text. Falls back to a default ElevenLabs
   voice if Mia isn't in this account's library. Caches the resulting
   audio for 24 hours since text → audio is deterministic. */

const FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Bella — default pre-made voice
const MAX_TEXT_LEN = 500;

let voiceIdCache: string | null = null;

async function resolveVoiceId(apiKey: string): Promise<string> {
  if (voiceIdCache) return voiceIdCache;
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
    const mia = data.voices.find((v) => v.name.trim().toLowerCase() === "mia");
    if (mia) {
      voiceIdCache = mia.voice_id;
      console.log("[tts] resolved Mia voice_id:", mia.voice_id);
    } else {
      voiceIdCache = FALLBACK_VOICE_ID;
      console.log(
        "[tts] no voice named 'Mia' in this account; using fallback",
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

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("[tts] ELEVENLABS_API_KEY not set");
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
