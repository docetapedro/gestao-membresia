"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarContribuicao,
  anularContribuicao,
} from "@/services/contribuicoes.service";
import type {
  CriarContribuicaoInput,
  AnularContribuicaoInput,
} from "@/lib/validators/contribuicoes";

export async function criarContribuicaoAction(
  input: CriarContribuicaoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const c = await criarContribuicao(ctx, input);
    revalidatePath("/contribuicoes");
    return sucesso({ id: c.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function anularContribuicaoAction(
  input: AnularContribuicaoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await anularContribuicao(ctx, input);
    revalidatePath("/contribuicoes");
    revalidatePath(`/contribuicoes/${input.id}`);
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
