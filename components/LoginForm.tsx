"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import InputField from "@/components/ui/InputField";
import { createClient } from "@/lib/supabase/client";

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginFormClient() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  const supabase = createClient();

  const onSubmit = handleSubmit(async (values: LoginValues) => {
    setServerError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw new Error(error.message || "Error al iniciar sesión");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField
        label="Email"
        type="email"
        register={register("email")}
        error={errors.email?.message as string | undefined}
        autoComplete="email"
      />

      <InputField
        label="Contraseña"
        type="password"
        register={register("password")}
        error={errors.password?.message as string | undefined}
        autoComplete="current-password"
      />

      {serverError && <div className="text-sm text-red-600">{serverError}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 rounded-full bg-green-700 text-white shadow disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}