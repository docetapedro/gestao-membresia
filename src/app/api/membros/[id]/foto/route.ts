import { getTenantContextOpcional } from "@/lib/auth/sessao";
import { obterFotoMembro } from "@/services/fotos.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTenantContextOpcional();
  if (!ctx) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const foto = await obterFotoMembro(ctx, id);
  if (!foto) return new Response("Sem fotografia", { status: 404 });

  return new Response(new Uint8Array(foto.dados), {
    headers: {
      "Content-Type": foto.mime,
      // Privado: fotografia de membro é dado pessoal.
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
