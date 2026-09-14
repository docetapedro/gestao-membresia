import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  senha: z.string().min(1, "Introduza a senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const pedidoRecuperacaoSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
});
export type PedidoRecuperacaoInput = z.infer<typeof pedidoRecuperacaoSchema>;

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(10),
    senha: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .max(128),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não coincidem.",
    path: ["confirmacao"],
  });
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
