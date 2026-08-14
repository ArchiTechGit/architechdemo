create schema if not exists dynamics;

create table dynamics.account (
  accountid uuid primary key default gen_random_uuid(),
  name text not null,
  telephone1 text,
  websiteurl text,
  address1_line1 text,
  address1_city text,
  address1_stateorprovince text,
  address1_postalcode text,
  address1_country text,
  industrycode text,
  createdon timestamptz not null default now()
);

create table dynamics.contact (
  contactid uuid primary key default gen_random_uuid(),
  parentcustomerid uuid references dynamics.account(accountid) on delete set null,
  firstname text not null,
  lastname text not null,
  jobtitle text,
  emailaddress1 text,
  emailaddress2 text,
  telephone1 text,
  telephone2 text,
  mobilephone text,
  address1_line1 text,
  address1_city text,
  address1_stateorprovince text,
  address1_postalcode text,
  address1_country text,
  createdon timestamptz not null default now()
);

create table dynamics.opportunity (
  opportunityid uuid primary key default gen_random_uuid(),
  parentaccountid uuid references dynamics.account(accountid) on delete set null,
  parentcontactid uuid references dynamics.contact(contactid) on delete set null,
  name text not null,
  estimatedvalue numeric,
  estimatedclosedate date,
  salesstage text not null default 'Qualify' check (salesstage in ('Qualify','Develop','Propose','Close')),
  createdon timestamptz not null default now()
);

create table dynamics.lead (
  leadid uuid primary key default gen_random_uuid(),
  firstname text not null,
  lastname text not null,
  companyname text,
  subject text not null default 'New lead',
  emailaddress1 text,
  telephone1 text,
  mobilephone text,
  leadsourcecode text,
  statuscode text not null default 'New' check (statuscode in ('New','Contacted','Qualified','Disqualified')),
  createdon timestamptz not null default now()
);

-- Notes, real Dataverse "annotation" entity: polymorphic, attaches to any
-- record via objectid + objecttypecode. No FK (target table varies).
create table dynamics.annotation (
  annotationid uuid primary key default gen_random_uuid(),
  objectid uuid not null,
  objecttypecode text not null check (objecttypecode in ('account','contact','lead','opportunity')),
  subject text,
  notetext text,
  createdon timestamptz not null default now()
);

-- Expose schema to PostgREST and grant CRUD to the anon demo role. The
-- Dataverse Web API shim (Task 3) uses the service role internally, but the
-- anon grant is still useful for direct debugging via the Supabase dashboard.
grant usage on schema dynamics to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema dynamics to anon, authenticated, service_role;
alter default privileges in schema dynamics grant select, insert, update, delete on tables to anon, authenticated;

-- RLS on, permissive policies: this is a public sales demo, isolation comes
-- from the dedicated schema, not from row-level restriction.
alter table dynamics.account enable row level security;
alter table dynamics.contact enable row level security;
alter table dynamics.opportunity enable row level security;
alter table dynamics.lead enable row level security;
alter table dynamics.annotation enable row level security;

create policy "anon full access" on dynamics.account for all using (true) with check (true);
create policy "anon full access" on dynamics.contact for all using (true) with check (true);
create policy "anon full access" on dynamics.opportunity for all using (true) with check (true);
create policy "anon full access" on dynamics.lead for all using (true) with check (true);
create policy "anon full access" on dynamics.annotation for all using (true) with check (true);
