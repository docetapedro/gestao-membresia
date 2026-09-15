import { PrismaClient } from "@prisma/client";
import { criarHashSenha } from "../src/lib/auth/senha";

/**
 * Cria ou repõe o utilizador administrador com uma senha conhecida.
 * Usar quando o login falha por o admin não existir na BD-alvo (ex.: Neon)
 * ou por a senha estar desconhecida. Aponta o DATABASE_URL à BD pretendida
 * antes de correr (ver README / memória: Neon usa a ligação UNPOOLED).
 */
const prisma = new PrismaClient();

const ADMIN_EMAIL = "docetapedro@gmail.com";
const ADMIN_SENHA = "Koinonia@2026";

async function main() {
  // Diagnóstico: a que base de dados nos ligámos?
  const url = process.env.DATABASE_URL ?? "(DATABASE_URL não definido → usou .env)";
  const motor = url.startsWith("postgres") ? "PostgreSQL (Neon?)" : url.startsWith("mysql") ? "MySQL (local?)" : "desconhecido";
  const hostMasc = url.replace(/:\/\/[^@]*@/, "://***@").split("?")[0];
  console.log(`→ BD alvo: ${motor}`);
  console.log(`→ URL: ${hostMasc}`);
  const totalUtil = await prisma.utilizador.count();
  console.log(`→ Utilizadores existentes antes: ${totalUtil}`);

  let igreja = await prisma.igreja.findFirst();
  if (!igreja) {
    igreja = await prisma.igreja.create({
      data: { nome: "Igreja Koinonia", provincia: "Luanda", municipio: "Luanda", moeda: "AOA" },
    });
    console.log(`✔ Igreja criada: ${igreja.nome}`);
  }

  const hashSenha = await criarHashSenha(ADMIN_SENHA);
  const existente = await prisma.utilizador.findFirst({ where: { email: ADMIN_EMAIL } });

  if (existente) {
    await prisma.utilizador.update({
      where: { id: existente.id },
      data: { hashSenha, activo: true, papel: "ADMIN", igrejaId: igreja.id },
    });
    console.log(`✔ Senha do admin reposta: ${ADMIN_EMAIL} / ${ADMIN_SENHA}`);
  } else {
    await prisma.utilizador.create({
      data: {
        igrejaId: igreja.id,
        nome: "Administrador",
        email: ADMIN_EMAIL,
        hashSenha,
        papel: "ADMIN",
        activo: true,
      },
    });
    console.log(`✔ Admin criado: ${ADMIN_EMAIL} / ${ADMIN_SENHA}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
