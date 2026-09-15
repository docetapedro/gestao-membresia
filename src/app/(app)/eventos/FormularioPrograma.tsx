"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { DIA_SEMANA } from "@/lib/rotulos";
import {
  criarProgramaSemanalAction,
  actualizarProgramaSemanalAction,
} from "./actions";
import type {
  CriarProgramaSemanalInput,
  ActualizarProgramaSemanalInput,
} from "@/lib/validators/eventos";
import type { ItemProgramaSemanal } from "@/services/eventos.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().min(1, "Indique o nome."),
  diaSemana: z.string().min(1, "Indique o dia."),
  hora: z.string().optional(),
  local: z.string().optional(),
  descricao: z.string().optional(),
  activo: z.boolean().default(true),
  ordem: z.string().optional(),
});

type FormValores = z.input<typeof formSchema>;

function Campo({
  label,
  htmlFor,
  erro,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {erro ? <p className="mt-1 text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}

interface Props {
  modo: "criar" | "editar";
  item?: ItemProgramaSemanal;
  aoTerminar: () => void;
}

export function FormularioPrograma({ modo, item, aoTerminar }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: item?.nome ?? "",
      diaSemana: item ? String(item.diaSemana) : "",
      hora: item?.hora ?? "",
      local: item?.local ?? "",
      descricao: item?.descricao ?? "",
      activo: item?.activo ?? true,
      ordem: item ? String(item.ordem) : "0",
    },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarProgramaSemanalAction(valores as unknown as CriarProgramaSemanalInput)
        : await actualizarProgramaSemanalAction({
            ...(valores as unknown as ActualizarProgramaSemanalInput),
            id: item!.id,
          });

    if (res.ok) {
      router.refresh();
      aoTerminar();
      return;
    }
    if (res.campos) {
      for (const [campo, msg] of Object.entries(res.campos)) {
        setError(campo as keyof FormValores, { message: msg });
      }
    }
    setErroGlobal(res.erro);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{modo === "criar" ? "Nova entrada na programação" : "Editar entrada"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(aoSubmeter)} className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome *" htmlFor="nome" erro={errors.nome?.message} className="sm:col-span-2">
            <Input id="nome" placeholder="Ex.: Culto de oração" {...register("nome")} />
          </Campo>
          <Campo label="Dia da semana *" htmlFor="diaSemana" erro={errors.diaSemana?.message}>
            <SelectNativo id="diaSemana" {...register("diaSemana")}>
              <option value="">Seleccione…</option>
              {Object.entries(DIA_SEMANA).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Hora" htmlFor="hora" erro={errors.hora?.message}>
            <Input id="hora" type="time" {...register("hora")} />
          </Campo>
          <Campo label="Local" htmlFor="local">
            <Input id="local" {...register("local")} />
          </Campo>
          <Campo label="Ordem" htmlFor="ordem" erro={errors.ordem?.message}>
            <Input id="ordem" type="number" min={0} {...register("ordem")} />
          </Campo>
          <Campo label="Descrição" htmlFor="descricao" className="sm:col-span-2">
            <Textarea id="descricao" {...register("descricao")} />
          </Campo>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              {...register("activo")}
            />
            Activo
          </label>

          {erroGlobal ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {erroGlobal}
            </p>
          ) : null}

          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar…" : modo === "criar" ? "Adicionar" : "Guardar alterações"}
            </Button>
            <Button type="button" variant="outline" onClick={aoTerminar}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
