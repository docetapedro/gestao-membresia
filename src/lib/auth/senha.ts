import { hash, verify } from "@node-rs/argon2";

// Parâmetros Argon2id (OWASP: >= 19 MiB, t=2, p=1).
const OPCOES = {
  memoryCost: 19456, // KiB (~19 MiB)
  timeCost: 2,
  parallelism: 1,
} as const;

/** Gera hash Argon2id de uma senha em claro. */
export function criarHashSenha(senha: string): Promise<string> {
  return hash(senha, OPCOES);
}

/** Verifica uma senha em claro contra um hash Argon2id. */
export function verificarSenha(hashGuardado: string, senha: string): Promise<boolean> {
  return verify(hashGuardado, senha, OPCOES);
}
