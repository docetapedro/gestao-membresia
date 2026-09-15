"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Clock, MapPin } from "lucide-react";
import { DIA_SEMANA } from "@/lib/rotulos";
import type { ItemProgramaSemanal } from "@/services/eventos.service";
import { removerProgramaSemanalAction } from "./actions";
import { FormularioPrograma } from "./FormularioPrograma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Edicao = { modo: "novo" } | { modo: "editar"; item: ItemProgramaSemanal } | null;

export function SeccaoPrograma({
  itens,
  podeCriar,
}: {
  itens: ItemProgramaSemanal[];
  podeCriar: boolean;
}) {
  const router = useRouter();
  const [edicao, setEdicao] = useState<Edicao>(null);
  const [aEliminar, setAEliminar] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const porDia = useMemo(() => {
    const grupos: Record<number, ItemProgramaSemanal[]> = {};
    for (const item of itens) {
      (grupos[item.diaSemana] ??= []).push(item);
    }
    return grupos;
  }, [itens]);

  async function eliminar(id: string) {
    setErro(null);
    setAEliminar(id);
    const res = await removerProgramaSemanalAction({ id });
    setAEliminar(null);
    if (res.ok) {
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  return (
    <div className="space-y-6">
      {podeCriar && edicao === null ? (
        <div className="flex justify-end">
          <Button onClick={() => setEdicao({ modo: "novo" })}>
            <Plus className="size-4" />
            Adicionar à programação
          </Button>
        </div>
      ) : null}

      {edicao ? (
        <FormularioPrograma
          modo={edicao.modo === "novo" ? "criar" : "editar"}
          item={edicao.modo === "editar" ? edicao.item : undefined}
          aoTerminar={() => setEdicao(null)}
        />
      ) : null}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      {itens.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Ainda não há programação semanal definida.
        </p>
      ) : (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6]
            .map((dia) => [dia, porDia[dia] ?? []] as const)
            .filter(([, lista]) => lista.length)
            .map(([dia, lista]) => (
              <div key={dia} className="rounded-lg border bg-card">
                <div className="border-b px-4 py-2 text-sm font-semibold">
                  {DIA_SEMANA[dia]}
                </div>
                <ul className="divide-y">
                  {lista.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-3",
                        !item.activo && "opacity-60",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{item.nome}</p>
                          {!item.activo ? <Badge variant="muted">Inactivo</Badge> : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {item.hora ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {item.hora}
                            </span>
                          ) : null}
                          {item.local ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {item.local}
                            </span>
                          ) : null}
                        </div>
                        {item.descricao ? (
                          <p className="mt-1 text-xs text-muted-foreground">{item.descricao}</p>
                        ) : null}
                      </div>
                      {podeCriar ? (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEdicao({ modo: "editar", item })}
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={aEliminar === item.id}
                            onClick={() => eliminar(item.id)}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
