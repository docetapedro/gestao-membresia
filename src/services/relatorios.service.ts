import { prismaComTenant, Prisma, type PrismaTenant } from "@/lib/tenant/prisma-tenant";
import { exigir, can, restringeACelula } from "@/lib/auth/permissoes";
import { calcularResumo, paraCentimos, deCentimos } from "@/lib/financeiro";
import type { TenantContext } from "@/lib/tenant/context";

/**
 * Serviço de Relatórios — agregações só de leitura sobre membros, presenças
 * e finanças. Segue o molde de `dashboard.service.ts`:
 *   - `exigir(ctx,"ler","relatorios")` no topo (o financeiro exige o recurso
 *     próprio `relatorios_financeiros`);
 *   - `prismaComTenant(ctx)` para o filtro por igrejaId;
 *   - operações agregadas (count / groupBy / aggregate / findMany + reduce),
 *     nunca findUnique / update / delete.
 */

// ── Estados considerados "activos" para efeitos de relatório ─────────
const ESTADOS_ACTIVOS = ["VISITANTE", "EM_ACOMPANHAMENTO", "MEMBRO"] as const;

// ── Ajudas de datas / meses ──────────────────────────────────────────
const ROTULO_MES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

interface Balde {
  chave: string; // "yyyy-MM"
  rotulo: string; // "Jan 2026"
  ano: number;
  mes: number; // 0..11
}

function chaveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Lista de baldes mensais (inclusive) entre dois instantes. */
function mesesEntre(inicio: Date, fim: Date): Balde[] {
  const baldes: Balde[] = [];
  let ano = inicio.getFullYear();
  let mes = inicio.getMonth();
  const anoFim = fim.getFullYear();
  const mesFim = fim.getMonth();
  // Limite de segurança (não deve ultrapassar ~120 meses em uso normal).
  for (let i = 0; i < 240; i++) {
    baldes.push({
      chave: `${ano}-${String(mes + 1).padStart(2, "0")}`,
      rotulo: `${ROTULO_MES[mes]} ${ano}`,
      ano,
      mes,
    });
    if (ano === anoFim && mes === mesFim) break;
    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }
  return baldes;
}

/** Converte "yyyy-MM-dd" (ou undefined) num intervalo utilizável. */
export function resolverPeriodo(filtros?: { de?: string; ate?: string }): {
  de: Date;
  ate: Date;
} {
  const agora = new Date();
  const ate = filtros?.ate ? new Date(`${filtros.ate}T23:59:59.999`) : agora;
  const de = filtros?.de
    ? new Date(`${filtros.de}T00:00:00`)
    : new Date(ate.getFullYear(), ate.getMonth() - 11, 1);
  return { de, ate };
}

// ── Âmbito de célula (LIDER_CELULA) ──────────────────────────────────
/** IDs das células lideradas pelo membro associado ao utilizador. */
async function celulasDoLider(db: PrismaTenant, ctx: TenantContext): Promise<string[]> {
  if (!ctx.membroId) return [];
  const celulas = await db.celula.findMany({
    where: { liderId: ctx.membroId },
    select: { id: true },
  });
  return celulas.map((c) => c.id);
}

/**
 * Filtro de célula a aplicar a queries de Membro quando o papel restringe.
 * Devolve `undefined` quando não há restrição (acesso total).
 */
async function filtroCelulaMembro(
  db: PrismaTenant,
  ctx: TenantContext,
): Promise<Prisma.MembroWhereInput | undefined> {
  if (!restringeACelula(ctx, "relatorios")) return undefined;
  const ids = await celulasDoLider(db, ctx);
  return { celulaId: { in: ids.length ? ids : ["__nenhuma__"] } };
}

// ─────────────────────────────────────────────────────────────────────
// 1) Resumo geral (Dashboard)
// ─────────────────────────────────────────────────────────────────────
export interface ResumoGeral {
  totalMembros: number;
  membrosActivos: number; // estado = MEMBRO
  visitantes: number; // estado = VISITANTE
  presencaMediaRecente: number | null;
  contribuicoesMes: number | null; // null = sem permissão financeira
}

export async function resumoGeral(ctx: TenantContext): Promise<ResumoGeral> {
  exigir(ctx, "ler", "relatorios");
  const db = prismaComTenant(ctx);
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const ha3Meses = new Date(agora.getFullYear(), agora.getMonth() - 2, 1);

  const escopo = await filtroCelulaMembro(db, ctx);

  const [totalMembros, membrosActivos, visitantes] = await Promise.all([
    db.membro.count({ where: { ...escopo, estado: { in: [...ESTADOS_ACTIVOS] } } }),
    db.membro.count({ where: { ...escopo, estado: "MEMBRO" } }),
    db.membro.count({ where: { ...escopo, estado: "VISITANTE" } }),
  ]);

  // Presença média dos cultos dos últimos 3 meses.
  // TODO âmbito célula: presenças não têm ligação directa à célula; fica total.
  const cultos = await db.culto.findMany({
    where: { data: { gte: ha3Meses } },
    select: { _count: { select: { presencas: { where: { presente: true } } } } },
  });
  const presencaMediaRecente =
    cultos.length > 0
      ? Math.round(cultos.reduce((s, c) => s + c._count.presencas, 0) / cultos.length)
      : null;

  // Contribuições do mês corrente — só para quem pode ler relatórios financeiros.
  let contribuicoesMes: number | null = null;
  if (can(ctx, "ler", "relatorios_financeiros")) {
    const agregado = await db.contribuicao.aggregate({
      where: { data: { gte: inicioMes }, anulada: false },
      _sum: { valor: true },
    });
    contribuicoesMes = Number(agregado._sum.valor ?? 0);
  }

  return { totalMembros, membrosActivos, visitantes, presencaMediaRecente, contribuicoesMes };
}

// ─────────────────────────────────────────────────────────────────────
// 2) Relatório de membros
// ─────────────────────────────────────────────────────────────────────
export interface Distribuicao {
  chave: string; // valor bruto (enum, província, id…)
  rotulo: string; // rótulo apresentável
  valor: number;
}

export interface RelatorioMembros {
  porEstado: Distribuicao[];
  porSexo: Distribuicao[];
  porProvincia: Distribuicao[];
  porMinisterio: Distribuicao[];
  admissoesPorMes: Array<{ rotulo: string; valor: number }>;
  aniversariantesDoMes: Array<{ id: string; nomeCompleto: string; dia: number }>;
}

export async function relatorioMembros(ctx: TenantContext): Promise<RelatorioMembros> {
  exigir(ctx, "ler", "relatorios");
  const db = prismaComTenant(ctx);
  const escopo = (await filtroCelulaMembro(db, ctx)) ?? {};

  const agora = new Date();
  const inicio12 = new Date(agora.getFullYear(), agora.getMonth() - 11, 1);

  const { ESTADO_MEMBRO, SEXO } = await import("@/lib/rotulos");

  const [grupoEstado, grupoSexo, grupoProvincia, grupoMinisterio, admissoes, aniversariantes] =
    await Promise.all([
      db.membro.groupBy({ by: ["estado"], where: escopo, _count: { _all: true } }),
      db.membro.groupBy({ by: ["sexo"], where: escopo, _count: { _all: true } }),
      db.membro.groupBy({ by: ["provincia"], where: escopo, _count: { _all: true } }),
      db.membroMinisterio.groupBy({
        by: ["ministerioId"],
        where: { ate: null },
        _count: { _all: true },
      }),
      db.membro.findMany({
        where: { ...escopo, dataAdmissao: { gte: inicio12 } },
        select: { dataAdmissao: true },
      }),
      db.membro.findMany({
        where: { ...escopo, dataNascimento: { not: null } },
        select: { id: true, nomeCompleto: true, dataNascimento: true },
      }),
    ]);

  const porEstado: Distribuicao[] = grupoEstado
    .map((g) => ({
      chave: g.estado,
      rotulo: ESTADO_MEMBRO[g.estado] ?? g.estado,
      valor: g._count._all,
    }))
    .sort((a, b) => b.valor - a.valor);

  const porSexo: Distribuicao[] = grupoSexo.map((g) => ({
    chave: g.sexo,
    rotulo: SEXO[g.sexo] ?? g.sexo,
    valor: g._count._all,
  }));

  const porProvincia: Distribuicao[] = grupoProvincia
    .map((g) => ({
      chave: g.provincia ?? "—",
      rotulo: g.provincia ?? "Sem província",
      valor: g._count._all,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Nomes dos ministérios/departamentos.
  const idsMin = grupoMinisterio.map((g) => g.ministerioId);
  const ministerios =
    idsMin.length > 0
      ? await db.ministerio.findMany({
          where: { id: { in: idsMin } },
          select: { id: true, nome: true },
        })
      : [];
  const nomeMin = new Map(ministerios.map((m) => [m.id, m.nome]));
  const porMinisterio: Distribuicao[] = grupoMinisterio
    .map((g) => ({
      chave: g.ministerioId,
      rotulo: nomeMin.get(g.ministerioId) ?? "—",
      valor: g._count._all,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Admissões por mês (12 meses) — bucketing em JS (portável MySQL/PG).
  const baldes = mesesEntre(inicio12, agora);
  const contagemAdm = new Map<string, number>();
  for (const m of admissoes) {
    if (!m.dataAdmissao) continue;
    const k = chaveMes(m.dataAdmissao);
    contagemAdm.set(k, (contagemAdm.get(k) ?? 0) + 1);
  }
  const admissoesPorMes = baldes.map((b) => ({
    rotulo: b.rotulo,
    valor: contagemAdm.get(b.chave) ?? 0,
  }));

  // Aniversariantes do mês corrente.
  const mesActual = agora.getMonth();
  const aniversariantesDoMes = aniversariantes
    .filter((m) => m.dataNascimento && m.dataNascimento.getMonth() === mesActual)
    .map((m) => ({
      id: m.id,
      nomeCompleto: m.nomeCompleto,
      dia: m.dataNascimento!.getDate(),
    }))
    .sort((a, b) => a.dia - b.dia);

  return {
    porEstado,
    porSexo,
    porProvincia,
    porMinisterio,
    admissoesPorMes,
    aniversariantesDoMes,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3) Relatório de presenças
// ─────────────────────────────────────────────────────────────────────
export interface RelatorioPresencas {
  mediaPorCulto: number | null;
  mediaPorEvento: number | null;
  totalCultos: number;
  totalEventos: number;
  seriePorMes: Array<{ rotulo: string; valor: number }>;
  porTipoCulto: Distribuicao[];
}

export async function relatorioPresencas(
  ctx: TenantContext,
  filtros?: { de?: string; ate?: string },
): Promise<RelatorioPresencas> {
  exigir(ctx, "ler", "relatorios");
  // TODO âmbito célula: presenças não têm ligação directa à célula do líder;
  // por agora o relatório de presenças é sempre à escala da igreja.
  const db = prismaComTenant(ctx);
  const { de, ate } = resolverPeriodo(filtros);

  const { TIPO_CULTO } = await import("@/lib/rotulos");

  const [cultos, eventos] = await Promise.all([
    db.culto.findMany({
      where: { data: { gte: de, lte: ate } },
      select: {
        tipo: true,
        data: true,
        _count: { select: { presencas: { where: { presente: true } } } },
      },
    }),
    db.evento.findMany({
      where: { inicio: { gte: de, lte: ate } },
      select: {
        inicio: true,
        _count: { select: { presencas: { where: { presente: true } } } },
      },
    }),
  ]);

  const presentesCultos = cultos.reduce((s, c) => s + c._count.presencas, 0);
  const presentesEventos = eventos.reduce((s, e) => s + e._count.presencas, 0);
  const mediaPorCulto = cultos.length > 0 ? Math.round(presentesCultos / cultos.length) : null;
  const mediaPorEvento = eventos.length > 0 ? Math.round(presentesEventos / eventos.length) : null;

  // Série mensal (cultos + eventos) de total de presentes.
  const baldes = mesesEntre(de, ate);
  const porMes = new Map<string, number>();
  for (const c of cultos) {
    const k = chaveMes(c.data);
    porMes.set(k, (porMes.get(k) ?? 0) + c._count.presencas);
  }
  for (const e of eventos) {
    const k = chaveMes(e.inicio);
    porMes.set(k, (porMes.get(k) ?? 0) + e._count.presencas);
  }
  const seriePorMes = baldes.map((b) => ({ rotulo: b.rotulo, valor: porMes.get(b.chave) ?? 0 }));

  // Total de presentes por tipo de culto.
  const porTipo = new Map<string, number>();
  for (const c of cultos) {
    porTipo.set(c.tipo, (porTipo.get(c.tipo) ?? 0) + c._count.presencas);
  }
  const porTipoCulto: Distribuicao[] = [...porTipo.entries()]
    .map(([tipo, valor]) => ({
      chave: tipo,
      rotulo: TIPO_CULTO[tipo as keyof typeof TIPO_CULTO] ?? tipo,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    mediaPorCulto,
    mediaPorEvento,
    totalCultos: cultos.length,
    totalEventos: eventos.length,
    seriePorMes,
    porTipoCulto,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 4) Relatório financeiro (recurso próprio)
// ─────────────────────────────────────────────────────────────────────
export interface RelatorioFinanceiro {
  total: string; // "1500.50"
  quantidade: number;
  porTipo: Distribuicao[]; // valor em unidades inteiras (moeda), para gráfico
  porTipoTexto: Record<string, string>; // "1500.50" por tipo
  seriePorMes: Array<{ rotulo: string; valor: number }>; // valor em unidades
  topContribuintes: Array<{ id: string; nome: string; total: string }>;
}

export async function relatorioFinanceiro(
  ctx: TenantContext,
  filtros?: { de?: string; ate?: string; topN?: number },
): Promise<RelatorioFinanceiro> {
  exigir(ctx, "ler", "relatorios_financeiros");
  const db = prismaComTenant(ctx);
  const { de, ate } = resolverPeriodo(filtros);
  const topN = filtros?.topN ?? 5;

  const registos = await db.contribuicao.findMany({
    where: { data: { gte: de, lte: ate }, anulada: false },
    select: {
      tipo: true,
      valor: true,
      data: true,
      membroId: true,
      membro: { select: { id: true, nomeCompleto: true } },
    },
  });

  const { TIPO_CONTRIBUICAO } = await import("@/lib/rotulos");

  const resumo = calcularResumo(
    registos.map((r) => ({ tipo: r.tipo, valor: r.valor.toString() })),
  );

  const porTipo: Distribuicao[] = Object.entries(resumo.porTipo)
    .map(([tipo, texto]) => ({
      chave: tipo,
      rotulo: TIPO_CONTRIBUICAO[tipo as keyof typeof TIPO_CONTRIBUICAO] ?? tipo,
      valor: Number(texto),
    }))
    .sort((a, b) => b.valor - a.valor);

  // Série mensal (soma em cêntimos → unidades).
  const baldes = mesesEntre(de, ate);
  const porMesCent = new Map<string, number>();
  for (const r of registos) {
    const k = chaveMes(r.data);
    porMesCent.set(k, (porMesCent.get(k) ?? 0) + paraCentimos(r.valor.toString()));
  }
  const seriePorMes = baldes.map((b) => ({
    rotulo: b.rotulo,
    valor: Number(deCentimos(porMesCent.get(b.chave) ?? 0)),
  }));

  // Top N contribuintes (ignora ofertas anónimas — sem membroId).
  const porMembroCent = new Map<string, { nome: string; cent: number }>();
  for (const r of registos) {
    if (!r.membro) continue;
    const actual = porMembroCent.get(r.membro.id);
    const cent = paraCentimos(r.valor.toString());
    if (actual) actual.cent += cent;
    else porMembroCent.set(r.membro.id, { nome: r.membro.nomeCompleto, cent });
  }
  const topContribuintes = [...porMembroCent.entries()]
    .map(([id, v]) => ({ id, nome: v.nome, total: deCentimos(v.cent) }))
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, topN);

  return {
    total: resumo.total,
    quantidade: resumo.quantidade,
    porTipo,
    porTipoTexto: resumo.porTipo,
    seriePorMes,
    topContribuintes,
  };
}
