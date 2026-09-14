"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarMinisterio,
  actualizarMinisterio,
  removerMinisterio,
  atribuirMembroMinisterio,
  removerMembroMinisterio,
} from "@/services/ministerios.service";
import type {
  CriarMinisterioInput,
  ActualizarMinisterioInput,
  RemoverMinisterioInput,
  AtribuirMembroMinisterioInput,
  RemoverMembroMinisterioInput,
} from "@/lib/validators/ministerios";

export async function criarMinisterioAction(
  input: CriarMinisterioInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const ministerio = await criarMinisterio(ctx, input);
    revalidatePath("/ministerios");
    return sucesso({ id: ministerio.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarMinisterioAction(
  input: ActualizarMinisterioInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const ministerio = await actualizarMinisterio(ctx, input);
    revalidatePath("/ministerios");
    revalidatePath(`/ministerios/${ministerio.id}`);
    return sucesso({ id: ministerio.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerMinisterioAction(
  input: RemoverMinisterioInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerMinisterio(ctx, input);
    revalidatePath("/ministerios");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function atribuirMembroMinisterioAction(
  input: AtribuirMembroMinisterioInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await atribuirMembroMinisterio(ctx, input);
    revalidatePath(`/ministerios/${input.ministerioId}`);
    revalidatePath("/ministerios");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerMembroMinisterioAction(
  ministerioId: string,
  input: RemoverMembroMinisterioInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerMembroMinisterio(ctx, input);
    revalidatePath(`/ministerios/${ministerioId}`);
    revalidatePath("/ministerios");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
