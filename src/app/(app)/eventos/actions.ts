"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/auth/sessao";
import { sucesso, falhaDeErro, type Resultado } from "@/lib/acoes/resultado";
import {
  criarProgramaSemanal,
  actualizarProgramaSemanal,
  removerProgramaSemanal,
  criarEvento,
  actualizarEvento,
  removerEvento,
  marcarPresencasEvento,
} from "@/services/eventos.service";
import type {
  CriarProgramaSemanalInput,
  ActualizarProgramaSemanalInput,
  RemoverProgramaSemanalInput,
  CriarEventoInput,
  ActualizarEventoInput,
  RemoverEventoInput,
  MarcarPresencasEventoInput,
} from "@/lib/validators/eventos";

// ── Programação semanal ──────────────────────────────────────────
export async function criarProgramaSemanalAction(
  input: CriarProgramaSemanalInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const item = await criarProgramaSemanal(ctx, input);
    revalidatePath("/eventos");
    return sucesso({ id: item.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarProgramaSemanalAction(
  input: ActualizarProgramaSemanalInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const item = await actualizarProgramaSemanal(ctx, input);
    revalidatePath("/eventos");
    return sucesso({ id: item.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerProgramaSemanalAction(
  input: RemoverProgramaSemanalInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerProgramaSemanal(ctx, input);
    revalidatePath("/eventos");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

// ── Eventos ──────────────────────────────────────────────────────
export async function criarEventoAction(
  input: CriarEventoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const evento = await criarEvento(ctx, input);
    revalidatePath("/eventos");
    return sucesso({ id: evento.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function actualizarEventoAction(
  input: ActualizarEventoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const evento = await actualizarEvento(ctx, input);
    revalidatePath("/eventos");
    revalidatePath(`/eventos/${evento.id}`);
    return sucesso({ id: evento.id });
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function removerEventoAction(
  input: RemoverEventoInput,
): Promise<Resultado<{ id: string }>> {
  try {
    const ctx = await getTenantContext();
    const r = await removerEvento(ctx, input);
    revalidatePath("/eventos");
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}

export async function marcarPresencasEventoAction(
  input: MarcarPresencasEventoInput,
): Promise<Resultado<{ marcados: number; presentes: number }>> {
  try {
    const ctx = await getTenantContext();
    const r = await marcarPresencasEvento(ctx, input);
    revalidatePath("/eventos");
    revalidatePath(`/eventos/${input.eventoId}`);
    revalidatePath(`/eventos/${input.eventoId}/presencas`);
    return sucesso(r);
  } catch (e) {
    return falhaDeErro(e);
  }
}
