import { z } from "zod";

/**
 * Normaliza um telefone angolano para o formato +244XXXXXXXXX.
 * Aceita entradas com espaços, +244, 244 ou os 9 dígitos nacionais.
 * Devolve null se não tiver 9 dígitos nacionais válidos.
 */
export function normalizarTelefone(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  let nacional = digitos;
  if (nacional.startsWith("244")) nacional = nacional.slice(3);
  if (nacional.length !== 9) return null;
  return `+244${nacional}`;
}

/** Campo de telefone opcional que normaliza para +244XXXXXXXXX. */
export const telefoneOpcional = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || normalizarTelefone(v) !== null, {
    message: "Telefone inválido. Use 9 dígitos (ex.: 923 456 789).",
  })
  .transform((v) => (v ? normalizarTelefone(v) : null));

/** Email opcional normalizado para minúsculas. */
export const emailOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email inválido.")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

/** Converte "" em null; mantém strings não vazias. */
export const textoOpcional = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

/** Aceita "yyyy-MM-dd" ou Date; devolve Date (UTC) ou null. */
export const dataOpcional = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    const t = v.trim();
    if (!t) return null;
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  });
