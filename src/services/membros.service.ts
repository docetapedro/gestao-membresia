import { prismaComTenant, Prisma, type PrismaTenant } from "@/lib/tenant/prisma-tenant";
import { exigir, restringeACelula } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarMembroSchema,
  actualizarMembroSchema,
  removerMembroSchema,
  filtrosMembroSchema,
  type CriarMembroInput,
  type ActualizarMembroInput,
  type RemoverMembroInput,
  type FiltrosMembroInput,
} from "@/lib/validators/membros";

/** IDs das células lideradas pelo membro associado ao utilizador (LIDER_CELULA). */
async function celulasDoLider(db: PrismaTenant, ctx: TenantContext): Promise<string[]> {
  if (!ctx.membroId) return [];
  const celulas = await db.celula.findMany({
    where: { liderId: ctx.membroId },
    select: { id: true },
  });
  return celulas.map((c) => c.id);
}

// ── Listagem ─────────────────────────────────────────────────────
export interface PaginaMembros {
  itens: Array<{
    id: string;
    numeroMembro: string;
    nomeCompleto: string;
    telefone: string | null;
    estado: string;
    celula: { nome: string } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarMembros(
  ctx: TenantContext,
  filtrosInput: FiltrosMembroInput,
): Promise<PaginaMembros> {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const filtros = filtrosMembroSchema.parse(filtrosInput);

  const where: Prisma.MembroWhereInput = {};

  if (filtros.q) {
    where.OR = [
      { nomeCompleto: { contains: filtros.q } },
      { numeroMembro: { contains: filtros.q } },
      { telefone: { contains: filtros.q } },
    ];
  }
  if (filtros.estado) where.estado = filtros.estado;

  // Restrição de âmbito para líder de célula.
  if (restringeACelula(ctx, "membros")) {
    const ids = await celulasDoLider(db, ctx);
    where.celulaId = filtros.celulaId
      ? ids.includes(filtros.celulaId)
        ? filtros.celulaId
        : "__nenhuma__"
      : { in: ids.length ? ids : ["__nenhuma__"] };
  } else if (filtros.celulaId) {
    where.celulaId = filtros.celulaId;
  }

  const [total, itens] = await Promise.all([
    db.membro.count({ where }),
    db.membro.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        numeroMembro: true,
        nomeCompleto: true,
        telefone: true,
        estado: true,
        celula: { select: { nome: true } },
      },
    }),
  ]);

  return {
    itens,
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

// ── Obter um ─────────────────────────────────────────────────────
export async function obterMembro(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);

  const membro = await db.membro.findFirst({
    where: { id },
    include: {
      celula: { select: { id: true, nome: true } },
      familia: { select: { id: true, nome: true } },
    },
  });
  if (!membro) return null;

  // Líder de célula só vê membros das suas células.
  if (restringeACelula(ctx, "membros")) {
    const ids = await celulasDoLider(db, ctx);
    if (!membro.celulaId || !ids.includes(membro.celulaId)) return null;
  }
  return membro;
}

// ── Número sequencial por igreja ─────────────────────────────────
async function proximoNumeroMembro(db: PrismaTenant): Promise<string> {
  const ultimo = await db.membro.findFirst({
    orderBy: { numeroMembro: "desc" },
    select: { numeroMembro: true },
  });
  const n = ultimo ? Number.parseInt(ultimo.numeroMembro, 10) || 0 : 0;
  return String(n + 1).padStart(4, "0");
}

// ── Criar ────────────────────────────────────────────────────────
export async function criarMembro(ctx: TenantContext, input: CriarMembroInput) {
  exigir(ctx, "criar", "membros");
  const db = prismaComTenant(ctx);
  const dados = criarMembroSchema.parse(input);

  const consentimentoDataHora = dados.consentimentoDados ? new Date() : null;

  // Tenta até 3 vezes em caso de colisão do número sequencial.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const numeroMembro = await proximoNumeroMembro(db);
    try {
      const criado = await db.membro.create({
        data: { ...dados, igrejaId: ctx.igrejaId, numeroMembro, consentimentoDataHora },
      });
      await registarAuditoria(db, ctx, {
        accao: "CRIAR",
        entidade: "Membro",
        entidadeId: criado.id,
        depois: criado,
      });
      return criado;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        tentativa < 2
      ) {
        continue; // número já usado — recalcula
      }
      throw e;
    }
  }
  throw new Error("Não foi possível gerar o número de membro. Tente novamente.");
}

// ── Actualizar ───────────────────────────────────────────────────
export async function actualizarMembro(
  ctx: TenantContext,
  input: ActualizarMembroInput,
) {
  exigir(ctx, "actualizar", "membros");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarMembroSchema.parse(input);

  const antes = await db.membro.findFirst({ where: { id } });
  if (!antes) throw new Error("Membro não encontrado.");

  // Data de consentimento: preenche ao conceder, limpa ao revogar.
  let consentimentoDataHora = antes.consentimentoDataHora;
  if (dados.consentimentoDados && !antes.consentimentoDados) {
    consentimentoDataHora = new Date();
  } else if (!dados.consentimentoDados) {
    consentimentoDataHora = null;
  }

  const [, actualizado] = await db.$transaction([
    db.membro.updateMany({ where: { id }, data: { ...dados, consentimentoDataHora } }),
    db.membro.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: id,
    antes,
    depois: actualizado,
  });
  return actualizado;
}

// ── Remoção lógica ───────────────────────────────────────────────
export async function removerMembro(ctx: TenantContext, input: RemoverMembroInput) {
  exigir(ctx, "eliminar", "membros");
  const db = prismaComTenant(ctx);
  const { id, estado, motivoSaida } = removerMembroSchema.parse(input);

  const antes = await db.membro.findFirst({ where: { id } });
  if (!antes) throw new Error("Membro não encontrado.");

  await db.membro.updateMany({
    where: { id },
    data: { estado, dataSaida: new Date(), motivoSaida: motivoSaida ?? null },
  });

  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Membro",
    entidadeId: id,
    antes,
    depois: { estado, motivoSaida },
  });
  return { id };
}

// ── Auxiliares para formulários ──────────────────────────────────
export async function opcoesFormularioMembro(ctx: TenantContext) {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const [celulas, familias] = await Promise.all([
    db.celula.findMany({
      where: { activa: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    db.familia.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  return { celulas, familias };
}
