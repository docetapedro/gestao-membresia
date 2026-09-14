import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterFamilia } from "@/services/familias.service";
import { FormularioFamilia } from "../../FormularioFamilia";

export const metadata = { title: "Editar família" };

export default async function EditarFamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/familias");
  }

  const { id } = await params;
  const familia = await obterFamilia(ctx, id);
  if (!familia) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar família</h1>
        <p className="text-sm text-muted-foreground">{familia.nome}</p>
      </div>
      <FormularioFamilia
        modo="editar"
        id={familia.id}
        inicial={{ nome: familia.nome, endereco: familia.endereco ?? "" }}
      />
    </div>
  );
}
