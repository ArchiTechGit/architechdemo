create schema if not exists alayacare;

create sequence alayacare.client_id_seq start with 100000;

create table alayacare.client (
  client_id text primary key default ('C' || lpad(nextval('alayacare.client_id_seq')::text, 7, '0')),
  salutation text,
  first_name text not null,
  last_name text not null,
  birthday date,
  zip text,
  phone_main text,
  ai_agent_opt_out text,
  channels_of_communication text,
  types_of_communication text,
  notification_recipient text,
  contacts jsonb not null default '[]'::jsonb,
  createdon timestamptz not null default now()
);

create table alayacare.visit (
  alayacare_visit_id bigint generated always as identity primary key,
  alayacare_service_id bigint,
  employee_id text,
  service_code_id integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'missed')),
  start_at timestamptz,
  end_at timestamptz,
  cancelled boolean not null default false,
  client_id text references alayacare.client(client_id) on delete set null,
  createdon timestamptz not null default now()
);

create table alayacare.care_team_member (
  id uuid primary key default gen_random_uuid(),
  client_id text references alayacare.client(client_id) on delete cascade,
  employee_id text,
  first_name text not null,
  last_name text not null,
  role text,
  email text,
  createdon timestamptz not null default now()
);

grant usage on schema alayacare to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema alayacare to anon, authenticated, service_role;
grant usage on all sequences in schema alayacare to anon, authenticated, service_role;
alter default privileges in schema alayacare grant select, insert, update, delete on tables to anon, authenticated;

alter table alayacare.client enable row level security;
alter table alayacare.visit enable row level security;
alter table alayacare.care_team_member enable row level security;

create policy "anon full access" on alayacare.client for all using (true) with check (true);
create policy "anon full access" on alayacare.visit for all using (true) with check (true);
create policy "anon full access" on alayacare.care_team_member for all using (true) with check (true);
