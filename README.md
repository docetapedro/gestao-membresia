# Koinonia — Gestão de Membros

Aplicação web de gestão para igrejas (Angola): membros, células, ministérios,
presenças, contribuições, eventos e relatórios.

Documento de arquitectura (contexto permanente): [`files/PROJECTO-gestao-igreja.md`](files/PROJECTO-gestao-igreja.md).

## Stack

Next.js (App Router) + TypeScript · Tailwind + shadcn/ui · Prisma · Auth.js v5 ·
Zod · MySQL (dev) / PostgreSQL (produção).

## Arranque local

1. **Iniciar o MySQL** no painel de controlo do XAMPP.
2. Copiar variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   O `.env` já vem apontado para o MySQL local do XAMPP
   (`mysql://root:@127.0.0.1:3306/gestao_membresia`). Ajuste se necessário.
3. Instalar dependências e criar o esquema:
   ```bash
   npm install
   npm run db:push      # cria as tabelas (usa prisma db push)
   npm run db:seed      # cria a igreja e o utilizador administrador
   ```
4. Arrancar:
   ```bash
   npm run dev
   ```
   Abrir http://localhost:3000

### Credenciais de arranque (seed)

- **Email:** docetapedro@gmail.com
- **Senha:** Koinonia@2026

## Scripts

| Script | Função |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Aplica o schema à base de dados |
| `npm run db:seed` | Popula igreja + admin |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | Verificação de tipos |
| `npm run test` | Testes (Vitest) |

## Base de dados: dev vs produção

O `provider` do Prisma é derivado do `DATABASE_URL` por `scripts/prisma-provider.mjs`
(`mysql://` local, `postgres://` na Vercel). Ver Decisão **D1** no documento de
arquitectura.
