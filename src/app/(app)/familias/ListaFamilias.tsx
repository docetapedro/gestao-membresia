"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginaFamilias } from "@/services/familias.service";
import type { FiltrosFamilia } from "@/lib/validators/familias";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ListaFamilias({
  dados,
  filtros,
}: {
  dados: PaginaFamilias;
  filtros: FiltrosFamilia;
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
      startTransition(() => router.push(`/familias?${p.toString()}`));
    },
    [params, router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Pesquisar por nome…"
          defaultValue={filtros.q}
          onChange={(e) => {
            const v = e.target.value;
            window.clearTimeout((window as any).__tFamilias);
            (window as any).__tFamilias = window.setTimeout(
              () => navegar({ q: v, page: 1 }),
              350,
            );
          }}
          className="sm:max-w-xs"
        />
      </div>

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead className="text-right">Membros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhuma família encontrada.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/familias/${f.id}`)}
                >
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.endereco ?? "—"}</TableCell>
                  <TableCell className="text-right">{f.totalMembros}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} família{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
