"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { moeda } from "@/lib/formato";

export interface PontoLinha {
  rotulo: string;
  valor: number;
}

/** Gráfico de linha responsivo para séries temporais (tendência mensal). */
export function GraficoLinha({
  dados,
  formato = "numero",
  altura = 288,
}: {
  dados: PontoLinha[];
  formato?: "numero" | "moeda";
  altura?: number;
}) {
  const fmt = (v: number) => (formato === "moeda" ? moeda(v) : String(v));

  if (dados.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height: altura }}
      >
        Sem dados para apresentar.
      </div>
    );
  }

  const eixo = { fontSize: 12, fill: "hsl(var(--muted-foreground))" } as const;

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="rotulo" tick={eixo} interval="preserveStartEnd" />
        <YAxis tick={eixo} tickFormatter={fmt} allowDecimals={false} width={48} />
        <Tooltip
          formatter={(v: number | string) => fmt(Number(v))}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          cursor={{ stroke: "hsl(var(--border))" }}
        />
        <Line
          type="monotone"
          dataKey="valor"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
