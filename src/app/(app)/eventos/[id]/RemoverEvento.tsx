"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removerEventoAction } from "../actions";
import { Button } from "@/components/ui/button";

export function RemoverEvento({ id }: { id: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function confirmar() {
    setErro(null);
    setPendente(true);
    const res = await removerEventoAction({ id });
    setPendente(false);
    if (res.ok) {
      router.push("/eventos?tab=eventos");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  if (!aberto) {
    return (
      <Button variant="outline" onClick={() => setAberto(true)}>
        <Trash2 className="size-4" />
        Eliminar evento
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium">Eliminar este evento?</p>
      <p className="text-xs text-muted-foreground">
        As presenças marcadas neste evento também serão removidas. Esta acção não pode ser anulada.
      </p>
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
