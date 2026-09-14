"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { entrar, type EstadoLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ESTADO_INICIAL: EstadoLogin = {};

export default function LoginPage() {
  const [estado, accao, pendente] = useActionState(entrar, ESTADO_INICIAL);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sessão</CardTitle>
        <CardDescription>Introduza as suas credenciais para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accao} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome@igreja.ao"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {estado.erro ? (
            <p className="text-sm text-destructive" role="alert">
              {estado.erro}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "A entrar…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
