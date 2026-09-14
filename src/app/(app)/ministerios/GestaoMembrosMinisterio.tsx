"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { data } from "@/lib/formato";
import {
  atribuirMembroMinisterioAction,
  removerMembroMinisterioAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";

interface Associacao {
  id: string;
  funcao: string | null;
  desde: Date | null;
  membro: { id: string; numeroMembro: string; nomeCompleto: string; telefone: string | null };
}

interface Disponivel {
  id: string;
  numeroMembro: string;
  nomeCompleto: string;
}

export function GestaoMembrosMinisterio({
  ministerioId,
  associacoes,
  disponiveis,
  podeGerir,
}: {
  ministerioId: string;
  associacoes: Associacao[];
  disponiveis: Disponivel[];
  podeGerir: boolean;
}) {
  const router = useRouter();
  const [membroId, setMembroId] = useState("");
  const [funcao, setFuncao] = useState("");
  const [desde, setDesde] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function adicionar() {
    if (!membroId) return;
    setErro(null);
    setPendente(true);
    const res = await atribuirMembroMinisterioAction({
      ministerioId,
      membroId,
      funcao: funcao || null,
      desde: desde || null,
    });
    setPendente(false);
    if (res.ok) {
      setMembroId("");
      setFuncao("");
      setDesde("");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  async function retirar(associacaoId: string) {
    setErro(null);
    setPendente(true);
    const res = await removerMembroMinisterioAction(ministerioId, {
      membroMinisterioId: associacaoId,
    });
    setPendente(false);
    if (res.ok) router.refresh();
    else setErro(res.erro);
  }

  return (
    <div className="space-y-4">
      {associacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ainda não há membros neste ministério.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {associacoes.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={`/membros/${a.membro.id}`} className="font-medium hover:underline">
                  {a.membro.nomeCompleto}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Nº {a.membro.numeroMembro}
                  {a.funcao ? ` · ${a.funcao}` : ""}
                  {a.desde ? ` · desde ${data(a.desde)}` : ""}
                </p>
              </div>
              {podeGerir ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => retirar(a.id)}
                  disabled={pendente}
                  title="Retirar do ministério"
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
              Todos os membros já pertencem a este ministério.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
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
                <Label className="mb-1.5 block">Função</Label>
                <Input
                  placeholder="Ex.: Vocalista"
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Desde</Label>
                <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={adicionar} disabled={pendente || !membroId}>
                  <UserPlus className="size-4" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </div>
  );
}
