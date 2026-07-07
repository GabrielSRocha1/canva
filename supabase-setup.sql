-- Setup do Verum Project Canvas no Supabase
-- Rode este script em: supabase.com > seu projeto > SQL Editor > New query > Run

create table if not exists public.entries (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Libera leitura e escrita para visitantes anônimos (site aberto, sem login).
alter table public.entries enable row level security;

create policy "leitura publica" on public.entries
  for select using (true);

create policy "insercao publica" on public.entries
  for insert with check (true);

create policy "atualizacao publica" on public.entries
  for update using (true) with check (true);
