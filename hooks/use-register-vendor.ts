// src/hooks/use-register-vendor.ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
// Importamos la Server Action segura
import { registerVendorAction } from "@/app/actions"; 

// --- ESQUEMA ZOD ---
// Usamos un esquema ligeramente diferente para el formulario que combina user/vendor data
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
      email: "", password: "", fullName: "", dni: "",
      vendorName: "", vendorAddress: "",
    },
  });

  const onSubmit = async (values: RegisterVendorInput) => {
    setServerError(null);

    try {
      // Llamar a la Server Action para manejar todo el registro y creación de Vendor
      await registerVendorAction(values);

      // Redirigir al usuario al dashboard o a donde corresponda
      form.reset();
      router.replace("/dashboard");
      router.refresh(); 

    } catch (error: any) {
      setServerError(error.message);
    }
  };

  return {
    ...form,
    serverError,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
