import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { membrosParaResponsavel } from "@/services/ministerios.service";
import { FormularioMinisterio } from "../FormularioMinisterio";

export const metadata = { title: "Novo ministério" };

export default async function NovoMinisterioPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/ministerios");
  }

  const membros = await membrosParaResponsavel(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo ministério</h1>
        <p className="text-sm text-muted-foreground">
          Crie o ministério e depois associe-lhe membros.
        </p>
      </div>
      <FormularioMinisterio modo="criar" membros={membros} />
    </div>
  );
}
