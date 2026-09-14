import type { PrismaTenant } from "@/lib/tenant/prisma-tenant";
import type { TenantContext } from "@/lib/tenant/context";

export type AccaoAuditoria = "CRIAR" | "ACTUALIZAR" | "ELIMINAR" | "ANULAR";

/** Serializa para JSON simples (converte Date -> ISO) para o campo Json. */
function limpar(valor: unknown): unknown {
  if (valor === undefined || valor === null) return null;
  return JSON.parse(JSON.stringify(valor));
}

/**
 * Regista uma entrada no log de auditoria. `db` é o cliente com tenant,
 * pelo que o igrejaId é injectado automaticamente.
 */
export async function registarAuditoria(
  db: PrismaTenant,
  ctx: TenantContext,
  params: {
    accao: AccaoAuditoria;
    entidade: string;
    entidadeId: string;
    antes?: unknown;
    depois?: unknown;
  },
): Promise<void> {
  await db.logAuditoria.create({
    data: {
      igrejaId: ctx.igrejaId,
      utilizadorId: ctx.utilizadorId,
      accao: params.accao,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      dadosAntes: limpar(params.antes) as never,
      dadosDepois: limpar(params.depois) as never,
    },
  });
}
