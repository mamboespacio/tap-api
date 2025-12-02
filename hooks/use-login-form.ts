// src/hooks/use-login-form.ts

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

export function useLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search?.get("returnTo") || "/";
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      // Mensaje amigable para el error de credenciales incorrectas
      if (error.message.includes('invalid login credentials')) {
          setServerError("Email o contraseña incorrectos.");
      } else {
          setServerError(error.message || "Error al iniciar sesión");
      }
      return;
    }

    // ✅ Redirección segura con SSR refrescado
    form.reset();
    router.replace(returnTo);
    router.refresh();
  };

  return {
    ...form, // Expone register, handleSubmit, formState, etc.
    serverError,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
