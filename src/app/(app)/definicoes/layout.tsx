import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/sessao";
import { can } from "@/lib/auth/permissoes";
import { NavDefinicoes } from "./NavDefinicoes";

export const metadata = { title: "Definições" };

export default async function DefinicoesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getTenantContext();
  if (!can(ctx, "ler", "definicoes")) redirect("/");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Definições</h1>
        <p className="text-sm text-muted-foreground">
          Dados da igreja e gestão de utilizadores.
        </p>
      </div>
      <NavDefinicoes />
      {children}
    </div>
  );
}
