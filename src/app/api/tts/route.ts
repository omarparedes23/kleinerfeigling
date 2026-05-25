import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

// Cambia este ID por la voz que elijas en tu ElevenLabs dashboard
// Recomendado para español: busca "Valentina" o "Laura" en Voice Library
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily — multilingual, funciona bien en español

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurado." }, { status: 400 });
    }

    const { text } = (await request.json()) as { text: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto requerido." }, { status: 400 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[TTS_ELEVENLABS_ERROR]", res.status, err);
      return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`🔊 [TTS ElevenLabs] ${buffer.length} bytes — "${text.slice(0, 60)}..."`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[TTS_ERROR]", error);
    return NextResponse.json({ error: "Error al generar audio." }, { status: 500 });
  }
}
