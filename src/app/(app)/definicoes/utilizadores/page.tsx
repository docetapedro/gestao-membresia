import Link from "next/link";
import { UserPlus, Pencil } from "lucide-react";
import { getTenantContext } from "@/lib/auth/sessao";
import { listarUtilizadores } from "@/services/utilizadores.service";
import { PAPEL } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UtilizadoresPage() {
  const ctx = await getTenantContext();
  const utilizadores = await listarUtilizadores(ctx);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {utilizadores.length} utilizador{utilizadores.length === 1 ? "" : "es"}
        </p>
        <Button asChild>
          <Link href="/definicoes/utilizadores/novo">
            <UserPlus className="size-4" />
            Novo utilizador
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilizadores.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.nome}
                  {u.id === ctx.utilizadorId ? (
                    <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                  ) : null}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{PAPEL[u.papel]}</TableCell>
                <TableCell>
                  {u.activo ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="muted">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/definicoes/utilizadores/${u.id}/editar`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
