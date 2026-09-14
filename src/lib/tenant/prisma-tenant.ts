import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { SemContextoTenantError, type TenantContext } from "./context";

/**
 * Modelos que NÃO são multi-tenant (não levam igrejaId).
 * `Igreja` é o próprio tenant. Tudo o resto é filho e leva igrejaId.
 */
const MODELOS_SEM_TENANT = new Set<string>(["Igreja"]);

/**
 * Operações de registo único que exigem um `where` unívoco (id / unique).
 * São BLOQUEADAS em modelos com tenant porque não permitem injectar igrejaId
 * com segurança. A disciplina multi-tenant obriga a usar:
 *   - findFirst / findFirstOrThrow  (em vez de findUnique)
 *   - updateMany / deleteMany       (em vez de update / delete / upsert)
 * Assim o igrejaId entra sempre no `where` e nunca se toca noutra igreja.
 */
const OPERACOES_BLOQUEADAS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "delete",
  "upsert",
]);

const OPERACOES_COM_WHERE = new Set<string>([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

/**
 * Devolve um cliente Prisma ligado a um tenant: injecta `igrejaId` em todos os
 * `where` e `create` dos modelos com tenant e lança erro se o contexto faltar.
 * Ver PROJECTO-gestao-igreja.md, secção 4.5.
 *
 * Uso (apenas na camada de serviços):
 *   const db = prismaComTenant(ctx);
 *   const membros = await db.membro.findMany();  // já filtrado por igrejaId
 */
export function prismaComTenant(ctx: TenantContext) {
  if (!ctx?.igrejaId) {
    throw new SemContextoTenantError();
  }
  const igrejaId = ctx.igrejaId;

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (MODELOS_SEM_TENANT.has(model)) {
            return query(args);
          }

          if (OPERACOES_BLOQUEADAS.has(operation)) {
            throw new SemContextoTenantError(
              `Operação "${operation}" não é permitida em "${model}" (modelo com tenant). ` +
                `Usa findFirst / updateMany / deleteMany para garantir o filtro por igrejaId.`,
            );
          }

          const a = (args ?? {}) as Record<string, unknown>;

          if (operation === "create") {
            a.data = { ...(a.data as object), igrejaId };
            return query(a);
          }

          if (operation === "createMany") {
            const data = a.data;
            a.data = Array.isArray(data)
              ? data.map((d) => ({ ...(d as object), igrejaId }))
              : { ...(data as object), igrejaId };
            return query(a);
          }

          if (OPERACOES_COM_WHERE.has(operation)) {
            a.where = { ...(a.where as object), igrejaId };
            return query(a);
          }

          return query(a);
        },
      },
    },
  });
}

export type PrismaTenant = ReturnType<typeof prismaComTenant>;

/** Reexport para conveniência dos serviços. */
export { Prisma };
