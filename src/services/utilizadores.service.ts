import { prismaComTenant, Prisma } from "@/lib/tenant/prisma-tenant";
import { exigir } from "@/lib/auth/permissoes";
import { criarHashSenha } from "@/lib/auth/senha";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";
import {
  criarUtilizadorSchema,
  actualizarUtilizadorSchema,
  type CriarUtilizadorInput,
  type ActualizarUtilizadorInput,
} from "@/lib/validators/definicoes";

const SELECT_SEGURO = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  activo: true,
  criadoEm: true,
} as const;

export async function listarUtilizadores(ctx: TenantContext) {
  exigir(ctx, "ler", "definicoes");
  const db = prismaComTenant(ctx);
  return db.utilizador.findMany({
    select: SELECT_SEGURO,
    orderBy: [{ activo: "desc" }, { nome: "asc" }],
  });
}

export async function obterUtilizador(ctx: TenantContext, id: string) {
  exigir(ctx, "ler", "definicoes");
  const db = prismaComTenant(ctx);
  return db.utilizador.findFirst({ where: { id }, select: SELECT_SEGURO });
}

export async function criarUtilizador(ctx: TenantContext, input: CriarUtilizadorInput) {
  exigir(ctx, "criar", "definicoes");
  const db = prismaComTenant(ctx);
  const dados = criarUtilizadorSchema.parse(input);

  const hashSenha = await criarHashSenha(dados.senha);
  try {
    const criado = await db.utilizador.create({
      data: {
        igrejaId: ctx.igrejaId,
        nome: dados.nome,
        email: dados.email,
        papel: dados.papel,
        activo: dados.activo,
        hashSenha,
      },
      select: SELECT_SEGURO,
    });
    await registarAuditoria(db, ctx, {
      accao: "CRIAR",
      entidade: "Utilizador",
      entidadeId: criado.id,
      depois: criado, // sem hashSenha
    });
    return criado;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new EmailEmUsoError();
    }
    throw e;
  }
}

export async function actualizarUtilizador(
  ctx: TenantContext,
  input: ActualizarUtilizadorInput,
) {
  exigir(ctx, "actualizar", "definicoes");
  const db = prismaComTenant(ctx);
  const dados = actualizarUtilizadorSchema.parse(input);

  const antes = await db.utilizador.findFirst({
    where: { id: dados.id },
    select: SELECT_SEGURO,
  });
  if (!antes) throw new Error("Utilizador não encontrado.");

  const perdeAdmin = antes.papel === "ADMIN" && dados.papel !== "ADMIN";
  const ficaInactivo = antes.activo && !dados.activo;

  // Não permitir remover o próprio acesso de administrador.
  if (dados.id === ctx.utilizadorId && (perdeAdmin || !dados.activo)) {
    throw new OperacaoInvalidaError("Não pode remover ou despromover o seu próprio acesso.");
  }
  // Não deixar a igreja sem administradores activos.
  if ((perdeAdmin || ficaInactivo) && antes.papel === "ADMIN") {
    const adminsActivos = await db.utilizador.count({
      where: { papel: "ADMIN", activo: true },
    });
    if (adminsActivos <= 1) {
      throw new OperacaoInvalidaError("Tem de existir pelo menos um administrador activo.");
    }
  }

  const data: Prisma.UtilizadorUpdateManyMutationInput = {
    nome: dados.nome,
    email: dados.email,
    papel: dados.papel,
    activo: dados.activo,
  };
  if (dados.senha && dados.senha.length > 0) {
    data.hashSenha = await criarHashSenha(dados.senha);
  }

  try {
    await db.utilizador.updateMany({ where: { id: dados.id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new EmailEmUsoError();
    }
    throw e;
  }

  const depois = await db.utilizador.findFirstOrThrow({
    where: { id: dados.id },
    select: SELECT_SEGURO,
  });
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Utilizador",
    entidadeId: dados.id,
    antes,
    depois,
  });
  return depois;
}

// Erros de domínio (traduzidos para mensagem amigável na action).
export class EmailEmUsoError extends ErroDeNegocio {
  constructor() {
    super("Já existe um utilizador com esse email.");
    this.name = "EmailEmUsoError";
  }
}
export class OperacaoInvalidaError extends ErroDeNegocio {
  constructor(msg: string) {
    super(msg);
    this.name = "OperacaoInvalidaError";
  }
}
