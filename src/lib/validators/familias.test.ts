import { describe, it, expect } from "vitest";
import {
  criarFamiliaSchema,
  actualizarFamiliaSchema,
  atribuirMembroFamiliaSchema,
  filtrosFamiliaSchema,
} from "./familias";

describe("validador de famílias", () => {
  it("aceita uma família válida e apara o nome", () => {
    const r = criarFamiliaSchema.parse({ nome: "  Família Pedro  ", endereco: "Rua 1" });
    expect(r.nome).toBe("Família Pedro");
    expect(r.endereco).toBe("Rua 1");
  });

  it("converte endereço vazio em null", () => {
    const r = criarFamiliaSchema.parse({ nome: "Família Silva", endereco: "" });
    expect(r.endereco).toBeNull();
  });

  it("rejeita nome demasiado curto", () => {
    expect(() => criarFamiliaSchema.parse({ nome: "A" })).toThrow();
  });

  it("exige id na actualização", () => {
    expect(() => actualizarFamiliaSchema.parse({ nome: "Família X" })).toThrow();
    const r = actualizarFamiliaSchema.parse({ id: "f1", nome: "Família X" });
    expect(r.id).toBe("f1");
  });

  it("valida a atribuição de membro com papel opcional", () => {
    const r = atribuirMembroFamiliaSchema.parse({ familiaId: "f1", membroId: "m1" });
    expect(r.familiaId).toBe("f1");
    expect(r.membroId).toBe("m1");

    const r2 = atribuirMembroFamiliaSchema.parse({
      familiaId: "f1",
      membroId: "m1",
      papelFamiliar: "CHEFE",
    });
    expect(r2.papelFamiliar).toBe("CHEFE");

    expect(() =>
      atribuirMembroFamiliaSchema.parse({ familiaId: "f1", membroId: "m1", papelFamiliar: "REI" }),
    ).toThrow();
  });

  it("aplica valores por omissão aos filtros", () => {
    const r = filtrosFamiliaSchema.parse({});
    expect(r).toMatchObject({
      q: "",
      page: 1,
      pageSize: 20,
      ordenarPor: "nome",
      ordem: "asc",
    });
  });
});
