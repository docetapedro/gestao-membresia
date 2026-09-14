# Sistema de Gestão de Membros para Igrejas

> Documento base do projecto. Serve de contexto permanente ao Claude Code.
> Sempre que uma decisão de arquitectura for tomada ou alterada, actualizar este ficheiro.

---

## 1. Objectivo

Aplicação web de gestão para igrejas: cadastro e acompanhamento de membros, estrutura
organizacional (células, ministérios), presenças, contribuições financeiras (dízimos e
ofertas), eventos e relatórios.

Contexto: Angola. Moeda AOA, telefones +244, documentos de identificação nacionais,
divisão administrativa província/município/bairro.

**Fase actual:** uma única igreja em produção.
**Requisito arquitectural:** o modelo de dados e todas as queries devem estar preparados
para multi-tenant desde o primeiro dia (ver secção 4). Não haverá refactor posterior.

**Interface:** apenas back-office web (administração). Sem app móvel e sem portal público
do membro nesta fase — mas a lógica de negócio fica em camada separada da UI para que
uma API pública possa ser exposta mais tarde sem reescrita.

---

## 2. Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript strict |
| UI | Tailwind CSS + shadcn/ui |
| Base de dados | MySQL em dev (XAMPP) · PostgreSQL em produção (Vercel + Neon) — ver Decisões |
| ORM | Prisma (schema portável; provider derivado do DATABASE_URL) |
| Autenticação | Auth.js (NextAuth v5) — credenciais + sessão JWT (ver Decisões) |
| Validação | Zod (partilhado entre cliente e servidor) |
| Formulários | react-hook-form + resolver Zod |
| Tabelas | TanStack Table |
| Gráficos | Recharts |
| Datas | date-fns, locale pt |
| Testes | Vitest (unitário) + Playwright (e2e nos fluxos críticos) |
| Deploy | Docker (VPS próprio) — evitar dependências exclusivas de plataforma |

Regras de stack:
- Server Components por omissão. `"use client"` apenas quando há estado ou eventos.
- Mutations via **Server Actions**, sempre com validação Zod no servidor.
- Nenhuma query Prisma dentro de componentes de UI — só na camada de serviços.

### Decisões de arquitectura (registo)

**D1 — Motor de base de dados: MySQL em dev, PostgreSQL em produção.**
Decisão do dono do projecto (2026-09-14). Para conviver com um único schema:
- `prisma/schema.prisma` usa apenas tipos portáveis entre os dois motores.
- `scripts/prisma-provider.mjs` define o `provider` do datasource a partir do
  prefixo do `DATABASE_URL` (`mysql://` → mysql, `postgres://` → postgresql).
  Corre automaticamente antes de `dev`, `build`, `generate` e `db push`.
- **Esquema aplicado com `prisma db push`** (não `migrate`), porque as migrations
  geram SQL específico de cada motor. Compromisso aceite para evitar divergência.
  Risco conhecido: sem histórico de migrations versionado.

**D2 — Sessão JWT em vez de sessão em base de dados.**
O provider de credenciais do Auth.js v5 não suporta sessão em BD; usa-se JWT a
transportar `igrejaId`, `papel`, `utilizadorId` e `membroId`. Sessão em BD fica
para fase futura, caso necessária.

---

## 3. Estrutura de pastas

```
/src
  /app
    /(auth)/login
    /(app)                  # área autenticada
      /membros
      /familias
      /celulas
      /ministerios
      /presencas
      /contribuicoes
      /eventos
      /relatorios
      /definicoes           # utilizadores, papéis, dados da igreja
    /api                    # só onde Server Actions não servem (webhooks, exports)
  /lib
    /db                     # cliente Prisma
    /auth                   # config Auth.js, helpers de sessão
    /tenant                 # resolução e guarda do tenant
    /validators             # schemas Zod por domínio
  /services                 # lógica de negócio — única camada que fala com o Prisma
    membros.service.ts
    contribuicoes.service.ts
    ...
  /components
    /ui                     # shadcn
    /forms
    /tables
/prisma
  schema.prisma
  /migrations
  seed.ts
```

---

## 4. Multi-tenancy (regra não negociável)

Estratégia: **base de dados única, coluna discriminadora**.

1. Toda a tabela de domínio tem `igrejaId String` com índice, incluindo as tabelas
   filhas (não confiar apenas na relação com a tabela pai).
2. Todo o índice único é composto com `igrejaId`.
   Ex.: `@@unique([igrejaId, numeroMembro])`.
3. Nenhum serviço recebe filtros de tenant do cliente. O `igrejaId` vem **sempre** da
   sessão do servidor, através de `getTenantContext()`.
4. Assinatura obrigatória dos serviços:
   ```ts
   export async function listarMembros(ctx: TenantContext, filtros: FiltrosMembro)
   ```
   Nunca `listarMembros(igrejaId: string)` vindo de parâmetro de rota.
5. Aplicar **Prisma Client Extension** que injecta `igrejaId` em todos os `where` e
   `create` dos modelos com tenant, e lança erro se o contexto estiver ausente.
6. Teste automático que percorre o schema e falha se algum modelo de domínio não tiver
   `igrejaId`.

Na fase 1 existe um único registo em `Igreja` e a UI não expõe a troca de tenant.

---

## 5. Modelo de dados (esboço)

```prisma
model Igreja {
  id           String   @id @default(cuid())
  nome         String
  denominacao  String?
  nif          String?
  provincia    String?
  municipio    String?
  endereco     String?
  telefone     String?
  email        String?
  logoUrl      String?
  moeda        String   @default("AOA")
  criadoEm     DateTime @default(now())
}

model Membro {
  id             String   @id @default(cuid())
  igrejaId       String
  numeroMembro   String              // sequencial por igreja
  nomeCompleto   String
  nomePreferido  String?
  sexo           Sexo
  dataNascimento DateTime?
  estadoCivil    EstadoCivil?
  documentoTipo  TipoDocumento?      // BI, PASSAPORTE, CARTAO_RESIDENTE
  documentoNumero String?
  telefone       String?
  telefoneAlt    String?
  email          String?
  provincia      String?
  municipio      String?
  bairro         String?
  endereco       String?
  profissao      String?
  fotoUrl        String?

  // vida eclesial
  estado         EstadoMembro        // VISITANTE, EM_ACOMPANHAMENTO, MEMBRO, INACTIVO, TRANSFERIDO, FALECIDO
  dataConversao  DateTime?
  dataBaptismo   DateTime?
  localBaptismo  String?
  dataAdmissao   DateTime?
  formaAdmissao  FormaAdmissao?      // BAPTISMO, TRANSFERENCIA, RECONCILIACAO
  igrejaOrigem   String?
  dataSaida      DateTime?
  motivoSaida    String?

  familiaId      String?
  papelFamiliar  PapelFamiliar?
  celulaId       String?
  observacoes    String?

  criadoEm       DateTime @default(now())
  actualizadoEm  DateTime @updatedAt

  @@unique([igrejaId, numeroMembro])
  @@index([igrejaId, nomeCompleto])
  @@index([igrejaId, estado])
}

model Familia {
  id        String @id @default(cuid())
  igrejaId  String
  nome      String              // "Família Pedro"
  endereco  String?
  membros   Membro[]
}

model Celula {
  id          String @id @default(cuid())
  igrejaId    String
  nome        String
  liderId     String?           // Membro
  anfitriaoId String?
  diaSemana   Int?
  hora        String?
  endereco    String?
  activa      Boolean @default(true)
}

model Ministerio {
  id        String @id @default(cuid())
  igrejaId  String
  nome      String              // Louvor, Diaconia, Infantil...
  descricao String?
  liderId   String?
  activo    Boolean @default(true)
}

model MembroMinisterio {
  id            String @id @default(cuid())
  igrejaId      String
  membroId      String
  ministerioId  String
  funcao        String?
  desde         DateTime?
  ate           DateTime?
  @@unique([igrejaId, membroId, ministerioId, desde])
}

model Culto {
  id        String @id @default(cuid())
  igrejaId  String
  tipo      TipoCulto           // DOMINGO_MANHA, ORACAO, CELULA, ESPECIAL
  data      DateTime
  tema      String?
  pregador  String?
  @@index([igrejaId, data])
}

model Presenca {
  id        String @id @default(cuid())
  igrejaId  String
  cultoId   String
  membroId  String
  presente  Boolean @default(true)
  @@unique([igrejaId, cultoId, membroId])
}

model Contribuicao {
  id         String   @id @default(cuid())
  igrejaId   String
  membroId   String?             // nulo = oferta anónima
  tipo       TipoContribuicao    // DIZIMO, OFERTA, VOTO, MISSOES, CONSTRUCAO, OUTRO
  valor      Decimal  @db.Decimal(14, 2)
  moeda      String   @default("AOA")
  metodo     MetodoPagamento     // NUMERARIO, TPA, TRANSFERENCIA, MULTICAIXA_EXPRESS
  data       DateTime
  referencia String?
  cultoId    String?
  registadoPorId String
  anulada    Boolean  @default(false)
  motivoAnulacao String?
  criadoEm   DateTime @default(now())
  @@index([igrejaId, data])
  @@index([igrejaId, membroId])
}

model Evento {
  id        String @id @default(cuid())
  igrejaId  String
  nome      String
  inicio    DateTime
  fim       DateTime?
  local     String?
  descricao String?
}

model Utilizador {
  id        String @id @default(cuid())
  igrejaId  String
  nome      String
  email     String
  hashSenha String
  papel     Papel               // ADMIN, PASTOR, SECRETARIA, TESOURARIA, LIDER_CELULA
  activo    Boolean @default(true)
  membroId  String?             // liga a conta ao registo de membro
  @@unique([igrejaId, email])
}

model LogAuditoria {
  id            String @id @default(cuid())
  igrejaId      String
  utilizadorId  String
  accao         String           // CRIAR, ACTUALIZAR, ELIMINAR, ANULAR
  entidade      String
  entidadeId    String
  dadosAntes    Json?
  dadosDepois   Json?
  ip            String?
  criadoEm      DateTime @default(now())
  @@index([igrejaId, criadoEm])
}
```

Notas:
- Valores monetários **sempre** `Decimal(14,2)`. Nunca `Float`.
- Eliminação de membros é lógica (`estado` + `dataSaida`), nunca física.
- Contribuições não se editam nem apagam: anulam-se com motivo e regista-se nova.

---

## 6. Permissões

| Papel | Membros | Contribuições | Presenças | Relatórios | Definições |
|---|---|---|---|---|---|
| ADMIN | total | total | total | total | total |
| PASTOR | total | leitura | total | total | — |
| SECRETARIA | total | — | total | não-financeiros | — |
| TESOURARIA | leitura | total | — | financeiros | — |
| LIDER_CELULA | só a sua célula | — | só a sua célula | só a sua célula | — |

Implementar como função única `can(ctx, accao, recurso)` verificada **no servidor**,
dentro de cada Server Action. A UI esconde botões, mas nunca é a fonte de autorização.

---

## 7. Módulos e âmbito

### Fase 1 — MVP
- [ ] Autenticação, sessão, recuperação de senha
- [ ] Dados da igreja e utilizadores
- [ ] CRUD de membros com pesquisa, filtros e paginação server-side
- [ ] Fotografia do membro (upload, redimensionamento)
- [ ] Famílias e agregados
- [ ] Células e ministérios, com atribuição de membros
- [ ] Registo de cultos e marcação de presenças (lista com marcação rápida)
- [ ] Registo de contribuições + recibo imprimível
- [ ] Dashboard: total de membros, novos no mês, presença média, contribuições do mês
- [ ] Relatórios base: livro de membros, aniversariantes, contribuições por período
- [ ] Exportação Excel/PDF
- [ ] Log de auditoria

### Fase 2
- [ ] Importação de membros a partir de Excel/CSV
- [ ] Certificados (baptismo, membresia, transferência) com template
- [ ] Eventos e inscrições
- [ ] Comunicação: SMS e WhatsApp por segmento de membros
- [ ] Acompanhamento de visitantes (pipeline até membro)
- [ ] Escalas de ministério (louvor, diaconia)
- [ ] Orçamento e despesas

### Fase 3
- [ ] Activação multi-igreja: onboarding, subdomínio ou selector, facturação
- [ ] API pública + app móvel do membro
- [ ] Portal do membro (histórico de contribuições, dados pessoais)

Fora de âmbito: contabilidade completa, folha salarial, streaming.

---

## 8. Convenções

**Idioma:** todo o código, schema, rotas e UI em português (pt-PT/Angola).
Sem mistura inglês/português em nomes de variáveis.

**Datas e moeda:** apresentar `dd/MM/yyyy` e `1 234 567,89 Kz`. Guardar sempre UTC.

**Telefones:** normalizar para `+244XXXXXXXXX` na gravação; validar 9 dígitos.

**Erros:** Server Actions devolvem `{ ok: true, data }` ou `{ ok: false, erro, campos? }`.
Nunca lançar excepções para a UI.

**Listagens:** paginação, ordenação e filtros sempre no servidor. Nunca carregar tabelas
completas para o cliente.

**Commits:** conventional commits em português (`feat: registo de contribuições`).

**Testes obrigatórios em:** cálculo de totais de contribuições, isolamento de tenant,
permissões por papel.

---

## 9. Protecção de dados

Dados de filiação religiosa são categoria sensível. Em Angola aplica-se a Lei 22/11
(Protecção de Dados Pessoais).

- Consentimento registado no cadastro do membro (campo + data).
- Senhas com Argon2id.
- Log de auditoria em todo o acesso a dados financeiros e em alterações de membros.
- Exportações registadas no log, com identificação de quem exportou.
- Backup diário da base de dados, encriptado.

---

## 10. Instruções ao Claude Code

1. Começar pelo `schema.prisma` completo e pela extensão de tenant **antes** de qualquer UI.
2. Implementar um módulo de cada vez, na ordem da Fase 1. Não avançar para o módulo
   seguinte com o anterior incompleto.
3. Para cada módulo, a ordem é: schema → validador Zod → serviço → Server Action →
   UI → teste.
4. Antes de criar um ficheiro novo, verificar se já existe algo equivalente.
5. Quando uma decisão não estiver coberta por este documento, perguntar em vez de assumir.
6. Propor as mudanças a este documento sempre que uma decisão de arquitectura mudar.
