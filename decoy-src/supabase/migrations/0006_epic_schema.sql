create schema if not exists epic;

create table epic.patient (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table epic.practitioner (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table epic.encounter (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.condition (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.medication_request (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.observation (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.allergy_intolerance (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.diagnostic_report (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.procedure (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.practitioner_role (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  practitioner_id text not null references epic.practitioner(id) on delete cascade,
  created_at timestamptz not null default now()
);

grant usage on schema epic to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema epic to anon, authenticated, service_role;
alter default privileges in schema epic grant select, insert, update, delete on tables to anon, authenticated;

alter table epic.patient enable row level security;
alter table epic.practitioner enable row level security;
alter table epic.encounter enable row level security;
alter table epic.condition enable row level security;
alter table epic.medication_request enable row level security;
alter table epic.observation enable row level security;
alter table epic.allergy_intolerance enable row level security;
alter table epic.diagnostic_report enable row level security;
alter table epic.procedure enable row level security;
alter table epic.practitioner_role enable row level security;

create policy "anon full access" on epic.patient for all using (true) with check (true);
create policy "anon full access" on epic.practitioner for all using (true) with check (true);
create policy "anon full access" on epic.encounter for all using (true) with check (true);
create policy "anon full access" on epic.condition for all using (true) with check (true);
create policy "anon full access" on epic.medication_request for all using (true) with check (true);
create policy "anon full access" on epic.observation for all using (true) with check (true);
create policy "anon full access" on epic.allergy_intolerance for all using (true) with check (true);
create policy "anon full access" on epic.diagnostic_report for all using (true) with check (true);
create policy "anon full access" on epic.procedure for all using (true) with check (true);
create policy "anon full access" on epic.practitioner_role for all using (true) with check (true);
