// src/app/login/page.tsx
"use client";
export const dynamic = 'force-dynamic'; 

import { useLoginForm } from "@/hooks/use-login-form"; // Importamos el nuevo hook
import InputField from "@/components/ui/inputField";

export default function LoginPage() {
  // Obtenemos los métodos del hook
  const {
    register,
    formState: { errors, isSubmitting },
    onSubmit,
    serverError,
  } = useLoginForm();

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Iniciar Sesión</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Usamos InputField o la estructura de div/label/input */}
        <InputField 
            label="Email" 
            type="email" 
            register={register("email")} 
            error={errors.email?.message} 
            autoComplete="email"
        />
        
        <InputField 
            label="Contraseña" 
            type="password" 
            register={register("password")} 
            error={errors.password?.message} 
            autoComplete="current-password"
        />

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