"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// Strict Zod 3 validation schema mapping the database table Smaller Profiles
const profileSchema = z.object({
  id: z.string({ message: "ID de usuario inválido" }).uuid({ message: "El ID de usuario debe ser un UUID válido" }),
  nombre: z.string({ message: "El nombre es obligatorio" }).min(1, { message: "El nombre no puede estar vacío" }),
  apellido: z.string({ message: "El apellido es obligatorio" }).min(1, { message: "El apellido no puede estar vacío" }),
  email: z.string({ message: "El correo es obligatorio" }).email({ message: "El correo electrónico debe ser una dirección válida" }),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  distrito_id: z.number().nullable().optional(),
});

export async function updateProfile(prevState: unknown, formData: FormData) {
  const rawId = formData.get("id");
  const rawNombre = formData.get("nombre");
  const rawApellido = formData.get("apellido");
  const rawEmail = formData.get("email");
  const rawTelefono = formData.get("telefono");
  const rawDireccion = formData.get("direccion");
  const rawDistritoId = formData.get("distrito_id");

  // Type parse inputs safely
  const validated = profileSchema.safeParse({
    id: rawId,
    nombre: rawNombre,
    apellido: rawApellido,
    email: rawEmail,
    telefono: rawTelefono ? String(rawTelefono).trim() : null,
    direccion: rawDireccion ? String(rawDireccion).trim() : null,
    distrito_id: rawDistritoId && rawDistritoId !== "" ? Number(rawDistritoId) : null,
  });

  if (!validated.success) {
    const errorMap = validated.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Por favor corrige los errores del formulario.",
      errors: errorMap,
    };
  }

  const data = validated.data;

  try {
    const supabase = await createServerSupabaseClient();
    
    // Security: verify session user matches update target
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== data.id) {
      return {
        success: false,
        message: "No autorizado para realizar esta acción.",
      };
    }

    const { error } = await supabase
      .from("kleiner_profiles")
      .update({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        distrito_id: data.distrito_id,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) {
      console.error("Error updating profile in database:", error);
      return {
        success: false,
        message: `Error de base de datos: ${error.message}`,
      };
    }

    revalidatePath("/perfil");
    
    return {
      success: true,
      message: "¡Perfil actualizado con éxito!",
    };
  } catch (err) {
    console.error("Error in updateProfile server action:", err);
    const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
    return {
      success: false,
      message: errorMessage,
    };
  }
}
