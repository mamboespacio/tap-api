'use client';
import { useLoginForm } from '@/hooks/use-login-form';
import InputField from './ui/inputField';

export default function LoginFormContainer() {
  // Obtenemos los métodos del hook
    const {
      register,
      formState: { errors, isSubmitting },
      onSubmit,
      serverError,
    } = useLoginForm();
  // ... el resto de tu UI de formulario que usa register, handleSubmit, etc.
  return (
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
  );
}