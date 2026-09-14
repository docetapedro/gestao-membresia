"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginaMinisterios } from "@/services/ministerios.service";
import type { FiltrosMinisterio } from "@/lib/validators/ministerios";
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

export function ListaMinisterios({
  dados,
  filtros,
}: {
  dados: PaginaMinisterios;
  filtros: FiltrosMinisterio;
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
      startTransition(() => router.push(`/ministerios?${p.toString()}`));
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
            window.clearTimeout((window as any).__tMinisterios);
            (window as any).__tMinisterios = window.setTimeout(
              () => navegar({ q: v, page: 1 }),
              350,
            );
          }}
          className="sm:max-w-xs"
        />
        <SelectNativo
          value={filtros.activo ?? ""}
          onChange={(e) => navegar({ activo: e.target.value || undefined, page: 1 })}
          className="sm:max-w-[200px]"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </SelectNativo>
      </div>

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Membros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhum departamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/ministerios/${m.id}`)}
                >
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell>
                    <Badge variant={m.activo ? "success" : "muted"}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{m.totalMembros}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} departamento{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
