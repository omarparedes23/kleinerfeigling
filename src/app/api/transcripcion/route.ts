import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.warn("🎙️ [VOZ] Intento de transcripción sin GROQ_API_KEY configurado.");
      return NextResponse.json(
        { error: "Por favor, descomenta o configura GROQ_API_KEY en tu archivo .env.local para usar la transcripción por voz." },
        { status: 400 },
      );
    }

    const openai = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo de audio" },
        { status: 400 },
      );
    }

    // Validar tamaño (máx 25MB, límite de OpenAI)
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo de audio excede el límite de 25MB" },
        { status: 400 },
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-large-v3",
      file: audio,
      language: "es",
      response_format: "json",
    });

    console.log(`🎙️ [VOZ] "${transcription.text}"`);
    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("[TRANSCRIPCION_ERROR]", error);

    const message =
      error instanceof OpenAI.APIError
        ? `Error de OpenAI: ${error.message}`
        : "Error al procesar el audio. Intenta de nuevo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
