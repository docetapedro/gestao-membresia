import { z } from "zod";
import { TipoContribuicao, MetodoPagamento } from "@prisma/client";
import { textoOpcional } from "./comum";

/** Data obrigatória. Aceita "yyyy-MM-dd", datetime-local ou Date. */
const dataObrigatoria = z.preprocess(
  (v) => {
    if (v instanceof Date) return v;
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  },
  z.date({ required_error: "Indique a data.", invalid_type_error: "Data inválida." }),
);

/**
 * Valor monetário. Aceita número ou string ("1500", "1 500,50", "1500.50").
 * Devolve string com 2 casas ("1500.50") para o Prisma Decimal. Nunca Float na BD.
 */
export const valorMonetario = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const n =
      typeof v === "number"
        ? v
        : Number(String(v).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor deve ser maior que zero." });
      return z.NEVER;
    }
    if (n > 999_999_999_999) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor demasiado alto." });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

/** Registo de contribuição. membroId vazio = oferta anónima. */
export const criarContribuicaoSchema = z.object({
  membroId: textoOpcional,
  tipo: z.nativeEnum(TipoContribuicao, { required_error: "Indique o tipo." }),
  valor: valorMonetario,
  metodo: z.nativeEnum(MetodoPagamento, { required_error: "Indique o método." }),
  data: dataObrigatoria,
  referencia: textoOpcional,
  cultoId: textoOpcional,
});
export type CriarContribuicaoInput = z.input<typeof criarContribuicaoSchema>;

/** Anulação (nunca se edita nem apaga — spec secção 5). */
export const anularContribuicaoSchema = z.object({
  id: z.string().min(1),
  motivoAnulacao: z.string().trim().min(3, "Indique o motivo da anulação.").max(500),
});
export type AnularContribuicaoInput = z.input<typeof anularContribuicaoSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const filtrosContribuicaoSchema = z.object({
  q: z.string().trim().optional().default(""),
  tipo: z.nativeEnum(TipoContribuicao).optional(),
  metodo: z.nativeEnum(MetodoPagamento).optional(),
  membroId: z.string().optional(),
  de: z.string().optional(), // "yyyy-MM-dd"
  ate: z.string().optional(),
  incluirAnuladas: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordem: z.enum(["asc", "desc"]).default("desc"),
});
export type FiltrosContribuicao = z.infer<typeof filtrosContribuicaoSchema>;
export type FiltrosContribuicaoInput = z.input<typeof filtrosContribuicaoSchema>;
