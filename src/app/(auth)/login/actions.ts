"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";

export type EstadoLogin = { erro?: string };

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: "/",
    });
    return {};
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "Email ou senha incorrectos." };
    }
    // Re-lança o redirect do Next (NEXT_REDIRECT) e erros inesperados.
    throw erro;
  }
}
