"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { PapelFamiliar } from "@prisma/client";
import { PAPEL_FAMILIAR } from "@/lib/rotulos";
import {
  atribuirMembroFamiliaAction,
  removerMembroFamiliaAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";

interface MembroFamilia {
  id: string;
  numeroMembro: string;
  nomeCompleto: string;
  telefone: string | null;
  papelFamiliar: PapelFamiliar | null;
}

interface Disponivel {
  id: string;
  numeroMembro: string;
  nomeCompleto: string;
}

export function GestaoMembrosFamilia({
  familiaId,
  membros,
  disponiveis,
  podeGerir,
}: {
  familiaId: string;
  membros: MembroFamilia[];
  disponiveis: Disponivel[];
  podeGerir: boolean;
}) {
  const router = useRouter();
  const [membroId, setMembroId] = useState("");
  const [papel, setPapel] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function adicionar() {
    if (!membroId) return;
    setErro(null);
    setPendente(true);
    const res = await atribuirMembroFamiliaAction({
      familiaId,
      membroId,
      papelFamiliar: (papel || null) as PapelFamiliar | null,
    });
    setPendente(false);
    if (res.ok) {
      setMembroId("");
      setPapel("");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  async function retirar(id: string) {
    setErro(null);
    setPendente(true);
    const res = await removerMembroFamiliaAction(familiaId, { membroId: id });
    setPendente(false);
    if (res.ok) router.refresh();
    else setErro(res.erro);
  }

  return (
    <div className="space-y-4">
      {membros.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ainda não há membros nesta família.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {membros.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/membros/${m.id}`}
                  className="font-medium hover:underline"
                >
                  {m.nomeCompleto}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Nº {m.numeroMembro}
                  {m.papelFamiliar ? ` · ${PAPEL_FAMILIAR[m.papelFamiliar]}` : ""}
                  {m.telefone ? ` · ${m.telefone}` : ""}
                </p>
              </div>
              {podeGerir ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => retirar(m.id)}
                  disabled={pendente}
                  title="Retirar da família"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {podeGerir ? (
        <div className="rounded-lg border border-dashed p-4">
          <p className="mb-3 text-sm font-medium">Adicionar membro</p>
          {disponiveis.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Não há membros sem família disponíveis.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
              <div>
                <Label className="mb-1.5 block">Membro</Label>
                <SelectNativo value={membroId} onChange={(e) => setMembroId(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {disponiveis.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nomeCompleto} (Nº {d.numeroMembro})
                    </option>
                  ))}
                </SelectNativo>
              </div>
              <div>
                <Label className="mb-1.5 block">Papel</Label>
                <SelectNativo value={papel} onChange={(e) => setPapel(e.target.value)}>
                  <option value="">—</option>
                  {Object.entries(PAPEL_FAMILIAR).map(([v, r]) => (
                    <option key={v} value={v}>
                      {r}
                    </option>
                  ))}
                </SelectNativo>
              </div>
              <Button onClick={adicionar} disabled={pendente || !membroId}>
                <UserPlus className="size-4" />
                Adicionar
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </div>
  );
}
