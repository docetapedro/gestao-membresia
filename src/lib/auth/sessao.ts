import { auth } from "./auth";
import { SemContextoTenantError, type TenantContext } from "@/lib/tenant/context";

/**
 * Resolve o contexto de tenant a partir da sessão do servidor.
 * Única forma de obter o igrejaId — nunca de parâmetros de rota (spec 4.3).
 * Lança se não houver sessão válida.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const sessao = await auth();
  const u = sessao?.user;
  if (!u?.igrejaId || !u.utilizadorId) {
    throw new SemContextoTenantError("Sessão sem tenant. Inicie sessão.");
  }
  return {
    igrejaId: u.igrejaId,
    utilizadorId: u.utilizadorId,
    papel: u.papel,
    nome: u.name ?? "",
    email: u.email ?? "",
    membroId: u.membroId ?? null,
  };
}

/** Como getTenantContext, mas devolve null em vez de lançar. */
export async function getTenantContextOpcional(): Promise<TenantContext | null> {
  try {
    return await getTenantContext();
  } catch {
    return null;
  }
}
