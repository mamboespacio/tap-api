// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const ok = user.password
          ? await bcrypt.compare(credentials.password, user.password)
          : user.password === credentials.password;
        if (!ok) return null;

        return { id: String(user.id), email: user.email, name: user.fullName ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1) persistí id
      if (user?.id) token.id = (user as any).id;

      // 2) firmá el apiJwt si falta (o si querés, siempre)
      const uid = (user as any)?.id ?? token.id;
      if (uid && !("apiJwt" in token)) {
        (token as any).apiJwt = jwt.sign(
          { id: uid, email: (user as any)?.email ?? token.email, name: (user as any)?.name ?? token.name },
          process.env.JWT_SECRET!,         // mismo secret que usa lib/getToken.ts
          { expiresIn: "7d" }
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) (session.user as any).id = token.id;
      (session as any).apiJwt = (token as any).apiJwt ?? null; // ← exponerlo al cliente
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
