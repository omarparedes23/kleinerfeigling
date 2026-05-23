"use client";

import { useActionState, useState, useEffect } from "react";
import { updateProfile } from "./actions";
import { toast } from "sonner";
import { Save, Loader2, Compass, Phone, Home, Mail, User } from "lucide-react";
import type { Profile, Distrito } from "@/types/product";

interface ProfileFormProps {
  profile: Profile | {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    direccion: string;
    distrito_id: number | null;
  };
  distritos: Distrito[];
}

export function ProfileForm({ profile, distritos }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [selectedDistritoId, setSelectedDistritoId] = useState<string>(
    profile.distrito_id ? String(profile.distrito_id) : ""
  );

  // Monitor action response to trigger premium feedback toast alerts
  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const selectedDistrito = distritos.find(
    (d) => String(d.id) === selectedDistritoId
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs to pass immutable parameters to validation schema */}
      <input type="hidden" name="id" value={profile.id} />
      <input type="hidden" name="email" value={profile.email} />

      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-500" />
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              defaultValue={profile.nombre}
              placeholder="Ingresa tu nombre"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-300 font-medium"
            />
            {state?.errors?.nombre && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {state.errors.nombre[0]}
              </p>
            )}
          </div>

          {/* Apellido Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-500" />
              Apellido
            </label>
            <input
              type="text"
              name="apellido"
              defaultValue={profile.apellido}
              placeholder="Ingresa tu apellido"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-300 font-medium"
            />
            {state?.errors?.apellido && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {state.errors.apellido[0]}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Input (Disabled/SSO Locked) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-neutral-600" />
              Email (No modificable)
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-neutral-900/40 border border-neutral-900/60 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-not-allowed font-medium"
            />
          </div>

          {/* Telefono Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-neutral-500" />
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              name="telefono"
              defaultValue={profile.telefono || ""}
              placeholder="Ej: +51 987 654 321"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-300 font-medium"
            />
            {state?.errors?.telefono && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                {state.errors.telefono[0]}
              </p>
            )}
          </div>
        </div>

        {/* Direccion Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-neutral-500" />
            Dirección Completa (Calle, Nro, Dpto/Int)
          </label>
          <input
            type="text"
            name="direccion"
            defaultValue={profile.direccion || ""}
            placeholder="Ej: Av. Benavides 1234, Dpto 402"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-300 font-medium"
          />
          {state?.errors?.direccion && (
            <p className="text-xs text-rose-500 font-semibold mt-1">
              {state.errors.direccion[0]}
            </p>
          )}
        </div>

        {/* Distrito Selector & Shipping Calculator */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-neutral-500" />
            Distrito de Entrega (Lima Metropolitana)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7">
              <select
                name="distrito_id"
                value={selectedDistritoId}
                onChange={(e) => setSelectedDistritoId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all duration-300 font-medium cursor-pointer"
              >
                <option value="">Selecciona tu distrito...</option>
                {distritos.map((distrito) => (
                  <option key={distrito.id} value={distrito.id}>
                    {distrito.nombre}
                  </option>
                ))}
              </select>
              {state?.errors?.distrito_id && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {state.errors.distrito_id[0]}
                </p>
              )}
            </div>

            {/* Dynamic District Cost Calculator Highlight Panel */}
            <div className="md:col-span-5 w-full">
              {selectedDistrito ? (
                <div className="p-3.5 rounded-xl border border-lime-400/20 bg-lime-950/10 text-lime-400 flex items-center justify-between shadow-[0_0_15px_rgba(163,230,53,0.05)] animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-black tracking-widest text-lime-500 block">
                      Tarifa Envío
                    </span>
                    <span className="text-xs font-black uppercase text-neutral-200">
                      Express Courier
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black block">
                      S/ {selectedDistrito.tarifa_envio.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-bold block">
                      ⏱️ {selectedDistrito.tiempo_estimado || "Mismo día"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-neutral-900 bg-neutral-900/20 text-neutral-500 flex items-center justify-center h-[58px] text-center border-dashed">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Calculador de envío inactivo
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-4 border-t border-neutral-900">
          <button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] text-neutral-950 font-black h-12 px-6 rounded-xl transition-all duration-300 uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Save className="h-4.5 w-4.5 stroke-[2.5px]" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
