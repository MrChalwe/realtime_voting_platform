-- ============================================================
-- Youth Sunday Voting — Supabase schema
-- Run this whole file in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) TABLES ---------------------------------------------------
create table rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  project text not null,
  description text,
  vote_count int not null default 0,
  created_at timestamptz not null default now()
);

-- One row per voter per room. voter_id is a random anonymous ID (not a name/email).
create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  voter_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (room_id, voter_id)
);

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 2) HELPERS --------------------------------------------------
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Keeps participants.vote_count in sync so everyone can see live totals
-- WITHOUT ever being able to read who voted for whom.
create or replace function handle_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update participants set vote_count = vote_count + 1 where id = new.participant_id;
  elsif tg_op = 'UPDATE' then
    if old.participant_id <> new.participant_id then
      update participants set vote_count = vote_count - 1 where id = old.participant_id;
      update participants set vote_count = vote_count + 1 where id = new.participant_id;
    end if;
  elsif tg_op = 'DELETE' then
    update participants set vote_count = vote_count - 1 where id = old.participant_id;
  end if;
  return null;
end $$;

create trigger votes_count_trg
after insert or update or delete on votes
for each row execute function handle_vote();

create or replace function reset_room_votes(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  delete from votes where room_id = p_room;
  update participants set vote_count = 0 where room_id = p_room;
end $$;

-- 3) ROW LEVEL SECURITY --------------------------------------
alter table rooms enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;
alter table admins enable row level security;

-- rooms: everyone sees non-draft rooms; admin does everything
create policy "rooms read" on rooms for select to anon, authenticated
  using (status <> 'draft' or is_admin());
create policy "rooms admin all" on rooms for all to authenticated
  using (is_admin()) with check (is_admin());

-- participants: everyone sees participants of non-draft rooms; admin does everything
create policy "participants read" on participants for select to anon, authenticated
  using (is_admin() or exists (select 1 from rooms r where r.id = room_id and r.status <> 'draft'));
create policy "participants admin all" on participants for all to authenticated
  using (is_admin()) with check (is_admin());

-- votes: a voter can only see/insert/change THEIR OWN vote, and only while the room is open.
-- Nobody (not even the admin) can read other people's votes -> anonymity.
create policy "votes read own" on votes for select to authenticated
  using (voter_id = auth.uid());
create policy "votes insert" on votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from rooms r join participants p on p.room_id = r.id
      where r.id = votes.room_id and r.status = 'open' and p.id = votes.participant_id
    )
  );
create policy "votes update own" on votes for update to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from rooms r join participants p on p.room_id = r.id
      where r.id = votes.room_id and r.status = 'open' and p.id = votes.participant_id
    )
  );

-- admins: you can only see your own row
create policy "admins read self" on admins for select to authenticated
  using (user_id = auth.uid());

-- 4) REALTIME -------------------------------------------------
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table rooms;

-- 5) MAKE YOURSELF ADMIN -------------------------------------
-- First create your admin user: Dashboard > Authentication > Users > Add user
-- (email + password, tick "Auto Confirm"). Then run this with YOUR email:
--
-- insert into admins (user_id)
-- select id from auth.users where email = 'you@example.com';
