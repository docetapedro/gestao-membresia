import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getTenantContext } from "@/lib/auth/sessao";
import { can, restringeACelula } from "@/lib/auth/permissoes";
import { obterCulto } from "@/services/cultos.service";
import { FormularioCulto } from "../../FormularioCulto";

export const metadata = { title: "Editar culto" };

export default async function EditarCultoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "presencas") || restringeACelula(ctx, "presencas")) {
    redirect("/presencas");
  }

  const { id } = await params;
  const culto = await obterCulto(ctx, id);
  if (!culto) notFound();

  const inicial = {
    tipo: culto.tipo,
    // datetime-local usa hora local (mesma que foi introduzida na criação).
    data: format(culto.data, "yyyy-MM-dd'T'HH:mm"),
    tema: culto.tema ?? "",
    pregador: culto.pregador ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar culto</h1>
      </div>
      <FormularioCulto modo="editar" id={culto.id} inicial={inicial} />
    </div>
  );
}
