import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // En Next.js 15+, cookies() es una Promesa y debe ser esperada (await)
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Se utiliza el método set de la instancia ya resuelta de cookieStore
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch (err) {
            // Nota: Esto es común en Server Components donde no se pueden setear cookies
            // durante el renderizado, solo en Server Actions o Route Handlers.
            console.warn('La configuración de cookies falló (posible Server Component):', err);
          }
        },
      },
    }
  )
}
