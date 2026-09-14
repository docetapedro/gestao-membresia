"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarMembro,
  actualizarMembro,
  removerMembro,
} from "@/services/membros.service";
import type {
  CriarMembroInput,
  ActualizarMembroInput,
  RemoverMembroInput,
} from "@/lib/validators/membros";

export async function criarMembroAction(
  input: CriarMembroInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const membro = await criarMembro(ctx, input);
    revalidatePath("/membros");
    return sucesso({ id: membro.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarMembroAction(
  input: ActualizarMembroInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const membro = await actualizarMembro(ctx, input);
    revalidatePath("/membros");
    revalidatePath(`/membros/${membro.id}`);
    return sucesso({ id: membro.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerMembroAction(
  input: RemoverMembroInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerMembro(ctx, input);
    revalidatePath("/membros");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
