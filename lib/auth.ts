import db from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "./errors";

export async function verifyLogin(email: string, password: string) {
  try {
    const user = await db.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
      }
    });
    
    if (!user) {
      throw new AuthError("Usuario no encontrado");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AuthError("Contraseña incorrecta");
    }

    // No enviamos la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new Error("Error en la verificación");
  }
}
