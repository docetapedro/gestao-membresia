import { getTenantContext } from "@/lib/auth/sessao";
import { obterIgreja } from "@/services/igreja.service";
import { FormularioIgreja } from "./FormularioIgreja";

const s = (v: string | null) => v ?? "";

export default async function DadosIgrejaPage() {
  const ctx = await getTenantContext();
  const igreja = await obterIgreja(ctx);
  if (!igreja) return <p className="text-sm text-muted-foreground">Igreja não encontrada.</p>;

  const inicial = {
    nome: igreja.nome,
    denominacao: s(igreja.denominacao),
    nif: s(igreja.nif),
    telefone: s(igreja.telefone),
    email: s(igreja.email),
    provincia: s(igreja.provincia),
    municipio: s(igreja.municipio),
    endereco: s(igreja.endereco),
    moeda: igreja.moeda,
  };

  return <FormularioIgreja inicial={inicial} />;
}
