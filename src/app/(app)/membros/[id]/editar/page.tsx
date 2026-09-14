import { notFound, redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { obterMembro, opcoesFormularioMembro } from "@/services/membros.service";
import { FormularioMembro } from "../../FormularioMembro";

export const metadata = { title: "Editar membro" };

const d = (v: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const s = (v: string | null) => v ?? "";

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  if (!can(ctx, "actualizar", "membros")) redirect("/membros");

  const { id } = await params;
  const [membro, opcoes] = await Promise.all([
    obterMembro(ctx, id),
    opcoesFormularioMembro(ctx),
  ]);
  if (!membro) notFound();

  const inicial = {
    nomeCompleto: membro.nomeCompleto,
    nomePreferido: s(membro.nomePreferido),
    sexo: membro.sexo,
    dataNascimento: d(membro.dataNascimento),
    estadoCivil: s(membro.estadoCivil),
    documentoTipo: s(membro.documentoTipo),
    documentoNumero: s(membro.documentoNumero),
    telefone: s(membro.telefone),
    telefoneAlt: s(membro.telefoneAlt),
    email: s(membro.email),
    provincia: s(membro.provincia),
    municipio: s(membro.municipio),
    bairro: s(membro.bairro),
    endereco: s(membro.endereco),
    profissao: s(membro.profissao),
    estado: membro.estado,
    dataConversao: d(membro.dataConversao),
    dataBaptismo: d(membro.dataBaptismo),
    localBaptismo: s(membro.localBaptismo),
    dataAdmissao: d(membro.dataAdmissao),
    formaAdmissao: s(membro.formaAdmissao),
    igrejaOrigem: s(membro.igrejaOrigem),
    familiaId: s(membro.familiaId),
    papelFamiliar: s(membro.papelFamiliar),
    celulaId: s(membro.celulaId),
    observacoes: s(membro.observacoes),
    consentimentoDados: membro.consentimentoDados,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar membro</h1>
        <p className="text-sm text-muted-foreground">
          Nº {membro.numeroMembro} · {membro.nomeCompleto}
        </p>
      </div>
      <FormularioMembro modo="editar" id={membro.id} opcoes={opcoes} inicial={inicial} />
    </div>
  );
}
