"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { removerMembroAction } from "../actions";
import { ESTADO_MEMBRO } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNativo } from "@/components/ui/select-nativo";

const ESTADOS_SAIDA = ["INACTIVO", "TRANSFERIDO", "FALECIDO"] as const;

export function RemoverMembro({ id }: { id: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<string>("INACTIVO");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function confirmar() {
    setErro(null);
    setPendente(true);
    const res = await removerMembroAction({ id, estado: estado as never, motivoSaida: motivo });
    setPendente(false);
    if (res.ok) {
      router.push("/membros");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  if (!aberto) {
    return (
      <Button variant="outline" onClick={() => setAberto(true)}>
        <UserMinus className="size-4" />
        Registar saída
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium">Registar saída do membro</p>
      <p className="text-xs text-muted-foreground">
        O membro não é apagado — fica com estado de saída e data registada.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Estado de saída</Label>
          <SelectNativo value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS_SAIDA.map((s) => (
              <option key={s} value={s}>{ESTADO_MEMBRO[s]}</option>
            ))}
          </SelectNativo>
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">Motivo (opcional)</Label>
        <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      <div className="flex gap-2">
        <Button variant="destructive" onClick={confirmar} disabled={pendente}>
          {pendente ? "A registar…" : "Confirmar saída"}
        </Button>
        <Button variant="ghost" onClick={() => setAberto(false)} disabled={pendente}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
