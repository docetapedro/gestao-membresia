import { prismaComTenant } from "@/lib/tenant/prisma-tenant";
import { can } from "@/lib/auth/permissoes";
import type { TenantContext } from "@/lib/tenant/context";

export interface ResumoPainel {
  totalMembros: number;
  novosNoMes: number;
  presencaMediaMes: number | null;
  contribuicoesMes: number | null; // null = sem permissão para ver
}

/** Métricas do painel principal (spec Fase 1 — Dashboard). */
export async function obterResumoPainel(ctx: TenantContext): Promise<ResumoPainel> {
  const db = prismaComTenant(ctx);
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [totalMembros, novosNoMes] = await Promise.all([
    db.membro.count({ where: { estado: "MEMBRO" } }),
    db.membro.count({ where: { dataAdmissao: { gte: inicioMes } } }),
  ]);

  // Presença média dos cultos do mês.
  const cultosMes = await db.culto.findMany({
    where: { data: { gte: inicioMes } },
    select: { _count: { select: { presencas: { where: { presente: true } } } } },
  });
  const presencaMediaMes =
    cultosMes.length > 0
      ? Math.round(
          cultosMes.reduce((s, c) => s + c._count.presencas, 0) / cultosMes.length,
        )
      : null;

  // Contribuições do mês — só para quem pode ler.
  let contribuicoesMes: number | null = null;
  if (can(ctx, "ler", "contribuicoes")) {
    const agregado = await db.contribuicao.aggregate({
      where: { data: { gte: inicioMes }, anulada: false },
      _sum: { valor: true },
    });
    contribuicoesMes = Number(agregado._sum.valor ?? 0);
  }

  return { totalMembros, novosNoMes, presencaMediaMes, contribuicoesMes };
}
