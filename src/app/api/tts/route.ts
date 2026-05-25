import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

// Cambia este ID por la voz que elijas en tu ElevenLabs dashboard
// Recomendado para español: busca "Valentina" o "Laura" en Voice Library
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily — multilingual, funciona bien en español

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("🔴 [TTS] ELEVENLABS_API_KEY no configurado en las variables de entorno.");
      return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurado." }, { status: 400 });
    }

    const { text } = (await request.json()) as { text: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto requerido." }, { status: 400 });
    }

    const truncated = text.slice(0, 500);
    console.log(`🔊 [TTS] Solicitando voz — ${truncated.length} chars — "${truncated.slice(0, 80)}..."`);

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncated,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    console.log(`🔊 [TTS] ElevenLabs status: ${res.status} — ${Date.now() - start}ms`);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`🔴 [TTS ERROR] status=${res.status} body="${errBody.slice(0, 500)}"`);
      return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`✅ [TTS] ${buffer.length} bytes — total ${Date.now() - start}ms`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`🔴 [TTS EXCEPTION] ${Date.now() - start}ms —`, error);
    return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
  }
}
