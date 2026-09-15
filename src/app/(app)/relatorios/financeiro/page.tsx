import Link from "next/link";
import { ArrowLeft, Wallet, Receipt, Lock } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { relatorioFinanceiro } from "@/services/relatorios.service";
import { moeda } from "@/lib/formato";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CartaoKpi } from "../CartaoKpi";
import { GraficoBarras } from "../GraficoBarras";
import { GraficoLinha } from "../GraficoLinha";
import { FiltroPeriodo } from "../FiltroPeriodo";

export const metadata = { title: "Relatórios · Financeiro" };

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();

  const voltar = (
    <Link
      href="/relatorios"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Relatórios
    </Link>
  );

  // Guarda de permissão — não rebenta; mostra aviso.
  if (!can(ctx, "ler", "relatorios_financeiros")) {
    return (
      <div className="space-y-6">
        <div>
          {voltar}
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Relatório financeiro</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="font-medium">Sem permissão</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Não tem acesso aos relatórios financeiros. Contacte um administrador
              se precisar desta informação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const de = typeof sp.de === "string" ? sp.de : undefined;
  const ate = typeof sp.ate === "string" ? sp.ate : undefined;

  const dados = await relatorioFinanceiro(ctx, { de, ate });

  return (
    <div className="space-y-6">
      <div>
        {voltar}
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Relatório financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Contribuições (ignora anuladas). Por omissão, últimos 12 meses.
        </p>
      </div>

      <FiltroPeriodo base="/relatorios/financeiro" de={de} ate={ate} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKpi
          titulo="Total no período"
          valor={moeda(dados.total)}
          sub={`${dados.quantidade} contribuiç${dados.quantidade === 1 ? "ão" : "ões"}`}
          icone={Wallet}
        />
        {dados.porTipo.slice(0, 3).map((t) => (
          <CartaoKpi
            key={t.chave}
            titulo={t.rotulo}
            valor={moeda(dados.porTipoTexto[t.chave] ?? "0")}
            icone={Receipt}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoLinha dados={dados.seriePorMes} formato="moeda" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por tipo de contribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={dados.porTipo} formato="moeda" orientacao="horizontal" multicor />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top contribuintes</CardTitle>
        </CardHeader>
        <CardContent>
          {dados.topContribuintes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem contribuições nominais no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.topContribuintes.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{moeda(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
