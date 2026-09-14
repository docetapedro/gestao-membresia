import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarCultos } from "@/services/cultos.service";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { filtrosCultoSchema } from "@/lib/validators/cultos";
import { Button } from "@/components/ui/button";
import { ListaCultos } from "./ListaCultos";

export const metadata = { title: "Presenças" };

export default async function PresencasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const parsed = filtrosCultoSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosCultoSchema.parse({});

  const dados = await listarCultos(ctx, filtros);
  const podeCriar = can(ctx, "criar", "presencas") && !restringeACelula(ctx, "presencas");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presenças</h1>
          <p className="text-sm text-muted-foreground">
            Cultos e marcação de presenças dos membros.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/presencas/novo">
              <Plus className="size-4" />
              Registar culto
            </Link>
          </Button>
        ) : null}
      </div>

      <ListaCultos dados={dados} filtros={filtros} />
    </div>
  );
}
