import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

// Groq expone Whisper con la misma interfaz de OpenAI
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: NextRequest) {
  try {
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
