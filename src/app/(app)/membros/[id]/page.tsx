import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { obterMembro } from "@/services/membros.service";
import { data } from "@/lib/formato";
import {
  SEXO,
  ESTADO_CIVIL,
  TIPO_DOCUMENTO,
  ESTADO_MEMBRO,
  FORMA_ADMISSAO,
  PAPEL_FAMILIAR,
  VARIANTE_ESTADO_MEMBRO,
} from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemoverMembro } from "./RemoverMembro";

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{valor || "—"}</dd>
    </div>
  );
}

export default async function MembroDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;
  const m = await obterMembro(ctx, id);
  if (!m) notFound();

  const podeEditar = can(ctx, "actualizar", "membros");
  const podeRemover = can(ctx, "eliminar", "membros");
  const temSaida = m.estado === "INACTIVO" || m.estado === "TRANSFERIDO" || m.estado === "FALECIDO";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/membros"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{m.nomeCompleto}</h1>
              <Badge variant={VARIANTE_ESTADO_MEMBRO[m.estado]}>
                {ESTADO_MEMBRO[m.estado]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Nº {m.numeroMembro}</p>
          </div>
        </div>
        {podeEditar ? (
          <Button asChild variant="outline">
            <Link href={`/membros/${m.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Linha rotulo="Nome preferido" valor={m.nomePreferido} />
            <Linha rotulo="Sexo" valor={SEXO[m.sexo]} />
            <Linha rotulo="Data de nascimento" valor={data(m.dataNascimento)} />
            <Linha rotulo="Estado civil" valor={m.estadoCivil ? ESTADO_CIVIL[m.estadoCivil] : null} />
            <Linha
              rotulo="Documento"
              valor={
                m.documentoTipo
                  ? `${TIPO_DOCUMENTO[m.documentoTipo]} ${m.documentoNumero ?? ""}`.trim()
                  : null
              }
            />
            <Linha rotulo="Profissão" valor={m.profissao} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contacto e morada</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Linha rotulo="Telefone" valor={m.telefone} />
            <Linha rotulo="Telefone alt." valor={m.telefoneAlt} />
            <Linha rotulo="Email" valor={m.email} />
            <Linha
              rotulo="Localização"
              valor={[m.bairro, m.municipio, m.provincia].filter(Boolean).join(", ")}
            />
            <Linha rotulo="Endereço" valor={m.endereco} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vida eclesial</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Linha rotulo="Data de conversão" valor={data(m.dataConversao)} />
            <Linha rotulo="Data de baptismo" valor={data(m.dataBaptismo)} />
            <Linha rotulo="Local do baptismo" valor={m.localBaptismo} />
            <Linha rotulo="Data de admissão" valor={data(m.dataAdmissao)} />
            <Linha
              rotulo="Forma de admissão"
              valor={m.formaAdmissao ? FORMA_ADMISSAO[m.formaAdmissao] : null}
            />
            <Linha rotulo="Igreja de origem" valor={m.igrejaOrigem} />
            {temSaida ? (
              <>
                <Linha rotulo="Data de saída" valor={data(m.dataSaida)} />
                <Linha rotulo="Motivo de saída" valor={m.motivoSaida} />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Família e célula</CardTitle></CardHeader>
          <CardContent className="divide-y">
            <Linha rotulo="Família" valor={m.familia?.nome} />
            <Linha
              rotulo="Papel na família"
              valor={m.papelFamiliar ? PAPEL_FAMILIAR[m.papelFamiliar] : null}
            />
            <Linha rotulo="Célula" valor={m.celula?.nome} />
            <Linha
              rotulo="Consentimento de dados"
              valor={
                m.consentimentoDados
                  ? `Sim (${data(m.consentimentoDataHora)})`
                  : "Não"
              }
            />
            <Linha rotulo="Observações" valor={m.observacoes} />
          </CardContent>
        </Card>
      </div>

      {podeRemover && !temSaida ? <RemoverMembro id={m.id} /> : null}
    </div>
  );
}
