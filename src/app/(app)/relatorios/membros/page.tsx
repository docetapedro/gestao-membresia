import Link from "next/link";
import { ArrowLeft, Cake } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { relatorioMembros } from "@/services/relatorios.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraficoBarras } from "../GraficoBarras";
import { GraficoLinha } from "../GraficoLinha";

export const metadata = { title: "Relatórios · Membros" };

export default async function RelatorioMembrosPage() {
  const ctx = await getTenantContext();
  const dados = await relatorioMembros(ctx);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/relatorios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Relatórios
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Relatório de membros</h1>
        <p className="text-sm text-muted-foreground">
          Distribuição da membresia e evolução das admissões.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={dados.porEstado} multicor />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por sexo</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={dados.porSexo} multicor />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por província</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={dados.porProvincia} orientacao="horizontal" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={dados.porMinisterio} orientacao="horizontal" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admissões nos últimos 12 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoLinha dados={dados.admissoesPorMes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cake className="size-4 text-primary" /> Aniversariantes do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dados.aniversariantesDoMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum aniversariante registado este mês.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dados.aniversariantesDoMes.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{a.nomeCompleto}</span>
                  <span className="tabular-nums text-muted-foreground">dia {a.dia}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
