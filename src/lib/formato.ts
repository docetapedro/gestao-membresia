import { format } from "date-fns";
import { pt } from "date-fns/locale";

/**
 * Formatação para Angola (spec secção 8):
 *   moeda -> "1 234 567,89 Kz"   datas -> "dd/MM/yyyy"
 * Guardar sempre UTC; formatar só na apresentação.
 */

/**
 * Formata um valor (number | string Decimal) como "1 234 567,89 Kz".
 * Separador de milhares = espaço; separador decimal = vírgula.
 * Construído manualmente para não depender do locale do sistema operativo.
 */
export function moeda(valor: number | string, simbolo = "Kz"): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return `0,00 ${simbolo}`;
  const negativo = n < 0;
  const [inteira = "0", decimal = "00"] = Math.abs(n).toFixed(2).split(".");
  const inteiraFmt = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${negativo ? "-" : ""}${inteiraFmt},${decimal} ${simbolo}`;
}

/** "dd/MM/yyyy". */
export function data(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return format(dt, "dd/MM/yyyy", { locale: pt });
}

/** "dd/MM/yyyy HH:mm". */
export function dataHora(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return format(dt, "dd/MM/yyyy HH:mm", { locale: pt });
}
