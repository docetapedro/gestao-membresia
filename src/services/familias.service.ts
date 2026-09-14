import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir, restringeACelula, SemPermissaoError } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarFamiliaSchema,
  actualizarFamiliaSchema,
  removerFamiliaSchema,
  filtrosFamiliaSchema,
  atribuirMembroFamiliaSchema,
  removerMembroFamiliaSchema,
  type CriarFamiliaInput,
  type ActualizarFamiliaInput,
  type RemoverFamiliaInput,
  type FiltrosFamiliaInput,
  type AtribuirMembroFamiliaInput,
  type RemoverMembroFamiliaInput,
} from "@/lib/validators/familias";

/**
 * As famílias são dados de referência à escala da igreja (não da célula).
 * Um líder de célula pode consultá-las, mas não reestruturá-las: as mutações
 * ficam reservadas a quem tem acesso total a "membros".
 */
function exigirGestaoFamilias(ctx: TenantContext, accao: "criar" | "actualizar" | "eliminar") {
  exigir(ctx, accao, "membros");
  if (restringeACelula(ctx, "membros")) {
    throw new SemPermissaoError(accao, "membros");
  }
}

// ── Listagem ─────────────────────────────────────────────────────
export interface PaginaFamilias {
  itens: Array<{
    id: string;
    nome: string;
    endereco: string | null;
    totalMembros: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarFamilias(
  ctx: TenantContext,
  filtrosInput: FiltrosFamiliaInput,
): Promise<PaginaFamilias> {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const filtros = filtrosFamiliaSchema.parse(filtrosInput);

  const where: Prisma.FamiliaWhereInput = {};
  if (filtros.q) {
    where.nome = { contains: filtros.q };
  }

  const [total, registos] = await Promise.all([
    db.familia.count({ where }),
    db.familia.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        nome: true,
        endereco: true,
        _count: { select: { membros: true } },
      },
    }),
  ]);

  return {
    itens: registos.map((f) => ({
      id: f.id,
      nome: f.nome,
      endereco: f.endereco,
      totalMembros: f._count.membros,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

// ── Obter uma ────────────────────────────────────────────────────
export async function obterFamilia(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);

  return db.familia.findFirst({
    where: { id },
    include: {
      membros: {
        orderBy: { nomeCompleto: "asc" },
        select: {
          id: true,
          numeroMembro: true,
          nomeCompleto: true,
          telefone: true,
          estado: true,
          papelFamiliar: true,
        },
      },
    },
  });
}

/** Membros ainda sem família, para o selector de atribuição. */
export async function membrosSemFamilia(ctx: TenantContext) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  return db.membro.findMany({
    where: { familiaId: null },
    orderBy: { nomeCompleto: "asc" },
    select: { id: true, numeroMembro: true, nomeCompleto: true },
  });
}

// ── Criar ────────────────────────────────────────────────────────
export async function criarFamilia(ctx: TenantContext, input: CriarFamiliaInput) {
  exigirGestaoFamilias(ctx, "criar");
  const db = prismaComTenant(ctx);
  const dados = criarFamiliaSchema.parse(input);

  const criada = await db.familia.create({
    data: { ...dados, igrejaId: ctx.igrejaId },
  });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Familia",
    entidadeId: criada.id,
    depois: criada,
  });
  return criada;
}

// ── Actualizar ───────────────────────────────────────────────────
export async function actualizarFamilia(ctx: TenantContext, input: ActualizarFamiliaInput) {
  exigirGestaoFamilias(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarFamiliaSchema.parse(input);

  const antes = await db.familia.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Família não encontrada.");

  const [, actualizada] = await db.$transaction([
    db.familia.updateMany({ where: { id }, data: dados }),
    db.familia.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Familia",
    entidadeId: id,
    antes,
    depois: actualizada,
  });
  return actualizada;
}

// ── Remover ──────────────────────────────────────────────────────
export async function removerFamilia(ctx: TenantContext, input: RemoverFamiliaInput) {
  exigirGestaoFamilias(ctx, "eliminar");
  const db = prismaComTenant(ctx);
  const { id } = removerFamiliaSchema.parse(input);

  const antes = await db.familia.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Família não encontrada.");

  const membros = await db.membro.count({ where: { familiaId: id } });
  if (membros > 0) {
    throw new ErroDeNegocio(
      "A família tem membros associados. Retire-os antes de a eliminar.",
    );
  }

  await db.familia.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Familia",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ── Atribuir membro à família ────────────────────────────────────
export async function atribuirMembroFamilia(
  ctx: TenantContext,
  input: AtribuirMembroFamiliaInput,
) {
  exigirGestaoFamilias(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { familiaId, membroId, papelFamiliar } = atribuirMembroFamiliaSchema.parse(input);

  const familia = await db.familia.findFirst({ where: { id: familiaId } });
  if (!familia) throw new ErroDeNegocio("Família não encontrada.");

  const membro = await db.membro.findFirst({ where: { id: membroId } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  await db.membro.updateMany({
    where: { id: membroId },
    data: { familiaId, papelFamiliar: papelFamiliar ?? null },
  });

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    antes: { familiaId: membro.familiaId, papelFamiliar: membro.papelFamiliar },
    depois: { familiaId, papelFamiliar: papelFamiliar ?? null },
  });
  return { id: membroId };
}

// ── Retirar membro da família ────────────────────────────────────
export async function removerMembroFamilia(
  ctx: TenantContext,
  input: RemoverMembroFamiliaInput,
) {
  exigirGestaoFamilias(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { membroId } = removerMembroFamiliaSchema.parse(input);

  const membro = await db.membro.findFirst({ where: { id: membroId } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  await db.membro.updateMany({
    where: { id: membroId },
    data: { familiaId: null, papelFamiliar: null },
  });

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    antes: { familiaId: membro.familiaId, papelFamiliar: membro.papelFamiliar },
    depois: { familiaId: null, papelFamiliar: null },
  });
  return { id: membroId };
}
