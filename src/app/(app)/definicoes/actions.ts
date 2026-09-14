"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import { actualizarIgreja } from "@/services/igreja.service";
import {
  criarUtilizador,
  actualizarUtilizador,
} from "@/services/utilizadores.service";
import type { IgrejaInput } from "@/lib/validators/definicoes";
import type {
  CriarUtilizadorInput,
  ActualizarUtilizadorInput,
} from "@/lib/validators/definicoes";

export async function actualizarIgrejaAction(
  input: IgrejaInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const igreja = await actualizarIgreja(ctx, input);
    revalidatePath("/definicoes");
    return sucesso({ id: igreja.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function criarUtilizadorAction(
  input: CriarUtilizadorInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const u = await criarUtilizador(ctx, input);
    revalidatePath("/definicoes/utilizadores");
    return sucesso({ id: u.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarUtilizadorAction(
  input: ActualizarUtilizadorInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const u = await actualizarUtilizador(ctx, input);
    revalidatePath("/definicoes/utilizadores");
    return sucesso({ id: u.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}
