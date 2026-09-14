import { describe, it, expect } from "vitest";
import {
  criarCultoSchema,
  actualizarCultoSchema,
  marcarPresencasSchema,
  filtrosCultoSchema,
} from "./cultos";

describe("validador de cultos", () => {
  it("aceita um culto válido e converte a data em Date", () => {
    const r = criarCultoSchema.parse({
      tipo: "DOMINGO_MANHA",
      data: "2026-01-18T09:00",
      tema: "Fé",
    });
    expect(r.tipo).toBe("DOMINGO_MANHA");
    expect(r.data).toBeInstanceOf(Date);
    expect(r.tema).toBe("Fé");
    expect(r.pregador).toBeNull();
  });

  it("exige a data e rejeita datas inválidas", () => {
    expect(() => criarCultoSchema.parse({ tipo: "ORACAO", data: "" })).toThrow();
    expect(() => criarCultoSchema.parse({ tipo: "ORACAO", data: "xpto" })).toThrow();
  });

  it("rejeita tipo de culto inválido", () => {
    expect(() => criarCultoSchema.parse({ tipo: "ALMOCO", data: "2026-01-18" })).toThrow();
  });

  it("exige id na actualização", () => {
    expect(() => actualizarCultoSchema.parse({ tipo: "CELULA", data: "2026-01-18" })).toThrow();
    const r = actualizarCultoSchema.parse({ id: "c1", tipo: "CELULA", data: "2026-01-18" });
    expect(r.id).toBe("c1");
  });

  it("valida a marcação de presenças e coage o booleano", () => {
    const r = marcarPresencasSchema.parse({
      cultoId: "c1",
      marcacoes: [
        { membroId: "m1", presente: true },
        { membroId: "m2", presente: false },
      ],
    });
    expect(r.marcacoes).toHaveLength(2);
    expect(r.marcacoes[0]?.presente).toBe(true);
    expect(r.marcacoes[1]?.presente).toBe(false);

    expect(() => marcarPresencasSchema.parse({ cultoId: "", marcacoes: [] })).toThrow();
  });

  it("ordena por data descendente por omissão", () => {
    expect(filtrosCultoSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      ordenarPor: "data",
      ordem: "desc",
    });
  });
});
