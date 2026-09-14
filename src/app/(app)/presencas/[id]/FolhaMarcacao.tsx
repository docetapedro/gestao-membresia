"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { marcarPresencasAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MembroFolha {
  membroId: string;
  numeroMembro: string;
  nomeCompleto: string;
  presente: boolean;
}

export function FolhaMarcacao({
  cultoId,
  membros,
  podeMarcar,
}: {
  cultoId: string;
  membros: MembroFolha[];
  podeMarcar: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(membros.map((m) => [m.membroId, m.presente])),
  );
  const [filtro, setFiltro] = useState("");
  const [pendente, setPendente] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return membros;
    return membros.filter(
      (m) =>
        m.nomeCompleto.toLowerCase().includes(q) || m.numeroMembro.includes(q),
    );
  }, [membros, filtro]);

  const presentes = useMemo(
    () => Object.values(estado).filter(Boolean).length,
    [estado],
  );

  function alternar(id: string) {
    if (!podeMarcar) return;
    setEstado((e) => ({ ...e, [id]: !e[id] }));
    setMensagem(null);
  }

  function definirTodos(valor: boolean) {
    if (!podeMarcar) return;
    setEstado((e) => {
      const novo = { ...e };
      for (const m of visiveis) novo[m.membroId] = valor;
      return novo;
    });
    setMensagem(null);
  }

  async function guardar() {
    setErro(null);
    setMensagem(null);
    setPendente(true);
    const marcacoes = membros.map((m) => ({
      membroId: m.membroId,
      presente: !!estado[m.membroId],
    }));
    const res = await marcarPresencasAction({ cultoId, marcacoes });
    setPendente(false);
    if (res.ok) {
      setMensagem(`Guardado: ${res.data.presentes} presente(s) de ${res.data.marcados}.`);
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filtrar por nome ou nº…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {presentes} presente{presentes === 1 ? "" : "s"} de {membros.length}
          </span>
          {podeMarcar ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => definirTodos(true)}>
                Marcar todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => definirTodos(false)}>
                Limpar
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {membros.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Não há membros elegíveis para marcar.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visiveis.map((m) => {
            const presente = !!estado[m.membroId];
            return (
              <li key={m.membroId}>
                <button
                  type="button"
                  onClick={() => alternar(m.membroId)}
                  disabled={!podeMarcar}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition",
                    presente ? "border-primary bg-primary/5" : "bg-card hover:bg-accent",
                    !podeMarcar && "cursor-default opacity-80",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.nomeCompleto}</p>
                    <p className="text-xs text-muted-foreground">Nº {m.numeroMembro}</p>
                  </div>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      presente
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {presente ? <Check className="size-4" /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      {mensagem ? <p className="text-sm text-emerald-600">{mensagem}</p> : null}

      {podeMarcar ? (
        <div className="flex justify-end">
          <Button onClick={guardar} disabled={pendente}>
            <Save className="size-4" />
            {pendente ? "A guardar…" : "Guardar presenças"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
