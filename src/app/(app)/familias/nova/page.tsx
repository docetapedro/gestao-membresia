import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { FormularioFamilia } from "../FormularioFamilia";

export const metadata = { title: "Nova família" };

export default async function NovaFamiliaPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/familias");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova família</h1>
        <p className="text-sm text-muted-foreground">
          Crie o agregado e depois associe-lhe membros.
        </p>
      </div>
      <FormularioFamilia modo="criar" />
    </div>
  );
}
