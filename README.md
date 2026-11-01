# Sistema do Escritório — Mariana Canedo Arquitetura e Interiores

Sistema web de gestão do escritório: Dashboard, Clientes, Agenda, Projetos, Calculadora de precificação, Financeiro e Usuários.

- **Código:** este repositório (GitHub)
- **Site:** Vercel
- **Banco de dados:** Neon (PostgreSQL)

As tabelas do banco são criadas sozinhas no primeiro acesso. Nada precisa ser rodado no computador.

## Publicar pela primeira vez

1. **Neon** → abra o projeto → botão **Connect** → copie a *connection string* (começa com `postgresql://`).
2. **Vercel** → **Add New → Project** → importe `SistemaEscritorio` → abra **Environment Variables** e crie:
   - `DATABASE_URL` = a connection string da Neon
   - `ADMIN_EMAIL` = o seu e-mail (só ele poderá criar a primeira conta)
3. Clique em **Deploy**. Em 1 a 2 minutos o endereço fica pronto.
4. Abra o endereço: aparece a tela **Primeiro acesso**. Crie a sua conta (administradora, acesso total).

Cada alteração enviada ao GitHub vira uma nova versão automaticamente na Vercel.

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/(app)/` | As abas do sistema (uma pasta por aba) |
| `app/login`, `app/setup` | Entrada e primeiro acesso |
| `components/` | Peças reutilizadas (janelas, formulários, tabelas) |
| `lib/schema.js` | Estrutura do banco de dados |
| `lib/format.js` | Datas, moeda, listas de categorias e etapas padrão |
| `lib/precificacao.js` | Cálculo da calculadora e valores iniciais |
| `public/` | Logotipo, ícones e o padrão de arcos da tela de login |

## Desenvolvimento local (opcional)

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL
npm run dev
```
