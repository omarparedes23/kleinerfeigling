import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadAudioToR2 } from "@/lib/r2";

export const maxDuration = 30;

// Cambia este ID por la voz que elijas en tu ElevenLabs dashboard
// Recomendado para español: busca "Valentina" o "Laura" en Voice Library
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily — multilingual, funciona bien en español

type TtsProvider = "openai" | "elevenlabs";

function resolveTtsProvider(): TtsProvider {
  return process.env.TTS_PROVIDER?.toLowerCase() === "openai" ? "openai" : "elevenlabs";
}

async function synthesizeElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY no configurado.");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`ElevenLabs status=${res.status} body="${errBody.slice(0, 500)}"`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeOpenAI(text: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurado.");

  const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
  const voice = process.env.OPENAI_TTS_VOICE ?? "shimmer";

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI TTS status=${res.status} body="${errBody.slice(0, 500)}"`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const provider = resolveTtsProvider();

    if (provider === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) {
      console.error("🔴 [TTS] ELEVENLABS_API_KEY no configurado en las variables de entorno.");
      return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurado." }, { status: 400 });
    }
    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      console.error("🔴 [TTS] OPENAI_API_KEY no configurado en las variables de entorno.");
      return NextResponse.json({ error: "OPENAI_API_KEY no configurado." }, { status: 400 });
    }

    const { text } = (await request.json()) as { text: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto requerido." }, { status: 400 });
    }

    const truncated = text.slice(0, 500);
    // Prefijo con el provider: evita que un cambio de proveedor sirva audio cacheado del otro.
    const hash = createHash("md5").update(`${provider}:${truncated}`).digest("hex");

    console.log(`🔊 [TTS] provider=${provider} ${truncated.length} chars — hash: ${hash.slice(0, 8)}... "${truncated.slice(0, 60)}"`);

    // Cache lookup
    const supabase = createAdminClient();
    const { data: cached } = await supabase
      .from("kleiner_tts_cache")
      .select("r2_url, hit_count")
      .eq("text_hash", hash)
      .single();

    if (cached?.r2_url) {
      console.log(`✅ [TTS] Cache HIT — ${Date.now() - start}ms`);
      // Fire-and-forget increment — race condition en hit_count es aceptable para analytics
      supabase
        .from("kleiner_tts_cache")
        .update({ hit_count: cached.hit_count + 1 })
        .eq("text_hash", hash)
        .then(() => {});
      return NextResponse.json({ url: cached.r2_url, cached: true });
    }

    // Cache MISS — llamar al proveedor configurado
    console.log(`📡 [TTS] Cache MISS — llamando ${provider}`);
    let buffer: Buffer;
    try {
      buffer = provider === "openai" ? await synthesizeOpenAI(truncated) : await synthesizeElevenLabs(truncated);
    } catch (synthError) {
      console.error(`🔴 [TTS ERROR] provider=${provider}`, synthError);
      return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
    }

    console.log(`✅ [TTS] ${provider} OK — ${buffer.length} bytes — ${Date.now() - start}ms`);

    // Subir a R2 y cachear — fallback a buffer si R2 falla
    try {
      const r2Url = await uploadAudioToR2(hash, buffer);
      await supabase.from("kleiner_tts_cache").insert({
        text_hash: hash,
        r2_url: r2Url,
        text_content: truncated,
        char_count: truncated.length,
      });
      console.log(`📦 [TTS] Cacheado en R2 — total ${Date.now() - start}ms`);
      return NextResponse.json({ url: r2Url, cached: false });
    } catch (r2Error) {
      console.error(`🔴 [TTS] R2 upload falló, usando buffer fallback:`, r2Error);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (error) {
    console.error(`🔴 [TTS EXCEPTION] ${Date.now() - start}ms —`, error);
    return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
  }
}
