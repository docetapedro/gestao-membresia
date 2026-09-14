import type { Papel } from "@prisma/client";
import type { TenantContext } from "@/lib/tenant/context";

/**
 * Autorização por papel (spec secção 6).
 * Fonte única de verdade — verificada SEMPRE no servidor, dentro de cada
 * Server Action. A UI apenas esconde botões; nunca autoriza.
 */

export type Recurso =
  | "membros"
  | "contribuicoes"
  | "presencas"
  | "relatorios"
  | "relatorios_financeiros"
  | "definicoes";

export type Accao = "ler" | "criar" | "actualizar" | "eliminar" | "anular" | "exportar";

/** Nível de acesso a um recurso. */
type Nivel = "nenhum" | "leitura" | "total" | "propria_celula";

const MATRIZ: Record<Papel, Record<Recurso, Nivel>> = {
  ADMIN: {
    membros: "total",
    contribuicoes: "total",
    presencas: "total",
    relatorios: "total",
    relatorios_financeiros: "total",
    definicoes: "total",
  },
  PASTOR: {
    membros: "total",
    contribuicoes: "leitura",
    presencas: "total",
    relatorios: "total",
    relatorios_financeiros: "total",
    definicoes: "nenhum",
  },
  SECRETARIA: {
    membros: "total",
    contribuicoes: "nenhum",
    presencas: "total",
    relatorios: "total", // não-financeiros
    relatorios_financeiros: "nenhum",
    definicoes: "nenhum",
  },
  TESOURARIA: {
    membros: "leitura",
    contribuicoes: "total",
    presencas: "nenhum",
    relatorios: "nenhum",
    relatorios_financeiros: "total",
    definicoes: "nenhum",
  },
  LIDER_CELULA: {
    membros: "propria_celula",
    contribuicoes: "nenhum",
    presencas: "propria_celula",
    relatorios: "propria_celula",
    relatorios_financeiros: "nenhum",
    definicoes: "nenhum",
  },
};

const ACCOES_LEITURA: ReadonlySet<Accao> = new Set(["ler", "exportar"]);

/**
 * Verifica se o papel do contexto pode executar `accao` sobre `recurso`.
 * Para LIDER_CELULA ("propria_celula") devolve verdadeiro, mas o serviço
 * TEM de restringir os dados à célula do líder (ver `restringeACelula`).
 */
export function can(ctx: TenantContext, accao: Accao, recurso: Recurso): boolean {
  const nivel = MATRIZ[ctx.papel][recurso];
  switch (nivel) {
    case "nenhum":
      return false;
    case "leitura":
      return ACCOES_LEITURA.has(accao);
    case "total":
      return true;
    case "propria_celula":
      // acesso concedido; o âmbito é reduzido no serviço
      return true;
  }
}

/** Indica se o papel só pode ver/agir sobre a sua própria célula. */
export function restringeACelula(ctx: TenantContext, recurso: Recurso): boolean {
  return MATRIZ[ctx.papel][recurso] === "propria_celula";
}

/** Visibilidade de um recurso na navegação (qualquer nível != nenhum). */
export function recursoVisivel(papel: Papel, recurso: Recurso): boolean {
  return MATRIZ[papel][recurso] !== "nenhum";
}

/** Erro de autorização — convertido para `{ ok:false }` na Server Action. */
export class SemPermissaoError extends Error {
  constructor(accao: Accao, recurso: Recurso) {
    super(`Sem permissão para "${accao}" em "${recurso}".`);
    this.name = "SemPermissaoError";
  }
}

/** Garante permissão ou lança. Usar no topo dos serviços/actions. */
export function exigir(ctx: TenantContext, accao: Accao, recurso: Recurso): void {
  if (!can(ctx, accao, recurso)) {
    throw new SemPermissaoError(accao, recurso);
  }
}
