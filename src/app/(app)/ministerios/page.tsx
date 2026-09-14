import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarMinisterios } from "@/services/ministerios.service";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { filtrosMinisterioSchema } from "@/lib/validators/ministerios";
import { Button } from "@/components/ui/button";
import { ListaMinisterios } from "./ListaMinisterios";

export const metadata = { title: "Ministérios" };

export default async function MinisteriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const parsed = filtrosMinisterioSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosMinisterioSchema.parse({});

  const dados = await listarMinisterios(ctx, filtros);
  const podeCriar = can(ctx, "criar", "membros") && !restringeACelula(ctx, "membros");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ministérios</h1>
          <p className="text-sm text-muted-foreground">
            Áreas de serviço e membros que nelas servem.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/ministerios/novo">
              <Plus className="size-4" />
              Novo ministério
            </Link>
          </Button>
        ) : null}
      </div>

      <ListaMinisterios dados={dados} filtros={filtros} />
    </div>
  );
}
