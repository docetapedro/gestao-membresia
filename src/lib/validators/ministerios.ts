import { z } from "zod";
import { textoOpcional, dataOpcional } from "./comum";

/** Campos partilhados por criação e edição de ministério. */
export const ministerioBaseSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto.").max(120),
  descricao: textoOpcional,
  liderId: textoOpcional,
  activo: z.coerce.boolean().default(true),
});

export const criarMinisterioSchema = ministerioBaseSchema;
export type CriarMinisterioInput = z.input<typeof criarMinisterioSchema>;

export const actualizarMinisterioSchema = ministerioBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarMinisterioInput = z.input<typeof actualizarMinisterioSchema>;

export const removerMinisterioSchema = z.object({
  id: z.string().min(1),
});
export type RemoverMinisterioInput = z.input<typeof removerMinisterioSchema>;

/** Atribuir um membro a um ministério (com função e datas opcionais). */
export const atribuirMembroMinisterioSchema = z.object({
  ministerioId: z.string().min(1),
  membroId: z.string().min(1),
  funcao: textoOpcional,
  desde: dataOpcional,
});
export type AtribuirMembroMinisterioInput = z.input<typeof atribuirMembroMinisterioSchema>;

/** Retirar uma associação membro↔ministério pelo id da associação. */
export const removerMembroMinisterioSchema = z.object({
  membroMinisterioId: z.string().min(1),
});
export type RemoverMembroMinisterioInput = z.input<typeof removerMembroMinisterioSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const ORDENAR_MINISTERIO = ["nome"] as const;
export type OrdenarMinisterio = (typeof ORDENAR_MINISTERIO)[number];

export const filtrosMinisterioSchema = z.object({
  q: z.string().trim().optional().default(""),
  activo: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_MINISTERIO).default("nome"),
  ordem: z.enum(["asc", "desc"]).default("asc"),
});
export type FiltrosMinisterio = z.infer<typeof filtrosMinisterioSchema>;
export type FiltrosMinisterioInput = z.input<typeof filtrosMinisterioSchema>;
