import { describe, it, expect } from "vitest";
import {
  criarMinisterioSchema,
  actualizarMinisterioSchema,
  atribuirMembroMinisterioSchema,
  filtrosMinisterioSchema,
} from "./ministerios";

describe("validador de ministérios", () => {
  it("aceita um ministério válido e trata campos opcionais", () => {
    const r = criarMinisterioSchema.parse({ nome: "Louvor", descricao: "" });
    expect(r.nome).toBe("Louvor");
    expect(r.descricao).toBeNull();
    expect(r.liderId).toBeNull();
    expect(r.activo).toBe(true);
  });

  it("rejeita nome demasiado curto", () => {
    expect(() => criarMinisterioSchema.parse({ nome: "A" })).toThrow();
  });

  it("exige id na actualização", () => {
    expect(() => actualizarMinisterioSchema.parse({ nome: "Louvor" })).toThrow();
    expect(actualizarMinisterioSchema.parse({ id: "m1", nome: "Louvor" }).id).toBe("m1");
  });

  it("valida a atribuição de membro e converte a data", () => {
    const r = atribuirMembroMinisterioSchema.parse({
      ministerioId: "min1",
      membroId: "mem1",
      funcao: "Vocalista",
      desde: "2026-01-15",
    });
    expect(r.ministerioId).toBe("min1");
    expect(r.membroId).toBe("mem1");
    expect(r.funcao).toBe("Vocalista");
    expect(r.desde).toBeInstanceOf(Date);

    expect(() => atribuirMembroMinisterioSchema.parse({ ministerioId: "min1" })).toThrow();
  });

  it("aplica valores por omissão aos filtros", () => {
    expect(filtrosMinisterioSchema.parse({})).toMatchObject({
      q: "",
      page: 1,
      pageSize: 20,
      ordenarPor: "nome",
      ordem: "asc",
    });
  });
});
