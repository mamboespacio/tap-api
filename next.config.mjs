/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de env para asegurar que Vercel las use durante el build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    // Añade cualquier otra variable que necesites aquí
  },
};

export default nextConfig;