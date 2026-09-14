import { describe, it, expect } from "vitest";
import {
  igrejaSchema,
  criarUtilizadorSchema,
  actualizarUtilizadorSchema,
} from "./definicoes";

describe("validação de dados da igreja", () => {
  it("exige nome", () => {
    expect(igrejaSchema.safeParse({ nome: "" }).success).toBe(false);
  });
  it("assume moeda AOA por omissão e normaliza telefone", () => {
    const r = igrejaSchema.parse({ nome: "Igreja X", telefone: "923 456 789" });
    expect(r.moeda).toBe("AOA");
    expect(r.telefone).toBe("+244923456789");
  });
});

describe("validação de utilizador", () => {
  it("rejeita senha curta na criação", () => {
    const r = criarUtilizadorSchema.safeParse({
      nome: "João Teste",
      email: "j@t.ao",
      papel: "SECRETARIA",
      senha: "123",
    });
    expect(r.success).toBe(false);
  });
  it("aceita criação válida e normaliza email", () => {
    const r = criarUtilizadorSchema.parse({
      nome: "João Teste",
      email: "J@T.AO",
      papel: "SECRETARIA",
      senha: "segredo123",
    });
    expect(r.email).toBe("j@t.ao");
    expect(r.activo).toBe(true);
  });
  it("na edição permite senha vazia (manter)", () => {
    const r = actualizarUtilizadorSchema.safeParse({
      id: "u1",
      nome: "João Teste",
      email: "j@t.ao",
      papel: "PASTOR",
      senha: "",
    });
    expect(r.success).toBe(true);
  });
});
