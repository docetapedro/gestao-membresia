"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { criarMinisterioAction, actualizarMinisterioAction } from "./actions";
import type {
  CriarMinisterioInput,
  ActualizarMinisterioInput,
} from "@/lib/validators/ministerios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto."),
  descricao: z.string().optional(),
  liderId: z.string().optional(),
  activo: z.boolean().default(true),
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

export function FormularioMinisterio({ modo, id, membros, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", descricao: "", liderId: "", activo: true, ...inicial },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarMinisterioAction(valores as unknown as CriarMinisterioInput)
        : await actualizarMinisterioAction({
            ...(valores as unknown as ActualizarMinisterioInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/ministerios/${res.data.id}`);
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
          <CardTitle>Dados do departamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="nome" className="mb-1.5 block">
              Nome *
            </Label>
            <Input id="nome" placeholder="Louvor" {...register("nome")} />
            {errors.nome ? (
              <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="liderId" className="mb-1.5 block">
              Líder
            </Label>
            <SelectNativo id="liderId" {...register("liderId")}>
              <option value="">—</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nomeCompleto}
                </option>
              ))}
            </SelectNativo>
          </div>
          <div>
            <Label htmlFor="descricao" className="mb-1.5 block">
              Descrição
            </Label>
            <Textarea id="descricao" rows={3} {...register("descricao")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 rounded border-input" {...register("activo")} />
            Departamento activo
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
              ? "Criar departamento"
              : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
