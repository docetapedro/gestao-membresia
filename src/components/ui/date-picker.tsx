"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Cabeçalho da grelha, semana a começar à segunda-feira.
const DIAS_CABECALHO = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Converte "yyyy-MM-dd" numa Date local válida, ou null. */
function parseValor(valor?: string): Date | null {
  if (!valor) return null;
  const d = parse(valor, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : null;
}

/** Índice 0..6 (Seg..Dom) do primeiro dia do mês. */
function inicioGrelha(ano: number, mes: number): number {
  const jsDia = new Date(ano, mes, 1).getDay(); // 0=Dom..6=Sáb
  return (jsDia + 6) % 7; // desloca para 0=Seg..6=Dom
}

interface DatePickerProps {
  value?: string; // "yyyy-MM-dd"
  onChange: (valor: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  minAno?: number;
  maxAno?: number;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "dd/mm/aaaa",
  disabled,
  minAno = 1920,
  maxAno = new Date().getFullYear() + 5,
  className,
}: DatePickerProps) {
  const selecionada = parseValor(value);
  const [aberto, setAberto] = React.useState(false);
  const hoje = new Date();
  const [vistaAno, setVistaAno] = React.useState(
    selecionada ? selecionada.getFullYear() : hoje.getFullYear(),
  );
  const [vistaMes, setVistaMes] = React.useState(
    selecionada ? selecionada.getMonth() : hoje.getMonth(),
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Ao abrir, posiciona a vista no valor selecionado.
  React.useEffect(() => {
    if (aberto && selecionada) {
      setVistaAno(selecionada.getFullYear());
      setVistaMes(selecionada.getMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // Fecha ao clicar fora ou premir Escape.
  React.useEffect(() => {
    if (!aberto) return;
    function aoClicar(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    function aoTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTecla);
    };
  }, [aberto]);

  const anos = React.useMemo(() => {
    const lista: number[] = [];
    for (let a = maxAno; a >= minAno; a--) lista.push(a);
    return lista;
  }, [minAno, maxAno]);

  function mudarMes(delta: number) {
    let m = vistaMes + delta;
    let a = vistaAno;
    if (m < 0) {
      m = 11;
      a -= 1;
    } else if (m > 11) {
      m = 0;
      a += 1;
    }
    setVistaMes(m);
    setVistaAno(a);
  }

  function escolher(dia: number) {
    const d = new Date(vistaAno, vistaMes, dia);
    onChange(format(d, "yyyy-MM-dd"));
    setAberto(false);
  }

  const diasNoMes = new Date(vistaAno, vistaMes + 1, 0).getDate();
  const branco = inicioGrelha(vistaAno, vistaMes);
  const celulas: Array<number | null> = [
    ...Array.from({ length: branco }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const ehSelecionada = (dia: number) =>
    selecionada &&
    selecionada.getFullYear() === vistaAno &&
    selecionada.getMonth() === vistaMes &&
    selecionada.getDate() === dia;

  const ehHoje = (dia: number) =>
    hoje.getFullYear() === vistaAno &&
    hoje.getMonth() === vistaMes &&
    hoje.getDate() === dia;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setAberto((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selecionada && "text-muted-foreground",
        )}
      >
        <span>{selecionada ? format(selecionada, "dd/MM/yyyy", { locale: pt }) : placeholder}</span>
        <span className="flex items-center gap-1">
          {selecionada && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Limpar data"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          ) : null}
          <Calendar className="size-4 text-muted-foreground" />
        </span>
      </button>

      {aberto ? (
        <div className="absolute z-50 mt-1 w-[17rem] rounded-md border bg-popover p-3 shadow-md">
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              className="rounded p-1 hover:bg-accent"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <select
              value={vistaMes}
              onChange={(e) => setVistaMes(Number(e.target.value))}
              className="h-8 flex-1 rounded-md border border-input bg-background px-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={vistaAno}
              onChange={(e) => setVistaAno(Number(e.target.value))}
              className="h-8 w-[4.5rem] rounded-md border border-input bg-background px-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => mudarMes(1)}
              className="rounded p-1 hover:bg-accent"
              aria-label="Mês seguinte"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground">
            {DIAS_CABECALHO.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {celulas.map((dia, i) =>
              dia === null ? (
                <span key={`b${i}`} />
              ) : (
                <button
                  key={dia}
                  type="button"
                  onClick={() => escolher(dia)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-sm hover:bg-accent",
                    ehSelecionada(dia) &&
                      "bg-primary text-primary-foreground hover:bg-primary",
                    !ehSelecionada(dia) && ehHoje(dia) && "border border-primary/50",
                  )}
                >
                  {dia}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(format(new Date(), "yyyy-MM-dd"));
                setAberto(false);
              }}
              className="text-xs text-primary hover:underline"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface DateTimePickerProps extends Omit<DatePickerProps, "value" | "onChange"> {
  value?: string; // "yyyy-MM-ddTHH:mm"
  onChange: (valor: string) => void;
}

/** Data + hora. Combina o DatePicker com um campo de hora nativo. */
export function DateTimePicker({ value, onChange, ...rest }: DateTimePickerProps) {
  const [dataParte = "", horaParte = ""] = (value ?? "").split("T");

  function mudarData(d: string) {
    if (!d) {
      onChange("");
      return;
    }
    onChange(`${d}T${horaParte || "09:00"}`);
  }

  function mudarHora(h: string) {
    if (!dataParte) return;
    onChange(`${dataParte}T${h}`);
  }

  return (
    <div className="flex gap-2">
      <DatePicker {...rest} value={dataParte} onChange={mudarData} className="flex-1" />
      <input
        type="time"
        value={horaParte}
        onChange={(e) => mudarHora(e.target.value)}
        disabled={rest.disabled}
        className="h-10 w-[7.5rem] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
