"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/InputField";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

type FormValues = z.infer<typeof RegisterVendorSchema>;

export default function RegisterVendorPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
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

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp(
        {
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.fullName || null,
              dni: values.dni || null,
              vendor_name: values.vendorName,
              vendor_address: values.vendorAddress || null,
              opening_hours: values.openingHours || null,
              closing_hours: values.closingHours || null,
            },
          }
        },
      );

      if (error) throw error;

      // Si la cuenta queda activa inmediatamente, data.user estará presente.
      // En cualquier caso redirigimos a una pantalla de "revisá tu email" o éxito.
      reset();
      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Ocurrió un error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              type="email"
              register={register("email")}
              error={errors.email?.message}
            />
            <InputField
              label="Contraseña"
              type="password"
              register={register("password")}
              error={errors.password?.message}
              autoComplete="new-password"
            />
            <InputField
              label="Nombre completo (opcional)"
              register={register("fullName")}
              error={errors.fullName?.message}
            />
            <InputField
              label="DNI (opcional)"
              register={register("dni")}
              error={errors.dni?.message}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Nombre del comercio"
              register={register("vendorName")}
              error={errors.vendorName?.message}
              className="md:col-span-2"
            />
            <InputField
              label="Dirección"
              register={register("vendorAddress")}
              error={errors.vendorAddress?.message}
              className="md:col-span-2"
            />
            <InputField
              label="Apertura"
              type="time"
              register={register("openingHours")}
              error={errors.openingHours?.message}
            />
            <InputField
              label="Cierre"
              type="time"
              register={register("closingHours")}
              error={errors.closingHours?.message}
            />
          </div>
        </section>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full bg-green-700 text-white shadow disabled:opacity-60"
        >
          {isSubmitting ? "Registrando…" : "Crear cuenta y comercio"}
        </button>
      </form>
    </div>
  );
}