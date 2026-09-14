import { z } from "zod";
import { textoOpcional } from "./comum";

/** Dia da semana opcional (0 = Domingo … 6 = Sábado). "" → null. */
const diaSemanaOpcional = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z.coerce.number().int().min(0).max(6).nullable(),
);

/** Campos partilhados por criação e edição de célula. */
export const celulaBaseSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto.").max(120),
  liderId: textoOpcional,
  anfitriaoId: textoOpcional,
  diaSemana: diaSemanaOpcional,
  hora: textoOpcional,
  endereco: textoOpcional,
  activa: z.coerce.boolean().default(true),
});

export const criarCelulaSchema = celulaBaseSchema;
export type CriarCelulaInput = z.input<typeof criarCelulaSchema>;

export const actualizarCelulaSchema = celulaBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarCelulaInput = z.input<typeof actualizarCelulaSchema>;

export const removerCelulaSchema = z.object({
  id: z.string().min(1),
});
export type RemoverCelulaInput = z.input<typeof removerCelulaSchema>;

/** Atribuir um membro (existente, sem célula) a uma célula. */
export const atribuirMembroCelulaSchema = z.object({
  celulaId: z.string().min(1),
  membroId: z.string().min(1),
});
export type AtribuirMembroCelulaInput = z.input<typeof atribuirMembroCelulaSchema>;

/** Retirar um membro da célula (limpa celulaId). */
export const removerMembroCelulaSchema = z.object({
  membroId: z.string().min(1),
});
export type RemoverMembroCelulaInput = z.input<typeof removerMembroCelulaSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const ORDENAR_CELULA = ["nome"] as const;
export type OrdenarCelula = (typeof ORDENAR_CELULA)[number];

export const filtrosCelulaSchema = z.object({
  q: z.string().trim().optional().default(""),
  activa: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_CELULA).default("nome"),
  ordem: z.enum(["asc", "desc"]).default("asc"),
});
export type FiltrosCelula = z.infer<typeof filtrosCelulaSchema>;
export type FiltrosCelulaInput = z.input<typeof filtrosCelulaSchema>;
