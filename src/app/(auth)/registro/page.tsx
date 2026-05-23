"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Sparkles, CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";

// Validación estricta con Zod 3.x
const registerSchema = z.object({
  email: z
    .string({ message: "El correo electrónico es requerido" })
    .email({ message: "Introduce un correo electrónico válido" }),
});

function RegisterForm() {
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get("next") ?? "/perfil";

  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar con Zod 3
    const result = registerSchema.safeParse({ email });
    if (!result.success) {
      const formattedErrors = result.error.format();
      setErrors({ email: formattedErrors.email?._errors[0] });
      toast.error(formattedErrors.email?._errors[0] ?? "Error de validación");
      return;
    }

    startTransition(async () => {
      try {
        const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextRoute)}`;
        // signInWithOtp creará la cuenta automáticamente si no existe
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          toast.error(error.message || "Error al registrar la cuenta.");
          return;
        }

        setIsSubmitted(true);
        toast.success("¡Enlace de verificación enviado con éxito!");
      } catch (err) {
        console.error("Register unexpected error:", err);
        toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <Card className="w-full border-neutral-800/80 bg-neutral-900/60 shadow-2xl backdrop-blur-xl shadow-black">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/10 text-lime-400 ring-4 ring-lime-400/5">
          <UserPlus className="h-6 w-6 animate-pulse" />
        </div>
        <CardTitle className="bg-gradient-to-r from-lime-400 to-lime-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Crear Cuenta
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Regístrate usando tu email para recibir un enlace de registro mágico y seguro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/20 text-lime-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">¡Verifica tu correo!</h3>
              <p className="text-sm text-neutral-400 max-w-sm">
                Hemos enviado un correo de verificación a{" "}
                <span className="font-semibold text-lime-400">{email}</span>. Haz clic en el enlace para confirmar tu cuenta y completar tu perfil.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-lime-400 hover:text-lime-300 hover:bg-neutral-800/50 mt-4"
              onClick={() => setIsSubmitted(false)}
            >
              Intentar con otro correo electrónico
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="pl-11 h-12 bg-neutral-950/70 border-neutral-800 text-white placeholder-neutral-500 rounded-xl focus-visible:ring-lime-400/20 focus-visible:border-lime-400 transition-all"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-rose-500 pl-1">
                  {errors.email}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-xl bg-lime-400 text-neutral-950 hover:bg-lime-300 font-bold text-sm tracking-wide shadow-lg shadow-lime-400/20 hover:shadow-lime-400/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Registrarse e Iniciar Sesión
                  <Sparkles className="h-4 w-4 text-neutral-950" />
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-4 border-t border-neutral-800/40 pt-6">
        <p className="text-xs text-neutral-500 text-center">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href={`/login${nextRoute ? `?next=${encodeURIComponent(nextRoute)}` : ""}`}
            className="font-semibold text-lime-400 hover:text-lime-300 transition-colors"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-black py-12">
      {/* Luces de acento de discoteca premium - Green Lemon glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-lime-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-lime-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-lime-500/5 blur-[90px] pointer-events-none" />

      {/* Grid decorativo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.07] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[450px] space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link
            href="/"
            className="text-3xl font-black tracking-widest text-white hover:opacity-90 transition-opacity"
          >
            KLEINER<span className="text-lime-400">FEIGLING</span>
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-500">
            Premium Nightclub Experience
          </span>
        </div>

        <Suspense
          fallback={
            <Card className="w-full border-neutral-800 bg-neutral-900/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center h-[350px]">
              <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            </Card>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
