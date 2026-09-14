"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarFamilia,
  actualizarFamilia,
  removerFamilia,
  atribuirMembroFamilia,
  removerMembroFamilia,
} from "@/services/familias.service";
import type {
  CriarFamiliaInput,
  ActualizarFamiliaInput,
  RemoverFamiliaInput,
  AtribuirMembroFamiliaInput,
  RemoverMembroFamiliaInput,
} from "@/lib/validators/familias";

export async function criarFamiliaAction(
  input: CriarFamiliaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const familia = await criarFamilia(ctx, input);
    revalidatePath("/familias");
    return sucesso({ id: familia.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarFamiliaAction(
  input: ActualizarFamiliaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const familia = await actualizarFamilia(ctx, input);
    revalidatePath("/familias");
    revalidatePath(`/familias/${familia.id}`);
    return sucesso({ id: familia.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerFamiliaAction(
  input: RemoverFamiliaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerFamilia(ctx, input);
    revalidatePath("/familias");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function atribuirMembroFamiliaAction(
  input: AtribuirMembroFamiliaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await atribuirMembroFamilia(ctx, input);
    revalidatePath(`/familias/${input.familiaId}`);
    revalidatePath("/familias");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerMembroFamiliaAction(
  familiaId: string,
  input: RemoverMembroFamiliaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerMembroFamilia(ctx, input);
    revalidatePath(`/familias/${familiaId}`);
    revalidatePath("/familias");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
