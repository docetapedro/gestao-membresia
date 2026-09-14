import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { obterUtilizador } from "@/services/utilizadores.service";
import { FormularioUtilizador } from "../../FormularioUtilizador";

export const metadata = { title: "Editar utilizador" };

export default async function EditarUtilizadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;
  const u = await obterUtilizador(ctx, id);
  if (!u) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Editar utilizador</h2>
      <FormularioUtilizador
        modo="editar"
        id={u.id}
        inicial={{
          nome: u.nome,
          email: u.email,
          papel: u.papel,
          senha: "",
          activo: u.activo,
        }}
      />
    </div>
  );
}
