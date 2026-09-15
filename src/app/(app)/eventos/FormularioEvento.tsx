"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { TipoEvento } from "@prisma/client";
import { TIPO_EVENTO } from "@/lib/rotulos";
import { criarEventoAction, actualizarEventoAction } from "./actions";
import type { CriarEventoInput, ActualizarEventoInput } from "@/lib/validators/eventos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().min(1, "Indique o nome."),
  tipo: z.string().min(1, "Indique o tipo.").pipe(z.nativeEnum(TipoEvento)),
  inicio: z.string().min(1, "Indique o início."),
  fim: z.string().optional(),
  local: z.string().optional(),
  descricao: z.string().optional(),
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
  id?: string;
  inicial?: Partial<FormValores>;
}

export function FormularioEvento({ modo, id, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "" as TipoEvento,
      inicio: "",
      fim: "",
      local: "",
      descricao: "",
      ...inicial,
    },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarEventoAction(valores as unknown as CriarEventoInput)
        : await actualizarEventoAction({
            ...(valores as unknown as ActualizarEventoInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/eventos/${res.data.id}`);
      router.refresh();
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
    <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do evento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome *" htmlFor="nome" erro={errors.nome?.message} className="sm:col-span-2">
            <Input id="nome" {...register("nome")} />
          </Campo>
          <Campo label="Tipo *" htmlFor="tipo" erro={errors.tipo?.message}>
            <SelectNativo id="tipo" {...register("tipo")}>
              <option value="">Seleccione…</option>
              {Object.entries(TIPO_EVENTO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Local" htmlFor="local">
            <Input id="local" {...register("local")} />
          </Campo>
          <Campo label="Início *" htmlFor="inicio" erro={errors.inicio?.message}>
            <Controller
              control={control}
              name="inicio"
              render={({ field }) => (
                <DateTimePicker id="inicio" value={field.value} onChange={field.onChange} />
              )}
            />
          </Campo>
          <Campo label="Fim" htmlFor="fim" erro={errors.fim?.message}>
            <Controller
              control={control}
              name="fim"
              render={({ field }) => (
                <DateTimePicker id="fim" value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Campo>
          <Campo label="Descrição" htmlFor="descricao" className="sm:col-span-2">
            <Textarea id="descricao" {...register("descricao")} />
          </Campo>
        </CardContent>
      </Card>

      {erroGlobal ? (
        <p className="text-sm text-destructive" role="alert">
          {erroGlobal}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "A guardar…"
            : modo === "criar"
              ? "Registar evento"
              : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
