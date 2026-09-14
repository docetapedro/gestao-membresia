import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarCelulas } from "@/services/celulas.service";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { filtrosCelulaSchema } from "@/lib/validators/celulas";
import { Button } from "@/components/ui/button";
import { ListaCelulas } from "./ListaCelulas";

export const metadata = { title: "Células" };

export default async function CelulasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const parsed = filtrosCelulaSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosCelulaSchema.parse({});

  const dados = await listarCelulas(ctx, filtros);
  const podeCriar = can(ctx, "criar", "membros") && !restringeACelula(ctx, "membros");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Células</h1>
          <p className="text-sm text-muted-foreground">
            Pequenos grupos, respectivos horários e membros.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/celulas/nova">
              <Plus className="size-4" />
              Nova célula
            </Link>
          </Button>
        ) : null}
      </div>

      <ListaCelulas dados={dados} filtros={filtros} />
    </div>
  );
}
