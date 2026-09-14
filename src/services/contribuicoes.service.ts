import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import { calcularResumo, type ResumoContribuicoes } from "@/lib/financeiro";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarContribuicaoSchema,
  anularContribuicaoSchema,
  filtrosContribuicaoSchema,
  type CriarContribuicaoInput,
  type AnularContribuicaoInput,
  type FiltrosContribuicaoInput,
} from "@/lib/validators/contribuicoes";

/** Constrói o `where` comum à listagem e ao resumo. */
function construirWhere(filtros: {
  tipo?: string;
  metodo?: string;
  membroId?: string;
  de?: string;
  ate?: string;
  incluirAnuladas?: "true" | "false";
}): Prisma.ContribuicaoWhereInput {
  const where: Prisma.ContribuicaoWhereInput = {};
  if (filtros.tipo) where.tipo = filtros.tipo as never;
  if (filtros.metodo) where.metodo = filtros.metodo as never;
  if (filtros.membroId) where.membroId = filtros.membroId;
  if (filtros.incluirAnuladas !== "true") where.anulada = false;

  if (filtros.de || filtros.ate) {
    const data: Prisma.DateTimeFilter = {};
    if (filtros.de) data.gte = new Date(`${filtros.de}T00:00:00`);
    if (filtros.ate) data.lte = new Date(`${filtros.ate}T23:59:59.999`);
    where.data = data;
  }
  return where;
}

// ── Listagem ─────────────────────────────────────────────────────
export interface PaginaContribuicoes {
  itens: Array<{
    id: string;
    data: Date;
    tipo: string;
    metodo: string;
    valor: string;
    anulada: boolean;
    referencia: string | null;
    membro: { id: string; nomeCompleto: string } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarContribuicoes(
  ctx: TenantContext,
  filtrosInput: FiltrosContribuicaoInput,
): Promise<PaginaContribuicoes> {
  exigir(ctx, "ler", "contribuicoes");
  const db = prismaComTenant(ctx);
  const filtros = filtrosContribuicaoSchema.parse(filtrosInput);
  const where = construirWhere(filtros);

  const [total, registos] = await Promise.all([
    db.contribuicao.count({ where }),
    db.contribuicao.findMany({
      where,
      orderBy: { data: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        data: true,
        tipo: true,
        metodo: true,
        valor: true,
        anulada: true,
        referencia: true,
        membro: { select: { id: true, nomeCompleto: true } },
      },
    }),
  ]);

  return {
    itens: registos.map((c) => ({
      id: c.id,
      data: c.data,
      tipo: c.tipo,
      metodo: c.metodo,
      valor: c.valor.toString(),
      anulada: c.anulada,
      referencia: c.referencia,
      membro: c.membro,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

// ── Resumo do período (totais) ───────────────────────────────────
export async function resumoContribuicoes(
  ctx: TenantContext,
  filtrosInput: FiltrosContribuicaoInput,
): Promise<ResumoContribuicoes> {
  exigir(ctx, "ler", "contribuicoes");
  const db = prismaComTenant(ctx);
  const filtros = filtrosContribuicaoSchema.parse(filtrosInput);
  // O resumo ignora sempre as anuladas.
  const where = construirWhere({ ...filtros, incluirAnuladas: "false" });

  const registos = await db.contribuicao.findMany({
    where,
    select: { tipo: true, valor: true },
  });

  return calcularResumo(registos.map((r) => ({ tipo: r.tipo, valor: r.valor.toString() })));
}

// ── Obter uma (recibo) ───────────────────────────────────────────
export async function obterContribuicao(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "contribuicoes");
  const db = prismaComTenant(ctx);

  const c = await db.contribuicao.findFirst({
    where: { id },
    include: {
      membro: { select: { id: true, nomeCompleto: true, numeroMembro: true } },
      registadoPor: { select: { nome: true } },
    },
  });
  if (!c) return null;

  // Dados da igreja para o cabeçalho do recibo (Igreja é o tenant; filtra-se por id).
  const igreja = await db.igreja.findFirst({
    where: { id: ctx.igrejaId },
    select: { nome: true, denominacao: true, provincia: true, municipio: true, telefone: true, moeda: true },
  });

  return { ...c, valor: c.valor.toString(), igreja };
}

// ── Criar ────────────────────────────────────────────────────────
export async function criarContribuicao(ctx: TenantContext, input: CriarContribuicaoInput) {
  exigir(ctx, "criar", "contribuicoes");
  const db = prismaComTenant(ctx);
  const dados = criarContribuicaoSchema.parse(input);

  if (dados.membroId) {
    const membro = await db.membro.findFirst({ where: { id: dados.membroId } });
    if (!membro) throw new ErroDeNegocio("Membro não encontrado.");
  }
  if (dados.cultoId) {
    const culto = await db.culto.findFirst({ where: { id: dados.cultoId } });
    if (!culto) throw new ErroDeNegocio("Culto não encontrado.");
  }

  const criada = await db.contribuicao.create({
    data: {
      igrejaId: ctx.igrejaId,
      membroId: dados.membroId,
      tipo: dados.tipo,
      valor: dados.valor, // string Decimal(14,2)
      metodo: dados.metodo,
      data: dados.data,
      referencia: dados.referencia,
      cultoId: dados.cultoId,
      registadoPorId: ctx.utilizadorId,
    },
  });

  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Contribuicao",
    entidadeId: criada.id,
    depois: { ...criada, valor: criada.valor.toString() },
  });
  return { ...criada, valor: criada.valor.toString() };
}

// ── Anular (nunca editar/apagar) ─────────────────────────────────
export async function anularContribuicao(ctx: TenantContext, input: AnularContribuicaoInput) {
  exigir(ctx, "anular", "contribuicoes");
  const db = prismaComTenant(ctx);
  const { id, motivoAnulacao } = anularContribuicaoSchema.parse(input);

  const antes = await db.contribuicao.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Contribuição não encontrada.");
  if (antes.anulada) throw new ErroDeNegocio("A contribuição já está anulada.");

  await db.contribuicao.updateMany({
    where: { id },
    data: { anulada: true, motivoAnulacao },
  });

  await registarAuditoria(db, ctx, {
    accao: "ANULAR",
    entidade: "Contribuicao",
    entidadeId: id,
    antes: { anulada: antes.anulada },
    depois: { anulada: true, motivoAnulacao },
  });
  return { id };
}

// ── Opções para o formulário ─────────────────────────────────────
export async function opcoesFormularioContribuicao(ctx: TenantContext) {
  exigir(ctx, "criar", "contribuicoes");
  const db = prismaComTenant(ctx);
  const [membros, cultos] = await Promise.all([
    db.membro.findMany({
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, numeroMembro: true, nomeCompleto: true },
    }),
    db.culto.findMany({
      orderBy: { data: "desc" },
      take: 30,
      select: { id: true, tipo: true, data: true, tema: true },
    }),
  ]);
  return { membros, cultos };
}
