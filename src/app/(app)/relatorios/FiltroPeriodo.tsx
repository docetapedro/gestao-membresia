"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

/**
 * Filtro de período (de / até) sincronizado com os searchParams do URL.
 * `base` é a rota a actualizar (ex.: "/relatorios/presencas").
 */
export function FiltroPeriodo({
  base,
  de,
  ate,
}: {
  base: string;
  de?: string;
  ate?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendente, startTransition] = useTransition();

  const navegar = useCallback(
    (mudancas: Record<string, string | undefined>) => {
      const p = new URLSearchParams(params.toString());
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (!valor) p.delete(chave);
        else p.set(chave, valor);
      }
      startTransition(() => router.push(`${base}?${p.toString()}`));
    },
    [params, router, base],
  );

  return (
    <div className={cn("flex flex-wrap items-end gap-3", pendente && "opacity-60")}>
      <div>
        <Label className="mb-1.5 block text-xs">De</Label>
        <DatePicker value={de ?? ""} onChange={(v) => navegar({ de: v || undefined })} />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Até</Label>
        <DatePicker value={ate ?? ""} onChange={(v) => navegar({ ate: v || undefined })} />
      </div>
      {de || ate ? (
        <button
          type="button"
          onClick={() => navegar({ de: undefined, ate: undefined })}
          className="h-10 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}
