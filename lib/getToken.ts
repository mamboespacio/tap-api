// lib/getToken.ts
import jwt from "jsonwebtoken";

export type TokenUser = {
  id: number;
  email?: string;
  name?: string;
};

type Decoded = jwt.JwtPayload & {
  id?: number | string;  // tu token siempre usa "id"
  email?: string;
  name?: string;
};

export function getToken(
  req: Request
): { user: TokenUser } | { error: string } {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return { error: "Falta header Authorization" };

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { error: "Formato de Authorization inválido" };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as Decoded;

    const rawId = decoded.id;
    const idNum = typeof rawId === "number" ? rawId : Number(rawId);

    if (!Number.isFinite(idNum) || !Number.isInteger(idNum)) {
      return { error: "Falta `id` válido en el token" };
    }

    return {
      user: {
        id: idNum,             // <-- siempre number
        email: decoded.email,
        name: decoded.name,
      },
    };
  } catch {
    return { error: "Token inválido" };
  }
}
