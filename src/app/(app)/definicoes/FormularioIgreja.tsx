"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { actualizarIgrejaAction } from "./actions";
import type { IgrejaInput } from "@/lib/validators/definicoes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Indique o nome da igreja."),
  denominacao: z.string().optional(),
  nif: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  endereco: z.string().optional(),
  moeda: z.string().trim().min(1).default("AOA"),
});
type FormValores = z.input<typeof formSchema>;

export function FormularioIgreja({ inicial }: { inicial: FormValores }) {
  const router = useRouter();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: inicial,
  });

  async function aoSubmeter(valores: FormValores) {
    setMensagem(null);
    const res = await actualizarIgrejaAction(valores as unknown as IgrejaInput);
    if (res.ok) {
      setMensagem({ tipo: "ok", texto: "Dados da igreja guardados." });
      router.refresh();
      return;
    }
    if (res.campos) {
      for (const [campo, msg] of Object.entries(res.campos)) {
        setError(campo as keyof FormValores, { message: msg });
      }
    }
    setMensagem({ tipo: "erro", texto: res.erro });
  }

  const e = errors;

  return (
    <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nome" className="mb-1.5 block">Nome da igreja *</Label>
            <Input id="nome" {...register("nome")} />
            {e.nome ? <p className="mt-1 text-xs text-destructive">{e.nome.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="denominacao" className="mb-1.5 block">Denominação</Label>
            <Input id="denominacao" {...register("denominacao")} />
          </div>
          <div>
            <Label htmlFor="nif" className="mb-1.5 block">NIF</Label>
            <Input id="nif" {...register("nif")} />
          </div>
          <div>
            <Label htmlFor="telefone" className="mb-1.5 block">Telefone</Label>
            <Input id="telefone" placeholder="923 456 789" {...register("telefone")} />
            {e.telefone ? <p className="mt-1 text-xs text-destructive">{e.telefone.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="email" className="mb-1.5 block">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {e.email ? <p className="mt-1 text-xs text-destructive">{e.email.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="provincia" className="mb-1.5 block">Província</Label>
            <Input id="provincia" {...register("provincia")} />
          </div>
          <div>
            <Label htmlFor="municipio" className="mb-1.5 block">Município</Label>
            <Input id="municipio" {...register("municipio")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="endereco" className="mb-1.5 block">Endereço</Label>
            <Textarea id="endereco" rows={2} {...register("endereco")} />
          </div>
          <div>
            <Label htmlFor="moeda" className="mb-1.5 block">Moeda</Label>
            <Input id="moeda" {...register("moeda")} className="max-w-[120px]" />
          </div>
        </CardContent>
      </Card>

      {mensagem ? (
        <p className={mensagem.tipo === "ok" ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
          {mensagem.texto}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "A guardar…" : "Guardar alterações"}
      </Button>
    </form>
  );
}
