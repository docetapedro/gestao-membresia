import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { FormularioCulto } from "../FormularioCulto";

export const metadata = { title: "Registar culto" };

export default async function NovoCultoPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "presencas") || restringeACelula(ctx, "presencas")) {
    redirect("/presencas");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registar culto</h1>
        <p className="text-sm text-muted-foreground">
          Depois de criar, marque as presenças dos membros.
        </p>
      </div>
      <FormularioCulto modo="criar" />
    </div>
  );
}
