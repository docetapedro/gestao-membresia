import sharp from "sharp";
import { prismaComTenant } from "@/lib/tenant/prisma-tenant";
import { exigir } from "@/lib/auth/permissoes";
import { registarAuditoria } from "@/lib/auditoria";
import { ErroDeNegocio } from "@/lib/acoes/erros";
import type { TenantContext } from "@/lib/tenant/context";

const MIMES_ACEITES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANHO_MAX = 5 * 1024 * 1024; // 5 MB
const LADO = 400;

function urlFoto(membroId: string) {
  return `/api/membros/${membroId}/foto`;
}

/** Redimensiona e guarda a fotografia do membro (bytes na BD). */
export async function guardarFotoMembro(
  ctx: TenantContext,
  membroId: string,
  ficheiro: { buffer: Buffer; mime: string; tamanho: number },
) {
  exigir(ctx, "actualizar", "membros");
  const db = prismaComTenant(ctx);

  if (!MIMES_ACEITES.has(ficheiro.mime)) {
    throw new ErroDeNegocio("Formato inválido. Use JPEG, PNG ou WebP.");
  }
  if (ficheiro.tamanho > TAMANHO_MAX) {
    throw new ErroDeNegocio("Imagem demasiado grande (máximo 5 MB).");
  }

  const membro = await db.membro.findFirst({ where: { id: membroId }, select: { id: true } });
  if (!membro) throw new ErroDeNegocio("Membro não encontrado.");

  let dados: Uint8Array<ArrayBuffer>;
  try {
    const saida = await sharp(ficheiro.buffer)
      .rotate() // corrige orientação a partir do EXIF
      .resize(LADO, LADO, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
    dados = Uint8Array.from(saida);
  } catch {
    throw new ErroDeNegocio("Não foi possível processar a imagem.");
  }

  const existente = await db.fotoMembro.findFirst({
    where: { membroId },
    select: { id: true },
  });
  if (existente) {
    await db.fotoMembro.updateMany({
      where: { membroId },
      data: { dados, mime: "image/webp" },
    });
  } else {
    await db.fotoMembro.create({
      data: { igrejaId: ctx.igrejaId, membroId, dados, mime: "image/webp" },
    });
  }

  await db.membro.updateMany({ where: { id: membroId }, data: { fotoUrl: urlFoto(membroId) } });
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    depois: { foto: "actualizada" },
  });

  return { fotoUrl: urlFoto(membroId) };
}

/** Remove a fotografia do membro. */
export async function removerFotoMembro(ctx: TenantContext, membroId: string) {
  exigir(ctx, "actualizar", "membros");
  const db = prismaComTenant(ctx);
  await db.fotoMembro.deleteMany({ where: { membroId } });
  await db.membro.updateMany({ where: { id: membroId }, data: { fotoUrl: null } });
  await registarAuditoria(db, ctx, {
    accao: "ACTUALIZAR",
    entidade: "Membro",
    entidadeId: membroId,
    depois: { foto: "removida" },
  });
  return { fotoUrl: null };
}

/** Bytes da fotografia para a rota de servir a imagem. */
export async function obterFotoMembro(
  ctx: TenantContext,
  membroId: string,
): Promise<{ dados: Buffer; mime: string } | null> {
  exigir(ctx, "ler", "membros");
  const db = prismaComTenant(ctx);
  const foto = await db.fotoMembro.findFirst({
    where: { membroId },
    select: { dados: true, mime: true },
  });
  if (!foto) return null;
  return { dados: Buffer.from(foto.dados), mime: foto.mime };
}
