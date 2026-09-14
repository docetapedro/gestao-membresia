import { describe, it, expect } from "vitest";
import type { Papel } from "@prisma/client";
import { can, recursoVisivel, restringeACelula } from "./permissoes";
import type { TenantContext } from "@/lib/tenant/context";

function ctxCom(papel: Papel): TenantContext {
  return {
    igrejaId: "igreja1",
    utilizadorId: "u1",
    papel,
    nome: "Teste",
    email: "t@t.ao",
    membroId: null,
  };
}

describe("permissões por papel (spec secção 6)", () => {
  it("ADMIN pode tudo", () => {
    const ctx = ctxCom("ADMIN");
    expect(can(ctx, "criar", "membros")).toBe(true);
    expect(can(ctx, "total" as never, "definicoes")).toBe(true);
    expect(can(ctx, "anular", "contribuicoes")).toBe(true);
    expect(can(ctx, "actualizar", "definicoes")).toBe(true);
  });

  it("PASTOR: membros total, contribuições só leitura, sem definições", () => {
    const ctx = ctxCom("PASTOR");
    expect(can(ctx, "criar", "membros")).toBe(true);
    expect(can(ctx, "ler", "contribuicoes")).toBe(true);
    expect(can(ctx, "criar", "contribuicoes")).toBe(false);
    expect(can(ctx, "ler", "definicoes")).toBe(false);
  });

  it("SECRETARIA: membros total, sem contribuições, relatórios não-financeiros", () => {
    const ctx = ctxCom("SECRETARIA");
    expect(can(ctx, "criar", "membros")).toBe(true);
    expect(can(ctx, "ler", "contribuicoes")).toBe(false);
    expect(can(ctx, "ler", "relatorios")).toBe(true);
    expect(can(ctx, "ler", "relatorios_financeiros")).toBe(false);
  });

  it("TESOURARIA: contribuições total, membros só leitura, sem presenças", () => {
    const ctx = ctxCom("TESOURARIA");
    expect(can(ctx, "criar", "contribuicoes")).toBe(true);
    expect(can(ctx, "ler", "membros")).toBe(true);
    expect(can(ctx, "criar", "membros")).toBe(false);
    expect(can(ctx, "ler", "presencas")).toBe(false);
    expect(can(ctx, "ler", "relatorios_financeiros")).toBe(true);
  });

  it("LIDER_CELULA: acesso restrito à própria célula", () => {
    const ctx = ctxCom("LIDER_CELULA");
    expect(can(ctx, "ler", "membros")).toBe(true);
    expect(restringeACelula(ctx, "membros")).toBe(true);
    expect(can(ctx, "ler", "contribuicoes")).toBe(false);
    expect(can(ctx, "ler", "definicoes")).toBe(false);
  });

  it("recursoVisivel esconde o que é 'nenhum'", () => {
    expect(recursoVisivel("TESOURARIA", "presencas")).toBe(false);
    expect(recursoVisivel("SECRETARIA", "membros")).toBe(true);
    expect(recursoVisivel("LIDER_CELULA", "definicoes")).toBe(false);
  });
});
