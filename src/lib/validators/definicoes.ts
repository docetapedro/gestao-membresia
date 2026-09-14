import { z } from "zod";
import { Papel } from "@prisma/client";
import { telefoneOpcional, emailOpcional, textoOpcional } from "./comum";

// ── Dados da igreja ──────────────────────────────────────────────
export const igrejaSchema = z.object({
  nome: z.string().trim().min(2, "Indique o nome da igreja.").max(150),
  denominacao: textoOpcional,
  nif: textoOpcional,
  provincia: textoOpcional,
  municipio: textoOpcional,
  endereco: textoOpcional,
  telefone: telefoneOpcional,
  email: emailOpcional,
  moeda: z.string().trim().min(1).max(8).default("AOA"),
});
export type IgrejaInput = z.input<typeof igrejaSchema>;

// ── Utilizadores ─────────────────────────────────────────────────
const senhaForte = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128);

export const criarUtilizadorSchema = z.object({
  nome: z.string().trim().min(3, "Nome demasiado curto.").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  papel: z.nativeEnum(Papel, { required_error: "Indique o papel." }),
  senha: senhaForte,
  activo: z.coerce.boolean().default(true),
});
export type CriarUtilizadorInput = z.input<typeof criarUtilizadorSchema>;

export const actualizarUtilizadorSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(3, "Nome demasiado curto.").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  papel: z.nativeEnum(Papel),
  activo: z.coerce.boolean().default(true),
  // Vazio = mantém a senha actual.
  senha: z.union([senhaForte, z.literal("")]).optional(),
});
export type ActualizarUtilizadorInput = z.input<typeof actualizarUtilizadorSchema>;
