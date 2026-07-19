import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import type { Database } from "@/types/database";
import type { SupabaseClient, User } from "@supabase/supabase-js";

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
export const getTools = (supabase: SupabaseClient<Database>, user: User | null) => ({
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
    execute: async (args) => {
      const limit = args?.limit ?? 10;
      const { data } = await supabase
        .from("kleiner_products")
        .select("id, nombre, slug, precio, precio_oferta, imagen_url, stock, sabor")
        .eq("activo", true)
        .gt("stock", 0)
        .order("destacado", { ascending: false })
        .limit(limit);
      return { productos: data ?? [] };
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
            return { productos: semanticResults };
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
        .select("id, nombre, slug, precio, precio_oferta, imagen_url, stock, sabor")
        .or(`nombre.ilike.%${term}%,sabor.ilike.%${term}%,descripcion.ilike.%${term}%`)
        .eq("activo", true)
        .gt("stock", 0)
        .limit(limit ?? 5);

      return {
        productos: (ftsResults ?? []).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          slug: p.slug,
          precio: p.precio,
          precio_oferta: p.precio_oferta,
          imagen_url: p.imagen_url,
          stock: p.stock,
          sabor: p.sabor,
          similarity: 0,
        }))
      };
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
      const { data, error } = await supabase
        .from("kleiner_products")
        .select("id, nombre, stock, precio, precio_oferta, imagen_url, sabor")
        .eq("id", product_id)
        .single();

      if (error || !data) {
        return { disponible: false, stock_actual: 0, mensaje: "Producto no encontrado" };
      }

      return {
        disponible: data.stock >= cantidad,
        stock_actual: data.stock,
        precio: data.precio,
        precio_oferta: data.precio_oferta,
        imagen_url: data.imagen_url,
        sabor: data.sabor,
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
   * Agrega productos al carrito del usuario en Supabase vía la función atómica
   * agregar_item_carrito (misma que usa el cliente), evitando condiciones de carrera.
   */
  agregar_al_carrito: tool({
    description:
      "Agrega uno o más productos al carrito del usuario. Retorna el total de items actualizado.",
    parameters: z.object({
      product_id: z.number().describe("ID numérico del producto"),
      cantidad: z.number().int().positive().max(50).describe("Cantidad a agregar (máximo 50 por pedido)"),
    }),
    execute: async ({ product_id, cantidad }) => {
      if (!user) {
        return {
          ok: false,
          total_items: 0,
          mensaje: "Debes iniciar sesión para agregar productos al carrito.",
        };
      }

      const { data: product } = await supabase
        .from("kleiner_products")
        .select("id, volumen_ml")
        .eq("id", product_id)
        .single();

      if (!product) {
        return { ok: false, total_items: 0, mensaje: "Producto no encontrado." };
      }

      // Función atómica: suma cantidad al ítem (o lo crea) sin condición de carrera
      // con el cliente, que llama la misma función desde el navegador.
      const { data, error } = await supabase.rpc("agregar_item_carrito", {
        p_usuario_id: user.id,
        p_product_id: product_id,
        p_volumen_ml: product.volumen_ml ?? 20,
        p_cantidad: cantidad,
      });

      if (error || !data || data.length === 0) {
        console.error("[agregar_al_carrito] Error en RPC agregar_item_carrito:", error?.message);
        return { ok: false, total_items: 0, mensaje: "Error al actualizar el carrito. Inténtalo de nuevo." };
      }

      const totalItems = data[0].out_total_items;

      return {
        ok: true,
        total_items: totalItems,
        mensaje: `✅ Producto agregado. Tu carrito tiene ${totalItems} ${totalItems === 1 ? "unidad" : "unidades"}.`,
      };
    },
  }),

  /**
   * Corrige la cantidad EXACTA de un producto ya en el carrito (o lo agrega si no está).
   * A diferencia de agregar_al_carrito (que suma), esta fija el valor — usar para correcciones.
   */
  modificar_cantidad_carrito: tool({
    description:
      "Corrige la cantidad EXACTA de un producto ya en el carrito, o lo agrega si no está. Usar SIEMPRE que el usuario corrija una cantidad ya agregada (ej. 'mejor que sean 3') — NUNCA volver a llamar agregar_al_carrito para corregir, esa suma en vez de fijar. cantidad=0 elimina el producto del carrito.",
    parameters: z.object({
      product_id: z.number().describe("ID numérico del producto"),
      cantidad: z.number().int().min(0).max(50).describe("Cantidad final exacta. 0 elimina el producto del carrito."),
    }),
    execute: async ({ product_id, cantidad }) => {
      if (!user) {
        return {
          ok: false,
          total_items: 0,
          mensaje: "Debes iniciar sesión para modificar el carrito.",
        };
      }

      const { data: product } = await supabase
        .from("kleiner_products")
        .select("id, volumen_ml")
        .eq("id", product_id)
        .single();

      if (!product) {
        return { ok: false, total_items: 0, mensaje: "Producto no encontrado." };
      }

      let { data: cart } = await supabase
        .from("kleiner_cart_sessions")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (!cart) {
        if (cantidad === 0) {
          return { ok: true, total_items: 0, mensaje: "Tu carrito ya está vacío." };
        }
        const { data: newCart, error: newCartError } = await supabase
          .from("kleiner_cart_sessions")
          .insert({ usuario_id: user.id, activo: true })
          .select("id")
          .single();

        if (newCartError || !newCart) {
          console.error("[modificar_cantidad_carrito] Error creando carrito:", newCartError?.message);
          return { ok: false, total_items: 0, mensaje: "Error al actualizar el carrito. Inténtalo de nuevo." };
        }
        cart = newCart;
      }

      const vol = product.volumen_ml ?? 20;

      if (cantidad === 0) {
        const { error: deleteError } = await supabase
          .from("kleiner_cart_items")
          .delete()
          .eq("cart_id", cart.id)
          .eq("product_id", product_id)
          .eq("volumen_ml", vol);

        if (deleteError) {
          console.error("[modificar_cantidad_carrito] Error eliminando ítem:", deleteError.message);
          return { ok: false, total_items: 0, mensaje: "Error al actualizar el carrito. Inténtalo de nuevo." };
        }
      } else {
        const { error: upsertError } = await supabase
          .from("kleiner_cart_items")
          .upsert(
            { cart_id: cart.id, product_id, volumen_ml: vol, cantidad, actualizado_en: new Date().toISOString() },
            { onConflict: "cart_id,product_id,volumen_ml" },
          );

        if (upsertError) {
          console.error("[modificar_cantidad_carrito] Error actualizando ítem:", upsertError.message);
          return { ok: false, total_items: 0, mensaje: "Error al actualizar el carrito. Inténtalo de nuevo." };
        }
      }

      const { data: items } = await supabase
        .from("kleiner_cart_items")
        .select("cantidad")
        .eq("cart_id", cart.id);

      const totalItems = (items ?? []).reduce((acc, i) => acc + i.cantidad, 0);

      return {
        ok: true,
        total_items: totalItems,
        mensaje:
          cantidad === 0
            ? `✅ Producto eliminado. Tu carrito tiene ${totalItems} ${totalItems === 1 ? "unidad" : "unidades"}.`
            : `✅ Cantidad corregida a ${cantidad}. Tu carrito tiene ${totalItems} ${totalItems === 1 ? "unidad" : "unidades"}.`,
      };
    },
  }),

  /**
   * Muestra el carrito actual del usuario con precios y subtotales.
   */
  ver_carrito_chat: tool({
    description:
      "Muestra el contenido actual del carrito del usuario con precios y subtotales. Usar cuando pregunte '¿qué tengo en el carrito?', '¿cuánto es el total?' o quiera revisar su pedido antes de confirmar.",
    parameters: z.object({}),
    execute: async () => {
      console.log("🛒 [ver_carrito_chat] Iniciando...");

      if (!user) {
        console.warn("🛒 [ver_carrito_chat] Sin sesión");
        return { ok: false, items: [], subtotal: 0, mensaje: "Debes iniciar sesión para ver tu carrito." };
      }
      console.log("🛒 [ver_carrito_chat] Usuario:", user.id);

      const { data: cart, error: cartError } = await supabase
        .from("kleiner_cart_sessions")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (cartError) console.warn("🛒 [ver_carrito_chat] Error leyendo carrito:", cartError.message);

      if (!cart) {
        return { ok: true, items: [], subtotal: 0, total_items: 0, mensaje: "Tu carrito está vacío. ¿Quieres ver nuestros productos?" };
      }

      const { data: cartItems, error: itemsError } = await supabase
        .from("kleiner_cart_items")
        .select("product_id, cantidad, kleiner_products(nombre, precio, precio_oferta, imagen_url, sabor)")
        .eq("cart_id", cart.id);

      if (itemsError) console.error("🛒 [ver_carrito_chat] Error leyendo items:", itemsError.message);
      console.log("🛒 [ver_carrito_chat] Items en carrito:", cartItems);

      if (!cartItems || cartItems.length === 0) {
        return { ok: true, items: [], subtotal: 0, total_items: 0, mensaje: "Tu carrito está vacío. ¿Quieres ver nuestros productos?" };
      }

      const enrichedItems = (cartItems as any[])
        .map((item) => {
          const product = item.kleiner_products;
          if (!product) {
            console.warn(`🛒 [ver_carrito_chat] Producto ID ${item.product_id} no encontrado en DB`);
            return null;
          }
          const unitPrice = product.precio_oferta
            ? Number(product.precio_oferta)
            : Number(product.precio);
          return {
            product_id: item.product_id,
            nombre: product.nombre,
            sabor: product.sabor,
            cantidad: item.cantidad,
            precio_unitario: unitPrice,
            subtotal: unitPrice * item.cantidad,
            imagen_url: product.imagen_url,
          };
        })
        .filter(Boolean);

      const subtotal = enrichedItems.reduce((acc, item) => acc + (item?.subtotal ?? 0), 0);
      const totalItems = enrichedItems.reduce((acc, item) => acc + (item?.cantidad ?? 0), 0);

      const response = {
        ok: true,
        items: enrichedItems,
        subtotal,
        total_items: totalItems,
        mensaje: `Tu carrito tiene ${enrichedItems.length} producto(s) · ${totalItems} unidad(es). Subtotal: S/ ${subtotal.toFixed(2)}`,
      };
      console.log("🛒 [ver_carrito_chat] Respuesta:", JSON.stringify({ subtotal, totalItems, count: enrichedItems.length }));
      return response;
    },
  }),

  /**
   * Valida el carrito (distrito + stock) y prepara el handoff a /carrito para pagar con tarjeta (Stripe).
   * No crea la orden ni decrementa stock — eso pasa en un solo lugar (crear-cargo), en el momento real del pago,
   * igual que para un comprador manual. Así se evita reservar stock de pedidos que nunca se pagan.
   */
  confirmar_pedido_chat: tool({
    description:
      "Valida el carrito, el distrito y el stock, y prepara el pedido para pagar con tarjeta. Usar SOLO cuando el usuario haya confirmado explícitamente la dirección de entrega, el distrito y que desea proceder al pago. No crea la orden todavía — eso pasa al pagar en /carrito.",
    parameters: z.object({
      direccion: z.string().describe("Dirección exacta de entrega (calle, número, referencias)"),
      distrito: z.string().describe("Distrito de Lima para el delivery"),
      notas: z.string().optional().describe("Notas adicionales para el repartidor"),
    }),
    execute: async ({ direccion, distrito, notas }) => {
      console.log(`📦 [confirmar_pedido_chat] Iniciando — distrito: "${distrito}", dirección: "${direccion}"`);

      if (!user) {
        console.warn("📦 [confirmar_pedido_chat] Sin sesión");
        return { ok: false, mensaje: "Debes iniciar sesión para confirmar tu pedido." };
      }
      console.log("📦 [confirmar_pedido_chat] Usuario:", user.id);

      // 1. Read cart
      const { data: cart, error: cartError } = await supabase
        .from("kleiner_cart_sessions")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (cartError) console.warn("📦 [confirmar_pedido_chat] Error leyendo carrito:", cartError.message);

      if (!cart) {
        return { ok: false, mensaje: "Tu carrito está vacío. Agrega productos antes de confirmar el pedido." };
      }

      const { data: rawCartItems, error: cartItemsError } = await supabase
        .from("kleiner_cart_items")
        .select("product_id, cantidad")
        .eq("cart_id", cart.id);

      if (cartItemsError) console.warn("📦 [confirmar_pedido_chat] Error leyendo items:", cartItemsError.message);
      const cartItems: { product_id: number; cantidad: number }[] = rawCartItems ?? [];

      console.log("📦 [confirmar_pedido_chat] Items en carrito:", cartItems);

      if (cartItems.length === 0) {
        return { ok: false, mensaje: "Tu carrito está vacío. Agrega productos antes de confirmar el pedido." };
      }

      // 2. Validate district
      const { data: districtData, error: districtError } = await supabase
        .from("kleiner_distritos")
        .select("id, nombre, tarifa_envio")
        .ilike("nombre", distrito.trim())
        .eq("disponible", true)
        .single();

      if (districtError) console.warn("📦 [confirmar_pedido_chat] Error buscando distrito:", districtError.message);
      console.log("📦 [confirmar_pedido_chat] Distrito encontrado:", districtData);

      if (!districtData) {
        const { data: allDistricts } = await supabase
          .from("kleiner_distritos")
          .select("nombre")
          .eq("disponible", true);
        const available = (allDistricts ?? []).map((d) => d.nombre).join(", ");
        return {
          ok: false,
          mensaje: `No cubrimos delivery en "${distrito}". Distritos disponibles: ${available}.`,
        };
      }

      // 3. Fetch products
      const productIds = cartItems.map((i) => i.product_id);
      const { data: products, error: productsError } = await supabase
        .from("kleiner_products")
        .select("id, nombre, precio, precio_oferta, stock")
        .in("id", productIds);

      if (productsError) console.error("📦 [confirmar_pedido_chat] Error leyendo productos:", productsError.message);
      console.log("📦 [confirmar_pedido_chat] Productos:", products?.map((p) => `${p.nombre} (stock:${p.stock})`));

      const productMap = new Map((products ?? []).map((p) => [p.id, p]));

      // 4. Validate stock
      for (const item of cartItems) {
        const product = productMap.get(item.product_id);
        if (!product || product.stock < item.cantidad) {
          console.warn(`📦 [confirmar_pedido_chat] Stock insuficiente: producto ${item.product_id}, stock ${product?.stock}, pedido ${item.cantidad}`);
          return {
            ok: false,
            mensaje: `Stock insuficiente para ${product?.nombre ?? `producto #${item.product_id}`}. Solo quedan ${product?.stock ?? 0} unidades.`,
          };
        }
      }

      // 5. Compute totals
      const subtotal = cartItems.reduce((acc, item) => {
        const p = productMap.get(item.product_id)!;
        const price = p.precio_oferta ? Number(p.precio_oferta) : Number(p.precio);
        return acc + price * item.cantidad;
      }, 0);

      const shippingFee = Number(districtData.tarifa_envio);
      const total = subtotal + shippingFee;
      console.log(`📦 [confirmar_pedido_chat] Totales — subtotal: ${subtotal}, envío: ${shippingFee}, total: ${total}`);

      // 6. Build items summary (la orden real se crea recién al pagar en /carrito vía crear-cargo)
      const itemsSummary = cartItems.map((item) => {
        const p = productMap.get(item.product_id)!;
        const unitPrice = p.precio_oferta ? Number(p.precio_oferta) : Number(p.precio);
        return {
          nombre: p.nombre,
          cantidad: item.cantidad,
          precio_unitario: unitPrice,
          subtotal: unitPrice * item.cantidad,
        };
      });

      const params = new URLSearchParams({ distrito_id: String(districtData.id), direccion });
      if (notas) params.set("notas", notas);

      const response = {
        ok: true,
        items: itemsSummary,
        subtotal,
        tarifa_envio: shippingFee,
        total,
        distrito: districtData.nombre,
        direccion_envio: direccion,
        payment_url: `/carrito?${params.toString()}`,
        mensaje: `Todo listo. Total: S/ ${total.toFixed(2)}. Entra a tu carrito para pagar con tarjeta.`,
      };
      console.log("📦 [confirmar_pedido_chat] Validado OK:", JSON.stringify({ total, distrito: districtData.nombre }));
      return response;
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
    execute: async (args) => {
      const producto = args?.producto;
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
});

export type Tools = ReturnType<typeof getTools>;
