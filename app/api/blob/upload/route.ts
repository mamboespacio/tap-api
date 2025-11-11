// /app/api/blob/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'edge'; // opcional, recomendado para velocidad

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request: req,
      body,
      // Emitimos un token de subida para el cliente
      onBeforeGenerateToken: async () => {
        // TODO: validar auth si corresponde (JWT/cookie/etc.)
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          // maximumSize: 5_000_000, // opcional: 5MB
          tokenPayload: JSON.stringify({}), // opcional: info que quieras recibir luego
        };
      },
      // Se llama cuando Vercel Blob confirma la subida
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob subido:', blob.url, 'payload:', tokenPayload);
        // Opcional: registrar en DB, auditoría, etc.
      },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Upload error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
