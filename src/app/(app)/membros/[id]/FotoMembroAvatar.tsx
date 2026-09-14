"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { carregarFotoAction, removerFotoAction } from "../actions";
import { Button } from "@/components/ui/button";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] ?? "" : "";
  return (primeira + ultima).toUpperCase();
}

export function FotoMembroAvatar({
  membroId,
  nome,
  fotoUrl,
  podeEditar,
}: {
  membroId: string;
  nome: string;
  fotoUrl: string | null;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(fotoUrl);
  const [versao, setVersao] = useState(0);
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const ficheiro = e.target.files?.[0];
    e.target.value = ""; // permite re-seleccionar o mesmo ficheiro
    if (!ficheiro) return;
    setErro(null);
    setPendente(true);
    const fd = new FormData();
    fd.append("foto", ficheiro);
    const res = await carregarFotoAction(membroId, fd);
    setPendente(false);
    if (res.ok) {
      setUrl(res.data.fotoUrl);
      setVersao((v) => v + 1);
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  async function aoRemover() {
    setErro(null);
    setPendente(true);
    const res = await removerFotoAction(membroId);
    setPendente(false);
    if (res.ok) {
      setUrl(null);
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  const src = url ? `${url}?v=${versao}` : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-24 overflow-hidden rounded-full border bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Fotografia de ${nome}`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {iniciais(nome) || "?"}
          </div>
        )}
      </div>

      {podeEditar ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={aoEscolher}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pendente}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="size-4" />
            {pendente ? "A carregar…" : url ? "Trocar" : "Carregar"}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="icon" disabled={pendente} onClick={aoRemover}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {erro ? <p className="max-w-[12rem] text-center text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}
