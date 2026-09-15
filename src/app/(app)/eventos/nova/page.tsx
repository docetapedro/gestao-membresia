import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { FormularioEvento } from "../FormularioEvento";

export const metadata = { title: "Registar evento" };

export default async function NovoEventoPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "eventos")) redirect("/eventos?tab=eventos");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registar evento</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criar, marque as presenças dos membros.
        </p>
      </div>
      <FormularioEvento modo="criar" />
    </div>
  );
}
