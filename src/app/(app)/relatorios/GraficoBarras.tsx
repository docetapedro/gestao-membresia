"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { moeda } from "@/lib/formato";

export interface PontoBarra {
  rotulo: string;
  valor: number;
}

/** Paleta discreta, legível em tema claro/escuro (via variáveis Tailwind/HSL). */
const PALETA = [
  "hsl(var(--primary))",
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
  "hsl(280 65% 60%)",
  "hsl(190 80% 42%)",
];

/**
 * Gráfico de barras responsivo. `orientacao="horizontal"` (barras deitadas)
 * é útil para categorias com rótulos compridos (províncias, departamentos).
 */
export function GraficoBarras({
  dados,
  formato = "numero",
  orientacao = "vertical",
  multicor = false,
  altura = 288,
}: {
  dados: PontoBarra[];
  formato?: "numero" | "moeda";
  orientacao?: "vertical" | "horizontal";
  multicor?: boolean;
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
  const horizontal = orientacao === "horizontal";

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={dados}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, bottom: 8, left: horizontal ? 8 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        {horizontal ? (
          <>
            <XAxis type="number" tick={eixo} tickFormatter={fmt} />
            <YAxis
              type="category"
              dataKey="rotulo"
              tick={eixo}
              width={120}
              interval={0}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="rotulo" tick={eixo} interval={0} />
            <YAxis tick={eixo} tickFormatter={fmt} allowDecimals={false} />
          </>
        )}
        <Tooltip
          formatter={(v: number | string) => fmt(Number(v))}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
        />
        <Bar dataKey="valor" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
          {dados.map((_, i) => (
            <Cell
              key={i}
              fill={multicor ? PALETA[i % PALETA.length] : "hsl(var(--primary))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
