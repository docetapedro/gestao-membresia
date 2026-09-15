"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TipoEvento } from "@prisma/client";
import type { PaginaEventos } from "@/services/eventos.service";
import type { FiltrosEvento } from "@/lib/validators/eventos";
import { TIPO_EVENTO } from "@/lib/rotulos";
import { dataHora } from "@/lib/formato";
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

export function ListaEventos({
  dados,
  filtros,
}: {
  dados: PaginaEventos;
  filtros: FiltrosEvento;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendente, startTransition] = useTransition();

  const navegar = useCallback(
    (mudancas: Record<string, string | number | undefined>) => {
      const p = new URLSearchParams(params.toString());
      p.set("tab", "eventos");
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === undefined || valor === "") p.delete(chave);
        else p.set(chave, String(valor));
      }
      startTransition(() => router.push(`/eventos?${p.toString()}`));
    },
    [params, router],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label className="mb-1.5 block text-xs">Tipo</Label>
          <SelectNativo
            value={filtros.tipo ?? ""}
            onChange={(e) => navegar({ tipo: e.target.value || undefined, page: 1 })}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_EVENTO).map(([v, r]) => (
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

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Início</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Presentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum evento registado.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/eventos/${e.id}`)}
                >
                  <TableCell className="font-medium">{dataHora(e.inicio)}</TableCell>
                  <TableCell>{e.nome}</TableCell>
                  <TableCell>
                    <Badge variant="default">{TIPO_EVENTO[e.tipo as TipoEvento]}</Badge>
                  </TableCell>
                  <TableCell>{e.local ?? "—"}</TableCell>
                  <TableCell className="text-right">{e.presentes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} evento{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
