import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarMembros } from "@/services/membros.service";
import { can } from "@/lib/auth/permissoes";
import { filtrosMembroSchema } from "@/lib/validators/membros";
import { Button } from "@/components/ui/button";
import { ListaMembros } from "./ListaMembros";

export const metadata = { title: "Membros" };

export default async function MembrosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  // Filtros com valores por omissão seguros (ignora entradas inválidas).
  const parsed = filtrosMembroSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosMembroSchema.parse({});

  const dados = await listarMembros(ctx, filtros);
  const podeCriar = can(ctx, "criar", "membros");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e acompanhamento de membros da igreja.
          </p>
        </div>
        {podeCriar ? (
          <Button asChild>
            <Link href="/membros/novo">
              <UserPlus className="size-4" />
              Novo membro
            </Link>
          </Button>
        ) : null}
      </div>

      <ListaMembros dados={dados} filtros={filtros} />
    </div>
  );
}
