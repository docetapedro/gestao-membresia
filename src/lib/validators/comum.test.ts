import { describe, it, expect } from "vitest";
import { normalizarTelefone } from "./comum";
import { moeda, data } from "@/lib/formato";

describe("normalização de telefone angolano", () => {
  it("aceita 9 dígitos nacionais", () => {
    expect(normalizarTelefone("923456789")).toBe("+244923456789");
  });
  it("remove espaços e prefixo 244/+244", () => {
    expect(normalizarTelefone("923 456 789")).toBe("+244923456789");
    expect(normalizarTelefone("+244 923 456 789")).toBe("+244923456789");
    expect(normalizarTelefone("244923456789")).toBe("+244923456789");
  });
  it("rejeita números com dígitos a mais ou a menos", () => {
    expect(normalizarTelefone("12345")).toBeNull();
    expect(normalizarTelefone("9234567890")).toBeNull();
    expect(normalizarTelefone("")).toBeNull();
  });
});

describe("formatação monetária (Kz)", () => {
  it("formata milhares com espaço e decimais com vírgula", () => {
    expect(moeda(1234567.89)).toBe("1 234 567,89 Kz");
    expect(moeda(0)).toBe("0,00 Kz");
    expect(moeda(1000)).toBe("1 000,00 Kz");
    expect(moeda(-50.5)).toBe("-50,50 Kz");
  });
  it("aceita string decimal (Prisma)", () => {
    expect(moeda("2500")).toBe("2 500,00 Kz");
  });
});

describe("formatação de data (dd/MM/yyyy)", () => {
  it("formata datas ISO", () => {
    expect(data("2026-09-14T12:00:00.000Z")).toBe("14/09/2026");
  });
  it("devolve travessão para nulo", () => {
    expect(data(null)).toBe("—");
  });
});
