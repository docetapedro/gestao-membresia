"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TipoCulto } from "@prisma/client";
import type { PaginaCultos } from "@/services/cultos.service";
import type { FiltrosCulto } from "@/lib/validators/cultos";
import { TIPO_CULTO } from "@/lib/rotulos";
import { dataHora } from "@/lib/formato";
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

export function ListaCultos({
  dados,
  filtros,
}: {
  dados: PaginaCultos;
  filtros: FiltrosCulto;
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
      startTransition(() => router.push(`/presencas?${p.toString()}`));
    },
    [params, router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SelectNativo
          value={filtros.tipo ?? ""}
          onChange={(e) => navegar({ tipo: e.target.value || undefined, page: 1 })}
          className="sm:max-w-[220px]"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_CULTO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </SelectNativo>
      </div>

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead className="text-right">Presentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum culto registado.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/presencas/${c.id}`)}
                >
                  <TableCell className="font-medium">{dataHora(c.data)}</TableCell>
                  <TableCell>
                    <Badge variant="default">{TIPO_CULTO[c.tipo as TipoCulto]}</Badge>
                  </TableCell>
                  <TableCell>{c.tema ?? "—"}</TableCell>
                  <TableCell className="text-right">{c.presentes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} culto{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
