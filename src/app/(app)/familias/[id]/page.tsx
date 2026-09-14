import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterFamilia, membrosSemFamilia } from "@/services/familias.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GestaoMembrosFamilia } from "./GestaoMembrosFamilia";
import { RemoverFamilia } from "./RemoverFamilia";

export default async function FamiliaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const familia = await obterFamilia(ctx, id);
  if (!familia) notFound();

  const podeGerir = can(ctx, "actualizar", "membros") && !restringeACelula(ctx, "membros");
  const podeEliminar = can(ctx, "eliminar", "membros") && !restringeACelula(ctx, "membros");
  const disponiveis = podeGerir ? await membrosSemFamilia(ctx) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/familias">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{familia.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {familia.membros.length} membro{familia.membros.length === 1 ? "" : "s"}
              {familia.endereco ? ` · ${familia.endereco}` : ""}
            </p>
          </div>
        </div>
        {podeGerir ? (
          <Button asChild variant="outline">
            <Link href={`/familias/${familia.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da família</CardTitle>
        </CardHeader>
        <CardContent>
          <GestaoMembrosFamilia
            familiaId={familia.id}
            membros={familia.membros}
            disponiveis={disponiveis}
            podeGerir={podeGerir}
          />
        </CardContent>
      </Card>

      {podeEliminar ? (
        <RemoverFamilia id={familia.id} temMembros={familia.membros.length > 0} />
      ) : null}
    </div>
  );
}
