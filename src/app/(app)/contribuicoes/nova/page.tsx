import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { opcoesFormularioContribuicao } from "@/services/contribuicoes.service";
import { FormularioContribuicao } from "../FormularioContribuicao";

export const metadata = { title: "Registar contribuição" };

export default async function NovaContribuicaoPage() {
  const ctx = await getTenantContext();
  if (!can(ctx, "criar", "contribuicoes")) redirect("/contribuicoes");

  const opcoes = await opcoesFormularioContribuicao(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registar contribuição</h1>
        <p className="text-sm text-muted-foreground">
          As contribuições não se editam nem apagam — corrigem-se por anulação e novo registo.
        </p>
      </div>
      <FormularioContribuicao opcoes={opcoes} />
    </div>
  );
}
