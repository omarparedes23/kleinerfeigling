import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient();
  
  // Obtain user session securely
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Query profile matching authenticated user id
  const { data: profile } = await supabase
    .from("kleiner_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Safeguard default model if profile registry has not been set yet
  const initialProfile = profile || {
    id: user.id,
    nombre: user.user_metadata?.nombre || "",
    apellido: user.user_metadata?.apellido || "",
    email: user.email || "",
    telefono: "",
    direccion: "",
    distrito_id: null,
  };

  // Fetch active Lima delivery districts
  const { data: distritos } = await supabase
    .from("kleiner_distritos")
    .select("*")
    .eq("disponible", true)
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide uppercase">
          Configuración de Perfil
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Actualiza tu información personal y dirección de entrega para recibir tus pedidos de forma rápida y segura.
        </p>
      </div>

      <ProfileForm 
        profile={initialProfile} 
        distritos={distritos || []} 
      />
    </div>
  );
}
