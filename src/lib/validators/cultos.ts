import { z } from "zod";
import { TipoCulto } from "@prisma/client";
import { textoOpcional } from "./comum";

/** Data/hora obrigatória. Aceita "yyyy-MM-dd", datetime-local ou Date. */
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

/** Campos partilhados por criação e edição de culto. */
export const cultoBaseSchema = z.object({
  tipo: z.nativeEnum(TipoCulto, { required_error: "Indique o tipo de culto." }),
  data: dataObrigatoria,
  tema: textoOpcional,
  pregador: textoOpcional,
});

export const criarCultoSchema = cultoBaseSchema;
export type CriarCultoInput = z.input<typeof criarCultoSchema>;

export const actualizarCultoSchema = cultoBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarCultoInput = z.input<typeof actualizarCultoSchema>;

export const removerCultoSchema = z.object({
  id: z.string().min(1),
});
export type RemoverCultoInput = z.input<typeof removerCultoSchema>;

/** Marcação rápida de presenças de um culto. */
export const marcarPresencasSchema = z.object({
  cultoId: z.string().min(1),
  marcacoes: z
    .array(
      z.object({
        membroId: z.string().min(1),
        presente: z.coerce.boolean(),
      }),
    )
    .max(2000),
});
export type MarcarPresencasInput = z.input<typeof marcarPresencasSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const ORDENAR_CULTO = ["data"] as const;
export type OrdenarCulto = (typeof ORDENAR_CULTO)[number];

export const filtrosCultoSchema = z.object({
  q: z.string().trim().optional().default(""),
  tipo: z.nativeEnum(TipoCulto).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_CULTO).default("data"),
  ordem: z.enum(["asc", "desc"]).default("desc"),
});
export type FiltrosCulto = z.infer<typeof filtrosCultoSchema>;
export type FiltrosCultoInput = z.input<typeof filtrosCultoSchema>;
