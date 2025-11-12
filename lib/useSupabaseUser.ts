// lib/useSupabaseUser.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";

export function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
   // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);
  
  return user;
}