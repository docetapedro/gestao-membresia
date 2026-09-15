import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TipoEvento } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { listarPresencasEvento } from "@/services/eventos.service";
import { TIPO_EVENTO } from "@/lib/rotulos";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolhaMarcacaoEvento } from "./FolhaMarcacaoEvento";

export const metadata = { title: "Presenças do evento" };

export default async function PresencasEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const folha = await listarPresencasEvento(ctx, id);
  if (!folha) notFound();

  const podeMarcar = can(ctx, "actualizar", "eventos");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/eventos/${folha.evento.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{folha.evento.nome}</h1>
              <Badge variant="default">{TIPO_EVENTO[folha.evento.tipo as TipoEvento]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{dataHora(folha.evento.inicio)}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcação de presenças</CardTitle>
        </CardHeader>
        <CardContent>
          <FolhaMarcacaoEvento
            eventoId={folha.evento.id}
            membros={folha.membros}
            podeMarcar={podeMarcar}
          />
        </CardContent>
      </Card>
    </div>
  );
}
