import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Database } from "@/types/database";
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
        .select("id, nombre, slug, precio, precio_oferta, imagen_url, stock, sabor, volumen_ml")
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
        .select("*")
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
        .select("id, session_data")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (cartError) console.warn("🛒 [ver_carrito_chat] Error leyendo carrito:", cartError.message);

      const cartItems: { product_id: number; cantidad: number }[] =
        (cart?.session_data as { items: { product_id: number; cantidad: number }[] })?.items ?? [];

      console.log("🛒 [ver_carrito_chat] Items en carrito:", cartItems);

      if (cartItems.length === 0) {
        return { ok: true, items: [], subtotal: 0, total_items: 0, mensaje: "Tu carrito está vacío. ¿Quieres ver nuestros productos?" };
      }

      const productIds = cartItems.map((i) => i.product_id);
      const { data: products, error: productsError } = await supabase
        .from("kleiner_products")
        .select("id, nombre, precio, precio_oferta, imagen_url, sabor, volumen_ml")
        .in("id", productIds);

      if (productsError) console.error("🛒 [ver_carrito_chat] Error leyendo productos:", productsError.message);
      console.log("🛒 [ver_carrito_chat] Productos obtenidos:", products?.map((p) => p.nombre));

      const productMap = new Map((products ?? []).map((p) => [p.id, p]));

      const enrichedItems = cartItems
        .map((item) => {
          const product = productMap.get(item.product_id);
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
   * Confirma y crea el pedido en base al carrito activo del usuario.
   */
  confirmar_pedido_chat: tool({
    description:
      "Crea el pedido final en base al carrito del usuario. Usar SOLO cuando el usuario haya confirmado explícitamente la dirección de entrega, el distrito y que desea proceder al pago.",
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
        .select("id, session_data")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .single();

      if (cartError) console.warn("📦 [confirmar_pedido_chat] Error leyendo carrito:", cartError.message);

      const cartItems: { product_id: number; cantidad: number }[] =
        (cart?.session_data as { items: { product_id: number; cantidad: number }[] })?.items ?? [];

      console.log("📦 [confirmar_pedido_chat] Items en carrito:", cartItems);

      if (!cart || cartItems.length === 0) {
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

      // 6. Generate order code
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const orderCode = `KF-${dateStr}-${randomStr}`;
      console.log("📦 [confirmar_pedido_chat] Código de pedido:", orderCode);

      // 7. Create order (user RLS policy allows insert with auth.uid() = usuario_id)
      const { data: order, error: orderError } = await supabase
        .from("kleiner_orders")
        .insert({
          usuario_id: user.id,
          codigo_pedido: orderCode,
          estado: "pendiente",
          subtotal,
          tarifa_envio: shippingFee,
          descuento: 0,
          total,
          distrito_id: districtData.id,
          direccion_envio: direccion,
          notas: notas ?? null,
          origen: "bot_ia",
          pago_estado: "pendiente",
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("📦 [confirmar_pedido_chat] Error creando orden:", orderError);
        return { ok: false, mensaje: "Hubo un error al crear el pedido. Por favor inténtalo nuevamente." };
      }
      console.log("📦 [confirmar_pedido_chat] Orden creada con ID:", order.id);

      // 8. Insert order items (requires admin client — no user INSERT policy on order_items)
      const orderItems = cartItems.map((item) => {
        const p = productMap.get(item.product_id)!;
        const unitPrice = p.precio_oferta ? Number(p.precio_oferta) : Number(p.precio);
        return {
          order_id: order.id,
          product_id: item.product_id,
          cantidad: item.cantidad,
          precio_unitario: unitPrice,
          subtotal: unitPrice * item.cantidad,
        };
      });

      const admin = createAdminClient();
      console.log("📦 [confirmar_pedido_chat] Insertando order items:", orderItems);
      const { error: itemsError } = await admin.from("kleiner_order_items").insert(orderItems);

      if (itemsError) {
        console.error("📦 [confirmar_pedido_chat] Error insertando order items:", itemsError);
        return { ok: false, mensaje: "Error al registrar los detalles del pedido. Contacta soporte." };
      }
      console.log("📦 [confirmar_pedido_chat] Order items insertados OK");

      // 9. Decrement stock (RPC uses security definer — works with user client)
      const stockResults = await Promise.all(
        cartItems.map((item) =>
          supabase.rpc("decrementar_stock_seguro", {
            p_product_id: item.product_id,
            p_cantidad: item.cantidad,
          }),
        ),
      );
      stockResults.forEach((r, i) => {
        if (r.error) console.error(`📦 [confirmar_pedido_chat] Error decrementando stock producto ${cartItems[i].product_id}:`, r.error);
        else console.log(`📦 [confirmar_pedido_chat] Stock decrementado OK — producto ${cartItems[i].product_id}:`, r.data);
      });

      // 10. Deactivate cart
      const { error: cartDeactivateError } = await supabase
        .from("kleiner_cart_sessions")
        .update({ activo: false, actualizado_en: new Date().toISOString() })
        .eq("id", cart.id);

      if (cartDeactivateError) console.error("📦 [confirmar_pedido_chat] Error desactivando carrito:", cartDeactivateError);
      else console.log("📦 [confirmar_pedido_chat] Carrito desactivado OK");

      // 11. Build items summary
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

      const response = {
        ok: true,
        order_id: order.id,
        codigo_pedido: orderCode,
        items: itemsSummary,
        subtotal,
        tarifa_envio: shippingFee,
        total,
        distrito: districtData.nombre,
        direccion_envio: direccion,
        payment_url: `/carrito?order_id=${order.id}`,
        mensaje: `¡Pedido ${orderCode} creado! Total: S/ ${total.toFixed(2)}. Procede al pago por Culqi.`,
      };
      console.log("📦 [confirmar_pedido_chat] Éxito:", JSON.stringify({ order_id: order.id, codigo: orderCode, total }));
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
