import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarFamilias } from "@/services/familias.service";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { filtrosFamiliaSchema } from "@/lib/validators/familias";
import { Button } from "@/components/ui/button";
import { ListaFamilias } from "./ListaFamilias";

export const metadata = { title: "Famílias" };

export default async function FamiliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const parsed = filtrosFamiliaSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosFamiliaSchema.parse({});

  const dados = await listarFamilias(ctx, filtros);
  const podeCriar = can(ctx, "criar", "membros") && !restringeACelula(ctx, "membros");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Famílias</h1>
          <p className="text-sm text-muted-foreground">
            Agregados familiares e membros de cada família.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/familias/nova">
              <Plus className="size-4" />
              Nova família
            </Link>
          </Button>
        ) : null}
      </div>

      <ListaFamilias dados={dados} filtros={filtros} />
    </div>
  );
}
