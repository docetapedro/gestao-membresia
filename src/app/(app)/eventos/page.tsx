import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarProgramaSemanal, listarEventos } from "@/services/eventos.service";
import { can } from "@/lib/auth/permissoes";
import { filtrosEventoSchema } from "@/lib/validators/eventos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SeccaoPrograma } from "./SeccaoPrograma";
import { ListaEventos } from "./ListaEventos";

export const metadata = { title: "Eventos" };

type Separador = "programa" | "eventos";

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getTenantContext();
  const sp = await searchParams;

  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: Separador = tabParam === "eventos" ? "eventos" : "programa";

  const parsed = filtrosEventoSchema.safeParse(sp);
  const filtros = parsed.success ? parsed.data : filtrosEventoSchema.parse({});

  const [programa, eventos] = await Promise.all([
    listarProgramaSemanal(ctx),
    listarEventos(ctx, filtros),
  ]);

  const podeCriar = can(ctx, "criar", "eventos");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Programação semanal fixa e eventos extraordinários com marcação de presenças.
          </p>
        </div>
        {tab === "eventos" && podeCriar ? (
          <Button asChild>
            <Link href="/eventos/nova">
              <Plus className="size-4" />
              Registar evento
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex gap-1 border-b">
        <TabLink actual={tab} valor="programa" rotulo="Programação semanal" />
        <TabLink actual={tab} valor="eventos" rotulo="Eventos" />
      </div>

      {tab === "programa" ? (
        <SeccaoPrograma itens={programa} podeCriar={podeCriar} />
      ) : (
        <ListaEventos dados={eventos} filtros={filtros} />
      )}
    </div>
  );
}

function TabLink({
  actual,
  valor,
  rotulo,
}: {
  actual: Separador;
  valor: Separador;
  rotulo: string;
}) {
  const activo = actual === valor;
  return (
    <Link
      href={`/eventos?tab=${valor}`}
      className={cn(
        "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        activo
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {rotulo}
    </Link>
  );
}
