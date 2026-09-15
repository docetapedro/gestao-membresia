import Link from "next/link";
import { Users, UserCheck, CalendarCheck, Wallet, ArrowRight, Wallet as WalletIco } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { resumoGeral, relatorioMembros } from "@/services/relatorios.service";
import { moeda } from "@/lib/formato";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartaoKpi } from "./CartaoKpi";
import { GraficoBarras } from "./GraficoBarras";
import { GraficoLinha } from "./GraficoLinha";

export const metadata = { title: "Relatórios" };

const SUBPAGINAS = [
  {
    href: "/relatorios/membros",
    titulo: "Membros",
    descricao: "Distribuição por estado, sexo, província e departamento; admissões.",
    icone: Users,
    financeiro: false,
  },
  {
    href: "/relatorios/presencas",
    titulo: "Presenças",
    descricao: "Frequência por culto e por evento, média e tendência mensal.",
    icone: CalendarCheck,
    financeiro: false,
  },
  {
    href: "/relatorios/financeiro",
    titulo: "Financeiro",
    descricao: "Contribuições por tipo, totais mensais e top contribuintes.",
    icone: WalletIco,
    financeiro: true,
  },
] as const;

export default async function RelatoriosPage() {
  const ctx = await getTenantContext();
  const podeFinanceiro = can(ctx, "ler", "relatorios_financeiros");

  const [resumo, membros] = await Promise.all([resumoGeral(ctx), relatorioMembros(ctx)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da igreja. Escolha uma área para análises detalhadas.
        </p>
      </div>

      {/* Cartões-KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKpi
          titulo="Membros activos"
          valor={String(resumo.totalMembros)}
          sub={`${resumo.membrosActivos} membros · ${resumo.visitantes} visitantes`}
          icone={Users}
        />
        <CartaoKpi titulo="Membros" valor={String(resumo.membrosActivos)} icone={UserCheck} />
        <CartaoKpi
          titulo="Presença média"
          valor={resumo.presencaMediaRecente === null ? "—" : String(resumo.presencaMediaRecente)}
          sub="últimos 3 meses"
          icone={CalendarCheck}
        />
        {resumo.contribuicoesMes !== null ? (
          <CartaoKpi
            titulo="Contribuições do mês"
            valor={moeda(resumo.contribuicoesMes)}
            icone={Wallet}
          />
        ) : null}
      </div>

      {/* Gráficos resumo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membros por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoBarras dados={membros.porEstado} multicor />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admissões (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoLinha dados={membros.admissoesPorMes} />
          </CardContent>
        </Card>
      </div>

      {/* Navegação para sub-relatórios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBPAGINAS.filter((s) => !s.financeiro || podeFinanceiro).map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <s.icone className="size-4 text-primary" />
                  {s.titulo}
                </CardTitle>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
