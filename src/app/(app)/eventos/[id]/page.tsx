import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft, CalendarCheck } from "lucide-react";
import { TipoEvento } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { obterEvento } from "@/services/eventos.service";
import { TIPO_EVENTO } from "@/lib/rotulos";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemoverEvento } from "./RemoverEvento";

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor || "—"}</span>
    </div>
  );
}

export default async function EventoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const evento = await obterEvento(ctx, id);
  if (!evento) notFound();

  const podeEditar = can(ctx, "actualizar", "eventos");
  const podeEliminar = can(ctx, "eliminar", "eventos");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/eventos?tab=eventos">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{evento.nome}</h1>
              <Badge variant="default">{TIPO_EVENTO[evento.tipo as TipoEvento]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{dataHora(evento.inicio)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/eventos/${evento.id}/presencas`}>
              <CalendarCheck className="size-4" />
              Presenças
            </Link>
          </Button>
          {podeEditar ? (
            <Button asChild variant="outline">
              <Link href={`/eventos/${evento.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <Linha rotulo="Tipo" valor={TIPO_EVENTO[evento.tipo as TipoEvento]} />
          <Linha rotulo="Início" valor={dataHora(evento.inicio)} />
          <Linha rotulo="Fim" valor={evento.fim ? dataHora(evento.fim) : "—"} />
          <Linha rotulo="Local" valor={evento.local} />
          <Linha rotulo="Descrição" valor={evento.descricao} />
        </CardContent>
      </Card>

      {podeEliminar ? <RemoverEvento id={evento.id} /> : null}
    </div>
  );
}
