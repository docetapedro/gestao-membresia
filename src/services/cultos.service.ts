import { prismaComTenant, Prisma, type PrismaTenant } from "@/lib/tenant/prisma-tenant";
import { exigir, restringeACelula, SemPermissaoError } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarCultoSchema,
  actualizarCultoSchema,
  removerCultoSchema,
  filtrosCultoSchema,
  marcarPresencasSchema,
  type CriarCultoInput,
  type ActualizarCultoInput,
  type RemoverCultoInput,
  type FiltrosCultoInput,
  type MarcarPresencasInput,
} from "@/lib/validators/cultos";

/** Estados de membro elegíveis para marcação de presença. */
const ESTADOS_PRESENCA = ["VISITANTE", "EM_ACOMPANHAMENTO", "MEMBRO", "INACTIVO"] as const;

/** IDs das células lideradas pelo membro associado ao utilizador (LIDER_CELULA). */
async function celulasDoLider(db: PrismaTenant, ctx: TenantContext): Promise<string[]> {
  if (!ctx.membroId) return [];
  const celulas = await db.celula.findMany({
    where: { liderId: ctx.membroId },
    select: { id: true },
  });
  return celulas.map((c) => c.id);
}

/**
 * O registo/edição de cultos é reservado a quem tem acesso total a "presencas".
 * O líder de célula marca presenças, mas não gere a agenda de cultos.
 */
function exigirGestaoCulto(ctx: TenantContext, accao: "criar" | "actualizar" | "eliminar") {
  exigir(ctx, accao, "presencas");
  if (restringeACelula(ctx, "presencas")) {
    throw new SemPermissaoError(accao, "presencas");
  }
}

// ── Listagem de cultos ───────────────────────────────────────────
export interface PaginaCultos {
  itens: Array<{
    id: string;
    tipo: string;
    data: Date;
    tema: string | null;
    pregador: string | null;
    presentes: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarCultos(
  ctx: TenantContext,
  filtrosInput: FiltrosCultoInput,
): Promise<PaginaCultos> {
  exigir(ctx, "ler", "presencas");
  const db = prismaComTenant(ctx);
  const filtros = filtrosCultoSchema.parse(filtrosInput);

  const where: Prisma.CultoWhereInput = {};
  if (filtros.q) where.tema = { contains: filtros.q };
  if (filtros.tipo) where.tipo = filtros.tipo;

  const [total, registos] = await Promise.all([
    db.culto.count({ where }),
    db.culto.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        tipo: true,
        data: true,
        tema: true,
        pregador: true,
        _count: { select: { presencas: { where: { presente: true } } } },
      },
    }),
  ]);

  return {
    itens: registos.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      data: c.data,
      tema: c.tema,
      pregador: c.pregador,
      presentes: c._count.presencas,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

// ── Obter um culto ───────────────────────────────────────────────
export async function obterCulto(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "presencas");
  const db = prismaComTenant(ctx);
  return db.culto.findFirst({ where: { id } });
}

// ── Criar / actualizar / remover culto ───────────────────────────
export async function criarCulto(ctx: TenantContext, input: CriarCultoInput) {
  exigirGestaoCulto(ctx, "criar");
  const db = prismaComTenant(ctx);
  const dados = criarCultoSchema.parse(input);

  const criado = await db.culto.create({ data: { ...dados, igrejaId: ctx.igrejaId } });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Culto",
    entidadeId: criado.id,
    depois: criado,
  });
  return criado;
}

export async function actualizarCulto(ctx: TenantContext, input: ActualizarCultoInput) {
  exigirGestaoCulto(ctx, "actualizar");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarCultoSchema.parse(input);

  const antes = await db.culto.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Culto não encontrado.");

  const [, actualizado] = await db.$transaction([
    db.culto.updateMany({ where: { id }, data: dados }),
    db.culto.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Culto",
    entidadeId: id,
    antes,
    depois: actualizado,
  });
  return actualizado;
}

export async function removerCulto(ctx: TenantContext, input: RemoverCultoInput) {
  exigirGestaoCulto(ctx, "eliminar");
  const db = prismaComTenant(ctx);
  const { id } = removerCultoSchema.parse(input);

  const antes = await db.culto.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Culto não encontrado.");

  // Presenca tem onDelete: Cascade — as marcações saem com o culto.
  await db.culto.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Culto",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ── Folha de marcação de presenças ───────────────────────────────
export interface FolhaPresencas {
  culto: { id: string; tipo: string; data: Date; tema: string | null };
  membros: Array<{
    membroId: string;
    numeroMembro: string;
    nomeCompleto: string;
    presente: boolean;
  }>;
}

export async function obterFolhaPresencas(
  ctx: TenantContext,
  cultoId: string,
): Promise<FolhaPresencas | null> {
  exigir(ctx, "ler", "presencas");
  const db = prismaComTenant(ctx);

  const culto = await db.culto.findFirst({
    where: { id: cultoId },
    select: { id: true, tipo: true, data: true, tema: true },
  });
  if (!culto) return null;

  const where: Prisma.MembroWhereInput = { estado: { in: [...ESTADOS_PRESENCA] } };
  if (restringeACelula(ctx, "presencas")) {
    const ids = await celulasDoLider(db, ctx);
    where.celulaId = { in: ids.length ? ids : ["__nenhuma__"] };
  }

  const [membros, presencas] = await Promise.all([
    db.membro.findMany({
      where,
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, numeroMembro: true, nomeCompleto: true },
    }),
    db.presenca.findMany({ where: { cultoId }, select: { membroId: true, presente: true } }),
  ]);

  const estado = new Map(presencas.map((p) => [p.membroId, p.presente]));
  return {
    culto,
    membros: membros.map((m) => ({
      membroId: m.id,
      numeroMembro: m.numeroMembro,
      nomeCompleto: m.nomeCompleto,
      presente: estado.get(m.id) ?? false,
    })),
  };
}

// ── Gravar marcação ──────────────────────────────────────────────
export async function marcarPresencas(ctx: TenantContext, input: MarcarPresencasInput) {
  exigir(ctx, "actualizar", "presencas");
  const db = prismaComTenant(ctx);
  const { cultoId, marcacoes } = marcarPresencasSchema.parse(input);

  const culto = await db.culto.findFirst({ where: { id: cultoId } });
  if (!culto) throw new ErroDeNegocio("Culto não encontrado.");

  // Um líder de célula só pode marcar membros das suas células.
  let permitidas = marcacoes;
  if (restringeACelula(ctx, "presencas")) {
    const ids = await celulasDoLider(db, ctx);
    const membrosPermitidos = await db.membro.findMany({
      where: { celulaId: { in: ids.length ? ids : ["__nenhuma__"] } },
      select: { id: true },
    });
    const conjunto = new Set(membrosPermitidos.map((m) => m.id));
    permitidas = marcacoes.filter((m) => conjunto.has(m.membroId));
  }

  const membroIds = permitidas.map((m) => m.membroId);

  await db.$transaction([
    db.presenca.deleteMany({ where: { cultoId, membroId: { in: membroIds } } }),
    db.presenca.createMany({
      data: permitidas.map((m) => ({
        igrejaId: ctx.igrejaId,
        cultoId,
        membroId: m.membroId,
        presente: m.presente,
      })),
    }),
  ]);

  const presentes = permitidas.filter((m) => m.presente).length;
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Culto",
    entidadeId: cultoId,
    depois: { marcados: permitidas.length, presentes },
  });
  return { marcados: permitidas.length, presentes };
}
