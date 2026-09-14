import { ZodError } from "zod";
import { SemPermissaoError } from "@/lib/auth/permissoes";
import { SemContextoTenantError } from "@/lib/tenant/context";
import { ErroDeNegocio } from "./erros";

/**
 * Contrato de resposta das Server Actions (spec secção 8).
 * Nunca lançar excepções para a UI: devolver sempre um destes.
 */
export type Resultado<T = void> =
  | { ok: true; data: T }
  | { ok: false; erro: string; campos?: Record<string, string> };

export function sucesso<T>(data: T): Resultado<T> {
  return { ok: true, data };
}

export function falha(erro: string, campos?: Record<string, string>): Resultado<never> {
  return { ok: false, erro, campos };
}

/** Converte erros conhecidos num Resultado de falha uniforme. */
export function falhaDeErro(e: unknown): Resultado<never> {
  if (e instanceof ZodError) {
    const campos: Record<string, string> = {};
    for (const issue of e.issues) {
      const chave = issue.path.join(".") || "_";
      if (!campos[chave]) campos[chave] = issue.message;
    }
    return { ok: false, erro: "Dados inválidos.", campos };
  }
  if (e instanceof SemPermissaoError) {
    return { ok: false, erro: "Não tem permissão para esta operação." };
  }
  if (e instanceof SemContextoTenantError) {
    return { ok: false, erro: "Sessão inválida. Inicie sessão novamente." };
  }
  if (e instanceof ErroDeNegocio) {
    return { ok: false, erro: e.message };
  }
  console.error("[acao] erro inesperado:", e);
  return { ok: false, erro: "Ocorreu um erro. Tente novamente." };
}
