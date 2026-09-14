import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir, restringeACelula, SemPermissaoError } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarMinisterioSchema,
  actualizarMinisterioSchema,
  removerMinisterioSchema,
  filtrosMinisterioSchema,
  atribuirMembroMinisterioSchema,
  removerMembroMinisterioSchema,
  type CriarMinisterioInput,
  type ActualizarMinisterioInput,
  type RemoverMinisterioInput,
  type FiltrosMinisterioInput,
  type AtribuirMembroMinisterioInput,
  type RemoverMembroMinisterioInput,
} from "@/lib/validators/ministerios";

function exigirGestao(ctx: TenantContext, accao: "criar" | "actualizar" | "eliminar") {
  exigir(ctx, accao, "membros");
  if (restringeACelula(ctx, "membros")) {
    throw new SemPermissaoError(accao, "membros");
  }
}

// ── Listagem ─────────────────────────────────────────────────────
export interface PaginaMinisterios {
  itens: Array<{
    id: string;
    nome: string;
    activo: boolean;
    totalMembros: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarMinisterios(
  ctx: TenantContext,
  filtrosInput: FiltrosMinisterioInput,
): Promise<PaginaMinisterios> {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const filtros = filtrosMinisterioSchema.parse(filtrosInput);

  const where: Prisma.MinisterioWhereInput = {};
  if (filtros.q) where.nome = { contains: filtros.q };
  if (filtros.activo) where.activo = filtros.activo === "true";

  const [total, registos] = await Promise.all([
    db.ministerio.count({ where }),
    db.ministerio.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        nome: true,
        activo: true,
        _count: { select: { membros: true } },
      },
    }),
  ]);

  return {
    itens: registos.map((m) => ({
      id: m.id,
      nome: m.nome,
      activo: m.activo,
      totalMembros: m._count.membros,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

// ── Obter um ─────────────────────────────────────────────────────
export async function obterMinisterio(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);

  const ministerio = await db.ministerio.findFirst({
    where: { id },
    include: {
      membros: {
        orderBy: { membro: { nomeCompleto: "asc" } },
        select: {
          id: true,
          funcao: true,
          desde: true,
          membro: {
            select: { id: true, numeroMembro: true, nomeCompleto: true, telefone: true },
          },
        },
      },
    },
  });
  if (!ministerio) return null;

  let liderNome: string | null = null;
  if (ministerio.liderId) {
    const lider = await db.membro.findFirst({
      where: { id: ministerio.liderId },
      select: { nomeCompleto: true },
    });
    liderNome = lider?.nomeCompleto ?? null;
  }
  return { ...ministerio, liderNome };
}

/** Membros que ainda não pertencem a este ministério. */
export async function membrosForaDoMinisterio(ctx: TenantContext, ministerioId: string) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const associacoes = await db.membroMinisterio.findMany({
    where: { ministerioId },
    select: { membroId: true },
  });
  const jaDentro = associacoes.map((a) => a.membroId);
  return db.membro.findMany({
    where: jaDentro.length ? { id: { notIn: jaDentro } } : {},
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, numeroMembro: true, nomeCompleto: true },
  });
}

export async function membrosParaResponsavel(ctx: TenantContext) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  return db.membro.findMany({
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, numeroMembro: true, nomeCompleto: true },
  });
}

// ── Criar ────────────────────────────────────────────────────────
export async function criarMinisterio(ctx: TenantContext, input: CriarMinisterioInput) {
  exigirGestao(ctx, "criar");
  const db = prismaComTenant(ctx);
  const dados = criarMinisterioSchema.parse(input);

  const criado = await db.ministerio.create({ data: { ...dados, igrejaId: ctx.igrejaId } });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Ministerio",
    entidadeId: criado.id,
    depois: criado,
  });
  return criado;
}

// ── Actualizar ───────────────────────────────────────────────────
export async function actualizarMinisterio(
  ctx: TenantContext,
  input: ActualizarMinisterioInput,
) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarMinisterioSchema.parse(input);

  const antes = await db.ministerio.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Ministério não encontrado.");

  const [, actualizado] = await db.$transaction([
    db.ministerio.updateMany({ where: { id }, data: dados }),
    db.ministerio.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Ministerio",
    entidadeId: id,
    antes,
    depois: actualizado,
  });
  return actualizado;
}

// ── Remover ──────────────────────────────────────────────────────
export async function removerMinisterio(ctx: TenantContext, input: RemoverMinisterioInput) {
  exigirGestao(ctx, "eliminar");
  const db = prismaComTenant(ctx);
  const { id } = removerMinisterioSchema.parse(input);

  const antes = await db.ministerio.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Ministério não encontrado.");

  const membros = await db.membroMinisterio.count({ where: { ministerioId: id } });
  if (membros > 0) {
    throw new ErroDeNegocio(
      "O ministério tem membros associados. Retire-os antes de o eliminar.",
    );
  }

  await db.ministerio.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Ministerio",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ── Atribuir membro ao ministério ────────────────────────────────
export async function atribuirMembroMinisterio(
  ctx: TenantContext,
  input: AtribuirMembroMinisterioInput,
) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { ministerioId, membroId, funcao, desde } = atribuirMembroMinisterioSchema.parse(input);

  const ministerio = await db.ministerio.findFirst({ where: { id: ministerioId } });
  if (!ministerio) throw new ErroDeNegocio("Ministério não encontrado.");

  const membro = await db.membro.findFirst({ where: { id: membroId } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  const existente = await db.membroMinisterio.findFirst({
    where: { ministerioId, membroId },
  });
  if (existente) throw new ErroDeNegocio("O membro já pertence a este ministério.");

  const criado = await db.membroMinisterio.create({
    data: { igrejaId: ctx.igrejaId, ministerioId, membroId, funcao, desde },
  });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "MembroMinisterio",
    entidadeId: criado.id,
    depois: criado,
  });
  return { id: criado.id };
}

// ── Retirar membro do ministério ─────────────────────────────────
export async function removerMembroMinisterio(
  ctx: TenantContext,
  input: RemoverMembroMinisterioInput,
) {
  exigirGestao(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { membroMinisterioId } = removerMembroMinisterioSchema.parse(input);

  const antes = await db.membroMinisterio.findFirst({ where: { id: membroMinisterioId } });
  if (!antes) throw new ErroDeNegocio("Associação não encontrada.");

  await db.membroMinisterio.deleteMany({ where: { id: membroMinisterioId } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "MembroMinisterio",
    entidadeId: membroMinisterioId,
    antes,
  });
  return { id: membroMinisterioId };
}
