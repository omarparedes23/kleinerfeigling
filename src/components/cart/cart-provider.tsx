"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart, fetchCartItemsFromDb } from "@/hooks/use-cart";
import type { User } from "@supabase/supabase-js";

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const setItems = useCart((state) => state.setItems);

  const supabase = createClient();

  // Refs to control sync state and avoid infinite loops
  const syncInProgress = useRef(false);
  const hasSyncedWithDb = useRef(false);

  // Hydration guard to prevent Next.js 15 SSR mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to Auth State changes
  useEffect(() => {
    if (!mounted) return;

    // Get initial session
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (!session?.user) {
          hasSyncedWithDb.current = true; // No DB sync needed for guests
        }
      } catch (err) {
        console.error("Error getting initial session in CartProvider:", err);
        hasSyncedWithDb.current = true;
      }
    }

    getInitialSession();

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === "SIGNED_IN" && currentUser) {
          hasSyncedWithDb.current = false; // Trigger database fetch/merge
        } else if (event === "SIGNED_OUT") {
          hasSyncedWithDb.current = true; // Guest state
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, supabase]);

  // Handle Sync when User logs in (merge guest items + DB items).
  // La DB es la única fuente de verdad: los items del carrito de invitado se empujan
  // al servidor vía la función atómica agregar_item_carrito (misma que usa el bot),
  // y después se relee de la DB — no se calcula ningún merge en el cliente.
  useEffect(() => {
    if (!mounted || !user || hasSyncedWithDb.current || syncInProgress.current) return;

    async function syncCartOnLogin() {
      syncInProgress.current = true;
      try {
        const dbItems = await fetchCartItemsFromDb(supabase, user!.id);
        const localItems = useCart.getState().items;

        const dbIds = new Set(dbItems.map((item) => item.id));
        const guestOnlyItems = localItems.filter((item) => !dbIds.has(item.id));

        for (const item of guestOnlyItems) {
          const productId = Math.floor(item.id / 10000);
          const volumenMl = item.id % 10000;
          const { error } = await supabase.rpc("agregar_item_carrito", {
            p_usuario_id: user!.id,
            p_product_id: productId,
            p_volumen_ml: volumenMl,
            p_cantidad: item.cantidad,
          });
          if (error) console.error("Error empujando item de invitado al carrito:", error.message);
        }

        const finalItems = guestOnlyItems.length > 0 ? await fetchCartItemsFromDb(supabase, user!.id) : dbItems;
        setItems(finalItems);

        hasSyncedWithDb.current = true;
      } catch (err) {
        console.error("Exception during cart sync on login:", err);
      } finally {
        syncInProgress.current = false;
      }
    }

    syncCartOnLogin();
  }, [mounted, user, setItems, supabase]);

  // SSR hydration guard
  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return <>{children}</>;
}
