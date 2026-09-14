import { describe, it, expect } from "vitest";
import {
  valorMonetario,
  criarContribuicaoSchema,
  anularContribuicaoSchema,
  filtrosContribuicaoSchema,
} from "./contribuicoes";

describe("valor monetário", () => {
  it("normaliza para string com 2 casas", () => {
    expect(valorMonetario.parse("1500")).toBe("1500.00");
    expect(valorMonetario.parse("1500.5")).toBe("1500.50");
    expect(valorMonetario.parse("1 500,50")).toBe("1500.50");
    expect(valorMonetario.parse(2500.5)).toBe("2500.50");
  });

  it("rejeita zero, negativos e valores inválidos", () => {
    expect(() => valorMonetario.parse("0")).toThrow();
    expect(() => valorMonetario.parse("-10")).toThrow();
    expect(() => valorMonetario.parse("abc")).toThrow();
  });
});

describe("validador de contribuições", () => {
  it("aceita uma contribuição com membro", () => {
    const r = criarContribuicaoSchema.parse({
      membroId: "m1",
      tipo: "DIZIMO",
      valor: "1000",
      metodo: "NUMERARIO",
      data: "2026-02-01",
    });
    expect(r.membroId).toBe("m1");
    expect(r.valor).toBe("1000.00");
    expect(r.data).toBeInstanceOf(Date);
  });

  it("aceita oferta anónima (sem membro)", () => {
    const r = criarContribuicaoSchema.parse({
      tipo: "OFERTA",
      valor: "500",
      metodo: "TPA",
      data: "2026-02-01",
    });
    expect(r.membroId).toBeNull();
  });

  it("exige tipo, método e data válidos", () => {
    expect(() =>
      criarContribuicaoSchema.parse({ tipo: "DIZIMO", valor: "100", metodo: "NUMERARIO", data: "" }),
    ).toThrow();
    expect(() =>
      criarContribuicaoSchema.parse({ tipo: "X", valor: "100", metodo: "NUMERARIO", data: "2026-02-01" }),
    ).toThrow();
  });

  it("exige motivo com pelo menos 3 caracteres na anulação", () => {
    expect(() => anularContribuicaoSchema.parse({ id: "c1", motivoAnulacao: "x" })).toThrow();
    const r = anularContribuicaoSchema.parse({ id: "c1", motivoAnulacao: "valor errado" });
    expect(r.motivoAnulacao).toBe("valor errado");
  });

  it("ordena por data descendente por omissão", () => {
    expect(filtrosContribuicaoSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      ordem: "desc",
    });
  });
});
