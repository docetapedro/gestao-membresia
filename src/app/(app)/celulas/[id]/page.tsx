import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterCelula, membrosSemCelula } from "@/services/celulas.service";
import { DIA_SEMANA } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GestaoMembrosCelula } from "../GestaoMembrosCelula";
import { RemoverCelula } from "./RemoverCelula";

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{valor || "—"}</dd>
    </div>
  );
}

export default async function CelulaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const celula = await obterCelula(ctx, id);
  if (!celula) notFound();

  const podeGerir = can(ctx, "actualizar", "membros") && !restringeACelula(ctx, "membros");
  const podeEliminar = can(ctx, "eliminar", "membros") && !restringeACelula(ctx, "membros");
  const disponiveis = podeGerir ? await membrosSemCelula(ctx) : [];

  const horario =
    celula.diaSemana !== null
      ? `${DIA_SEMANA[celula.diaSemana]}${celula.hora ? `, ${celula.hora}` : ""}`
      : celula.hora;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/celulas">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{celula.nome}</h1>
              <Badge variant={celula.activa ? "success" : "muted"}>
                {celula.activa ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {celula.membros.length} membro{celula.membros.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {podeGerir ? (
          <Button asChild variant="outline">
            <Link href={`/celulas/${celula.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informação</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Linha rotulo="Líder" valor={celula.liderNome} />
            <Linha rotulo="Anfitrião" valor={celula.anfitriaoNome} />
            <Linha rotulo="Reunião" valor={horario} />
            <Linha rotulo="Endereço" valor={celula.endereco} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros da célula</CardTitle>
          </CardHeader>
          <CardContent>
            <GestaoMembrosCelula
              celulaId={celula.id}
              membros={celula.membros}
              disponiveis={disponiveis}
              podeGerir={podeGerir}
            />
          </CardContent>
        </Card>
      </div>

      {podeEliminar ? (
        <RemoverCelula id={celula.id} temMembros={celula.membros.length > 0} />
      ) : null}
    </div>
  );
}
