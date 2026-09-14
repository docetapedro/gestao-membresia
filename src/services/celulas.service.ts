import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir, restringeACelula, SemPermissaoError } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarCelulaSchema,
  actualizarCelulaSchema,
  removerCelulaSchema,
  filtrosCelulaSchema,
  atribuirMembroCelulaSchema,
  removerMembroCelulaSchema,
  type CriarCelulaInput,
  type ActualizarCelulaInput,
  type RemoverCelulaInput,
  type FiltrosCelulaInput,
  type AtribuirMembroCelulaInput,
  type RemoverMembroCelulaInput,
} from "@/lib/validators/celulas";

/**
 * Estrutura organizacional é gerida por quem tem acesso total a "membros".
 * Um líder de célula consulta, mas não reestrutura (ver famílias).
 */
function exigirGestao(ctx: TenantContext, accao: "criar" | "actualizar" | "eliminar") {
  exigir(ctx, accao, "membros");
  if (restringeACelula(ctx, "membros")) {
    throw new SemPermissaoError(accao, "membros");
  }
}

// ── Listagem ─────────────────────────────────────────────────────
export interface PaginaCelulas {
  itens: Array<{
    id: string;
    nome: string;
    diaSemana: number | null;
    hora: string | null;
    activa: boolean;
    totalMembros: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarCelulas(
  ctx: TenantContext,
  filtrosInput: FiltrosCelulaInput,
): Promise<PaginaCelulas> {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const filtros = filtrosCelulaSchema.parse(filtrosInput);

  const where: Prisma.CelulaWhereInput = {};
  if (filtros.q) where.nome = { contains: filtros.q };
  if (filtros.activa) where.activa = filtros.activa === "true";

  const [total, registos] = await Promise.all([
    db.celula.count({ where }),
    db.celula.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        nome: true,
        diaSemana: true,
        hora: true,
        activa: true,
        _count: { select: { membros: true } },
      },
    }),
  ]);

  return {
    itens: registos.map((c) => ({
      id: c.id,
      nome: c.nome,
      diaSemana: c.diaSemana,
      hora: c.hora,
      activa: c.activa,
      totalMembros: c._count.membros,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

/** Resolve os nomes de líder/anfitrião (não há relação FK no schema). */
async function nomesMembros(
  db: ReturnType<typeof prismaComTenant>,
  ids: Array<string | null>,
): Promise<Map<string, string>> {
  const validos = [...new Set(ids.filter((v): v is string => !!v))];
  if (validos.length === 0) return new Map();
  const membros = await db.membro.findMany({
    where: { id: { in: validos } },
    select: { id: true, nomeCompleto: true },
  });
  return new Map(membros.map((m) => [m.id, m.nomeCompleto]));
}

// ── Obter uma ────────────────────────────────────────────────────
export async function obterCelula(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);

  const celula = await db.celula.findFirst({
    where: { id },
    include: {
      membros: {
        orderBy: { nomeCompleto: "asc" },
        select: {
          id: true,
          numeroMembro: true,
          nomeCompleto: true,
          telefone: true,
          papelFamiliar: true,
        },
      },
    },
  });
  if (!celula) return null;

  const nomes = await nomesMembros(db, [celula.liderId, celula.anfitriaoId]);
  return {
    ...celula,
    liderNome: celula.liderId ? (nomes.get(celula.liderId) ?? null) : null,
    anfitriaoNome: celula.anfitriaoId ? (nomes.get(celula.anfitriaoId) ?? null) : null,
  };
}

/** Membros sem célula, para os selectores de líder/anfitrião e atribuição. */
export async function membrosSemCelula(ctx: TenantContext) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  return db.membro.findMany({
    where: { celulaId: null },
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, numeroMembro: true, nomeCompleto: true },
  });
}

/** Todos os membros (para escolher líder/anfitrião, que podem já ter célula). */
export async function membrosParaResponsavel(ctx: TenantContext) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  return db.membro.findMany({
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, numeroMembro: true, nomeCompleto: true },
  });
}

// ── Criar ────────────────────────────────────────────────────────
export async function criarCelula(ctx: TenantContext, input: CriarCelulaInput) {
  exigirGestao(ctx, "criar");
  const db = prismaComTenant(ctx);
  const dados = criarCelulaSchema.parse(input);

  const criada = await db.celula.create({ data: { ...dados, igrejaId: ctx.igrejaId } });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Celula",
    entidadeId: criada.id,
    depois: criada,
  });
  return criada;
}

// ── Actualizar ───────────────────────────────────────────────────
export async function actualizarCelula(ctx: TenantContext, input: ActualizarCelulaInput) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarCelulaSchema.parse(input);

  const antes = await db.celula.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Célula não encontrada.");

  const [, actualizada] = await db.$transaction([
    db.celula.updateMany({ where: { id }, data: dados }),
    db.celula.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Celula",
    entidadeId: id,
    antes,
    depois: actualizada,
  });
  return actualizada;
}

// ── Remover ──────────────────────────────────────────────────────
export async function removerCelula(ctx: TenantContext, input: RemoverCelulaInput) {
  exigirGestao(ctx, "eliminar");
  const db = prismaComTenant(ctx);
  const { id } = removerCelulaSchema.parse(input);

  const antes = await db.celula.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Célula não encontrada.");

  const membros = await db.membro.count({ where: { celulaId: id } });
  if (membros > 0) {
    throw new ErroDeNegocio(
      "A célula tem membros associados. Retire-os antes de a eliminar.",
    );
  }

  await db.celula.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Celula",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ── Atribuir membro à célula ─────────────────────────────────────
export async function atribuirMembroCelula(
  ctx: TenantContext,
  input: AtribuirMembroCelulaInput,
) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { celulaId, membroId } = atribuirMembroCelulaSchema.parse(input);

  const celula = await db.celula.findFirst({ where: { id: celulaId } });
  if (!celula) throw new ErroDeNegocio("Célula não encontrada.");

  const membro = await db.membro.findFirst({ where: { id: membroId } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  await db.membro.updateMany({ where: { id: membroId }, data: { celulaId } });
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    antes: { celulaId: membro.celulaId },
    depois: { celulaId },
  });
  return { id: membroId };
}

// ── Retirar membro da célula ─────────────────────────────────────
export async function removerMembroCelula(
  ctx: TenantContext,
  input: RemoverMembroCelulaInput,
) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { membroId } = removerMembroCelulaSchema.parse(input);

  const membro = await db.membro.findFirst({ where: { id: membroId } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  await db.membro.updateMany({ where: { id: membroId }, data: { celulaId: null } });
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    antes: { celulaId: membro.celulaId },
    depois: { celulaId: null },
  });
  return { id: membroId };
}
