"use client";

import React, { useState } from "react";
import InputField from "@/components/ui/InputField";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { registerVendorAction } from "@/app/auth/actions";

const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  fullName: z.string().optional(),
  dni: z.string().optional(),
  vendorName: z.string().min(1, "Nombre del comercio es obligatorio"),
  vendorAddress: z.string().optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

export default function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const supabase = createClient(); // client-side (ANON key)
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values: RegisterValues) => {
    setServerError(null);

    try {
      await registerVendorAction(values);
      reset();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un error";
      setServerError(message);
    }

    // try {
    //   const { error } = await supabase.auth.signUp({
    //       email: values.email,
    //       password: values.password,
    //     });
    //   if (error) throw error;
    //   reset();
    //   router.push("/auth/dashboard");
    // } catch (err: unknown) {
    //   const message = err instanceof Error ? err.message : "Ocurrió un error";
    //   setServerError(message);
    // }
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Registro de Vendor</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos de usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              type="email"
              register={register("email")}
              error={errors.email?.message as string | undefined}
            />
            <InputField
              label="Contraseña"
              type="password"
              register={register("password")}
              error={errors.password?.message as string | undefined}
              autoComplete="new-password"
            />
            <InputField
              label="Nombre completo (opcional)"
              register={register("fullName")}
              error={errors.fullName?.message as string | undefined}
            />
            <InputField
              label="DNI (opcional)"
              register={register("dni")}
              error={errors.dni?.message as string | undefined}
            />
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Nombre del comercio"
              register={register("vendorName")}
              error={errors.vendorName?.message as string | undefined}
              className="md:col-span-2"
            />
            <InputField
              label="Dirección"
              register={register("vendorAddress")}
              error={errors.vendorAddress?.message as string | undefined}
              className="md:col-span-2"
            />
            <InputField
              label="Apertura"
              type="time"
              register={register("openingHours")}
              error={errors.openingHours?.message as string | undefined}
            />
            <InputField
              label="Cierre"
              type="time"
              register={register("closingHours")}
              error={errors.closingHours?.message as string | undefined}
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