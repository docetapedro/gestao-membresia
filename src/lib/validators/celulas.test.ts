import { describe, it, expect } from "vitest";
import {
  criarCelulaSchema,
  actualizarCelulaSchema,
  filtrosCelulaSchema,
} from "./celulas";

describe("validador de células", () => {
  it("aceita uma célula válida e converte campos vazios em null", () => {
    const r = criarCelulaSchema.parse({ nome: "Célula Central", endereco: "" });
    expect(r.nome).toBe("Célula Central");
    expect(r.endereco).toBeNull();
    expect(r.liderId).toBeNull();
    expect(r.activa).toBe(true);
  });

  it("converte diaSemana de string para número e valida o intervalo", () => {
    expect(criarCelulaSchema.parse({ nome: "Célula A", diaSemana: "3" }).diaSemana).toBe(3);
    expect(criarCelulaSchema.parse({ nome: "Célula A", diaSemana: "" }).diaSemana).toBeNull();
    expect(() => criarCelulaSchema.parse({ nome: "Célula A", diaSemana: "9" })).toThrow();
  });

  it("rejeita nome demasiado curto", () => {
    expect(() => criarCelulaSchema.parse({ nome: "A" })).toThrow();
  });

  it("exige id na actualização", () => {
    expect(() => actualizarCelulaSchema.parse({ nome: "Célula X" })).toThrow();
    expect(actualizarCelulaSchema.parse({ id: "c1", nome: "Célula X" }).id).toBe("c1");
  });

  it("aplica valores por omissão aos filtros", () => {
    expect(filtrosCelulaSchema.parse({})).toMatchObject({
      q: "",
      page: 1,
      pageSize: 20,
      ordenarPor: "nome",
      ordem: "asc",
    });
  });
});
