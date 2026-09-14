"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EstadoMembro } from "@prisma/client";
import type { PaginaMembros } from "@/services/membros.service";
import type { FiltrosMembro } from "@/lib/validators/membros";
import { ESTADO_MEMBRO, VARIANTE_ESTADO_MEMBRO } from "@/lib/rotulos";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
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

type Linha = PaginaMembros["itens"][number];
const col = createColumnHelper<Linha>();

const COLUNAS = [
  col.accessor("numeroMembro", { header: "Nº", meta: { ordenavel: true } }),
  col.accessor("nomeCompleto", { header: "Nome", meta: { ordenavel: true } }),
  col.accessor("telefone", {
    header: "Telefone",
    cell: (c) => c.getValue() ?? "—",
  }),
  col.accessor((l) => l.celula?.nome ?? "—", {
    id: "celula",
    header: "Célula",
  }),
  col.accessor("estado", {
    header: "Estado",
    meta: { ordenavel: true },
    cell: (c) => {
      const e = c.getValue() as EstadoMembro;
      return <Badge variant={VARIANTE_ESTADO_MEMBRO[e]}>{ESTADO_MEMBRO[e]}</Badge>;
    },
  }),
];

export function ListaMembros({
  dados,
  filtros,
}: {
  dados: PaginaMembros;
  filtros: FiltrosMembro;
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
      startTransition(() => router.push(`/membros?${p.toString()}`));
    },
    [params, router],
  );

  function ordenarPor(coluna: string) {
    const mesma = filtros.ordenarPor === coluna;
    const ordem = mesma && filtros.ordem === "asc" ? "desc" : "asc";
    navegar({ ordenarPor: coluna, ordem, page: 1 });
  }

  const tabela = useReactTable({
    data: dados.itens,
    columns: COLUNAS,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Pesquisar por nome, nº ou telefone…"
          defaultValue={filtros.q}
          onChange={(e) => {
            const v = e.target.value;
            // debounce simples
            window.clearTimeout((window as any).__tMembros);
            (window as any).__tMembros = window.setTimeout(
              () => navegar({ q: v, page: 1 }),
              350,
            );
          }}
          className="sm:max-w-xs"
        />
        <SelectNativo
          value={filtros.estado ?? ""}
          onChange={(e) => navegar({ estado: e.target.value || undefined, page: 1 })}
          className="sm:max-w-[220px]"
        >
          <option value="">Todos os estados</option>
          {Object.entries(ESTADO_MEMBRO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </SelectNativo>
      </div>

      {/* Tabela */}
      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            {tabela.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((h) => {
                  const ordenavel = (h.column.columnDef.meta as any)?.ordenavel;
                  const activa = filtros.ordenarPor === h.column.id;
                  return (
                    <TableHead key={h.id}>
                      {ordenavel ? (
                        <button
                          type="button"
                          onClick={() => ordenarPor(h.column.id)}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {activa &&
                            (filtros.ordem === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            ))}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tabela.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUNAS.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tabela.getRowModel().rows.map((linha) => (
                <TableRow
                  key={linha.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/membros/${linha.original.id}`)}
                >
                  {linha.getVisibleCells().map((celula) => (
                    <TableCell key={celula.id}>
                      {flexRender(celula.column.columnDef.cell, celula.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} membro{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
