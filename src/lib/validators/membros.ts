import { z } from "zod";
import {
  Sexo,
  EstadoCivil,
  TipoDocumento,
  EstadoMembro,
  FormaAdmissao,
  PapelFamiliar,
} from "@prisma/client";
import {
  telefoneOpcional,
  emailOpcional,
  textoOpcional,
  dataOpcional,
} from "./comum";

/** Campos partilhados por criação e edição de membro. */
export const membroBaseSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Nome demasiado curto.").max(150),
  nomePreferido: textoOpcional,
  sexo: z.nativeEnum(Sexo, { required_error: "Indique o sexo." }),
  dataNascimento: dataOpcional,
  estadoCivil: z.nativeEnum(EstadoCivil).optional().nullable(),
  documentoTipo: z.nativeEnum(TipoDocumento).optional().nullable(),
  documentoNumero: textoOpcional,
  telefone: telefoneOpcional,
  telefoneAlt: telefoneOpcional,
  email: emailOpcional,
  provincia: textoOpcional,
  municipio: textoOpcional,
  bairro: textoOpcional,
  endereco: textoOpcional,
  profissao: textoOpcional,

  estado: z.nativeEnum(EstadoMembro, { required_error: "Indique o estado." }),
  dataConversao: dataOpcional,
  dataBaptismo: dataOpcional,
  localBaptismo: textoOpcional,
  dataAdmissao: dataOpcional,
  formaAdmissao: z.nativeEnum(FormaAdmissao).optional().nullable(),
  igrejaOrigem: textoOpcional,

  familiaId: textoOpcional,
  papelFamiliar: z.nativeEnum(PapelFamiliar).optional().nullable(),
  celulaId: textoOpcional,
  observacoes: textoOpcional,

  consentimentoDados: z.coerce.boolean().default(false),
});

export const criarMembroSchema = membroBaseSchema;
export type CriarMembroInput = z.input<typeof criarMembroSchema>;

export const actualizarMembroSchema = membroBaseSchema.extend({
  id: z.string().min(1),
});
export type ActualizarMembroInput = z.input<typeof actualizarMembroSchema>;

/** Remoção lógica (nunca física — spec secção 5). */
export const removerMembroSchema = z.object({
  id: z.string().min(1),
  estado: z
    .nativeEnum(EstadoMembro)
    .refine((e) => e === "INACTIVO" || e === "TRANSFERIDO" || e === "FALECIDO", {
      message: "Estado de saída inválido.",
    }),
  motivoSaida: z.string().trim().max(500).optional().nullable(),
});
export type RemoverMembroInput = z.input<typeof removerMembroSchema>;

// ── Filtros da listagem (server-side) ────────────────────────────
export const ORDENAR_MEMBRO = ["nomeCompleto", "numeroMembro", "estado", "criadoEm"] as const;
export type OrdenarMembro = (typeof ORDENAR_MEMBRO)[number];

export const filtrosMembroSchema = z.object({
  q: z.string().trim().optional().default(""),
  estado: z.nativeEnum(EstadoMembro).optional(),
  celulaId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  ordenarPor: z.enum(ORDENAR_MEMBRO).default("nomeCompleto"),
  ordem: z.enum(["asc", "desc"]).default("asc"),
});
export type FiltrosMembro = z.infer<typeof filtrosMembroSchema>;
export type FiltrosMembroInput = z.input<typeof filtrosMembroSchema>;
