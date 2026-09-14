import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db/prisma";
import { verificarSenha } from "./senha";
import { loginSchema } from "@/lib/validators/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        const parsed = loginSchema.safeParse(credenciais);
        if (!parsed.success) return null;
        const { email, senha } = parsed.data;

        // Fase 1: uma única igreja → email identifica o utilizador.
        // (email é único por igreja; rever quando activar multi-igreja.)
        const utilizador = await prisma.utilizador.findFirst({
          where: { email, activo: true },
        });
        if (!utilizador) return null;

        const senhaOk = await verificarSenha(utilizador.hashSenha, senha);
        if (!senhaOk) return null;

        return {
          id: utilizador.id,
          name: utilizador.nome,
          email: utilizador.email,
          igrejaId: utilizador.igrejaId,
          papel: utilizador.papel,
          membroId: utilizador.membroId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.utilizadorId = user.id as string;
        token.igrejaId = user.igrejaId;
        token.papel = user.papel;
        token.membroId = user.membroId ?? null;
        token.nome = user.name ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.utilizadorId = token.utilizadorId as string;
        session.user.igrejaId = token.igrejaId as string;
        session.user.papel = token.papel as typeof session.user.papel;
        session.user.membroId = (token.membroId as string | null) ?? null;
        session.user.name = (token.nome as string) ?? "";
      }
      return session;
    },
  },
});
