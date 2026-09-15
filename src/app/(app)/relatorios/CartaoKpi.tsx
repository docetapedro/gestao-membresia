import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Cartão-KPI simples (número + rótulo + subtítulo opcional).
 * É um componente de apresentação sem estado — pode ser usado directamente
 * a partir de Server Components.
 */
export function CartaoKpi({
  titulo,
  valor,
  sub,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  sub?: string;
  icone?: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        {Icone ? <Icone className="size-4 text-primary" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{valor}</div>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
