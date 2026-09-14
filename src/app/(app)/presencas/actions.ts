"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarCulto,
  actualizarCulto,
  removerCulto,
  marcarPresencas,
} from "@/services/cultos.service";
import type {
  CriarCultoInput,
  ActualizarCultoInput,
  RemoverCultoInput,
  MarcarPresencasInput,
} from "@/lib/validators/cultos";

export async function criarCultoAction(
  input: CriarCultoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const culto = await criarCulto(ctx, input);
    revalidatePath("/presencas");
    return sucesso({ id: culto.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarCultoAction(
  input: ActualizarCultoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const culto = await actualizarCulto(ctx, input);
    revalidatePath("/presencas");
    revalidatePath(`/presencas/${culto.id}`);
    return sucesso({ id: culto.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerCultoAction(
  input: RemoverCultoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerCulto(ctx, input);
    revalidatePath("/presencas");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function marcarPresencasAction(
  input: MarcarPresencasInput,
): Promise<Resultado<{ marcados: number; presentes: number }>> {
  try {
    const ctx = await getTenantContext();
    const r = await marcarPresencas(ctx, input);
    revalidatePath("/presencas");
    revalidatePath(`/presencas/${input.cultoId}`);
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
