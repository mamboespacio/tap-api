"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";

// --- ESQUEMA ZOD ---
// Usa el mismo esquema que tenías
const RegisterVendorSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  fullName: z.string().optional().or(z.literal("")),
  dni: z.string().optional().or(z.literal("")),
  vendorName: z.string().min(2, "Muy corto"),
  vendorAddress: z.string().optional().or(z.literal("")),
  openingHours: z.string().optional().or(z.literal("")),
  closingHours: z.string().optional().or(z.literal("")),
});

type RegisterVendorInput = z.infer<typeof RegisterVendorSchema>;

export function useRegisterVendor() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterVendorInput>({
    resolver: zodResolver(RegisterVendorSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      dni: "",
      vendorName: "",
      vendorAddress: "",
      openingHours: "",
      closingHours: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values: RegisterVendorInput) => {
    setServerError(null);

    try {
      // Llamamos al endpoint server-side que crea el usuario y, opcionalmente,
      // puede crear el vendor en la BD. Este endpoint usa createClient(cookieStore)
      // por lo que en web también se setearán las cookies que permiten que
      // supabase.auth.getUser() funcione en Server Components.
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json?.error || "Error al registrarse");
        return;
      }

      // Si el signup requiere confirmación por email, data.session podría ser null.
      // Si quieres redirigir directamente sólo cuando haya sesión válida:
      // if (json.session) { ... }
      // Para UX simple: redirigir al dashboard (o a una página de confirmación)
      form.reset();
      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      setServerError(error?.message ?? String(error));
    }
  });

  return {
    ...form,
    serverError,
    onSubmit,
  };
}