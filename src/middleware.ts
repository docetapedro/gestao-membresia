import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Middleware de protecção de rotas (runtime edge, sem Prisma/Argon).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protege tudo excepto assets estáticos e as rotas internas do Auth.js.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
