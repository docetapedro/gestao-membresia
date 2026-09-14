"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/definicoes", rotulo: "Dados da igreja", exacto: true },
  { href: "/definicoes/utilizadores", rotulo: "Utilizadores", exacto: false },
];

export function NavDefinicoes() {
  const caminho = usePathname();
  return (
    <nav className="flex gap-1 border-b">
      {ITENS.map((i) => {
        const activo = i.exacto ? caminho === i.href : caminho.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activo
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
