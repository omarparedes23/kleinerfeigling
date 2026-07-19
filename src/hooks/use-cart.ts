import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

export interface CartItem {
  id: number; // Unique identifier: productId * 10000 + volumen_ml
  nombre: string;
  slug: string;
  cantidad: number;
  precio: number;
  volumen_ml: number;
  imagen_url: string;
}

interface CartStore {
  items: CartItem[];
  add: (product: any, quantity?: number, volume?: number) => Promise<void>;
  addItem: (product: any, quantity?: number, volume?: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// El id compuesto (productId*10000+volumen_ml) es reversible y se usa para
// ubicar la fila real en kleiner_cart_items sin necesitar guardar su uuid en el cliente.
function decomposeId(id: number) {
  return { productId: Math.floor(id / 10000), volumenMl: id % 10000 };
}

// Ubica la fila de kleiner_cart_items para el carrito activo del usuario dado un id compuesto.
async function findCartRow(supabase: ReturnType<typeof createClient>, usuarioId: string, id: number) {
  const { productId, volumenMl } = decomposeId(id);
  const { data: cart } = await supabase
    .from("kleiner_cart_sessions")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .single();
  if (!cart) return null;
  return { cartId: cart.id, productId, volumenMl };
}

// Lee el carrito activo del usuario directo de kleiner_cart_items (fuente de verdad en DB).
// Usado para reflejar en Zustand un cambio que ya escribió otro actor (ej. el bot vía RPC),
// sin volver a escribir — evita duplicar cantidades.
export async function fetchCartItemsFromDb(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string,
): Promise<CartItem[]> {
  const { data: cart } = await supabase
    .from("kleiner_cart_sessions")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .single();

  if (!cart) return [];

  const { data: rows } = await supabase
    .from("kleiner_cart_items")
    .select("product_id, volumen_ml, cantidad, kleiner_products(nombre, slug, precio, precio_oferta, imagen_url)")
    .eq("cart_id", cart.id);

  return ((rows ?? []) as any[])
    .map((row) => {
      const product = row.kleiner_products;
      if (!product) return null;
      const precio = product.precio_oferta ? Number(product.precio_oferta) : Number(product.precio);
      return {
        id: row.product_id * 10000 + row.volumen_ml,
        nombre: product.nombre,
        slug: product.slug ?? "",
        cantidad: row.cantidad,
        precio,
        volumen_ml: row.volumen_ml,
        imagen_url: product.imagen_url ?? "",
      } as CartItem;
    })
    .filter((item): item is CartItem => item !== null);
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: async (product, quantity = 1, volume) => {
        const previousItems = get().items;

        // Extract properties carefully to support both raw Product and CartItem formats
        const productId = product.product?.id ?? product.id;
        const nombre = product.product?.nombre ?? product.nombre;
        const slug = product.product?.slug ?? product.slug;
        const imagen_url = product.product?.imagen_url ?? product.imagen_url ?? "";
        const vol = volume ?? product.volumen_ml ?? product.selectedVolume ?? 20;
        const precio = Number(product.precio_oferta ?? product.precio ?? 0);

        // Generate unique item ID combining product ID and volume
        const cartItemId = productId * 10000 + vol;

        const existingItemIndex = previousItems.findIndex((item) => item.id === cartItemId);

        if (existingItemIndex > -1) {
          const updatedItems = [...previousItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            cantidad: updatedItems[existingItemIndex].cantidad + quantity,
          };
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...previousItems,
              { id: cartItemId, nombre, slug, cantidad: quantity, precio, volumen_ml: vol, imagen_url },
            ],
          });
        }

        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return; // invitado: el carrito vive solo en localStorage

          // Función atómica: suma cantidad al ítem (o lo crea) sin condición de carrera
          // con el bot, que llama la misma función server-side.
          const { error } = await supabase.rpc("agregar_item_carrito", {
            p_usuario_id: user.id,
            p_product_id: productId,
            p_volumen_ml: vol,
            p_cantidad: quantity,
          });

          if (error) {
            console.error("[cart] Error sincronizando alta con Supabase:", error.message);
            set({ items: previousItems }); // revertir el update optimista
          }
        } catch (err) {
          console.error("[cart] Excepción sincronizando alta:", err);
          set({ items: previousItems });
        }
      },

      // Alias for compatibility with existing components
      addItem: async (product, quantity, volume) => {
        await get().add(product, quantity, volume);
      },

      remove: async (id) => {
        const previousItems = get().items;
        set({ items: previousItems.filter((item) => item.id !== id) });

        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const row = await findCartRow(supabase, user.id, id);
          if (!row) return;

          const { error } = await supabase
            .from("kleiner_cart_items")
            .delete()
            .eq("cart_id", row.cartId)
            .eq("product_id", row.productId)
            .eq("volumen_ml", row.volumenMl);

          if (error) {
            console.error("[cart] Error sincronizando baja con Supabase:", error.message);
            set({ items: previousItems });
          }
        } catch (err) {
          console.error("[cart] Excepción sincronizando baja:", err);
          set({ items: previousItems });
        }
      },

      // Alias for compatibility
      removeItem: async (id) => {
        await get().remove(id);
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await get().remove(id);
          return;
        }

        const previousItems = get().items;
        set({
          items: previousItems.map((item) => (item.id === id ? { ...item, cantidad: quantity } : item)),
        });

        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const row = await findCartRow(supabase, user.id, id);
          if (!row) return;

          const { error } = await supabase
            .from("kleiner_cart_items")
            .update({ cantidad: quantity, actualizado_en: new Date().toISOString() })
            .eq("cart_id", row.cartId)
            .eq("product_id", row.productId)
            .eq("volumen_ml", row.volumenMl);

          if (error) {
            console.error("[cart] Error sincronizando cantidad con Supabase:", error.message);
            set({ items: previousItems });
          }
        } catch (err) {
          console.error("[cart] Excepción sincronizando cantidad:", err);
          set({ items: previousItems });
        }
      },

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.precio * item.cantidad, 0);
      },
    }),
    {
      name: "kleiner-cart",
    }
  )
);
