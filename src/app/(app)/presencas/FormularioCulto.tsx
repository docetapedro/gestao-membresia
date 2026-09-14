"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { TipoCulto } from "@prisma/client";
import { TIPO_CULTO } from "@/lib/rotulos";
import { criarCultoAction, actualizarCultoAction } from "./actions";
import type { CriarCultoInput, ActualizarCultoInput } from "@/lib/validators/cultos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  tipo: z.string().min(1, "Indique o tipo.").pipe(z.nativeEnum(TipoCulto)),
  data: z.string().min(1, "Indique a data."),
  tema: z.string().optional(),
  pregador: z.string().optional(),
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

export function FormularioCulto({ modo, id, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: { tipo: "" as TipoCulto, data: "", tema: "", pregador: "", ...inicial },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarCultoAction(valores as unknown as CriarCultoInput)
        : await actualizarCultoAction({
            ...(valores as unknown as ActualizarCultoInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/presencas/${res.data.id}`);
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
          <CardTitle>Dados do culto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tipo *" htmlFor="tipo" erro={errors.tipo?.message}>
            <SelectNativo id="tipo" {...register("tipo")}>
              <option value="">Seleccione…</option>
              {Object.entries(TIPO_CULTO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Data e hora *" htmlFor="data" erro={errors.data?.message}>
            <Input id="data" type="datetime-local" {...register("data")} />
          </Campo>
          <Campo label="Tema" htmlFor="tema" className="sm:col-span-2">
            <Input id="tema" {...register("tema")} />
          </Campo>
          <Campo label="Pregador" htmlFor="pregador" className="sm:col-span-2">
            <Input id="pregador" {...register("pregador")} />
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
              ? "Registar culto"
              : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
