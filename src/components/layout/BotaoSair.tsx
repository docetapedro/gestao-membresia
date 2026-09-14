"use client";

import { LogOut } from "lucide-react";
import { sair } from "@/lib/auth/acoes";
import { Button } from "@/components/ui/button";

export function BotaoSair() {
  return (
    <form action={sair}>
      <Button variant="ghost" size="sm" type="submit" title="Terminar sessão">
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </form>
  );
}
