import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { membrosParaResponsavel } from "@/services/celulas.service";
import { FormularioCelula } from "../FormularioCelula";

export const metadata = { title: "Nova célula" };

export default async function NovaCelulaPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/celulas");
  }

  const membros = await membrosParaResponsavel(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova célula</h1>
        <p className="text-sm text-muted-foreground">
          Crie a célula e depois associe-lhe membros.
        </p>
      </div>
      <FormularioCelula modo="criar" membros={membros} />
    </div>
  );
}
