import type { NextAuthConfig } from "next-auth";

/**
 * Configuração base do Auth.js — segura para o runtime edge (middleware).
 * NÃO importa Prisma nem Argon2 (só disponíveis em Node). O provider de
 * credenciais com `authorize` vive em auth.ts.
 *
 * Nota de arquitectura: o provider de credenciais do Auth.js v5 obriga a
 * sessão JWT (não suporta sessão em BD). O JWT transporta igrejaId/papel.
 * Sessão em base de dados fica para fase futura, se necessária.
 */
export const authConfig = {
  // Confia no host do pedido — em dev a porta pode variar (3000/3002/…);
  // em produção definir AUTH_URL na Vercel.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user;
      const emLogin = nextUrl.pathname.startsWith("/login");
      const emRecuperacao = nextUrl.pathname.startsWith("/recuperar-senha");

      if (emLogin || emRecuperacao) {
        if (logado) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return logado;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
