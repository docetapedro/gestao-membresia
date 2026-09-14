/**
 * Aritmética monetária em cêntimos inteiros — evita erros de vírgula flutuante.
 * Os valores vêm do Prisma como string Decimal (ex.: "1500.50").
 */

export function paraCentimos(valor: string | number): number {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function deCentimos(centimos: number): string {
  const negativo = centimos < 0;
  const abs = Math.abs(centimos);
  const inteiros = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  return `${negativo ? "-" : ""}${inteiros}.${dec}`;
}

export interface ItemContribuicao {
  tipo: string;
  valor: string | number;
  anulada?: boolean;
}

export interface ResumoContribuicoes {
  total: string; // "1500.50"
  quantidade: number;
  porTipo: Record<string, string>;
}

/**
 * Soma contribuições ignorando as anuladas. Devolve o total, a quantidade
 * considerada e o total por tipo. Base dos relatórios financeiros.
 */
export function calcularResumo(itens: ItemContribuicao[]): ResumoContribuicoes {
  let totalCent = 0;
  const porTipoCent: Record<string, number> = {};
  let quantidade = 0;

  for (const item of itens) {
    if (item.anulada) continue;
    const c = paraCentimos(item.valor);
    totalCent += c;
    porTipoCent[item.tipo] = (porTipoCent[item.tipo] ?? 0) + c;
    quantidade += 1;
  }

  const porTipo: Record<string, string> = {};
  for (const [tipo, cent] of Object.entries(porTipoCent)) {
    porTipo[tipo] = deCentimos(cent);
  }

  return { total: deCentimos(totalCent), quantidade, porTipo };
}
