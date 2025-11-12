// lib/api.ts
import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL ?? '' : '',
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;

  config.headers = config.headers ?? {};

  if (!config.headers.Authorization) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  return config;
});
