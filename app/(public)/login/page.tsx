"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});
type LoginInput = z.infer<typeof LoginSchema>;

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search?.get("returnTo") || "/";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message || "Error al iniciar sesión");
      return;
    }

    // ✅ Redirección segura con SSR refrescado
    router.replace(returnTo);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Iniciar Sesión</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Email</label>
          <input
            type="email"
            className="border rounded-lg px-3 py-2 bg-transparent"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <span className="text-sm text-red-500 mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">Contraseña</label>
          <input
            type="password"
            className="border rounded-lg px-3 py-2 bg-transparent"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <span className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {serverError && (
          <div className="text-sm text-red-600">{serverError}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full bg-green-700 text-white shadow disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="text-sm">
        ¿No tenés cuenta?{" "}
        <a className="underline" href="/register">
          Crear cuenta
        </a>
      </p>
    </div>
  );
}
