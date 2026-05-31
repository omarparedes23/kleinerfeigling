"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart, type CartItem } from "@/hooks/use-cart";
import type { User } from "@supabase/supabase-js";

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const items = useCart((state) => state.items);
  const setItems = useCart((state) => state.setItems);
  
  const supabase = createClient();
  
  // Refs to control sync state and avoid infinite loops
  const syncInProgress = useRef(false);
  const hasSyncedWithDb = useRef(false);
  const lastSyncedItemsString = useRef("");

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

  // Handle Sync when User logs in (merge guest items + DB items)
  useEffect(() => {
    if (!mounted || !user || hasSyncedWithDb.current || syncInProgress.current) return;

    async function syncCartOnLogin() {
      syncInProgress.current = true;
      try {
        // 1. Fetch active session cart from DB
        const { data: dbRecords, error: fetchError } = await supabase
          .from("kleiner_cart_sessions")
          .select("session_data")
          .eq("usuario_id", user!.id)
          .eq("activo", true);

        if (fetchError) {
          console.error("Error fetching cart session:", fetchError);
          return;
        }

        const dbItems = (dbRecords?.[0]?.session_data as unknown as CartItem[]) || [];
        const localItems = useCart.getState().items;


        // 2. Merge local guest items with DB items (sum quantities for matching product ID + volume)
        const mergedMap = new Map<number, CartItem>();

        // Add DB items first
        dbItems.forEach((item) => {
          mergedMap.set(item.id, { ...item });
        });

        // Add local items (take max per item to prevent doubling on repeated syncs)
        localItems.forEach((item) => {
          const existing = mergedMap.get(item.id);
          if (existing) {
            existing.cantidad = Math.max(existing.cantidad, item.cantidad);
          } else {
            mergedMap.set(item.id, { ...item });
          }
        });

        const mergedItems = Array.from(mergedMap.values());
        
        // 3. Update local Zustand state
        setItems(mergedItems);
        lastSyncedItemsString.current = JSON.stringify(mergedItems);

        // 4. Save merged cart to DB
        const hasRecord = dbRecords && dbRecords.length > 0;
        if (hasRecord) {
          await supabase
            .from("kleiner_cart_sessions")
            .update({
              session_data: mergedItems as any,
              actualizado_en: new Date().toISOString(),
            })
            .eq("usuario_id", user!.id)
            .eq("activo", true);
        } else {
          await supabase
            .from("kleiner_cart_sessions")
            .insert({
              usuario_id: user!.id,
              session_data: mergedItems as any,
              activo: true,
              actualizado_en: new Date().toISOString(),
            });
        }


        hasSyncedWithDb.current = true;
      } catch (err) {
        console.error("Exception during cart sync on login:", err);
      } finally {
        syncInProgress.current = false;
      }
    }

    syncCartOnLogin();
  }, [mounted, user, setItems, supabase]);

  // Handle Sync on Local Cart Mutations (Upsert local cart changes to database)
  useEffect(() => {
    if (!mounted || !user || !hasSyncedWithDb.current || syncInProgress.current) return;

    const itemsString = JSON.stringify(items);
    if (itemsString === lastSyncedItemsString.current) return;

    async function syncCartOnMutation() {
      syncInProgress.current = true;
      try {
        // Query to check if record exists
        const { data: dbRecords } = await supabase
          .from("kleiner_cart_sessions")
          .select("id")
          .eq("usuario_id", user!.id)
          .eq("activo", true);

        const hasRecord = dbRecords && dbRecords.length > 0;
        
        if (hasRecord) {
          await supabase
            .from("kleiner_cart_sessions")
            .update({
              session_data: items as any,
              actualizado_en: new Date().toISOString(),
            })
            .eq("usuario_id", user!.id)
            .eq("activo", true);
        } else {
          await supabase
            .from("kleiner_cart_sessions")
            .insert({
              usuario_id: user!.id,
              session_data: items as any,
              activo: true,
              actualizado_en: new Date().toISOString(),
            });
        }


        lastSyncedItemsString.current = itemsString;
      } catch (err) {
        console.error("Error syncing cart on mutation:", err);
      } finally {
        syncInProgress.current = false;
      }
    }

    // Debounce/delay the synchronization slightly to avoid excessive calls on rapid updates
    const timer = setTimeout(() => {
      syncCartOnMutation();
    }, 800);

    return () => clearTimeout(timer);
  }, [mounted, items, user, supabase]);

  // SSR hydration guard
  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return <>{children}</>;
}
