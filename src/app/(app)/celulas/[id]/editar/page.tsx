import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterCelula, membrosParaResponsavel } from "@/services/celulas.service";
import { FormularioCelula } from "../../FormularioCelula";

export const metadata = { title: "Editar célula" };

export default async function EditarCelulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "membros") || restringeACelula(ctx, "membros")) {
    redirect("/celulas");
  }

  const { id } = await params;
  const [celula, membros] = await Promise.all([
    obterCelula(ctx, id),
    membrosParaResponsavel(ctx),
  ]);
  if (!celula) notFound();

  const inicial = {
    nome: celula.nome,
    liderId: celula.liderId ?? "",
    anfitriaoId: celula.anfitriaoId ?? "",
    diaSemana: celula.diaSemana !== null ? String(celula.diaSemana) : "",
    hora: celula.hora ?? "",
    endereco: celula.endereco ?? "",
    activa: celula.activa,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar célula</h1>
        <p className="text-sm text-muted-foreground">{celula.nome}</p>
      </div>
      <FormularioCelula modo="editar" id={celula.id} membros={membros} inicial={inicial} />
    </div>
  );
}
