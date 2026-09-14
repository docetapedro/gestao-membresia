import Link from "next/link";
import { Plus } from "lucide-react";
import { TipoContribuicao } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarContribuicoes, resumoContribuicoes } from "@/services/contribuicoes.service";
import { can } from "@/lib/auth/permissoes";
import { filtrosContribuicaoSchema } from "@/lib/validators/contribuicoes";
import { TIPO_CONTRIBUICAO } from "@/lib/rotulos";
import { moeda } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListaContribuicoes } from "./ListaContribuicoes";

export const metadata = { title: "Contribuições" };

export default async function ContribuicoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const parsed = filtrosContribuicaoSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosContribuicaoSchema.parse({});

  const [dados, resumo] = await Promise.all([
    listarContribuicoes(ctx, filtros),
    resumoContribuicoes(ctx, filtros),
  ]);
  const podeCriar = can(ctx, "criar", "contribuicoes");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contribuições</h1>
          <p className="text-sm text-muted-foreground">
            Dízimos, ofertas e outras entradas. Recibo imprimível por registo.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/contribuicoes/nova">
              <Plus className="size-4" />
              Registar contribuição
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Resumo do período filtrado (ignora anuladas) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total no período</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {moeda(resumo.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {resumo.quantidade} contribuiç{resumo.quantidade === 1 ? "ão" : "ões"}
            </p>
          </CardContent>
        </Card>
        {(Object.keys(TIPO_CONTRIBUICAO) as TipoContribuicao[])
          .filter((t) => resumo.porTipo[t])
          .slice(0, 3)
          .map((t) => (
            <Card key={t}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{TIPO_CONTRIBUICAO[t]}</p>
                <p className="text-xl font-semibold tabular-nums">{moeda(resumo.porTipo[t]!)}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <ListaContribuicoes dados={dados} filtros={filtros} />
    </div>
  );
}
