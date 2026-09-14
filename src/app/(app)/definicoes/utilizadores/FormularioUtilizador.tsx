"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Papel } from "@prisma/client";
import { PAPEL } from "@/lib/rotulos";
import {
  criarUtilizadorAction,
  actualizarUtilizadorAction,
} from "../actions";
import type {
  CriarUtilizadorInput,
  ActualizarUtilizadorInput,
} from "@/lib/validators/definicoes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function criarSchema(modo: "criar" | "editar") {
  const senha =
    modo === "criar"
      ? z.string().min(8, "A senha deve ter pelo menos 8 caracteres.")
      : z
          .string()
          .optional()
          .refine((v) => !v || v.length >= 8, "A senha deve ter pelo menos 8 caracteres.");
  return z.object({
    nome: z.string().trim().min(3, "Nome demasiado curto."),
    email: z.string().trim().email("Email inválido."),
    papel: z.string().min(1, "Indique o papel.").pipe(z.nativeEnum(Papel)),
    senha,
    activo: z.boolean().default(true),
  });
}

type FormValores = {
  nome: string;
  email: string;
  papel: string;
  senha?: string;
  activo: boolean;
};

interface Props {
  modo: "criar" | "editar";
  id?: string;
  inicial?: Partial<FormValores>;
}

export function FormularioUtilizador({ modo, id, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(criarSchema(modo)),
    defaultValues: {
      nome: "",
      email: "",
      papel: "",
      senha: "",
      activo: true,
      ...inicial,
    },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarUtilizadorAction(valores as unknown as CriarUtilizadorInput)
        : await actualizarUtilizadorAction({
            ...(valores as unknown as ActualizarUtilizadorInput),
            id: id!,
          });

    if (res.ok) {
      router.push("/definicoes/utilizadores");
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

  const e = errors;

  return (
    <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nome" className="mb-1.5 block">Nome *</Label>
            <Input id="nome" {...register("nome")} />
            {e.nome ? <p className="mt-1 text-xs text-destructive">{e.nome.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="email" className="mb-1.5 block">Email *</Label>
            <Input id="email" type="email" {...register("email")} />
            {e.email ? <p className="mt-1 text-xs text-destructive">{e.email.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="papel" className="mb-1.5 block">Papel *</Label>
            <SelectNativo id="papel" {...register("papel")}>
              <option value="">Seleccione…</option>
              {Object.entries(PAPEL).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
            {e.papel ? <p className="mt-1 text-xs text-destructive">{e.papel.message}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="senha" className="mb-1.5 block">
              {modo === "criar" ? "Senha *" : "Nova senha"}
            </Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              placeholder={modo === "editar" ? "Deixe em branco para manter a actual" : ""}
              {...register("senha")}
            />
            {e.senha ? <p className="mt-1 text-xs text-destructive">{e.senha.message}</p> : null}
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="size-4 rounded border-input" {...register("activo")} />
            Conta activa (pode iniciar sessão)
          </label>
        </CardContent>
      </Card>

      {erroGlobal ? <p className="text-sm text-destructive" role="alert">{erroGlobal}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "A guardar…" : modo === "criar" ? "Criar utilizador" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
