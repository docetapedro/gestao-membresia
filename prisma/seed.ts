import { PrismaClient } from "@prisma/client";
import { criarHashSenha } from "../src/lib/auth/senha";

const prisma = new PrismaClient();

// Credenciais de arranque (Fase 1 — uma única igreja).
const ADMIN_EMAIL = "docetapedro@gmail.com";
const ADMIN_SENHA = "Koinonia@2026";

async function main() {
  // 1) Igreja (tenant único nesta fase).
  let igreja = await prisma.igreja.findFirst();
  if (!igreja) {
    igreja = await prisma.igreja.create({
      data: {
        nome: "Igreja Koinonia",
        provincia: "Luanda",
        municipio: "Luanda",
        moeda: "AOA",
      },
    });
    console.log(`✔ Igreja criada: ${igreja.nome} (${igreja.id})`);
  } else {
    console.log(`• Igreja já existe: ${igreja.nome}`);
  }

  // 2) Utilizador administrador.
  const existente = await prisma.utilizador.findFirst({
    where: { igrejaId: igreja.id, email: ADMIN_EMAIL },
  });
  if (!existente) {
    const hashSenha = await criarHashSenha(ADMIN_SENHA);
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
  } else {
    console.log(`• Admin já existe: ${ADMIN_EMAIL}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
