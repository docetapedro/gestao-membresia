import { getTenantContext } from "@/lib/auth/sessao";
import { BarraLateral } from "@/components/layout/BarraLateral";
import { BotaoSair } from "@/components/layout/BotaoSair";

const ROTULO_PAPEL: Record<string, string> = {
  ADMIN: "Administrador",
  PASTOR: "Pastor",
  SECRETARIA: "Secretaria",
  TESOURARIA: "Tesouraria",
  LIDER_CELULA: "Líder de Célula",
};

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getTenantContext();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <BarraLateral papel={ctx.papel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{ctx.nome}</p>
            <p className="text-xs text-muted-foreground">
              {ROTULO_PAPEL[ctx.papel] ?? ctx.papel}
            </p>
          </div>
          <BotaoSair />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
