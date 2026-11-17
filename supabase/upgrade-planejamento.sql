-- Zentro: atualização para salários mensais previstos (execute UMA vez no SQL Editor).
-- Mantém as tabelas e os registros existentes.
create table if not exists public.salary_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_month date not null check (extract(day from effective_month) = 1),
  amount_cents bigint not null check (amount_cents > 0),
  payment_day smallint not null check (payment_day between 1 and 31),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, effective_month)
);
create index if not exists idx_salary_plans_user_month on public.salary_plans (user_id, effective_month desc);
alter table public.salary_plans enable row level security;
-- Remove policies antigas com os mesmos nomes caso um deploy parcial já as tenha criado.
drop policy if exists salary_plans_select_own on public.salary_plans;
drop policy if exists salary_plans_insert_own on public.salary_plans;
drop policy if exists salary_plans_update_own on public.salary_plans;
drop policy if exists salary_plans_delete_own on public.salary_plans;
create policy salary_plans_select_own on public.salary_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy salary_plans_insert_own on public.salary_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy salary_plans_update_own on public.salary_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy salary_plans_delete_own on public.salary_plans for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.salary_plans to authenticated;

-- Vincula um salário efetivamente recebido ao mês de competência.
-- NULL permite preservar todos os lançamentos manuais antigos.
alter table public.transactions add column if not exists salary_month date;
create unique index if not exists idx_transactions_salary_unique
  on public.transactions (user_id, salary_month) where salary_month is not null;
-- Reafirma as permissões necessárias, sem retirar as políticas RLS já existentes.
grant select, insert, update, delete on public.categories, public.transactions to authenticated;
