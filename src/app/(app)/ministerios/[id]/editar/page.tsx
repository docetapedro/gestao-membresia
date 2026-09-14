import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterMinisterio, membrosParaResponsavel } from "@/services/ministerios.service";
import { FormularioMinisterio } from "../../FormularioMinisterio";

export const metadata = { title: "Editar ministério" };

export default async function EditarMinisterioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/ministerios");
  }

  const { id } = await params;
  const [ministerio, membros] = await Promise.all([
    obterMinisterio(ctx, id),
    membrosParaResponsavel(ctx),
  ]);
  if (!ministerio) notFound();

  const inicial = {
    nome: ministerio.nome,
    descricao: ministerio.descricao ?? "",
    liderId: ministerio.liderId ?? "",
    activo: ministerio.activo,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar ministério</h1>
        <p className="text-sm text-muted-foreground">{ministerio.nome}</p>
      </div>
      <FormularioMinisterio modo="editar" id={ministerio.id} membros={membros} inicial={inicial} />
    </div>
  );
}
