"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { TipoContribuicao, MetodoPagamento } from "@prisma/client";
import { TIPO_CONTRIBUICAO, METODO_PAGAMENTO, TIPO_CULTO } from "@/lib/rotulos";
import { data as fmtData } from "@/lib/formato";
import { criarContribuicaoAction } from "./actions";
import type { CriarContribuicaoInput } from "@/lib/validators/contribuicoes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/ui/select-nativo";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  membroId: z.string().optional(),
  tipo: z.string().min(1, "Indique o tipo.").pipe(z.nativeEnum(TipoContribuicao)),
  valor: z.string().min(1, "Indique o valor."),
  metodo: z.string().min(1, "Indique o método.").pipe(z.nativeEnum(MetodoPagamento)),
  data: z.string().min(1, "Indique a data."),
  referencia: z.string().optional(),
  cultoId: z.string().optional(),
});

type FormValores = z.input<typeof formSchema>;

interface Opcoes {
  membros: Array<{ id: string; numeroMembro: string; nomeCompleto: string }>;
  cultos: Array<{ id: string; tipo: TipoContribuicao | string; data: Date; tema: string | null }>;
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

export function FormularioContribuicao({ opcoes }: { opcoes: Opcoes }) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membroId: "",
      tipo: "" as TipoContribuicao,
      valor: "",
      metodo: "NUMERARIO",
      data: hoje,
      referencia: "",
      cultoId: "",
    },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res = await criarContribuicaoAction(valores as unknown as CriarContribuicaoInput);
    if (res.ok) {
      router.push(`/contribuicoes/${res.data.id}`);
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
          <CardTitle>Dados da contribuição</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Membro" htmlFor="membroId" className="sm:col-span-2">
            <SelectNativo id="membroId" {...register("membroId")}>
              <option value="">Oferta anónima (sem membro)</option>
              {opcoes.membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nomeCompleto} (Nº {m.numeroMembro})
                </option>
              ))}
            </SelectNativo>
          </Campo>

          <Campo label="Tipo *" htmlFor="tipo" erro={errors.tipo?.message}>
            <SelectNativo id="tipo" {...register("tipo")}>
              <option value="">Seleccione…</option>
              {Object.entries(TIPO_CONTRIBUICAO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>

          <Campo label="Valor (Kz) *" htmlFor="valor" erro={errors.valor?.message}>
            <Input
              id="valor"
              inputMode="decimal"
              placeholder="0,00"
              {...register("valor")}
            />
          </Campo>

          <Campo label="Método *" htmlFor="metodo" erro={errors.metodo?.message}>
            <SelectNativo id="metodo" {...register("metodo")}>
              {Object.entries(METODO_PAGAMENTO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </SelectNativo>
          </Campo>

          <Campo label="Data *" htmlFor="data" erro={errors.data?.message}>
            <Controller
              control={control}
              name="data"
              render={({ field }) => (
                <DatePicker id="data" value={field.value} onChange={field.onChange} />
              )}
            />
          </Campo>

          <Campo label="Referência" htmlFor="referencia">
            <Input id="referencia" placeholder="Nº do talão / transferência" {...register("referencia")} />
          </Campo>

          <Campo label="Culto (opcional)" htmlFor="cultoId">
            <SelectNativo id="cultoId" {...register("cultoId")}>
              <option value="">—</option>
              {opcoes.cultos.map((c) => (
                <option key={c.id} value={c.id}>
                  {fmtData(c.data)} · {TIPO_CULTO[c.tipo as keyof typeof TIPO_CULTO] ?? c.tipo}
                  {c.tema ? ` — ${c.tema}` : ""}
                </option>
              ))}
            </SelectNativo>
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
          {isSubmitting ? "A guardar…" : "Registar contribuição"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
