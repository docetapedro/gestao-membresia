import type { Papel } from "@prisma/client";

/**
 * Contexto de tenant + identidade, resolvido SEMPRE no servidor a partir
 * da sessão (nunca de parâmetros de rota ou do cliente).
 * Ver PROJECTO-gestao-igreja.md, secção 4.
 */
export interface TenantContext {
  igrejaId: string;
  utilizadorId: string;
  papel: Papel;
  nome: string;
  email: string;
  membroId: string | null;
}

/** Erro lançado quando uma operação com tenant corre sem contexto. */
export class SemContextoTenantError extends Error {
  constructor(mensagem = "Contexto de tenant ausente.") {
    super(mensagem);
    this.name = "SemContextoTenantError";
  }
}
