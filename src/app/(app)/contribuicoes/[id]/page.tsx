import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TipoContribuicao, MetodoPagamento } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { obterContribuicao } from "@/services/contribuicoes.service";
import { TIPO_CONTRIBUICAO, METODO_PAGAMENTO } from "@/lib/rotulos";
import { moeda, dataHora, data as fmtData } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccoesRecibo } from "./AccoesRecibo";

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor || "—"}</span>
    </div>
  );
}

export default async function ContribuicaoReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTenantContext();
  const { id } = await params;

  const c = await obterContribuicao(ctx, id);
  if (!c) notFound();

  const podeAnular = can(ctx, "anular", "contribuicoes");
  const moedaSimbolo = c.igreja?.moeda === "AOA" || !c.igreja?.moeda ? "Kz" : c.igreja.moeda;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="nao-imprimir flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/contribuicoes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Recibo de contribuição</h1>
        </div>
        {c.anulada ? <Badge variant="destructive">Anulada</Badge> : null}
      </div>

      {/* Área imprimível */}
      <div className="recibo rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-start justify-between border-b pb-4">
          <div>
            <p className="text-lg font-bold">{c.igreja?.nome ?? "Igreja"}</p>
            {c.igreja?.denominacao ? (
              <p className="text-xs text-muted-foreground">{c.igreja.denominacao}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {[c.igreja?.municipio, c.igreja?.provincia].filter(Boolean).join(", ")}
              {c.igreja?.telefone ? ` · ${c.igreja.telefone}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Recibo Nº</p>
            <p className="font-mono text-sm">{c.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {c.anulada ? (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm font-semibold text-destructive">
            CONTRIBUIÇÃO ANULADA
            {c.motivoAnulacao ? ` — ${c.motivoAnulacao}` : ""}
          </p>
        ) : null}

        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
          <p className="text-3xl font-bold tabular-nums">{moeda(c.valor, moedaSimbolo)}</p>
        </div>

        <Linha
          rotulo="Contribuinte"
          valor={
            c.membro
              ? `${c.membro.nomeCompleto} (Nº ${c.membro.numeroMembro})`
              : "Oferta anónima"
          }
        />
        <Linha rotulo="Tipo" valor={TIPO_CONTRIBUICAO[c.tipo as TipoContribuicao]} />
        <Linha rotulo="Método" valor={METODO_PAGAMENTO[c.metodo as MetodoPagamento]} />
        <Linha rotulo="Data" valor={fmtData(c.data)} />
        {c.referencia ? <Linha rotulo="Referência" valor={c.referencia} /> : null}
        <Linha rotulo="Registado por" valor={c.registadoPor?.nome} />
        <Linha rotulo="Emitido em" valor={dataHora(c.criadoEm)} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Documento emitido por {c.igreja?.nome ?? "—"}. Guarde este recibo.
        </p>
      </div>

      <AccoesRecibo id={c.id} anulada={c.anulada} podeAnular={podeAnular} />
    </div>
  );
}
