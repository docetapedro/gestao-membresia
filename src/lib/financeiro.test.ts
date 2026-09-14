import { describe, it, expect } from "vitest";
import { calcularResumo, paraCentimos, deCentimos } from "./financeiro";

describe("aritmética monetária em cêntimos", () => {
  it("converte para cêntimos e de volta sem erro de vírgula flutuante", () => {
    expect(paraCentimos("1500.50")).toBe(150050);
    expect(paraCentimos(0.1) + paraCentimos(0.2)).toBe(30); // 0.1+0.2 problemático em float
    expect(deCentimos(150050)).toBe("1500.50");
    expect(deCentimos(30)).toBe("0.30");
    expect(deCentimos(5)).toBe("0.05");
  });
});

describe("calcularResumo (totais de contribuições)", () => {
  it("soma contribuições e agrupa por tipo", () => {
    const r = calcularResumo([
      { tipo: "DIZIMO", valor: "1000.00" },
      { tipo: "DIZIMO", valor: "500.50" },
      { tipo: "OFERTA", valor: "250.00" },
    ]);
    expect(r.total).toBe("1750.50");
    expect(r.quantidade).toBe(3);
    expect(r.porTipo.DIZIMO).toBe("1500.50");
    expect(r.porTipo.OFERTA).toBe("250.00");
  });

  it("ignora as contribuições anuladas", () => {
    const r = calcularResumo([
      { tipo: "DIZIMO", valor: "1000.00" },
      { tipo: "DIZIMO", valor: "999.99", anulada: true },
      { tipo: "OFERTA", valor: "200.00" },
    ]);
    expect(r.total).toBe("1200.00");
    expect(r.quantidade).toBe(2);
    expect(r.porTipo.DIZIMO).toBe("1000.00");
  });

  it("devolve zero para uma lista vazia", () => {
    const r = calcularResumo([]);
    expect(r.total).toBe("0.00");
    expect(r.quantidade).toBe(0);
    expect(r.porTipo).toEqual({});
  });

  it("aceita valores como número ou string", () => {
    const r = calcularResumo([
      { tipo: "OFERTA", valor: 1500.5 },
      { tipo: "OFERTA", valor: "0.50" },
    ]);
    expect(r.total).toBe("1501.00");
  });
});
