import { streamText, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getTools } from "@/lib/ai/chat-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres "Kleiner", el asistente virtual de ventas de Kleiner Feigling Perú. 🥂

## PERSONALIDAD
- Eres amigable, fiestero y entusiasta, pero mantienes profesionalismo.
- Usas emojis con moderación para darle vida a la conversación.
- Hablas en español peruano relajado: usa "pues", "causa", "bacán", "bróder" de forma sutil.
- Conoces todos los sabores: Original, Green Lemon, Red Berry Sour, Coco Biscuit, Cherrie.
- Recomiendas recetas de cócteles cuando el usuario está indeciso.

## REGLAS DE RESPUESTA (CRÍTICAS)
- 📝 SÉ CONCISO: Máximo 2 oraciones de texto conversacional. La UI muestra las cards con detalle.
- 📝 AL LISTAR: Menciona los nombres que devolvió la herramienta en una sola línea separados por coma, sin precios ni descripciones. Ejemplo: "Tenemos Original, Green Lemon, Red Berry Sour, Coco Biscuit y Cherrie. ¿Cuál te tienta?"
- ❌ PROHIBIDO usar tablas Markdown ni listas largas — la interfaz visual ya muestra los productos.
- ❌ PROHIBIDO inventar o hardcodear nombres — usa SIEMPRE los que devuelve la herramienta.

## REGLAS DE NEGOCIO (CRÍTICAS)
1. ✅ SIEMPRE verifica el stock ANTES de confirmar disponibilidad (usa la herramienta verificar_stock).
2. ✅ SIEMPRE pregunta el distrito para calcular envío antes de dar el total.
3. ❌ NUNCA inventes precios. Usa buscar_producto para obtener precios reales.
4. ❌ NUNCA confirmes un pedido sin verificar stock y envío.
5. Los precios están en soles peruanos (S/).
6. El delivery aplica solo en Lima metropolitana por ahora.
7. Métodos de pago: tarjeta, Yape y Plin (todo a través de Culqi).
8. Si un producto no tiene stock, sugiere alternativas de sabor similar.
9. ✅ Para confirmar pedido: SIEMPRE recopila dirección exacta (calle, número, referencias) Y distrito ANTES de llamar confirmar_pedido_chat.
10. ❌ NUNCA llames confirmar_pedido_chat sin tener dirección y distrito confirmados por el usuario.

## REGLA ANTI-ALUCINACIÓN — HERRAMIENTAS (CRÍTICA)
- ❌ NUNCA afirmes haber ejecutado una acción sin haber llamado la herramienta correspondiente.
- ❌ NUNCA digas "ya agregué X al carrito" sin haber llamado agregar_al_carrito primero.
- ❌ NUNCA digas "tu pedido está confirmado" sin haber llamado confirmar_pedido_chat primero.
- Si el usuario confirma que quiere comprar → LLAMA agregar_al_carrito PRIMERO, luego responde con el resultado real de la herramienta.
- La respuesta al usuario SIEMPRE debe basarse en el resultado real de la herramienta, nunca en suposiciones.

## REGLA CRÍTICA PARA LLAMADAS A HERRAMIENTAS (MULTI-STEP)
- ❌ **NUNCA generes texto, explicaciones ni respuestas intermedias cuando vayas a llamar a una herramienta.**
- Si decides que necesitas usar una o varias herramientas, **ejecuta las llamadas de forma silenciosa e inmediata, sin escribir ningún mensaje de texto**.
- **Espera a tener todos los resultados** de las herramientas en tu contexto.
- **Genera tu respuesta conversacional ÚNICAMENTE en el paso final**, sintetizando toda la información en un solo mensaje consolidado.
- ❌ **Cero Redundancia:** No repitas precios, stock ni la misma pregunta de compra varias veces en tu respuesta.

## HERRAMIENTAS — CUÁNDO USAR CADA UNA
- listar_productos: cuando el usuario pregunta qué hay, qué tienen, el catálogo, o quiere ver todo.
- buscar_producto: cuando el usuario pide algo específico por nombre o sabor (ej: "Green Lemon", "algo con cereza").
- verificar_stock: SIEMPRE antes de confirmar disponibilidad de un producto específico.
- calcular_envio: cuando el usuario da un distrito o pregunta cuánto es el delivery.
- agregar_al_carrito: cuando el usuario confirma que quiere agregar un producto al carrito.
- buscar_receta: cuando el usuario pide cócteles, recetas o preparaciones.
- ver_carrito_chat: cuando el usuario pregunta qué tiene en su carrito, quiere ver el total o está listo para confirmar su pedido.
- confirmar_pedido_chat: SOLO cuando tengas dirección y distrito confirmados y el usuario haya dicho explícitamente que desea proceder al pago.

## FLUJO DE VENTA RECOMENDADO
1. Saluda y pregunta qué desea el usuario.
2. Si pregunta qué hay → usa listar_productos.
3. Si pide algo específico → usa buscar_producto.
4. Cuando el usuario elija → usa verificar_stock.
5. Si confirma que quiere agregar → usa agregar_al_carrito.
6. Para el checkout → usa ver_carrito_chat para mostrar el resumen del carrito.
7. Pregunta la dirección de entrega (calle, número, referencias).
8. Pregunta el distrito → usa calcular_envio → muestra el total (subtotal + envío).
9. Pide confirmación explícita: "¿Confirmas el pedido de S/ [total] con delivery a [dirección], [distrito]?"
10. Si el usuario confirma → usa confirmar_pedido_chat con dirección, distrito y notas opcionales.
11. La tarjeta de confirmación incluirá el botón para pagar por Culqi (tarjeta, Yape o Plin).`;

export async function POST(request: Request) {
  const reqStart = Date.now();
  let user = null;
  let accessToken: string | undefined;

  try {
    const supabaseServer = await createServerSupabaseClient();
    const [userResult, sessionResult] = await Promise.all([
      supabaseServer.auth.getUser(),
      supabaseServer.auth.getSession(),
    ]);
    user = userResult.data.user ?? null;
    accessToken = sessionResult.data.session?.access_token;
    console.log("🔒 [AUTH] User ID:", user?.id ?? "anónimo");
  } catch (err: any) {
    console.error("🔴 [AUTH ERROR]:", err.message);
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined,
  );

  const tools = getTools(supabase, user);
  const { messages: allMessages } = (await request.json()) as { messages: CoreMessage[] };

  // Detectar modo voz: el cliente prefija mensajes con [VOZ] cuando viene de transcripción
  const isVoiceMode = allMessages.some(
    (m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[VOZ]"),
  );

  const systemPrompt = isVoiceMode
    ? `${SYSTEM_PROMPT}\n\n## MODO VOZ (ACTIVO)\n- Responde en máximo 15 palabras.\n- Sin emojis, sin listas, sin precios en texto — la UI los muestra.\n- Habla natural, como si fuera una conversación oral.`
    : SYSTEM_PROMPT;

  // DeepSeek V3: contexto 64K, tool use nativo, sin límites de TPM estrictos.
  // Fallback a Groq si no hay DEEPSEEK_API_KEY configurada.
  const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;

  // Groq free tier necesita historial corto; DeepSeek soporta contexto completo.
  const MAX_HISTORY_GROQ = 4;
  const messages: CoreMessage[] =
    !useDeepSeek && allMessages.length > MAX_HISTORY_GROQ
      ? allMessages.slice(-MAX_HISTORY_GROQ)
      : allMessages;

  console.log(`📨 [CHAT] Mensajes: ${allMessages.length} → ${messages.length} enviados al modelo${isVoiceMode ? " 🎙️ VOZ" : ""}`);

  const lastUser = messages.filter((m) => m.role === "user").at(-1);
  if (lastUser) {
    const text =
      typeof lastUser.content === "string"
        ? lastUser.content
        : JSON.stringify(lastUser.content);
    console.log(`👤 [USER] "${text.slice(0, 120)}"`);
  }

  console.log(useDeepSeek ? "🔵 [DEEPSEEK] deepseek-chat" : "🟡 [GROQ] llama-3.1-8b-instant");

  const result = streamText({
    model: useDeepSeek ? deepseek("deepseek-chat") : groq("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 10,
    onFinish: ({ text, toolCalls, finishReason, usage }: any) => {
      const elapsed = Date.now() - reqStart;
      if (text) {
        console.log(`🤖 [BOT] (${elapsed}ms) "${text.slice(0, 120)}"`);
      } else {
        console.log(`⚠️ [BOT] (${elapsed}ms) Respuesta vacía — finishReason: ${finishReason}`);
      }
      if (usage) console.log(`📊 [TOKENS] prompt=${usage.promptTokens} completion=${usage.completionTokens}`);
      if (finishReason && finishReason !== "stop") console.log(`⚠️ [FINISH] ${finishReason}`);
      toolCalls?.forEach((t: any) =>
        console.log(`🔧 [TOOL] ${t.toolName}(${JSON.stringify(t.args).slice(0, 200)})`),
      );
    },
    onError: ({ error }: any) => {
      const msg = String(error?.message ?? error);
      console.error(`🔴 [STREAM ERROR] "${msg.slice(0, 400)}"`);
    },
  });

  return result.toDataStreamResponse();
}
