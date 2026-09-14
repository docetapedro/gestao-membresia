"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarMembro,
  actualizarMembro,
  removerMembro,
} from "@/services/membros.service";
import { guardarFotoMembro, removerFotoMembro } from "@/services/fotos.service";
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

export async function carregarFotoAction(
  membroId: string,
  formData: FormData,
): Promise<Resultado<{ fotoUrl: string }>> {
  try {
    const ctx = await getTenantContext();
    const ficheiro = formData.get("foto");
    if (!(ficheiro instanceof File) || ficheiro.size === 0) {
      return { ok: false, erro: "Nenhum ficheiro seleccionado." };
    }
    const buffer = Buffer.from(await ficheiro.arrayBuffer());
    const r = await guardarFotoMembro(ctx, membroId, {
      buffer,
      mime: ficheiro.type,
      tamanho: ficheiro.size,
    });
    revalidatePath(`/membros/${membroId}`);
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerFotoAction(
  membroId: string,
): Promise<Resultado<{ fotoUrl: null }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerFotoMembro(ctx, membroId);
    revalidatePath(`/membros/${membroId}`);
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
