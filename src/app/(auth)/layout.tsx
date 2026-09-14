import { Logotipo } from "@/components/marca/Logotipo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8">
        <Logotipo tamanho="lg" />
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        Koinonia · Gestão de Membros
      </p>
    </div>
  );
}
