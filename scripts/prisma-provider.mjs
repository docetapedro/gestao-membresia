// Deriva o `provider` do datasource do Prisma a partir do prefixo do DATABASE_URL.
//   mysql://...       → provider = "mysql"      (dev local, XAMPP)
//   postgres://... ou postgresql://... → provider = "postgresql"  (produção, Vercel + Neon)
//
// Mantém um único schema.prisma portável como fonte de verdade e evita
// divergência de provider entre ambientes (ver PROJECTO-gestao-igreja.md, secção 2).
//
// Corre antes de: dev, build, prisma generate, prisma db push.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const caminhoSchema = join(raiz, "prisma", "schema.prisma");

function carregarEnv() {
  // Lê DATABASE_URL do ambiente ou do .env (sem dependências externas).
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(raiz, ".env"), "utf8");
    const linha = env
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith("DATABASE_URL"));
    if (!linha) return "";
    return linha.slice(linha.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

const url = carregarEnv();
let provider;
if (url.startsWith("mysql://")) provider = "mysql";
else if (url.startsWith("postgres://") || url.startsWith("postgresql://"))
  provider = "postgresql";
else {
  console.warn(
    `[prisma-provider] DATABASE_URL ausente ou desconhecido ("${url.slice(0, 20)}"). Provider inalterado.`,
  );
  process.exit(0);
}

let schema = readFileSync(caminhoSchema, "utf8");
const atual = schema.match(/provider\s*=\s*"([^"]+)"/);
if (atual && atual[1] === provider) {
  process.exit(0); // já está correcto
}

schema = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"[^"]+"/s,
  `$1"${provider}"`,
);
writeFileSync(caminhoSchema, schema);
console.log(`[prisma-provider] provider do datasource definido para "${provider}".`);
