import Link from "next/link";
import { ArrowLeft, CalendarCheck, CalendarDays } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { relatorioPresencas } from "@/services/relatorios.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartaoKpi } from "../CartaoKpi";
import { GraficoBarras } from "../GraficoBarras";
import { GraficoLinha } from "../GraficoLinha";
import { FiltroPeriodo } from "../FiltroPeriodo";

export const metadata = { title: "Relatórios · Presenças" };

export default async function RelatorioPresencasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;
  const de = typeof sp.de === "string" ? sp.de : undefined;
  const ate = typeof sp.ate === "string" ? sp.ate : undefined;

  const dados = await relatorioPresencas(ctx, { de, ate });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/relatorios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Relatórios
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Relatório de presenças</h1>
        <p className="text-sm text-muted-foreground">
          Frequência aos cultos e eventos. Por omissão, últimos 12 meses.
        </p>
      </div>

      <FiltroPeriodo base="/relatorios/presencas" de={de} ate={ate} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKpi
          titulo="Média por culto"
          valor={dados.mediaPorCulto === null ? "—" : String(dados.mediaPorCulto)}
          sub={`${dados.totalCultos} cultos no período`}
          icone={CalendarCheck}
        />
        <CartaoKpi
          titulo="Média por evento"
          valor={dados.mediaPorEvento === null ? "—" : String(dados.mediaPorEvento)}
          sub={`${dados.totalEventos} eventos no período`}
          icone={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendência mensal de presenças</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoLinha dados={dados.seriePorMes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presenças por tipo de culto</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoBarras dados={dados.porTipoCulto} orientacao="horizontal" multicor />
        </CardContent>
      </Card>
    </div>
  );
}
