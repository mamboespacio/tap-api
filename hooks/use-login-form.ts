"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type LoginValues = {
  email: string;
  password: string;
};

export function useLoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>();

  const onSubmit = handleSubmit(async (values: LoginValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json?.error || "Error al iniciar sesión");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/dashboard";

      router.replace(returnTo);
    } catch (err: any) {
      console.error("useLoginForm error:", err);
      setServerError(err?.message ?? "Error de conexión");
    }
  });

  return {
    register,
    onSubmit,
    errors,
    isSubmitting,
    serverError,
  };
}