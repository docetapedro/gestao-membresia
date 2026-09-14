"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { DIA_SEMANA } from "@/lib/rotulos";
import { criarCelulaAction, actualizarCelulaAction } from "./actions";
import type { CriarCelulaInput, ActualizarCelulaInput } from "@/lib/validators/celulas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto."),
  liderId: z.string().optional(),
  anfitriaoId: z.string().optional(),
  diaSemana: z.string().optional(),
  hora: z.string().optional(),
  endereco: z.string().optional(),
  activa: z.boolean().default(true),
});

type FormValores = z.input<typeof formSchema>;

interface Membro {
  id: string;
  numeroMembro: string;
  nomeCompleto: string;
}

interface Props {
  modo: "criar" | "editar";
  id?: string;
  membros: Membro[];
  inicial?: Partial<FormValores>;
}

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

export function FormularioCelula({ modo, id, membros, inicial }: Props) {
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
      nome: "",
      liderId: "",
      anfitriaoId: "",
      diaSemana: "",
      hora: "",
      endereco: "",
      activa: true,
      ...inicial,
    },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarCelulaAction(valores as unknown as CriarCelulaInput)
        : await actualizarCelulaAction({
            ...(valores as unknown as ActualizarCelulaInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/celulas/${res.data.id}`);
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
          <CardTitle>Dados da célula</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome *" htmlFor="nome" erro={errors.nome?.message} className="sm:col-span-2">
            <Input id="nome" placeholder="Célula Central" {...register("nome")} />
          </Campo>
          <Campo label="Líder" htmlFor="liderId">
            <SelectNativo id="liderId" {...register("liderId")}>
              <option value="">—</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nomeCompleto}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Anfitrião" htmlFor="anfitriaoId">
            <SelectNativo id="anfitriaoId" {...register("anfitriaoId")}>
              <option value="">—</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nomeCompleto}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Dia de reunião" htmlFor="diaSemana">
            <SelectNativo id="diaSemana" {...register("diaSemana")}>
              <option value="">—</option>
              {Object.entries(DIA_SEMANA).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Hora" htmlFor="hora">
            <Input id="hora" type="time" {...register("hora")} />
          </Campo>
          <Campo label="Endereço" htmlFor="endereco" className="sm:col-span-2">
            <Textarea id="endereco" rows={2} {...register("endereco")} />
          </Campo>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="size-4 rounded border-input" {...register("activa")} />
            Célula activa
          </label>
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
              ? "Criar célula"
              : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
