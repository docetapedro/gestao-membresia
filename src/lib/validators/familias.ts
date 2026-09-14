import { z } from "zod";
import { PapelFamiliar } from "@prisma/client";
import { textoOpcional } from "./comum";

/** Campos partilhados por criação e edição de família. */
export const familiaBaseSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto.").max(120),
  endereco: textoOpcional,
});

export const criarFamiliaSchema = familiaBaseSchema;
export type CriarFamiliaInput = z.input<typeof criarFamiliaSchema>;

export const actualizarFamiliaSchema = familiaBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarFamiliaInput = z.input<typeof actualizarFamiliaSchema>;

export const removerFamiliaSchema = z.object({
  id: z.string().min(1),
});
export type RemoverFamiliaInput = z.input<typeof removerFamiliaSchema>;

/** Atribuir um membro existente a uma família (com papel opcional). */
export const atribuirMembroFamiliaSchema = z.object({
  familiaId: z.string().min(1),
  membroId: z.string().min(1),
  papelFamiliar: z.nativeEnum(PapelFamiliar).optional().nullable(),
});
export type AtribuirMembroFamiliaInput = z.input<typeof atribuirMembroFamiliaSchema>;

/** Retirar um membro da família (limpa familiaId e papelFamiliar). */
export const removerMembroFamiliaSchema = z.object({
  membroId: z.string().min(1),
});
export type RemoverMembroFamiliaInput = z.input<typeof removerMembroFamiliaSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const ORDENAR_FAMILIA = ["nome"] as const;
export type OrdenarFamilia = (typeof ORDENAR_FAMILIA)[number];

export const filtrosFamiliaSchema = z.object({
  q: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_FAMILIA).default("nome"),
  ordem: z.enum(["asc", "desc"]).default("asc"),
});
export type FiltrosFamilia = z.infer<typeof filtrosFamiliaSchema>;
export type FiltrosFamiliaInput = z.input<typeof filtrosFamiliaSchema>;
