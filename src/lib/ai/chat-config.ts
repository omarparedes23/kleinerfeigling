import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// ─── OpenAI client para embeddings ──────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "not-configured",
});

// ─── Recetas hardcodeadas ────────────────────────────────────
const RECETAS = [
  {
    nombre: "Feigling Sunrise",
    ingredientes: [
      "60ml Kleiner Feigling Original",
      "120ml jugo de naranja",
      "15ml granadina",
      "Hielo",
    ],
    preparacion:
      "Llena un vaso alto con hielo. Vierte el Kleiner Feigling, el jugo de naranja y la granadina. Remueve suavemente. Decora con una rodaja de naranja y una cereza.",
    sabor_recomendado: "Original",
  },
  {
    nombre: "Lemon Spark",
    ingredientes: [
      "50ml Kleiner Feigling Green Lemon",
      "150ml agua tónica",
      "Rodaja de limón",
      "Hojas de menta",
      "Hielo",
    ],
    preparacion:
      "En un vaso con hielo, vierte el Kleiner Feigling Green Lemon. Agrega la tónica lentamente. Exprime la rodaja de limón y decora con menta.",
    sabor_recomendado: "Green Lemon",
  },
  {
    nombre: "Berry Sour Kiss",
    ingredientes: [
      "60ml Kleiner Feigling Red Berry Sour",
      "30ml jugo de limón",
      "15ml jarabe de goma",
      "Clara de huevo (opcional)",
      "Hielo",
    ],
    preparacion:
      "Agita todos los ingredientes en una coctelera con hielo por 15 segundos. Cuela en un vaso old fashioned. Decora con frutos rojos.",
    sabor_recomendado: "Red Berry Sour",
  },
  {
    nombre: "Coco Delight",
    ingredientes: [
      "60ml Kleiner Feigling Coco Biscuit",
      "120ml leche de coco",
      "30ml crema de coco",
      "Canela en polvo",
      "Hielo",
    ],
    preparacion:
      "Licúa todos los ingredientes con hielo hasta obtener una textura suave. Sirve en un vaso escarchado con canela. Espolvorea más canela encima.",
    sabor_recomendado: "Coco Biscuit",
  },
  {
    nombre: "Cherrie Fizz",
    ingredientes: [
      "50ml Kleiner Feigling Cherrie",
      "100ml soda de cereza",
      "15ml jugo de limón",
      "Cerezas frescas",
      "Hielo",
    ],
    preparacion:
      "Llena una copa alta con hielo. Agrega el Kleiner Feigling Cherrie, el jugo de limón y completa con soda de cereza. Decora con cerezas frescas.",
    sabor_recomendado: "Cherrie",
  },
];

// ─── Tools ───────────────────────────────────────────────────
export const tools = {
  /**
   * Lista todos los productos activos del catálogo.
   * Usar cuando el usuario pregunta qué hay disponible en general.
   */
  listar_productos: tool({
    description:
      "Lista todos los productos disponibles de Kleiner Feigling. Usar cuando el usuario pregunta qué hay, qué tienen, o quiere ver el catálogo completo.",
    parameters: z.object({
      limit: z.number().optional().default(10),
    }),
    execute: async ({ limit }) => {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from("kleiner_products")
        .select("id, nombre, slug, precio, precio_oferta, imagen_url, stock, sabor, volumen_ml")
        .eq("activo", true)
        .gt("stock", 0)
        .order("destacado", { ascending: false })
        .limit(limit ?? 10);
      return data ?? [];
    },
  }),

  /**
   * Busca productos por nombre, sabor o descripción.
   * Usa pgvector (búsqueda semántica) con fallback a FTS en español.
   */
  buscar_producto: tool({
    description:
      "Busca productos de Kleiner Feigling por nombre, sabor o descripción. Retorna precio, stock, imagen y sabor.",
    parameters: z.object({
      query: z.string().describe("Nombre, sabor o descripción del producto a buscar"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ query, limit }) => {
      const supabase = await createServerSupabaseClient();

      // Búsqueda semántica solo si hay OPENAI_API_KEY disponible
      if (process.env.OPENAI_API_KEY) {
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
          });
          const embedding = embeddingResponse.data[0].embedding;
          const queryEmbedding = `[${embedding.join(",")}]`;

          const { data: semanticResults } = await supabase.rpc(
            "match_kleiner_products",
            { query_embedding: queryEmbedding, match_count: limit, min_similarity: 0.3 },
          );

          if (semanticResults && semanticResults.length > 0) {
            return semanticResults;
          }
        } catch (err) {
          console.warn("[buscar_producto] Embeddings fallido, usando FTS:", err);
        }
      }

      // Fallback: ilike por nombre o sabor (funciona con nombres en inglés como "Green Lemon")
      console.log("[buscar_producto] Sin resultados semánticos, usando ilike fallback para:", query);

      const term = query.trim();
      const { data: ftsResults } = await supabase
        .from("kleiner_products")
        .select("*")
        .or(`nombre.ilike.%${term}%,sabor.ilike.%${term}%,descripcion.ilike.%${term}%`)
        .eq("activo", true)
        .gt("stock", 0)
        .limit(limit ?? 5);

      return (ftsResults ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        precio: p.precio,
        precio_oferta: p.precio_oferta,
        imagen_url: p.imagen_url,
        stock: p.stock,
        sabor: p.sabor,
        similarity: 0,
      }));
    },
  }),

  /**
   * Verifica el stock disponible de un producto.
   */
  verificar_stock: tool({
    description:
      "Verifica el stock disponible de un producto específico. Usa SIEMPRE antes de confirmar disponibilidad.",
    parameters: z.object({
      product_id: z.number().describe("ID numérico del producto"),
      cantidad: z.number().positive().describe("Cantidad que el usuario desea comprar"),
    }),
    execute: async ({ product_id, cantidad }) => {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase
        .from("kleiner_products")
        .select("id, nombre, stock, precio")
        .eq("id", product_id)
        .single();

      if (error || !data) {
        return { disponible: false, stock_actual: 0, mensaje: "Producto no encontrado" };
      }

      return {
        disponible: data.stock >= cantidad,
        stock_actual: data.stock,
        precio: data.precio,
        nombre: data.nombre,
        mensaje:
          data.stock >= cantidad
            ? `✅ Stock disponible: ${data.stock} unidades`
            : `❌ Stock insuficiente. Solo quedan ${data.stock} unidades.`,
      };
    },
  }),

  /**
   * Calcula la tarifa de envío para un distrito de Lima.
   */
  calcular_envio: tool({
    description:
      "Calcula la tarifa de envío y tiempo estimado para un distrito de Lima metropolitana. Pregunta SIEMPRE el distrito antes del total.",
    parameters: z.object({
      distrito: z
        .string()
        .describe("Nombre del distrito en Lima (ej: Miraflores, Surco, San Isidro)"),
    }),
    execute: async ({ distrito }) => {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase
        .from("kleiner_distritos")
        .select("id, nombre, tarifa_envio, tiempo_estimado")
        .ilike("nombre", distrito.trim())
        .eq("disponible", true)
        .single();

      if (error || !data) {
        // Intentar búsqueda más flexible
        const { data: fuzzyData } = await supabase
          .from("kleiner_distritos")
          .select("id, nombre, tarifa_envio, tiempo_estimado")
          .eq("disponible", true);

        const distritosDisponibles = (fuzzyData ?? []).map((d) => d.nombre);

        return {
          disponible: false,
          mensaje: `Lo sentimos, no cubrimos delivery en "${distrito}". Distritos disponibles: ${distritosDisponibles.join(", ")}.`,
          distritos_disponibles: distritosDisponibles,
        };
      }

      return {
        disponible: true,
        distrito: data.nombre,
        tarifa: Number(data.tarifa_envio),
        tiempo: data.tiempo_estimado,
        mensaje: `🚚 Delivery a ${data.nombre}: S/ ${Number(data.tarifa_envio).toFixed(2)} (${data.tiempo_estimado})`,
      };
    },
  }),

  /**
   * Agrega productos al carrito del usuario en Supabase.
   */
  agregar_al_carrito: tool({
    description:
      "Agrega uno o más productos al carrito del usuario. Retorna el total de items actualizado.",
    parameters: z.object({
      product_id: z.number().describe("ID numérico del producto"),
      cantidad: z.number().positive().describe("Cantidad a agregar"),
    }),
    execute: async ({ product_id, cantidad }) => {
      const supabase = await createServerSupabaseClient();

      // Intentar obtener el usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Carrito anónimo - retornamos error (requiere auth para persistir)
        return {
          ok: false,
          total_items: 0,
          mensaje: "Debes iniciar sesión para agregar productos al carrito.",
        };
      }

      // Buscar carrito activo del usuario
      const { data: cart } = await supabase
        .from("kleiner_cart_sessions")
        .select("id, session_data")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      const currentItems: Array<{
        product_id: number;
        cantidad: number;
      }> = (cart?.session_data as { items: { product_id: number; cantidad: number }[] })
        ?.items ?? [];

      // Actualizar o agregar el item
      const existingIndex = currentItems.findIndex(
        (item) => item.product_id === product_id,
      );

      if (existingIndex >= 0) {
        currentItems[existingIndex].cantidad += cantidad;
      } else {
        currentItems.push({ product_id, cantidad });
      }

      const totalItems = currentItems.reduce((acc, item) => acc + item.cantidad, 0);

      const sessionData = { items: currentItems };

      if (cart) {
        // Actualizar carrito existente
        await supabase
          .from("kleiner_cart_sessions")
          .update({
            session_data: sessionData as unknown as Json,
            actualizado_en: new Date().toISOString(),
          })
          .eq("id", cart.id);
      } else {
        // Crear nuevo carrito
        await supabase.from("kleiner_cart_sessions").insert({
          usuario_id: user.id,
          session_data: sessionData as unknown as Json,
          activo: true,
        });
      }

      return {
        ok: true,
        total_items: totalItems,
        mensaje: `✅ Producto agregado. Tu carrito tiene ${totalItems} ${totalItems === 1 ? "unidad" : "unidades"}.`,
      };
    },
  }),

  /**
   * Sugiere recetas de cócteles con los sabores disponibles.
   * No requiere base de datos.
   */
  buscar_receta: tool({
    description:
      "Sugiere recetas de cócteles que se pueden preparar con los productos de Kleiner Feigling. Filtra por sabor si se especifica.",
    parameters: z.object({
      producto: z
        .string()
        .optional()
        .describe(
          "Sabor específico para filtrar recetas (Original, Green Lemon, Red Berry Sour, Coco Biscuit, Cherrie)",
        ),
    }),
    execute: async ({ producto }) => {
      if (producto) {
        const receta = RECETAS.find(
          (r) =>
            r.sabor_recomendado.toLowerCase() === producto.toLowerCase() ||
            r.nombre.toLowerCase().includes(producto.toLowerCase()),
        );

        if (receta) {
          return {
            recetas: [receta],
            total: 1,
            mensaje: `🥂 Aquí tienes una receta con ${producto}:`,
          };
        }

        return {
          recetas: RECETAS,
          total: RECETAS.length,
          mensaje: `No encontré una receta específica para "${producto}", pero aquí tienes todas nuestras recetas:`,
        };
      }

      return {
        recetas: RECETAS,
        total: RECETAS.length,
        mensaje:
          "🥂 ¡Aquí tienes nuestras mejores recetas con Kleiner Feigling! ¿Cuál te gusta más?",
      };
    },
  }),
};

export type Tools = typeof tools;
