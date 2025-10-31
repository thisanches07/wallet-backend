# Wallet AI Backend 💰

API REST para gerenciamento financeiro pessoal construída com NestJS, TypeORM e PostgreSQL.

## 🚀 Funcionalidades

- ✅ **Autenticação com Firebase** - JWT tokens para segurança
- ✅ **Gestão de Usuários** - Perfis de usuário sincronizados com Firebase
- ✅ **Gestão de Despesas** - CRUD completo com categorização
- ✅ **Gestão de Receitas** - Controle de rendas com períodos
- ✅ **Categorias** - Sistema de categorização de despesas
- ✅ **Documentação Swagger** - API completamente documentada
- ✅ **Validação de Dados** - DTOs com class-validator
- ✅ **Tratamento de Erros** - Respostas padronizadas e logs
- ✅ **Health Check** - Endpoint para monitoramento

## 📚 Documentação da API

# Wallet AI Backend 💰

API REST para gerenciamento financeiro pessoal (backend) construída com NestJS, TypeORM e PostgreSQL — com autenticação via Firebase e endpoints para despesas, receitas, investimentos, integração com Pluggy e análise de portfólio.

## Descrição rápida

Este repositório contém a API do Wallet AI, responsável por armazenar transações, contas, alocação de investimentos e fornecer análises e recomendações. Foi pensado para ser usado junto com um frontend (web/mobile) que consome os endpoints documentados em Swagger.

## Estrutura do projeto (visão geral)

- `src/` - Código-fonte da aplicação

  - `auth/` - Decorators e guards de autenticação (Firebase)
  - `common/` - DTOs, filtros, interceptors e utilitários compartilhados
  - `db/` - Configuração do TypeORM, migrations e entidades
    - `entities/` - Entities do TypeORM (User, Expense, Income, Transaction, PluggyItem, etc.)
    - `migrations/` - Arquivos de migração
  - `modules/` - Módulos organizados por domínio
    - `users/`, `expenses/`, `incomes/`, `pluggy/`, `portfolio/`, `summary/`, `firebase/`, etc.
  - `types/` - Tipos e extensões (ex.: `express.d.ts`, request-with-user)
  - `main.ts` - Bootstrap da aplicação
  - `preload.ts` - Inicializações (se usadas)

- `test/` - Testes unitários e e2e
- `docker-compose.yml`, `Dockerfile` - Configuração Docker
- `cloud-run-config.yaml`, `deploy-cloud-run.*` - Configuração para deploy no Cloud Run
- `ormconfig.js` - Configuração do TypeORM (conhecida pelo CLI)
- `package.json`, `tsconfig.json`, `jest.config.ts` - Configs de build e testes

## Principais funcionalidades

- Autenticação com Firebase (guards e decorator `@AuthenticatedUser()`)
- CRUD de despesas e receitas com validação (DTOs)
- Integração com Pluggy para conectar contas bancárias
- Análise de portfólio e recomendações de investimento (MVP)
- Swagger/OpenAPI para documentação dos endpoints
- Health checks e tratamento global de erros

## Pré-requisitos

- Node.js 18+
- npm 8+ (ou yarn)
- PostgreSQL 12+
- Conta Firebase com credenciais de serviço (service account JSON)

## Variáveis de ambiente importantes

Coloque as variáveis no arquivo `.env` (ex.: copie de `.env.example`). As variáveis mais relevantes são:

- `NODE_ENV` - `development` | `production`
- `PORT` - Porta da API (ex.: `3001`)
- `DATABASE_URL` - URL de conexão com Postgres (ex.: `postgres://user:pass@host:5432/dbname`)
- `TYPEORM_ENTITIES` / `TYPEORM_MIGRATIONS` - (geralmente setadas no ormconfig)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` - Atenção: o private key pode precisar de tratamento de quebras de linha (\n)
- `JWT_EXPIRES_IN` - Se aplicável

Verifique `.env.example` para a lista completa.

## Como rodar localmente (desenvolvimento)

1. Instale dependências:

```bash
npm install
```

2. Crie `.env` a partir do `.env.example` e preencha as variáveis.

3. Execute as migrações (garanta que `DATABASE_URL` esteja correta):

```bash
npm run typeorm migration:run
```

4. Inicie em modo desenvolvimento (hot reload):

```bash
npm run start:dev
```

Por padrão a API usa um prefixo global `/api`. Exemplos de endpoints:

- `GET /api/health` — health check
- `GET /api/portfolio/analysis` — análise do portfólio (requer auth)

Observação importante: se você receber 404 nas rotas, verifique se está incluindo o prefixo `/api` e a porta correta.

## Como rodar em produção (build)

```bash
npm run build
npm run start:prod
```

Ou usando Docker (exemplo simples):

```bash
docker build -t wallet-backend .
docker run -e DATABASE_URL="$DATABASE_URL" -e PORT=3001 -p 3001:3001 wallet-backend
```

Também há scripts para deploy em Cloud Run (veja `deploy-cloud-run.sh` e `deploy-cloud-run.ps1`).

## Migrations

Gerencie migrations com o script TypeORM configurado no `package.json`:

```bash
npm run typeorm migration:generate -- -n NomeDaMigration
npm run typeorm migration:run
npm run typeorm migration:revert
```

## Testes

- Testes unitários (Jest):

```bash
npm run test
```

- Testes E2E (necessitam de setup específico — ver `test/setup`):

```bash
npm run test:e2e
```

- Cobertura:

```bash
npm run test:cov
```

## Lint e formatação

```bash
npm run lint
npm run format
```

## Documentação da API (Swagger)

Após iniciar a aplicação, a documentação Swagger normalmente fica disponível em:

```
http://localhost:3001/api/docs
```

Os caminhos podem variar conforme `PORT` e prefixo global.

## Autenticação (Firebase)

A autenticação é feita com tokens do Firebase. Para usar endpoints protegidos inclua o header HTTP:

```
Authorization: Bearer <firebase-jwt-token>
```

Se você receber 401 Unauthorized, cheque:

- O token enviado no header `Authorization` está presente e válido
- A hora do servidor está sincronizada (tokens expirados)
- As credenciais do Firebase Admin (service account) estão corretas no `.env`

Se receber 404 em uma rota que existe, verifique se está usando o prefixo global `/api` (ex.: `/api/portfolio/analysis`).

## Endpoints úteis

- Health check: `GET /api/health` ou `GET /api/v1/health` (dependendo da versão que sua instância aplica)
- Swagger: `/api/docs`
- Pluggy items: `/api/pluggy-items` (CRUD de conexões bancárias)
- Portfolio analysis: `/api/portfolio/analysis` (autenticado)

## Troubleshooting rápido

- 401 Unauthorized: token ausente/expirado ou credenciais Firebase faltando
- 404 Not Found: rota com prefixo errado (ver `/api`) ou servidor na porta incorreta
- Erro de DB: verifique `DATABASE_URL` e se o Postgres está acessível
- Problemas com `FIREBASE_PRIVATE_KEY`: lembre-se de substituir as quebras de linha corretamente se estiver usando variáveis de ambiente (\n)
