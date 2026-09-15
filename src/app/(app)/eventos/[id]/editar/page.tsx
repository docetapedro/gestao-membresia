import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { obterEvento } from "@/services/eventos.service";
import { FormularioEvento } from "../../FormularioEvento";

export const metadata = { title: "Editar evento" };

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "eventos")) redirect("/eventos?tab=eventos");

  const { id } = await params;
  const evento = await obterEvento(ctx, id);
  if (!evento) notFound();

  const inicial = {
    nome: evento.nome,
    tipo: evento.tipo,
    // datetime-local usa hora local (mesma que foi introduzida na criação).
    inicio: format(evento.inicio, "yyyy-MM-dd'T'HH:mm"),
    fim: evento.fim ? format(evento.fim, "yyyy-MM-dd'T'HH:mm") : "",
    local: evento.local ?? "",
    descricao: evento.descricao ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar evento</h1>
      </div>
      <FormularioEvento modo="editar" id={evento.id} inicial={inicial} />
    </div>
  );
}
