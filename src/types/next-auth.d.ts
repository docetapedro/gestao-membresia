import type { Papel } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    igrejaId: string;
    papel: Papel;
    membroId: string | null;
  }

  interface Session {
    user: {
      utilizadorId: string;
      igrejaId: string;
      papel: Papel;
      membroId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    utilizadorId: string;
    igrejaId: string;
    papel: Papel;
    membroId: string | null;
    nome: string;
  }
}
