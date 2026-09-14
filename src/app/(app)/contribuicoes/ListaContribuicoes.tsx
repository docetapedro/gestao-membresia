"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TipoContribuicao, MetodoPagamento } from "@prisma/client";
import type { PaginaContribuicoes } from "@/services/contribuicoes.service";
import type { FiltrosContribuicao } from "@/lib/validators/contribuicoes";
import { TIPO_CONTRIBUICAO, METODO_PAGAMENTO } from "@/lib/rotulos";
import { moeda, data as fmtData } from "@/lib/formato";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ListaContribuicoes({
  dados,
  filtros,
}: {
  dados: PaginaContribuicoes;
  filtros: FiltrosContribuicao;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendente, startTransition] = useTransition();

  const navegar = useCallback(
    (mudancas: Record<string, string | number | undefined>) => {
      const p = new URLSearchParams(params.toString());
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === undefined || valor === "") p.delete(chave);
        else p.set(chave, String(valor));
      }
      startTransition(() => router.push(`/contribuicoes?${p.toString()}`));
    },
    [params, router],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="mb-1.5 block text-xs">Tipo</Label>
          <SelectNativo
            value={filtros.tipo ?? ""}
            onChange={(e) => navegar({ tipo: e.target.value || undefined, page: 1 })}
          >
            <option value="">Todos</option>
            {Object.entries(TIPO_CONTRIBUICAO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </SelectNativo>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Método</Label>
          <SelectNativo
            value={filtros.metodo ?? ""}
            onChange={(e) => navegar({ metodo: e.target.value || undefined, page: 1 })}
          >
            <option value="">Todos</option>
            {Object.entries(METODO_PAGAMENTO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </SelectNativo>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">De</Label>
          <DatePicker
            value={filtros.de ?? ""}
            onChange={(v) => navegar({ de: v || undefined, page: 1 })}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Até</Label>
          <DatePicker
            value={filtros.ate ?? ""}
            onChange={(v) => navegar({ ate: v || undefined, page: 1 })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={filtros.incluirAnuladas === "true"}
          onChange={(e) => navegar({ incluirAnuladas: e.target.checked ? "true" : undefined, page: 1 })}
        />
        Incluir contribuições anuladas
      </label>

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Membro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma contribuição encontrada.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((c) => (
                <TableRow
                  key={c.id}
                  className={cn("cursor-pointer", c.anulada && "opacity-60")}
                  onClick={() => router.push(`/contribuicoes/${c.id}`)}
                >
                  <TableCell className="font-medium">{fmtData(c.data)}</TableCell>
                  <TableCell>
                    {c.membro ? c.membro.nomeCompleto : <span className="italic">Anónima</span>}
                  </TableCell>
                  <TableCell>{TIPO_CONTRIBUICAO[c.tipo as TipoContribuicao]}</TableCell>
                  <TableCell>{METODO_PAGAMENTO[c.metodo as MetodoPagamento]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.anulada ? (
                      <span className="flex items-center justify-end gap-2">
                        <Badge variant="destructive">Anulada</Badge>
                        <span className="line-through">{moeda(c.valor)}</span>
                      </span>
                    ) : (
                      moeda(c.valor)
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} contribuiç{dados.total === 1 ? "ão" : "ões"} · página {dados.page} de{" "}
          {dados.totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={dados.page <= 1}
            onClick={() => navegar({ page: dados.page - 1 })}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <button
            type="button"
            disabled={dados.page >= dados.totalPaginas}
            onClick={() => navegar({ page: dados.page + 1 })}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
          >
            Seguinte <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
