-- Execute este arquivo uma única vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  type text not null check (type in ('income','expense')),
  color text not null default '#94a3b8' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (user_id, type, name),
  unique (id, user_id, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  amount_cents bigint not null check (amount_cents > 0),
  type text not null check (type in ('income','expense')),
  category_id uuid,
  due_date date not null,
  paid boolean not null default false,
  notes text check (notes is null or length(notes) <= 1000),
  group_id uuid,
  installment_number integer,
  installment_count integer,
  created_at timestamptz not null default now(),
  constraint fk_category_owner_type foreign key (category_id, user_id, type)
    references public.categories(id, user_id, type) on delete restrict,
  constraint installment_integrity check (
    (group_id is null and installment_number is null and installment_count is null) or
    (group_id is not null and type='expense' and installment_number between 1 and installment_count and installment_count between 2 and 60)
  ),
  unique (user_id, group_id, installment_number)
);

create index if not exists idx_transactions_user_date on public.transactions (user_id, due_date desc);
create index if not exists idx_transactions_user_group on public.transactions (user_id, group_id);
create index if not exists idx_categories_user on public.categories (user_id);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "categories_select_own" on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories for delete to authenticated using ((select auth.uid()) = user_id);

create policy "transactions_select_own" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);
