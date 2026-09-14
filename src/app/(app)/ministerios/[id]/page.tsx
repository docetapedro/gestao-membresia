import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterMinisterio, membrosForaDoMinisterio } from "@/services/ministerios.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GestaoMembrosMinisterio } from "../GestaoMembrosMinisterio";
import { RemoverMinisterio } from "./RemoverMinisterio";

export default async function MinisterioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const ministerio = await obterMinisterio(ctx, id);
  if (!ministerio) notFound();

  const podeGerir = can(ctx, "actualizar", "membros") && !restringeACelula(ctx, "membros");
  const podeEliminar = can(ctx, "eliminar", "membros") && !restringeACelula(ctx, "membros");
  const disponiveis = podeGerir ? await membrosForaDoMinisterio(ctx, id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/ministerios">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{ministerio.nome}</h1>
              <Badge variant={ministerio.activo ? "success" : "muted"}>
                {ministerio.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {ministerio.liderNome ? `Líder: ${ministerio.liderNome} · ` : ""}
              {ministerio.membros.length} membro{ministerio.membros.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {podeGerir ? (
          <Button asChild variant="outline">
            <Link href={`/ministerios/${ministerio.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
      </div>

      {ministerio.descricao ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {ministerio.descricao}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Membros do departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <GestaoMembrosMinisterio
            ministerioId={ministerio.id}
            associacoes={ministerio.membros}
            disponiveis={disponiveis}
            podeGerir={podeGerir}
          />
        </CardContent>
      </Card>

      {podeEliminar ? (
        <RemoverMinisterio id={ministerio.id} temMembros={ministerio.membros.length > 0} />
      ) : null}
    </div>
  );
}
