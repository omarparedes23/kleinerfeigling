import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  add: (product: any, quantity?: number, volume?: number) => void;
  addItem: (product: any, quantity?: number, volume?: number) => void;
  remove: (id: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      add: (product, quantity = 1, volume) => {
        const items = get().items;
        
        // Extract properties carefully to support both raw Product and CartItem formats
        const productId = product.product?.id ?? product.id;
        const nombre = product.product?.nombre ?? product.nombre;
        const slug = product.product?.slug ?? product.slug;
        const imagen_url = product.product?.imagen_url ?? product.imagen_url ?? "";
        const vol = volume ?? product.volumen_ml ?? product.selectedVolume ?? 250;
        const precio = Number(product.precio_oferta ?? product.precio ?? 0);
        
        // Generate unique item ID combining product ID and volume
        const cartItemId = productId * 10000 + vol;
        
        const existingItemIndex = items.findIndex((item) => item.id === cartItemId);
        
        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].cantidad += quantity;
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...items,
              {
                id: cartItemId,
                nombre,
                slug,
                cantidad: quantity,
                precio,
                volumen_ml: vol,
                imagen_url,
              },
            ],
          });
        }
      },
      
      // Alias for compatibility with existing components
      addItem: (product, quantity = 1, volume) => {
        get().add(product, quantity, volume);
      },
      
      remove: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      
      // Alias for compatibility
      removeItem: (id) => {
        get().remove(id);
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== id) });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, cantidad: quantity } : item
          ),
        });
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
