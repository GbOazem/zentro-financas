# Zentro — Suas finanças em um só lugar.

Projeto Next.js + React + TypeScript + Tailwind CSS + Supabase. Executa **localmente**, com login e dados armazenados no Supabase. A publicação do site não é necessária.

## Requisitos
- Node.js 22 LTS ou compatível com Next.js 16 (mínimo indicado na documentação: Node 20.9).
- Conta gratuita no Supabase: https://supabase.com

## Configurar o banco (uma única vez)
1. Crie um projeto no Supabase.
2. Acesse **SQL Editor** e execute todo o conteúdo de `supabase/schema.sql`.
3. Em **Authentication → Providers → Email**, mantenha o provedor Email ativo. O Supabase pode exigir confirmação do e-mail após criar a conta; verifique sua caixa de entrada.
4. Em **Project Settings → API Keys** (ou Connect), copie a URL do projeto e a **publishable key** (`sb_publishable_...`) ou a chave `anon` pública. **Nunca utilize a chave `service_role` ou uma secret key no navegador**.
5. Copie `.env.example` para `.env.local` e substitua os valores de exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

## Executar o site no computador
Abra um terminal na pasta do projeto e execute:

```bash
npm install
npm run dev
```

Depois abra **http://localhost:3000** no navegador. Use **Criar conta**, confirme o e-mail se solicitado e faça login. As categorias padrão serão criadas automaticamente para sua conta.

## Funcionalidades da Fase 1
- Cadastro, login e logout com Supabase Auth.
- Categorias de receitas/despesas, com inclusão e exclusão de categorias sem uso.
- Lançamentos de receitas e despesas, com edição, exclusão e marcar como pago/recebido.
- Parcelamento de despesas: 2 a 60 parcelas, centavos distribuídos sem perda, datas mensais automaticamente, visão agrupada e exclusão da compra completa.
- Painel com receitas, despesas, saldo planejado do mês, despesas pendentes, gráfico por categoria e próximos vencimentos.
- Filtros por mês, tipo e busca por nome.
- Acesso do próprio usuário apenas aos próprios dados, com Row Level Security (RLS).
- Exportação das movimentações para CSV (compatível com Excel).
- Interface adaptada para desktop e celular.
- Temas claro e escuro com alternância no topo, respeitando a preferência do sistema e salvando a seleção no navegador.

## Regras de cálculo
- Receitas e despesas mensais usam a **data do lançamento/vencimento**. O saldo previsto do mês é receitas menos despesas, **sem** representar o saldo bancário real.
- A coluna `paid` permite separar o que foi pago/recebido do que está pendente.
- Uma compra em 10 parcelas é armazenada como dez registros relacionados pelo mesmo `group_id`; cada parcela aparece no seu mês, sem cobrar o valor total em apenas um mês.
- Ao editar uma parcela, só essa parcela muda. Para excluir uma compra inteira, utilize a tela Parcelamentos.
- Não há integração bancária nem importação automática de faturas nesta fase.

## Segurança e privacidade
- Banco de dados protegido por políticas RLS que limitam a leitura e escrita a `auth.uid() = user_id`.
- Chave pública Supabase no front-end é esperada, mas **jamais** exponha secret keys.
- Nunca faça upload do `.env.local` para GitHub ou envie suas credenciais para terceiros.
- Para backup, use a exportação CSV e as opções do painel Supabase conforme seu plano. A disponibilidade de backups automáticos depende do plano.

## Verificações úteis
```bash
npm run typecheck
npm run build
```

## Próximas fases
Contas/cartões, fechamento de fatura, orçamento mensal, metas, pagamentos recorrentes, importação Excel/CSV e publicação online.

## Identidade Zentro
Nome provisório: **Zentro**. Slogan: **Suas finanças em um só lugar.** Verde-esmeralda como destaque e temas claro/escuro. A disponibilidade de marca e domínio deve ser verificada antes de publicar comercialmente.
