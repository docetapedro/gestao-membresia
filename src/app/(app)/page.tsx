import { Users, UserPlus, CalendarCheck, Wallet } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { obterResumoPainel } from "@/services/dashboard.service";
import { moeda } from "@/lib/formato";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Painel" };

function Estatistica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <Icone className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
      </CardContent>
    </Card>
  );
}

export default async function PainelPage() {
  const ctx = await getTenantContext();
  const resumo = await obterResumoPainel(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da igreja no mês corrente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estatistica
          titulo="Membros activos"
          valor={String(resumo.totalMembros)}
          icone={Users}
        />
        <Estatistica
          titulo="Novos este mês"
          valor={String(resumo.novosNoMes)}
          icone={UserPlus}
        />
        <Estatistica
          titulo="Presença média"
          valor={resumo.presencaMediaMes === null ? "—" : String(resumo.presencaMediaMes)}
          icone={CalendarCheck}
        />
        {resumo.contribuicoesMes !== null ? (
          <Estatistica
            titulo="Contribuições do mês"
            valor={moeda(resumo.contribuicoesMes)}
            icone={Wallet}
          />
        ) : null}
      </div>
    </div>
  );
}
