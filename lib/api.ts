// lib/api.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL ?? '' : '',
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;

  config.headers = config.headers ?? {};
  if (!config.headers.Authorization) {
    // 1) si tenés LS, úsalo (opcional)
    // const ls = localStorage.getItem('jwt');
    // if (ls) {
    //   config.headers.Authorization = `Bearer ${ls}`;
    //   return config;
    // }
    // 2) NextAuth session.apiJwt
    const session = await getSession();
    const apiJwt = (session as any)?.apiJwt;
    if (apiJwt) {
      config.headers.Authorization = `Bearer ${apiJwt}`;
    }
  }
  return config;
});
