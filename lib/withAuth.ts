// lib/withAuth.ts
import { getToken } from '@/lib/getToken';

type Authed = { id: number; email?: string; name?: string } & Record<string, any>;

export function withAuth(
  handler: (user: Authed, req: Request) => Promise<Response>
) {
  return async function (req: Request): Promise<Response> {
    const auth = getToken(req); // tu getToken es síncrono

    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const rawId = auth.user.id;
    const idNum = typeof rawId === 'number' ? rawId : Number(rawId);
    if (!Number.isFinite(idNum) || !Number.isInteger(idNum)) {
      return new Response(JSON.stringify({ error: 'id de usuario inválido' }), {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const user: Authed = { ...auth.user, id: idNum };
    return handler(user, req);
  };
}
