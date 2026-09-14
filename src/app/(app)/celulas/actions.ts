"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarCelula,
  actualizarCelula,
  removerCelula,
  atribuirMembroCelula,
  removerMembroCelula,
} from "@/services/celulas.service";
import type {
  CriarCelulaInput,
  ActualizarCelulaInput,
  RemoverCelulaInput,
  AtribuirMembroCelulaInput,
  RemoverMembroCelulaInput,
} from "@/lib/validators/celulas";

export async function criarCelulaAction(
  input: CriarCelulaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const celula = await criarCelula(ctx, input);
    revalidatePath("/celulas");
    return sucesso({ id: celula.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarCelulaAction(
  input: ActualizarCelulaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const celula = await actualizarCelula(ctx, input);
    revalidatePath("/celulas");
    revalidatePath(`/celulas/${celula.id}`);
    return sucesso({ id: celula.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerCelulaAction(
  input: RemoverCelulaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerCelula(ctx, input);
    revalidatePath("/celulas");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function atribuirMembroCelulaAction(
  input: AtribuirMembroCelulaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await atribuirMembroCelula(ctx, input);
    revalidatePath(`/celulas/${input.celulaId}`);
    revalidatePath("/celulas");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerMembroCelulaAction(
  celulaId: string,
  input: RemoverMembroCelulaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerMembroCelula(ctx, input);
    revalidatePath(`/celulas/${celulaId}`);
    revalidatePath("/celulas");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
