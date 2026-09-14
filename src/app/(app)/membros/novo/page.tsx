import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { opcoesFormularioMembro } from "@/services/membros.service";
import { FormularioMembro } from "../FormularioMembro";

export const metadata = { title: "Novo membro" };

export default async function NovoMembroPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "membros")) redirect("/membros");

  const opcoes = await opcoesFormularioMembro(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo membro</h1>
        <p className="text-sm text-muted-foreground">
          O número de membro é gerado automaticamente.
        </p>
      </div>
      <FormularioMembro modo="criar" opcoes={opcoes} />
    </div>
  );
}
