import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getTools } from "../src/lib/ai/chat-config";
import { createAdminClient } from "../src/lib/supabase/admin";

// Load dotenv
require('dotenv').config({ path: '.env.local' });

const SYSTEM_PROMPT = `Eres "Kleiner", el asistente virtual de ventas de Kleiner Feigling Perú.`;

async function test() {
  console.log("Starting chat stream debug with Gemini Flash Latest (gemini-flash-latest)...");
  try {
    const supabaseAdmin = createAdminClient();
    const tools = getTools(supabaseAdmin, null);

    const result = streamText({
      model: google("gemini-flash-latest") as any,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: 'Hola, ¿qué licores hay?' }
      ],
      tools,
      maxSteps: 10,
    });

    console.log("Consuming stream...");
    for await (const chunk of result.fullStream) {
      console.log("Chunk type:", chunk.type);
      if (chunk.type === 'error') {
        console.error("Error chunk content:", chunk.error);
      } else if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.textDelta);
      } else if (chunk.type === 'tool-call') {
        console.log("\nTool Call:", chunk.toolName, chunk.args);
      } else if (chunk.type === 'tool-result') {
        console.log("\nTool Result:", chunk.toolName, "Result count:", Array.isArray(chunk.result) ? chunk.result.length : typeof chunk.result);
      }
    }
    console.log("\nDone consuming stream.");
  } catch (err) {
    console.error("Caught error during stream:", err);
  }
}

test();
