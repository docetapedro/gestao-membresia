import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { TipoCulto } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterFolhaPresencas } from "@/services/cultos.service";
import { TIPO_CULTO } from "@/lib/rotulos";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolhaMarcacao } from "./FolhaMarcacao";
import { RemoverCulto } from "./RemoverCulto";

export default async function CultoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const folha = await obterFolhaPresencas(ctx, id);
  if (!folha) notFound();

  const podeMarcar = can(ctx, "actualizar", "presencas");
  const podeGerirCulto = podeMarcar && !restringeACelula(ctx, "presencas");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/presencas">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {folha.culto.tema || TIPO_CULTO[folha.culto.tipo as TipoCulto]}
              </h1>
              <Badge variant="default">{TIPO_CULTO[folha.culto.tipo as TipoCulto]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{dataHora(folha.culto.data)}</p>
          </div>
        </div>
        {podeGerirCulto ? (
          <Button asChild variant="outline">
            <Link href={`/presencas/${folha.culto.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcação de presenças</CardTitle>
        </CardHeader>
        <CardContent>
          <FolhaMarcacao
            cultoId={folha.culto.id}
            membros={folha.membros}
            podeMarcar={podeMarcar}
          />
        </CardContent>
      </Card>

      {podeGerirCulto ? <RemoverCulto id={folha.culto.id} /> : null}
    </div>
  );
}
