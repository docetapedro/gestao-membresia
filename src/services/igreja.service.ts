import { prismaComTenant } from "@/lib/tenant/prisma-tenant";
import { exigir } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import type { TenantContext } from "@/lib/tenant/context";
import { igrejaSchema, type IgrejaInput } from "@/lib/validators/definicoes";

export async function obterIgreja(ctx: TenantContext) {
  exigir(ctx, "ler", "definicoes");
  const db = prismaComTenant(ctx);
  return db.igreja.findFirst({ where: { id: ctx.igrejaId } });
}

export async function actualizarIgreja(ctx: TenantContext, input: IgrejaInput) {
  exigir(ctx, "actualizar", "definicoes");
  const db = prismaComTenant(ctx);
  const dados = igrejaSchema.parse(input);

  const antes = await db.igreja.findFirst({ where: { id: ctx.igrejaId } });
  if (!antes) throw new Error("Igreja não encontrada.");

  const actualizada = await db.igreja.update({
    where: { id: ctx.igrejaId },
    data: dados,
  });

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Igreja",
    entidadeId: ctx.igrejaId,
    antes,
    depois: actualizada,
  });
  return actualizada;
}
