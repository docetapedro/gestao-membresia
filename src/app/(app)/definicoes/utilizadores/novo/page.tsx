import { FormularioUtilizador } from "../FormularioUtilizador";

export const metadata = { title: "Novo utilizador" };

export default function NovoUtilizadorPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Novo utilizador</h2>
      <FormularioUtilizador modo="criar" />
    </div>
  );
}
