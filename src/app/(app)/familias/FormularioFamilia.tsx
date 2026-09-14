"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { criarFamiliaAction, actualizarFamiliaAction } from "./actions";
import type {
  CriarFamiliaInput,
  ActualizarFamiliaInput,
} from "@/lib/validators/familias";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto."),
  endereco: z.string().optional(),
});

type FormValores = z.input<typeof formSchema>;

interface Props {
  modo: "criar" | "editar";
  id?: string;
  inicial?: Partial<FormValores>;
}

export function FormularioFamilia({ modo, id, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", endereco: "", ...inicial },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarFamiliaAction(valores as unknown as CriarFamiliaInput)
        : await actualizarFamiliaAction({
            ...(valores as unknown as ActualizarFamiliaInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/familias/${res.data.id}`);
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
          <CardTitle>Dados da família</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="nome" className="mb-1.5 block">
              Nome da família *
            </Label>
            <Input id="nome" placeholder="Família Pedro" {...register("nome")} />
            {errors.nome ? (
              <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="endereco" className="mb-1.5 block">
              Endereço
            </Label>
            <Textarea id="endereco" rows={2} {...register("endereco")} />
          </div>
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
              ? "Criar família"
              : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
