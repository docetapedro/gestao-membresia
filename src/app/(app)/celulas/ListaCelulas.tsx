"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginaCelulas } from "@/services/celulas.service";
import type { FiltrosCelula } from "@/lib/validators/celulas";
import { DIA_SEMANA } from "@/lib/rotulos";
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

function horario(dia: number | null, hora: string | null): string {
  const d = dia === null ? null : DIA_SEMANA[dia];
  if (d && hora) return `${d}, ${hora}`;
  return d ?? hora ?? "—";
}

export function ListaCelulas({
  dados,
  filtros,
}: {
  dados: PaginaCelulas;
  filtros: FiltrosCelula;
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
      startTransition(() => router.push(`/celulas?${p.toString()}`));
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
            window.clearTimeout((window as any).__tCelulas);
            (window as any).__tCelulas = window.setTimeout(
              () => navegar({ q: v, page: 1 }),
              350,
            );
          }}
          className="sm:max-w-xs"
        />
        <SelectNativo
          value={filtros.activa ?? ""}
          onChange={(e) => navegar({ activa: e.target.value || undefined, page: 1 })}
          className="sm:max-w-[200px]"
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </SelectNativo>
      </div>

      <div className={cn("rounded-lg border bg-card", pendente && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Reunião</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Membros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhuma célula encontrada.
                </TableCell>
              </TableRow>
            ) : (
              dados.itens.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/celulas/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{horario(c.diaSemana, c.hora)}</TableCell>
                  <TableCell>
                    <Badge variant={c.activa ? "success" : "muted"}>
                      {c.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.totalMembros}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {dados.total} célula{dados.total === 1 ? "" : "s"} · página {dados.page} de{" "}
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
