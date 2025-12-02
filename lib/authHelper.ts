// lib/authHelper.ts
// Usamos el runtime de Node.js aquí también por si acaso
export const runtime = 'nodejs';

import { createClient } from "@/lib/supabase/server";
// Ya que usas createClient de "@/lib/supabase/server", puedes usar tipos de supabase-js
import { User } from '@supabase/supabase-js'; 

// Definimos los headers CORS centralizados
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Valida la sesión del usuario con Supabase.
 * @returns {Promise<User | Response>} Retorna el objeto User si está autenticado, o un objeto Response de error si no lo está.
 */
export async function authenticateUser(): Promise<User | Response> {
  const supabase = await createClient();
  // Usamos getUser() para una validación segura en el servidor
  const { data: { user } } = await supabase.auth.getUser(); 

  if (!user) {
    // Si no hay usuario, devolvemos una respuesta de error 401
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Si hay usuario, retornamos el objeto user
  return user;
}
