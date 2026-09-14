"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removerMinisterioAction } from "../actions";
import { Button } from "@/components/ui/button";

export function RemoverMinisterio({ id, temMembros }: { id: string; temMembros: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function confirmar() {
    setErro(null);
    setPendente(true);
    const res = await removerMinisterioAction({ id });
    setPendente(false);
    if (res.ok) {
      router.push("/ministerios");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  if (temMembros) {
    return (
      <p className="text-xs text-muted-foreground">
        Para eliminar o departamento, retire primeiro todos os membros.
      </p>
    );
  }

  if (!aberto) {
    return (
      <Button variant="outline" onClick={() => setAberto(true)}>
        <Trash2 className="size-4" />
        Eliminar departamento
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium">Eliminar este departamento?</p>
      <p className="text-xs text-muted-foreground">Esta acção não pode ser anulada.</p>
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      <div className="flex gap-2">
        <Button variant="destructive" onClick={confirmar} disabled={pendente}>
          {pendente ? "A eliminar…" : "Confirmar eliminação"}
        </Button>
        <Button variant="ghost" onClick={() => setAberto(false)} disabled={pendente}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
