"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Sexo,
  EstadoCivil,
  TipoDocumento,
  EstadoMembro,
  FormaAdmissao,
  PapelFamiliar,
} from "@prisma/client";
import {
  SEXO,
  ESTADO_CIVIL,
  TIPO_DOCUMENTO,
  ESTADO_MEMBRO,
  FORMA_ADMISSAO,
  PAPEL_FAMILIAR,
} from "@/lib/rotulos";
import { criarMembroAction, actualizarMembroAction } from "./actions";
import type {
  CriarMembroInput,
  ActualizarMembroInput,
} from "@/lib/validators/membros";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Schema do formulário (valores em string; o servidor faz a validação final).
const formSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Nome demasiado curto."),
  nomePreferido: z.string().optional(),
  sexo: z.string().min(1, "Indique o sexo.").pipe(z.nativeEnum(Sexo)),
  dataNascimento: z.string().optional(),
  estadoCivil: z.string().optional(),
  documentoTipo: z.string().optional(),
  documentoNumero: z.string().optional(),
  telefone: z.string().optional(),
  telefoneAlt: z.string().optional(),
  email: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  profissao: z.string().optional(),
  estado: z.string().min(1, "Indique o estado.").pipe(z.nativeEnum(EstadoMembro)),
  dataConversao: z.string().optional(),
  dataBaptismo: z.string().optional(),
  localBaptismo: z.string().optional(),
  dataAdmissao: z.string().optional(),
  formaAdmissao: z.string().optional(),
  igrejaOrigem: z.string().optional(),
  familiaId: z.string().optional(),
  papelFamiliar: z.string().optional(),
  celulaId: z.string().optional(),
  observacoes: z.string().optional(),
  consentimentoDados: z.boolean().default(false),
});

type FormValores = z.input<typeof formSchema>;

export interface OpcoesFormulario {
  celulas: Array<{ id: string; nome: string }>;
  familias: Array<{ id: string; nome: string }>;
}

interface Props {
  opcoes: OpcoesFormulario;
  modo: "criar" | "editar";
  id?: string;
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

const VAZIOS: FormValores = {
  nomeCompleto: "",
  sexo: "" as Sexo,
  estado: "MEMBRO",
  consentimentoDados: false,
};

export function FormularioMembro({ opcoes, modo, id, inicial }: Props) {
  const router = useRouter();
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValores>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...VAZIOS, ...inicial },
  });

  async function aoSubmeter(valores: FormValores) {
    setErroGlobal(null);
    const res =
      modo === "criar"
        ? await criarMembroAction(valores as unknown as CriarMembroInput)
        : await actualizarMembroAction({
            ...(valores as unknown as ActualizarMembroInput),
            id: id!,
          });

    if (res.ok) {
      router.push(`/membros/${res.data.id}`);
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
    <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome completo *" htmlFor="nomeCompleto" erro={e.nomeCompleto?.message} className="sm:col-span-2">
            <Input id="nomeCompleto" {...register("nomeCompleto")} />
          </Campo>
          <Campo label="Nome preferido" htmlFor="nomePreferido">
            <Input id="nomePreferido" {...register("nomePreferido")} />
          </Campo>
          <Campo label="Sexo *" htmlFor="sexo" erro={e.sexo?.message}>
            <SelectNativo id="sexo" {...register("sexo")}>
              <option value="">Seleccione…</option>
              {Object.entries(SEXO).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Data de nascimento" htmlFor="dataNascimento">
            <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
          </Campo>
          <Campo label="Estado civil" htmlFor="estadoCivil">
            <SelectNativo id="estadoCivil" {...register("estadoCivil")}>
              <option value="">—</option>
              {Object.entries(ESTADO_CIVIL).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Tipo de documento" htmlFor="documentoTipo">
            <SelectNativo id="documentoTipo" {...register("documentoTipo")}>
              <option value="">—</option>
              {Object.entries(TIPO_DOCUMENTO).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Nº do documento" htmlFor="documentoNumero">
            <Input id="documentoNumero" {...register("documentoNumero")} />
          </Campo>
          <Campo label="Profissão" htmlFor="profissao">
            <Input id="profissao" {...register("profissao")} />
          </Campo>
        </CardContent>
      </Card>

      {/* Contacto e morada */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto e morada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Telefone" htmlFor="telefone" erro={e.telefone?.message}>
            <Input id="telefone" placeholder="923 456 789" {...register("telefone")} />
          </Campo>
          <Campo label="Telefone alternativo" htmlFor="telefoneAlt" erro={e.telefoneAlt?.message}>
            <Input id="telefoneAlt" {...register("telefoneAlt")} />
          </Campo>
          <Campo label="Email" htmlFor="email" erro={e.email?.message} className="sm:col-span-2">
            <Input id="email" type="email" {...register("email")} />
          </Campo>
          <Campo label="Província" htmlFor="provincia">
            <Input id="provincia" {...register("provincia")} />
          </Campo>
          <Campo label="Município" htmlFor="municipio">
            <Input id="municipio" {...register("municipio")} />
          </Campo>
          <Campo label="Bairro" htmlFor="bairro">
            <Input id="bairro" {...register("bairro")} />
          </Campo>
          <Campo label="Endereço" htmlFor="endereco" className="sm:col-span-2">
            <Textarea id="endereco" rows={2} {...register("endereco")} />
          </Campo>
        </CardContent>
      </Card>

      {/* Vida eclesial */}
      <Card>
        <CardHeader>
          <CardTitle>Vida eclesial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Estado *" htmlFor="estado" erro={e.estado?.message}>
            <SelectNativo id="estado" {...register("estado")}>
              {Object.entries(ESTADO_MEMBRO).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Forma de admissão" htmlFor="formaAdmissao">
            <SelectNativo id="formaAdmissao" {...register("formaAdmissao")}>
              <option value="">—</option>
              {Object.entries(FORMA_ADMISSAO).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Data de conversão" htmlFor="dataConversao">
            <Input id="dataConversao" type="date" {...register("dataConversao")} />
          </Campo>
          <Campo label="Data de admissão" htmlFor="dataAdmissao">
            <Input id="dataAdmissao" type="date" {...register("dataAdmissao")} />
          </Campo>
          <Campo label="Data de baptismo" htmlFor="dataBaptismo">
            <Input id="dataBaptismo" type="date" {...register("dataBaptismo")} />
          </Campo>
          <Campo label="Local do baptismo" htmlFor="localBaptismo">
            <Input id="localBaptismo" {...register("localBaptismo")} />
          </Campo>
          <Campo label="Igreja de origem" htmlFor="igrejaOrigem" className="sm:col-span-2">
            <Input id="igrejaOrigem" {...register("igrejaOrigem")} />
          </Campo>
        </CardContent>
      </Card>

      {/* Família e célula */}
      <Card>
        <CardHeader>
          <CardTitle>Família e célula</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Família" htmlFor="familiaId">
            <SelectNativo id="familiaId" {...register("familiaId")}>
              <option value="">—</option>
              {opcoes.familias.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Papel na família" htmlFor="papelFamiliar">
            <SelectNativo id="papelFamiliar" {...register("papelFamiliar")}>
              <option value="">—</option>
              {Object.entries(PAPEL_FAMILIAR).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Célula" htmlFor="celulaId" className="sm:col-span-2">
            <SelectNativo id="celulaId" {...register("celulaId")}>
              <option value="">—</option>
              {opcoes.celulas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </SelectNativo>
          </Campo>
          <Campo label="Observações" htmlFor="observacoes" className="sm:col-span-2">
            <Textarea id="observacoes" rows={3} {...register("observacoes")} />
          </Campo>
        </CardContent>
      </Card>

      {/* Consentimento (Lei 22/11) */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input"
              {...register("consentimentoDados")}
            />
            <span>
              O membro consente o tratamento dos seus dados pessoais para fins de
              gestão da igreja (Lei 22/11 — Protecção de Dados Pessoais).
            </span>
          </label>
        </CardContent>
      </Card>

      {erroGlobal ? (
        <p className="text-sm text-destructive" role="alert">{erroGlobal}</p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "A guardar…" : modo === "criar" ? "Criar membro" : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
