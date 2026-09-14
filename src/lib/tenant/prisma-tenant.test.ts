import { describe, it, expect } from "vitest";
import { prismaComTenant } from "./prisma-tenant";
import { SemContextoTenantError } from "./context";

describe("isolamento de tenant (spec secção 4)", () => {
  it("lança se o contexto não tiver igrejaId", () => {
    expect(() =>
      // @ts-expect-error contexto propositadamente inválido
      prismaComTenant({ igrejaId: "" }),
    ).toThrow(SemContextoTenantError);
  });

  it("aceita um contexto com igrejaId", () => {
    const db = prismaComTenant({
      igrejaId: "igreja1",
      utilizadorId: "u1",
      papel: "ADMIN",
      nome: "T",
      email: "t@t.ao",
      membroId: null,
    });
    expect(db).toBeDefined();
    expect(typeof db.membro.findMany).toBe("function");
  });
});
