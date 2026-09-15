import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarProgramaSemanalSchema,
  actualizarProgramaSemanalSchema,
  removerProgramaSemanalSchema,
  criarEventoSchema,
  actualizarEventoSchema,
  removerEventoSchema,
  filtrosEventoSchema,
  marcarPresencasEventoSchema,
  type CriarProgramaSemanalInput,
  type ActualizarProgramaSemanalInput,
  type RemoverProgramaSemanalInput,
  type CriarEventoInput,
  type ActualizarEventoInput,
  type RemoverEventoInput,
  type FiltrosEventoInput,
  type MarcarPresencasEventoInput,
} from "@/lib/validators/eventos";

/** Estados de membro elegíveis para marcação de presença. */
const ESTADOS_PRESENCA = ["VISITANTE", "EM_ACOMPANHAMENTO", "MEMBRO", "INACTIVO"] as const;

// ═════════════════════════════════════════════════════════════════
// Programação semanal (horário fixo recorrente)
// ═════════════════════════════════════════════════════════════════

export interface ItemProgramaSemanal {
  id: string;
  nome: string;
  diaSemana: number;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  activo: boolean;
  ordem: number;
}

export async function listarProgramaSemanal(
  ctx: TenantContext,
): Promise<ItemProgramaSemanal[]> {
  exigir(ctx, "ler", "eventos");
  const db = prismaComTenant(ctx);

  return db.programaSemanal.findMany({
    orderBy: [{ diaSemana: "asc" }, { ordem: "asc" }, { hora: "asc" }],
    select: {
      id: true,
      nome: true,
      diaSemana: true,
      hora: true,
      local: true,
      descricao: true,
      activo: true,
      ordem: true,
    },
  });
}

export async function criarProgramaSemanal(
  ctx: TenantContext,
  input: CriarProgramaSemanalInput,
) {
  exigir(ctx, "criar", "eventos");
  const db = prismaComTenant(ctx);
  const dados = criarProgramaSemanalSchema.parse(input);

  const criado = await db.programaSemanal.create({ data: { ...dados, igrejaId: ctx.igrejaId } });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "ProgramaSemanal",
    entidadeId: criado.id,
    depois: criado,
  });
  return criado;
}

export async function actualizarProgramaSemanal(
  ctx: TenantContext,
  input: ActualizarProgramaSemanalInput,
) {
  exigir(ctx, "actualizar", "eventos");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarProgramaSemanalSchema.parse(input);

  const antes = await db.programaSemanal.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Item da programação não encontrado.");

  const [, actualizado] = await db.$transaction([
    db.programaSemanal.updateMany({ where: { id }, data: dados }),
    db.programaSemanal.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "ProgramaSemanal",
    entidadeId: id,
    antes,
    depois: actualizado,
  });
  return actualizado;
}

export async function removerProgramaSemanal(
  ctx: TenantContext,
  input: RemoverProgramaSemanalInput,
) {
  exigir(ctx, "eliminar", "eventos");
  const db = prismaComTenant(ctx);
  const { id } = removerProgramaSemanalSchema.parse(input);

  const antes = await db.programaSemanal.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Item da programação não encontrado.");

  await db.programaSemanal.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "ProgramaSemanal",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ═════════════════════════════════════════════════════════════════
// Eventos extraordinários (pontuais, com presenças)
// ═════════════════════════════════════════════════════════════════

export interface PaginaEventos {
  itens: Array<{
    id: string;
    nome: string;
    tipo: string;
    inicio: Date;
    fim: Date | null;
    local: string | null;
    presentes: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPaginas: number;
}

export async function listarEventos(
  ctx: TenantContext,
  filtrosInput: FiltrosEventoInput,
): Promise<PaginaEventos> {
  exigir(ctx, "ler", "eventos");
  const db = prismaComTenant(ctx);
  const filtros = filtrosEventoSchema.parse(filtrosInput);

  const where: Prisma.EventoWhereInput = {};
  if (filtros.q) where.nome = { contains: filtros.q };
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.de || filtros.ate) {
    const inicio: Prisma.DateTimeFilter = {};
    if (filtros.de) inicio.gte = new Date(`${filtros.de}T00:00:00`);
    if (filtros.ate) inicio.lte = new Date(`${filtros.ate}T23:59:59.999`);
    where.inicio = inicio;
  }

  const [total, registos] = await Promise.all([
    db.evento.count({ where }),
    db.evento.findMany({
      where,
      orderBy: { [filtros.ordenarPor]: filtros.ordem },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
      select: {
        id: true,
        nome: true,
        tipo: true,
        inicio: true,
        fim: true,
        local: true,
        _count: { select: { presencas: { where: { presente: true } } } },
      },
    }),
  ]);

  return {
    itens: registos.map((e) => ({
      id: e.id,
      nome: e.nome,
      tipo: e.tipo,
      inicio: e.inicio,
      fim: e.fim,
      local: e.local,
      presentes: e._count.presencas,
    })),
    total,
    page: filtros.page,
    pageSize: filtros.pageSize,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.pageSize)),
  };
}

export async function obterEvento(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "eventos");
  const db = prismaComTenant(ctx);
  return db.evento.findFirst({ where: { id } });
}

export async function criarEvento(ctx: TenantContext, input: CriarEventoInput) {
  exigir(ctx, "criar", "eventos");
  const db = prismaComTenant(ctx);
  const dados = criarEventoSchema.parse(input);

  const criado = await db.evento.create({ data: { ...dados, igrejaId: ctx.igrejaId } });
  await registarAuditoria(db, ctx, {
    accao: "CRIAR",
    entidade: "Evento",
    entidadeId: criado.id,
    depois: criado,
  });
  return criado;
}

export async function actualizarEvento(ctx: TenantContext, input: ActualizarEventoInput) {
  exigir(ctx, "actualizar", "eventos");
  const db = prismaComTenant(ctx);
  const { id, ...dados } = actualizarEventoSchema.parse(input);

  const antes = await db.evento.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Evento não encontrado.");

  const [, actualizado] = await db.$transaction([
    db.evento.updateMany({ where: { id }, data: dados }),
    db.evento.findFirstOrThrow({ where: { id } }),
  ]);

  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Evento",
    entidadeId: id,
    antes,
    depois: actualizado,
  });
  return actualizado;
}

export async function removerEvento(ctx: TenantContext, input: RemoverEventoInput) {
  exigir(ctx, "eliminar", "eventos");
  const db = prismaComTenant(ctx);
  const { id } = removerEventoSchema.parse(input);

  const antes = await db.evento.findFirst({ where: { id } });
  if (!antes) throw new ErroDeNegocio("Evento não encontrado.");

  // Presenca tem onDelete: Cascade — as marcações saem com o evento.
  await db.evento.deleteMany({ where: { id } });
  await registarAuditoria(db, ctx, {
    accao: "ELIMINAR",
    entidade: "Evento",
    entidadeId: id,
    antes,
  });
  return { id };
}

// ═════════════════════════════════════════════════════════════════
// Presenças de evento
// ═════════════════════════════════════════════════════════════════

export interface FolhaPresencasEvento {
  evento: { id: string; nome: string; tipo: string; inicio: Date; fim: Date | null };
  membros: Array<{
    membroId: string;
    numeroMembro: string;
    nomeCompleto: string;
    presente: boolean;
  }>;
}

export async function listarPresencasEvento(
  ctx: TenantContext,
  eventoId: string,
): Promise<FolhaPresencasEvento | null> {
  exigir(ctx, "ler", "eventos");
  const db = prismaComTenant(ctx);

  const evento = await db.evento.findFirst({
    where: { id: eventoId },
    select: { id: true, nome: true, tipo: true, inicio: true, fim: true },
  });
  if (!evento) return null;

  const [membros, presencas] = await Promise.all([
    db.membro.findMany({
      where: { estado: { in: [...ESTADOS_PRESENCA] } },
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, numeroMembro: true, nomeCompleto: true },
    }),
    db.presenca.findMany({ where: { eventoId }, select: { membroId: true, presente: true } }),
  ]);

  const estado = new Map(presencas.map((p) => [p.membroId, p.presente]));
  return {
    evento,
    membros: membros.map((m) => ({
      membroId: m.id,
      numeroMembro: m.numeroMembro,
      nomeCompleto: m.nomeCompleto,
      presente: estado.get(m.id) ?? false,
    })),
  };
}

export async function marcarPresencasEvento(
  ctx: TenantContext,
  input: MarcarPresencasEventoInput,
) {
  exigir(ctx, "actualizar", "eventos");
  const db = prismaComTenant(ctx);
  const { eventoId, marcacoes } = marcarPresencasEventoSchema.parse(input);

  const evento = await db.evento.findFirst({ where: { id: eventoId } });
  if (!evento) throw new ErroDeNegocio("Evento não encontrado.");

  const membroIds = marcacoes.map((m) => m.membroId);

  await db.$transaction([
    db.presenca.deleteMany({ where: { eventoId, membroId: { in: membroIds } } }),
    db.presenca.createMany({
      data: marcacoes.map((m) => ({
        igrejaId: ctx.igrejaId,
        eventoId,
        membroId: m.membroId,
        presente: m.presente,
      })),
    }),
  ]);

  const presentes = marcacoes.filter((m) => m.presente).length;
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Evento",
    entidadeId: eventoId,
    depois: { marcados: marcacoes.length, presentes },
  });
  return { marcados: marcacoes.length, presentes };
}
