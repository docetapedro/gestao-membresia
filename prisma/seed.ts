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

  // 3) Membros de amostra (só se ainda não houver nenhum).
  const totalMembros = await prisma.membro.count({ where: { igrejaId: igreja.id } });
  if (totalMembros === 0) {
    const amostra = [
      { nomeCompleto: "Manuel João Cardoso", sexo: "MASCULINO", estado: "MEMBRO", telefone: "+244923111222", provincia: "Luanda", municipio: "Belas", dataAdmissao: new Date() },
      { nomeCompleto: "Ana Paula dos Santos", sexo: "FEMININO", estado: "MEMBRO", telefone: "+244924333444", provincia: "Luanda", municipio: "Viana" },
      { nomeCompleto: "Joaquim Pedro Neto", sexo: "MASCULINO", estado: "EM_ACOMPANHAMENTO", telefone: "+244925555666", provincia: "Luanda", municipio: "Cazenga" },
      { nomeCompleto: "Esperança Domingos", sexo: "FEMININO", estado: "VISITANTE", provincia: "Luanda", municipio: "Luanda" },
    ] as const;

    let i = 1;
    for (const m of amostra) {
      await prisma.membro.create({
        data: { igrejaId: igreja.id, numeroMembro: String(i).padStart(4, "0"), ...m },
      });
      i++;
    }
    console.log(`✔ ${amostra.length} membros de amostra criados`);
  } else {
    console.log(`• Já existem ${totalMembros} membros`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
