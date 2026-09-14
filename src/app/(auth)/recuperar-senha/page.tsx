import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          O envio de email de recuperação será activado em breve.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Por agora, contacte o administrador da igreja para repor a sua senha.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          ← Voltar ao início de sessão
        </Link>
      </CardContent>
    </Card>
  );
}
