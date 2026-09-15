import { z } from "zod";
import { TipoEvento } from "@prisma/client";
import { textoOpcional } from "./comum";

/** Data/hora obrigatória. Aceita "yyyy-MM-dd", datetime-local ou Date. */
const dataHoraObrigatoria = z.preprocess(
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

/** Data/hora opcional. Aceita "", "yyyy-MM-dd", datetime-local ou Date; devolve Date ou null. */
const dataHoraOpcional = z.preprocess(
  (v) => {
    if (v instanceof Date) return v;
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return null;
  },
  z.date({ invalid_type_error: "Data inválida." }).nullable(),
);

/** Hora "HH:mm" opcional; "" → null. */
export const horaOpcional = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), {
    message: "Hora inválida. Use o formato HH:mm.",
  });

// ── Programação semanal ──────────────────────────────────────────
export const programaSemanalBaseSchema = z.object({
  nome: z.string().trim().min(1, "Indique o nome.").max(120),
  diaSemana: z.coerce
    .number({ required_error: "Indique o dia da semana." })
    .int()
    .min(0, "Dia inválido.")
    .max(6, "Dia inválido."),
  hora: horaOpcional,
  local: textoOpcional,
  descricao: textoOpcional,
  activo: z.coerce.boolean().default(true),
  ordem: z.coerce.number().int().min(0).max(9999).default(0),
});

export const criarProgramaSemanalSchema = programaSemanalBaseSchema;
export type CriarProgramaSemanalInput = z.input<typeof criarProgramaSemanalSchema>;

export const actualizarProgramaSemanalSchema = programaSemanalBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarProgramaSemanalInput = z.input<typeof actualizarProgramaSemanalSchema>;

export const removerProgramaSemanalSchema = z.object({
  id: z.string().min(1),
});
export type RemoverProgramaSemanalInput = z.input<typeof removerProgramaSemanalSchema>;

// ── Eventos extraordinários ──────────────────────────────────────
export const eventoBaseSchema = z
  .object({
    nome: z.string().trim().min(1, "Indique o nome.").max(160),
    tipo: z.nativeEnum(TipoEvento, { required_error: "Indique o tipo de evento." }),
    inicio: dataHoraObrigatoria,
    fim: dataHoraOpcional,
    local: textoOpcional,
    descricao: textoOpcional,
  })
  .refine((v) => v.fim === null || v.fim >= v.inicio, {
    message: "O fim não pode ser anterior ao início.",
    path: ["fim"],
  });

export const criarEventoSchema = eventoBaseSchema;
export type CriarEventoInput = z.input<typeof criarEventoSchema>;

export const actualizarEventoSchema = z
  .object({
    id: z.string().min(1),
    nome: z.string().trim().min(1, "Indique o nome.").max(160),
    tipo: z.nativeEnum(TipoEvento, { required_error: "Indique o tipo de evento." }),
    inicio: dataHoraObrigatoria,
    fim: dataHoraOpcional,
    local: textoOpcional,
    descricao: textoOpcional,
  })
  .refine((v) => v.fim === null || v.fim >= v.inicio, {
    message: "O fim não pode ser anterior ao início.",
    path: ["fim"],
  });
export type ActualizarEventoInput = z.input<typeof actualizarEventoSchema>;

export const removerEventoSchema = z.object({
  id: z.string().min(1),
});
export type RemoverEventoInput = z.input<typeof removerEventoSchema>;

/** Marcação rápida de presenças de um evento. */
export const marcarPresencasEventoSchema = z.object({
  eventoId: z.string().min(1),
  marcacoes: z
    .array(
      z.object({
        membroId: z.string().min(1),
        presente: z.coerce.boolean(),
      }),
    )
    .max(2000),
});
export type MarcarPresencasEventoInput = z.input<typeof marcarPresencasEventoSchema>;

// ── Filtros da listagem de eventos (server-side) ─────────────────
export const ORDENAR_EVENTO = ["inicio", "nome"] as const;
export type OrdenarEvento = (typeof ORDENAR_EVENTO)[number];

export const filtrosEventoSchema = z.object({
  q: z.string().trim().optional().default(""),
  tipo: z.nativeEnum(TipoEvento).optional(),
  de: z.string().optional(), // "yyyy-MM-dd"
  ate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_EVENTO).default("inicio"),
  ordem: z.enum(["asc", "desc"]).default("desc"),
});
export type FiltrosEvento = z.infer<typeof filtrosEventoSchema>;
export type FiltrosEventoInput = z.input<typeof filtrosEventoSchema>;
