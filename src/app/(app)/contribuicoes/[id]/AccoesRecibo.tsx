"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Ban } from "lucide-react";
import { anularContribuicaoAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AccoesRecibo({
  id,
  anulada,
  podeAnular,
}: {
  id: string;
  anulada: boolean;
  podeAnular: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function confirmar() {
    setErro(null);
    setPendente(true);
    const res = await anularContribuicaoAction({ id, motivoAnulacao: motivo });
    setPendente(false);
    if (res.ok) {
      setAberto(false);
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  return (
    <div className="nao-imprimir space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir recibo
        </Button>
        {podeAnular && !anulada ? (
          <Button variant="outline" onClick={() => setAberto((v) => !v)}>
            <Ban className="size-4" />
            Anular
          </Button>
        ) : null}
      </div>

      {aberto ? (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium">Anular esta contribuição</p>
          <p className="text-xs text-muted-foreground">
            A contribuição não é apagada — fica marcada como anulada. Para corrigir, registe
            uma nova.
          </p>
          <div>
            <Label className="mb-1.5 block">Motivo *</Label>
            <Textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: valor incorrecto"
            />
          </div>
          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          <div className="flex gap-2">
            <Button variant="destructive" onClick={confirmar} disabled={pendente}>
              {pendente ? "A anular…" : "Confirmar anulação"}
            </Button>
            <Button variant="ghost" onClick={() => setAberto(false)} disabled={pendente}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
