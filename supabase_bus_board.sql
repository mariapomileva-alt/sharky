-- Run once in Supabase → SQL → New query
-- Then enable useCloud in bus-config.js with your URL and anon key.

create table if not exists public.bus_board (
  id bigint primary key default 1,
  trip_date text not null default '',
  seats jsonb not null default '["","","","","","","","",""]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.bus_board (id, trip_date, seats)
values (1, '', '["","","","","","","","",""]'::jsonb)
on conflict (id) do nothing;

alter table public.bus_board enable row level security;

-- MVP: anyone with anon key can read/write (fine for a small private team + obscurity).
-- Tighten later with auth or a single "service" Edge Function.
drop policy if exists "bus_select" on public.bus_board;
drop policy if exists "bus_insert" on public.bus_board;
drop policy if exists "bus_update" on public.bus_board;

create policy "bus_select" on public.bus_board for select using (true);
create policy "bus_insert" on public.bus_board for insert with check (true);
create policy "bus_update" on public.bus_board for update using (true);
