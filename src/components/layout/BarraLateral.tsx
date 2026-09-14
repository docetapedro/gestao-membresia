"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@prisma/client";
import { Logotipo } from "@/components/marca/Logotipo";
import { NAVEGACAO } from "./navegacao";
import { recursoVisivel } from "@/lib/auth/permissoes";
import { cn } from "@/lib/utils";

export function BarraLateral({ papel }: { papel: Papel }) {
  const caminho = usePathname();
  const itens = NAVEGACAO.filter(
    (i) => !i.recurso || recursoVisivel(papel, i.recurso),
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Logotipo tamanho="sm" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {itens.map((item) => {
          const activo =
            item.href === "/"
              ? caminho === "/"
              : caminho.startsWith(item.href);
          const Icone = item.icone;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icone className="size-4" />
              {item.rotulo}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
