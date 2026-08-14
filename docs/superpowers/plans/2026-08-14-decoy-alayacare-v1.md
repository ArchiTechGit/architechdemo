# Decoy — Alayacare v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a live-editable Alayacare demo (Client, Visit/Schedules, care-team lookup, Dashboard) using Alayacare's real captured REST API shape, plus a cross-system switcher linking it to the existing Dynamics section.

**Architecture:** Same pattern as Dynamics — a Supabase Edge Function (`alayacare-api`) exposes Alayacare's real wire format (`/AlayaCare/v1/<resource>[/<id>][?query]`, plain REST verbs, no OData) and translates it to Postgres queries against a new `alayacare` schema. Two endpoints (`client-profile/{id}` single-fetch, `scheduled-visits` list, `cancelled-visit/staff-contacts/{id}`) match real captured traffic byte-for-byte; list-all and all write verbs are inferred (flagged as such in `/alayacare/help`). Reset reuses the existing `reset-demo` function with an extended schema allow-list.

**Tech Stack:** Same as Dynamics — Next.js 14 static export, TypeScript, Tailwind, Supabase Postgres + Edge Functions. No app test framework.

**Spec:** `docs/superpowers/specs/2026-08-14-decoy-alayacare-v1-design.md`

## Global Constraints

- Every captured endpoint's response shape is reproduced exactly (field names, nesting, envelope). Every inferred endpoint (list-all, POST/PATCH/DELETE) is clearly flagged as inferred, not captured, in `/alayacare/help` — never presented as equally certain to the captured ones.
- The odd `cancelled-visit/staff-contacts/{id}` path stays literal even though it reads strangely for a non-cancelled visit — that's the real system's actual path, don't "fix" it.
- New Edge Function ships with CORS headers + `OPTIONS` handling from its first commit — this was a post-hoc bug fix on Dynamics, must not be repeated (see `CLAUDE.md`'s CORS gotcha).
- New Postgres schema `alayacare`: RLS enabled, fully permissive policies (`using (true) with check (true)`) — isolation is the schema boundary, not row-level rules, same as `dynamics`.
- Supabase project ref `kjapsnzcaicecjnctmoh` (already linked from the Dynamics build) — no new project.
- v1 scope is Client + Visit + care-team lookup + Dashboard + switcher only. Employee, Tasks, Extensions, and Client Intelligence are explicitly out — do not add them speculatively.
- Never commit the Supabase personal access token or service-role key to any file. Every command below uses `<token>` as a placeholder — substitute the real value only when running the command, never when writing it to a tracked file.
- No app test framework. Verify with `npx tsc --noEmit`, `npm run build`, and `curl` against the deployed endpoints, matching captured shapes byte-for-byte where a capture exists.

---

### Task 1: Alayacare Postgres schema, RLS, and exposure

**Files:**
- Create: `decoy-src/supabase/migrations/0002_alayacare_schema.sql`

**Interfaces:**
- Produces: Postgres schema `alayacare` with tables `client`, `visit`, `care_team_member`. Task 3's Edge Function and Task 2's seed function both depend on these exact table/column names.

- [ ] **Step 1: Write the migration**

`decoy-src/supabase/migrations/0002_alayacare_schema.sql`:
```sql
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
```

- [ ] **Step 2: Apply it to the linked project**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/migrations/0002_alayacare_schema.sql
```
Expected: runs with no errors.

- [ ] **Step 3: Expose the schema via the Management API**

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kjapsnzcaicecjnctmoh/postgrest" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"db_schema":"public,graphql_public,dynamics,alayacare"}'
```
Expected: response echoes back `"db_schema":"public,graphql_public,dynamics,alayacare"`.

- [ ] **Step 4: Verify**

```bash
curl -s "https://kjapsnzcaicecjnctmoh.supabase.co/rest/v1/client?select=client_id" \
  -H "apikey: <anon-or-publishable-key>" -H "Authorization: Bearer <anon-or-publishable-key>" \
  -H "Accept-Profile: alayacare"
```
Expected: `[]` (empty array — no rows yet, but no `PGRST106: Invalid schema` error).

- [ ] **Step 5: Commit**

```bash
git add decoy-src/supabase/migrations/0002_alayacare_schema.sql
git commit -m "feat(decoy): add alayacare schema, RLS policies, and expose it via PostgREST"
```

---

### Task 2: Alayacare seed data

**Files:**
- Create: `decoy-src/supabase/seed/alayacare.sql`

**Interfaces:**
- Consumes: `alayacare.client`/`visit`/`care_team_member` from Task 1.
- Produces: `alayacare.reset_demo_data()`, called by Task 4's extended `reset-demo` function.

- [ ] **Step 1: Write the seed/reset function**

`decoy-src/supabase/seed/alayacare.sql`:
```sql
create or replace function alayacare.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = alayacare, pg_temp
as $$
begin
  truncate table alayacare.care_team_member, alayacare.visit, alayacare.client restart identity cascade;
  alter sequence alayacare.client_id_seq restart with 100000;

  insert into alayacare.client (client_id, salutation, first_name, last_name, birthday, zip, phone_main, ai_agent_opt_out, channels_of_communication, types_of_communication, notification_recipient, contacts) values
    ('C0100001', 'Mrs', 'Margaret', 'Voss', '1938-03-14', '3220', '+61411300001', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100002', 'Mr', 'Harold', 'Fenwick', '1941-11-02', '3350', '+61411300002', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100003', 'Mrs', 'Ivy', 'Castellano', '1933-07-19', '3199', '+61411300003', '', 'SMS', '', 'Family Contact', '[]'),
    ('C0100004', 'Mr', 'Desmond', 'Okafor', '1945-01-27', '3630', '+61411300004', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100005', 'Mrs', 'Lorna', 'Petrakis', '1937-09-08', '3550', '+61411300005', '', 'Email', '', 'Family Contact', '[]');

  insert into alayacare.visit (alayacare_service_id, employee_id, service_code_id, status, start_at, end_at, cancelled, client_id) values
    (610001, '051201', 43, 'scheduled', '2026-08-20T05:25:00+00:00', '2026-08-20T06:25:00+00:00', false, 'C0100001'),
    (610001, '051201', 43, 'completed', '2026-08-06T05:25:00+00:00', '2026-08-06T06:25:00+00:00', false, 'C0100001'),
    (610002, 'S0018842', 106, 'scheduled', '2026-08-22T22:00:00+00:00', '2026-08-23T00:30:00+00:00', false, 'C0100002'),
    (610003, '051340', 283, 'scheduled', '2026-08-19T22:00:00+00:00', '2026-08-19T22:15:00+00:00', false, 'C0100003'),
    (610003, '051340', 283, 'cancelled', '2026-08-12T22:00:00+00:00', '2026-08-12T22:15:00+00:00', true, 'C0100003'),
    (610004, 'S2201177', 327, 'scheduled', '2026-08-25T21:30:00+00:00', '2026-08-25T22:30:00+00:00', false, 'C0100004'),
    (610005, '051201', 43, 'missed', '2026-08-10T05:25:00+00:00', '2026-08-10T06:25:00+00:00', false, 'C0100005'),
    (610005, '051201', 43, 'scheduled', '2026-08-24T05:25:00+00:00', '2026-08-24T06:25:00+00:00', false, 'C0100005');

  insert into alayacare.care_team_member (client_id, employee_id, first_name, last_name, role, email) values
    ('C0100001', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100001', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100002', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100003', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100003', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100004', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100005', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example');
end;
$$;

revoke execute on function alayacare.reset_demo_data() from public, anon, authenticated;
grant execute on function alayacare.reset_demo_data() to service_role;

select alayacare.reset_demo_data();
```

- [ ] **Step 2: Apply it**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/seed/alayacare.sql
```
Expected: runs with no errors.

- [ ] **Step 3: Verify**

```bash
curl -s "https://kjapsnzcaicecjnctmoh.supabase.co/rest/v1/client?select=client_id,first_name,last_name" \
  -H "apikey: <anon-or-publishable-key>" -H "Authorization: Bearer <anon-or-publishable-key>" \
  -H "Accept-Profile: alayacare"
```
Expected: 5 rows, `client_id` values `C0100001`–`C0100005`.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/supabase/seed/alayacare.sql
git commit -m "feat(decoy): add alayacare seed data (5 clients, 8 visits, 7 care team members)"
```

---

### Task 3: `alayacare-api` Edge Function

**Files:**
- Create: `decoy-src/supabase/functions/alayacare-api/index.ts`

**Interfaces:**
- Consumes: `alayacare.client`/`visit`/`care_team_member` from Task 1.
- Produces: `{SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1/<resource>[/<id>][?query]`. Task 5's `lib/alayacareApi.ts` is the only consumer.
  - `GET .../client-profile` → `200 { count, page, total_pages, items: [...] }` (inferred envelope, reusing the captured `scheduled-visits` convention)
  - `GET .../client-profile/{client_id}` → `200 <flat client object>` (captured shape, no wrapper)
  - `POST .../client-profile` → `201 <created client>` (inferred; omit `client_id` in the body to let the DB default generate it)
  - `PATCH .../client-profile/{client_id}` → `200 <updated client>` (inferred)
  - `DELETE .../client-profile/{client_id}` → `204` (inferred)
  - `GET .../scheduled-visits?client_id=&start_at=&end_at=&page=` → `200 { count, page, total_pages, items: [...] }` (captured shape; all query params optional here — the capture always passed `client_id` but an all-visits view needs it optional)
  - `POST .../scheduled-visits` → `201 <created visit>` (inferred)
  - `PATCH .../scheduled-visits/{visit_id}` → `200 <updated visit>` (inferred)
  - `DELETE .../scheduled-visits/{visit_id}` → `204` (inferred)
  - `GET .../cancelled-visit/staff-contacts/{visit_id}` → `200 { care_team: [...] }` (captured shape, read-only)

- [ ] **Step 1: Write the function**

`decoy-src/supabase/functions/alayacare-api/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json' };

const PAGE_SIZE = 50;

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), { status, headers: CORS_HEADERS });
}

async function paginatedResponse(query: any, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return errorResponse(error.message, 500);
  const total = count ?? (data?.length ?? 0);
  return new Response(
    JSON.stringify({
      count: total,
      page,
      total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      items: data ?? [],
    }),
    { headers: JSON_HEADERS },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // GET .../cancelled-visit/staff-contacts/{visit_id}
  const staffContactsMatch = path.match(/\/cancelled-visit\/staff-contacts\/([0-9]+)$/);
  if (staffContactsMatch) {
    if (req.method !== 'GET') return errorResponse('method not allowed', 405);
    const visitId = Number(staffContactsMatch[1]);
    const { data: visit, error: visitError } = await supabase
      .schema('alayacare')
      .from('visit')
      .select('client_id')
      .eq('alayacare_visit_id', visitId)
      .single();
    if (visitError || !visit?.client_id) return errorResponse('visit not found', 404);
    const { data: careTeam, error: careTeamError } = await supabase
      .schema('alayacare')
      .from('care_team_member')
      .select('employee_id,first_name,last_name,role,email')
      .eq('client_id', visit.client_id);
    if (careTeamError) return errorResponse(careTeamError.message, 500);
    return new Response(JSON.stringify({ care_team: careTeam ?? [] }), { headers: JSON_HEADERS });
  }

  // .../client-profile[/{client_id}]
  const clientMatch = path.match(/\/client-profile(?:\/([A-Za-z0-9]+))?$/);
  if (clientMatch) {
    const clientId = clientMatch[1];
    const db = supabase.schema('alayacare').from('client');

    if (req.method === 'GET' && !clientId) {
      const page = Number(url.searchParams.get('page') ?? '1');
      return paginatedResponse(db.select('*', { count: 'exact' }).order('createdon', { ascending: false }), page);
    }
    if (req.method === 'GET' && clientId) {
      const { data, error } = await db.select('*').eq('client_id', clientId).single();
      if (error) return errorResponse(error.message, 404);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await db.insert(body).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { status: 201, headers: JSON_HEADERS });
    }
    if (req.method === 'PATCH' && clientId) {
      const body = await req.json();
      const { data, error } = await db.update(body).eq('client_id', clientId).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'DELETE' && clientId) {
      const { error } = await db.delete().eq('client_id', clientId);
      if (error) return errorResponse(error.message, 400);
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return errorResponse('method not allowed', 405);
  }

  // .../scheduled-visits[/{visit_id}]
  const visitMatch = path.match(/\/scheduled-visits(?:\/([0-9]+))?$/);
  if (visitMatch) {
    const visitId = visitMatch[1] ? Number(visitMatch[1]) : undefined;
    const db = supabase.schema('alayacare').from('visit');

    if (req.method === 'GET' && !visitId) {
      const page = Number(url.searchParams.get('page') ?? '1');
      const clientId = url.searchParams.get('client_id');
      const startAt = url.searchParams.get('start_at');
      const endAt = url.searchParams.get('end_at');
      let query = db.select('*', { count: 'exact' }).order('start_at', { ascending: true });
      if (clientId) query = query.eq('client_id', clientId);
      if (startAt) query = query.gte('start_at', startAt);
      if (endAt) query = query.lte('end_at', endAt);
      return paginatedResponse(query, page);
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await db.insert(body).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { status: 201, headers: JSON_HEADERS });
    }
    if (req.method === 'PATCH' && visitId) {
      const body = await req.json();
      const { data, error } = await db.update(body).eq('alayacare_visit_id', visitId).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'DELETE' && visitId) {
      const { error } = await db.delete().eq('alayacare_visit_id', visitId);
      if (error) return errorResponse(error.message, 400);
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return errorResponse('method not allowed', 405);
  }

  return errorResponse('not found', 404);
});
```

- [ ] **Step 2: Deploy it**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy alayacare-api --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
```

- [ ] **Step 3: Verify each captured endpoint matches the real shape**

```bash
BASE="https://kjapsnzcaicecjnctmoh.supabase.co/functions/v1/alayacare-api/AlayaCare/v1"

curl -s "$BASE/client-profile/C0100001"
# Expected: flat object, no wrapper, e.g. {"client_id":"C0100001","first_name":"Margaret","last_name":"Voss",...}

curl -s "$BASE/scheduled-visits?client_id=C0100001&page=1"
# Expected: {"count":2,"page":1,"total_pages":1,"items":[{...},{...}]}

VISIT_ID=$(curl -s "$BASE/scheduled-visits?client_id=C0100001" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).items[0].alayacare_visit_id))")
curl -s "$BASE/cancelled-visit/staff-contacts/$VISIT_ID"
# Expected: {"care_team":[{"employee_id":"051201","first_name":"Nathan","last_name":"Brice","role":"Support Worker","email":"..."},{"employee_id":"","first_name":"Simone","last_name":"Achebe","role":"Team Leader","email":"..."}]}
```

- [ ] **Step 4: Verify writes**

```bash
BASE="https://kjapsnzcaicecjnctmoh.supabase.co/functions/v1/alayacare-api/AlayaCare/v1"

curl -s -X POST "$BASE/client-profile" -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"Client","phone_main":"+61400000000"}'
# Expected: 201, generated client_id like "C0100006"

curl -s -X PATCH "$BASE/scheduled-visits/<a-visit-id-from-step-3>" -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
# Expected: 200, updated visit with status "completed"
```

- [ ] **Step 5: Commit**

```bash
git add decoy-src/supabase/functions/alayacare-api
git commit -m "feat(decoy): add alayacare-api edge function (real captured REST shape + inferred writes)"
```

---

### Task 4: Extend `reset-demo` for the `alayacare` schema

**Files:**
- Modify: `decoy-src/supabase/functions/reset-demo/index.ts`

**Interfaces:**
- Consumes: `alayacare.reset_demo_data()` from Task 2.
- Produces: `POST /functions/v1/reset-demo` now accepts `{ "schema": "alayacare" }` in addition to `"dynamics"`.

- [ ] **Step 1: Extend the allow-list**

In `decoy-src/supabase/functions/reset-demo/index.ts`, change:
```ts
const ALLOWED_SCHEMAS = ['dynamics'];
```
to:
```ts
const ALLOWED_SCHEMAS = ['dynamics', 'alayacare'];
```

- [ ] **Step 2: Redeploy**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy reset-demo --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
```

- [ ] **Step 3: Verify**

```bash
curl -s -X POST "https://kjapsnzcaicecjnctmoh.supabase.co/functions/v1/reset-demo" \
  -H "Content-Type: application/json" -d '{"schema":"alayacare"}'
# Expected: {"ok":true}
```
Then re-run Task 2 Step 3's `curl` — should show the original 5 seeded clients again, with any test writes from Task 3 gone.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/supabase/functions/reset-demo
git commit -m "feat(decoy): extend reset-demo to cover the alayacare schema"
```

---

### Task 5: Alayacare types and API hook

**Files:**
- Create: `decoy-src/lib/alayacareTypes.ts`
- Create: `decoy-src/lib/alayacareApi.ts`

**Interfaces:**
- Produces: `AlayacareClient`, `AlayacareVisit`, `CareTeamMember` types.
- Produces: `useAlayacareResource<T>(resource: string, listParams?: Record<string, string>)` returning `{ rows: T[], loading, error, refresh(), insert(values), update(id, values), remove(id) }`, and `useCareTeam(visitId: string | null)` returning `{ careTeam: CareTeamMember[], loading }`. Tasks 8–10 are the consumers.

- [ ] **Step 1: Write the types**

`decoy-src/lib/alayacareTypes.ts`:
```ts
export interface AlayacareClient {
  client_id: string;
  salutation: string | null;
  first_name: string;
  last_name: string;
  birthday: string | null;
  zip: string | null;
  phone_main: string | null;
  ai_agent_opt_out: string | null;
  channels_of_communication: string | null;
  types_of_communication: string | null;
  notification_recipient: string | null;
  contacts: unknown[];
  createdon: string;
}

export interface AlayacareVisit {
  alayacare_visit_id: number;
  alayacare_service_id: number | null;
  employee_id: string | null;
  service_code_id: number | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  start_at: string | null;
  end_at: string | null;
  cancelled: boolean;
  client_id: string | null;
  createdon: string;
}

export interface CareTeamMember {
  employee_id: string | null;
  first_name: string;
  last_name: string;
  role: string | null;
  email: string | null;
}
```

- [ ] **Step 2: Write the API hook**

`decoy-src/lib/alayacareApi.ts`:
```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CareTeamMember } from './alayacareTypes';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1`;

export function useAlayacareResource<T extends { [key: string]: unknown }>(
  resource: string,
  listParams: Record<string, string> = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams(listParams);
    fetch(`${API_BASE}/${resource}?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) setError(body.error.message);
        else setRows(body.items as T[]);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resource, JSON.stringify(listParams)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = useCallback(
    async (values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`insert failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  const update = useCallback(
    async (id: string | number, values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`update failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  const remove = useCallback(
    async (id: string | number) => {
      const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  return { rows, loading, error, refresh, insert, update, remove };
}

export function useCareTeam(visitId: number | null) {
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visitId) {
      setCareTeam([]);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/cancelled-visit/staff-contacts/${visitId}`)
      .then((res) => res.json())
      .then((body) => setCareTeam(body.care_team ?? []))
      .finally(() => setLoading(false));
  }, [visitId]);

  return { careTeam, loading };
}
```

- [ ] **Step 3: Verify**

```bash
cd decoy-src
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/lib/alayacareTypes.ts decoy-src/lib/alayacareApi.ts
git commit -m "feat(decoy): add alayacare types and REST API hook"
```

---

### Task 6: `StatusBadge` component

**Files:**
- Create: `decoy-src/components/StatusBadge.tsx`

**Interfaces:**
- Produces: `<StatusBadge status={string} />`, a colored pill. Consumed by Tasks 8–9.

- [ ] **Step 1: Write the component**

`decoy-src/components/StatusBadge.tsx`:
```tsx
const COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  missed: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd decoy-src
npx tsc --noEmit
```
Expected: no errors (component isn't wired into a page yet, but must compile standalone).

- [ ] **Step 3: Commit**

```bash
git add decoy-src/components/StatusBadge.tsx
git commit -m "feat(decoy): add StatusBadge component"
```

---

### Task 7: Alayacare layout shell (top bar, sidebar, tab row)

**Files:**
- Create: `decoy-src/components/AlayacareTopNav.tsx`
- Create: `decoy-src/components/AlayacareSidebar.tsx`
- Create: `decoy-src/app/alayacare/layout.tsx`

**Interfaces:**
- Consumes: `resetDemoData` from `lib/resetDemoData.ts` (already exists from the Dynamics build; called with `'alayacare'` instead of `'dynamics'`).
- Produces: the shell every Alayacare page (Tasks 8–10) renders inside.

- [ ] **Step 1: Write the top nav**

`decoy-src/components/AlayacareTopNav.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';

export function AlayacareTopNav() {
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all Alayacare demo data to the seed set? This deletes any edits.')) return;
    setResetting(true);
    try {
      await resetDemoData('alayacare');
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between bg-[#0f2a5c] px-4 text-white">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">AlayaCare</span>
        <input
          placeholder="Search clients, employees, contacts"
          disabled
          className="w-72 rounded border-none bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none"
        />
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Reset demo data"
          className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset demo data'}
        </button>
        <span>Admin</span>
        <span className="rounded bg-white/10 px-2 py-1 text-xs">UTC</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold">
          AD
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write the sidebar**

`decoy-src/components/AlayacareSidebar.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
}

const ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/alayacare/dashboard' },
  { label: 'Clients', href: '/alayacare/clients' },
  { label: 'Employees' },
  { label: 'Accounting' },
  { label: 'Schedules', href: '/alayacare/schedules' },
  { label: 'Settings' },
];

export function AlayacareSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-24 shrink-0 bg-[#0f2a5c] py-4 text-center text-white">
      {ITEMS.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={`mb-2 block px-2 py-3 text-xs ${
              pathname === item.href ? 'bg-blue-700 font-medium' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <div key={item.label} title="Not part of this demo" className="mb-2 block cursor-default px-2 py-3 text-xs text-white/40">
            {item.label}
          </div>
        ),
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Write the layout with the secondary tab row**

`decoy-src/app/alayacare/layout.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlayacareTopNav } from '@/components/AlayacareTopNav';
import { AlayacareSidebar } from '@/components/AlayacareSidebar';

const TABS = [
  { label: 'Live Dashboard', href: '/alayacare/dashboard' },
  { label: 'Visit Reports' },
  { label: 'Forms' },
  { label: 'Client Intake' },
  { label: 'Marketplace' },
  { label: 'Data Exploration' },
  { label: 'Tasks' },
];

export default function AlayacareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col">
      <AlayacareTopNav />
      <nav className="flex gap-6 border-b bg-white px-4 text-sm">
        {TABS.map((tab) =>
          tab.href ? (
            <Link
              key={tab.label}
              href={tab.href}
              className={`border-b-2 px-1 py-3 ${
                pathname === tab.href ? 'border-blue-700 font-medium text-blue-800' : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </Link>
          ) : (
            <span key={tab.label} title="Not part of this demo" className="cursor-default border-b-2 border-transparent px-1 py-3 text-gray-300">
              {tab.label}
            </span>
          ),
        )}
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <AlayacareSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
cd decoy-src
npm run build
```
Expected: succeeds (no pages exist under `/alayacare` yet, so nothing renders there at runtime — that's expected until Task 8; the build itself must still succeed).

- [ ] **Step 5: Commit**

```bash
git add decoy-src/components/AlayacareTopNav.tsx decoy-src/components/AlayacareSidebar.tsx decoy-src/app/alayacare/layout.tsx
git commit -m "feat(decoy): add alayacare layout shell (top nav, sidebar, tab row)"
```

---

### Task 8: Clients page

**Files:**
- Create: `decoy-src/app/alayacare/clients/page.tsx`

**Interfaces:**
- Consumes: `useAlayacareResource<AlayacareClient>('client-profile')` from Task 5.

- [ ] **Step 1: Write the page**

`decoy-src/app/alayacare/clients/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useAlayacareResource } from '@/lib/alayacareApi';
import type { AlayacareClient } from '@/lib/alayacareTypes';

type FormState = Omit<AlayacareClient, 'client_id' | 'contacts' | 'createdon'>;

const BLANK: FormState = {
  salutation: '',
  first_name: '',
  last_name: '',
  birthday: '',
  zip: '',
  phone_main: '',
  ai_agent_opt_out: '',
  channels_of_communication: '',
  types_of_communication: '',
  notification_recipient: '',
};

function age(birthday: string | null): string {
  if (!birthday) return '—';
  const diffMs = Date.now() - new Date(birthday).getTime();
  return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function ClientsPage() {
  const { rows, loading, error, insert, update, remove } = useAlayacareResource<AlayacareClient>('client-profile');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: AlayacareClient) {
    setSelectedId(row.client_id);
    setForm({
      salutation: row.salutation ?? '',
      first_name: row.first_name,
      last_name: row.last_name,
      birthday: row.birthday ?? '',
      zip: row.zip ?? '',
      phone_main: row.phone_main ?? '',
      ai_agent_opt_out: row.ai_agent_opt_out ?? '',
      channels_of_communication: row.channels_of_communication ?? '',
      types_of_communication: row.types_of_communication ?? '',
      notification_recipient: row.notification_recipient ?? '',
    });
  }

  function startNew() {
    setSelectedId(null);
    setForm(BLANK);
  }

  async function handleSave() {
    if (selectedId) await update(selectedId, form);
    else await insert(form);
    startNew();
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm('Delete this client?')) return;
    await remove(selectedId);
    startNew();
  }

  const selected = rows.find((r) => r.client_id === selectedId);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Clients</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Postcode</th>
              <th className="p-2 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.client_id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.client_id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.first_name} {row.last_name}</td>
                <td className="p-2">{row.zip}</td>
                <td className="p-2">{row.phone_main}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
            {form.first_name || form.last_name ? initials(form.first_name, form.last_name) : '—'}
          </span>
          <div>
            <div className="flex gap-2">
              <input className="border-none p-0 text-base font-semibold outline-none" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input className="border-none p-0 text-base font-semibold outline-none" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <span className="text-xs text-gray-400">
              {selected ? `${age(form.birthday)} yrs, ${form.zip || '—'}` : 'New client'}
            </span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Salutation</label>
              <input className="w-full rounded border p-2" value={form.salutation ?? ''} onChange={(e) => setForm({ ...form, salutation: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Birthday</label>
              <input type="date" className="w-full rounded border p-2" value={form.birthday ?? ''} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Postcode</label>
            <input className="w-full rounded border p-2" value={form.zip ?? ''} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Phone (main)</label>
            <input className="w-full rounded border p-2" value={form.phone_main ?? ''} onChange={(e) => setForm({ ...form, phone_main: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Preferred channel of communication</label>
            <input className="w-full rounded border p-2" value={form.channels_of_communication ?? ''} onChange={(e) => setForm({ ...form, channels_of_communication: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Notification recipient</label>
            <input className="w-full rounded border p-2" value={form.notification_recipient ?? ''} onChange={(e) => setForm({ ...form, notification_recipient: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 border-t p-4">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

```bash
cd decoy-src
npm run dev
```
Open `http://localhost:3000/decoy/alayacare/clients`. Expected: 5 seeded clients; the list request in devtools Network tab hits `GET .../AlayaCare/v1/client-profile?`; clicking a row populates the form and shows "{age} yrs, {postcode}"; Save on an existing client fires `PATCH .../client-profile/{id}`; New + fill + Save fires `POST .../client-profile` and a new `client_id` like `C0100006` comes back.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/alayacare/clients
git commit -m "feat(decoy): add alayacare clients list/detail page"
```

---

### Task 9: Schedules page (Visits + care team lookup)

**Files:**
- Create: `decoy-src/app/alayacare/schedules/page.tsx`

**Interfaces:**
- Consumes: `useAlayacareResource<AlayacareVisit>('scheduled-visits')`, `useAlayacareResource<AlayacareClient>('client-profile')` (for the client picker), `useCareTeam(visitId)` from Task 5. `<StatusBadge>` from Task 6.

- [ ] **Step 1: Write the page**

`decoy-src/app/alayacare/schedules/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useAlayacareResource, useCareTeam } from '@/lib/alayacareApi';
import { StatusBadge } from '@/components/StatusBadge';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

const STATUSES: AlayacareVisit['status'][] = ['scheduled', 'completed', 'cancelled', 'missed'];

type FormState = Omit<AlayacareVisit, 'alayacare_visit_id' | 'createdon'>;

const BLANK: FormState = {
  alayacare_service_id: null,
  employee_id: '',
  service_code_id: null,
  status: 'scheduled',
  start_at: '',
  end_at: '',
  cancelled: false,
  client_id: null,
};

function toLocalInput(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 16);
}

export default function SchedulesPage() {
  const { rows, loading, error, insert, update, remove } = useAlayacareResource<AlayacareVisit>('scheduled-visits');
  const { rows: clients } = useAlayacareResource<AlayacareClient>('client-profile');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const { careTeam } = useCareTeam(selectedId);

  function clientName(id: string | null) {
    const c = clients.find((c) => c.client_id === id);
    return c ? `${c.first_name} ${c.last_name}` : 'Unassigned';
  }

  function selectRow(row: AlayacareVisit) {
    setSelectedId(row.alayacare_visit_id);
    setForm({
      alayacare_service_id: row.alayacare_service_id,
      employee_id: row.employee_id ?? '',
      service_code_id: row.service_code_id,
      status: row.status,
      start_at: toLocalInput(row.start_at),
      end_at: toLocalInput(row.end_at),
      cancelled: row.cancelled,
      client_id: row.client_id,
    });
  }

  function startNew() {
    setSelectedId(null);
    setForm(BLANK);
  }

  async function handleSave() {
    if (selectedId) await update(selectedId, form);
    else await insert(form);
    startNew();
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm('Delete this visit?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Schedules</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Client</th>
              <th className="p-2 font-medium">Start</th>
              <th className="p-2 font-medium">Employee</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.alayacare_visit_id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.alayacare_visit_id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{clientName(row.client_id)}</td>
                <td className="p-2">{row.start_at ? new Date(row.start_at).toLocaleString() : '—'}</td>
                <td className="p-2">{row.employee_id}</td>
                <td className="p-2"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="rounded bg-white shadow-sm">
          <div className="border-b p-4">
            <h2 className="font-semibold">{selectedId ? 'Edit visit' : 'New visit'}</h2>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
              <select className="w-full rounded border p-2" value={form.client_id ?? ''} onChange={(e) => setForm({ ...form, client_id: e.target.value || null })}>
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Start</label>
                <input type="datetime-local" className="w-full rounded border p-2" value={form.start_at ?? ''} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">End</label>
                <input type="datetime-local" className="w-full rounded border p-2" value={form.end_at ?? ''} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Employee ID</label>
              <input className="w-full rounded border p-2" value={form.employee_id ?? ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
              <select className="w-full rounded border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AlayacareVisit['status'] })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 border-t p-4">
            <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
            {selectedId && (
              <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
            )}
          </div>
        </div>

        {selectedId && (
          <div className="rounded bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium">Care Team</h2>
            <ul className="space-y-1 text-sm">
              {careTeam.map((member, i) => (
                <li key={i} className="flex justify-between border-b pb-1">
                  <span>{member.first_name} {member.last_name}</span>
                  <span className="text-gray-500">{member.role}</span>
                </li>
              ))}
              {careTeam.length === 0 && <li className="text-gray-500">No care team assigned.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open `http://localhost:3000/decoy/alayacare/schedules`. Expected: 8 seeded visits; selecting one calls `GET .../cancelled-visit/staff-contacts/{id}` and shows that client's care team below the form; status badges render with the right colors; New + fill + Save creates a visit.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/alayacare/schedules
git commit -m "feat(decoy): add alayacare schedules (visits) page with care team lookup"
```

---

### Task 10: Dashboard page

**Files:**
- Create: `decoy-src/app/alayacare/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useAlayacareResource<AlayacareClient>('client-profile')`, `useAlayacareResource<AlayacareVisit>('scheduled-visits')` from Task 5; `StatTile`, `BarList`, `DonutChart`, `TrendChart` (already exist from the Dynamics build — system-agnostic, no changes needed).

- [ ] **Step 1: Write the page**

`decoy-src/app/alayacare/dashboard/page.tsx`:
```tsx
'use client';

import { useAlayacareResource } from '@/lib/alayacareApi';
import { StatTile } from '@/components/StatTile';
import { BarList } from '@/components/BarList';
import { DonutChart } from '@/components/DonutChart';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

const STATUS_COLORS: Record<AlayacareVisit['status'], string> = {
  scheduled: '#2a78d6',
  completed: '#1baf7a',
  cancelled: '#e34948',
  missed: '#898781',
};

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export default function AlayacareDashboardPage() {
  const { rows: clients, loading: clientsLoading } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits, loading: visitsLoading } = useAlayacareResource<AlayacareVisit>('scheduled-visits');

  if (clientsLoading || visitsLoading) return <p>Loading…</p>;

  const upcoming = visits.filter((v) => v.start_at && new Date(v.start_at) > new Date() && v.status === 'scheduled');
  const uniqueEmployees = new Set(visits.map((v) => v.employee_id).filter(Boolean)).size;

  const visitsByStatusDonut = (['scheduled', 'completed', 'cancelled', 'missed'] as const).map((status) => ({
    label: status,
    value: visits.filter((v) => v.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const visitsByClient = clients
    .map((c) => ({
      label: `${c.first_name} ${c.last_name}`,
      value: visits.filter((v) => v.client_id === c.client_id).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const upcomingList = [...upcoming]
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime())
    .slice(0, 5)
    .map((v) => ({
      label: `${clients.find((c) => c.client_id === v.client_id)?.first_name ?? 'Unknown'} — ${monthLabel(v.start_at!)}`,
      value: 1,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-700">Live Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total Clients" caption="Active" value={String(clients.length)} />
        <StatTile label="Total Visits" caption="All Statuses" value={String(visits.length)} />
        <StatTile label="Upcoming Visits" caption="Scheduled, Future" value={String(upcoming.length)} />
        <StatTile label="Care Staff" caption="Unique Employees Rostered" value={String(uniqueEmployees)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart title="Visits by Status" slices={visitsByStatusDonut} />
        <BarList title="Visits by Client" items={visitsByClient} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <BarList title="Next 5 Upcoming Visits" items={upcomingList} formatValue={() => ''} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open `http://localhost:3000/decoy/alayacare/dashboard`. Expected: 4 KPI tiles with real counts from the seeded data, a status donut, a per-client bar list, and an upcoming-visits list.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/alayacare/dashboard
git commit -m "feat(decoy): add alayacare live dashboard"
```

---

### Task 11: Help page

**Files:**
- Create: `decoy-src/app/alayacare/help/page.tsx`
- Modify: `decoy-src/components/AlayacareTopNav.tsx` (add a help link)

**Interfaces:**
- Produces: `/alayacare/help`, documenting every `alayacare-api` endpoint with captured-vs-inferred flagged per row.

- [ ] **Step 1: Write the page**

`decoy-src/app/alayacare/help/page.tsx`:
```tsx
const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="space-y-3 text-sm text-gray-700">{children}</div>
    </section>
  );
}

export default function AlayacareHelpPage() {
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Alayacare API Reference</h1>
        <p className="text-sm text-gray-500">
          Three endpoints below (marked <strong>Captured</strong>) reproduce real Alayacare
          integration traffic byte-for-byte. Everything marked <strong>Inferred</strong> was built
          to match that traffic's conventions but was not itself observed in real traffic — treat it
          as plausible, not verified, if you're validating against a real Alayacare tenant.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
      </Section>

      <Section title="Client — GET /client-profile/{client_id} (Captured)">
        <Code>{`GET ${BASE}/client-profile/C0100001

→ 200 OK
{
  "client_id": "C0100001",
  "salutation": "Mrs",
  "first_name": "Margaret",
  "last_name": "Voss",
  "birthday": "1938-03-14",
  "zip": "3220",
  "phone_main": "+61411300001",
  "ai_agent_opt_out": "",
  "channels_of_communication": "Phone Call",
  "types_of_communication": "",
  "notification_recipient": "Client",
  "contacts": []
}`}</Code>
      </Section>

      <Section title="Client — GET /client-profile (Inferred: list-all)">
        <p>Same pagination envelope as the captured scheduled-visits endpoint, applied here by inference.</p>
        <Code>{`GET ${BASE}/client-profile?page=1

→ 200 OK
{ "count": 5, "page": 1, "total_pages": 1, "items": [ { "client_id": "C0100001", ... }, ... ] }`}</Code>
      </Section>

      <Section title="Client — POST / PATCH / DELETE (Inferred)">
        <Code>{`POST ${BASE}/client-profile
Content-Type: application/json

{ "first_name": "Jordan", "last_name": "Reyes", "phone_main": "+61400111222" }

→ 201 Created  (client_id is generated, e.g. "C0100006")

PATCH ${BASE}/client-profile/C0100006
{ "phone_main": "+61400111333" }
→ 200 OK

DELETE ${BASE}/client-profile/C0100006
→ 204 No Content`}</Code>
      </Section>

      <Section title="Visits — GET /scheduled-visits (Captured shape, params relaxed)">
        <p>
          The real capture always passed <code>client_id</code>; here it's optional, so a
          schedules view can list all visits. <code>start_at</code>/<code>end_at</code> are also
          optional range filters.
        </p>
        <Code>{`GET ${BASE}/scheduled-visits?client_id=C0100001&page=1

→ 200 OK
{
  "count": 2,
  "page": 1,
  "total_pages": 1,
  "items": [
    {
      "alayacare_visit_id": 1,
      "alayacare_service_id": 610001,
      "employee_id": "051201",
      "service_code_id": 43,
      "status": "scheduled",
      "start_at": "2026-08-20T05:25:00+00:00",
      "end_at": "2026-08-20T06:25:00+00:00",
      "cancelled": false,
      "client_id": "C0100001"
    }
  ]
}`}</Code>
      </Section>

      <Section title="Visits — POST / PATCH / DELETE (Inferred)">
        <Code>{`POST ${BASE}/scheduled-visits
{ "client_id": "C0100001", "employee_id": "051201", "status": "scheduled", "start_at": "2026-09-01T05:00:00+00:00", "end_at": "2026-09-01T06:00:00+00:00" }
→ 201 Created

PATCH ${BASE}/scheduled-visits/1
{ "status": "completed" }
→ 200 OK

DELETE ${BASE}/scheduled-visits/1
→ 204 No Content`}</Code>
      </Section>

      <Section title="Care team — GET /cancelled-visit/staff-contacts/{visit_id} (Captured)">
        <p>
          Read-only. Returns the care team assigned to the visit&apos;s client — note the path says
          &quot;cancelled-visit&quot; but this works for any visit, cancelled or not; that&apos;s a
          real quirk of the source system&apos;s naming, kept intact here on purpose.
        </p>
        <Code>{`GET ${BASE}/cancelled-visit/staff-contacts/1

→ 200 OK
{
  "care_team": [
    { "employee_id": "051201", "first_name": "Nathan", "last_name": "Brice", "role": "Support Worker", "email": "nbrice@agedcaredemo.example" },
    { "employee_id": "", "first_name": "Simone", "last_name": "Achebe", "role": "Team Leader", "email": "sachebe@agedcaredemo.example" }
  ]
}`}</Code>
      </Section>

      <Section title="Using this from a Webex Contact Center flow">
        <p>
          Same pattern as the Dynamics reference: an HTTP Request activity can call any endpoint
          above directly. CORS is enabled (<code>Access-Control-Allow-Origin: *</code>), so
          browser-based flow steps work too, not just server-side ones.
        </p>
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: Add the help link to the top nav**

In `decoy-src/components/AlayacareTopNav.tsx`, add an import and a link next to the reset button:
```tsx
import Link from 'next/link';
```
And in the right-side `div`, before the reset button:
```tsx
<Link href="/alayacare/help" title="API Help" className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10">
  ?
</Link>
```

- [ ] **Step 3: Verify**

```bash
cd decoy-src
npx tsc --noEmit
npm run build
```
Expected: no errors; `dynamics-src/out/alayacare/help/index.html` produced.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/app/alayacare/help decoy-src/components/AlayacareTopNav.tsx
git commit -m "feat(decoy): add alayacare API reference page, link from top nav"
```

---

### Task 12: Build and deploy Alayacare to the site

**Files:**
- Modify: `wxcc-build/decoy/` (build output, copied — not hand-written)

**Interfaces:**
- Consumes: `decoy-src/out/` produced by `npm run build`, now including `/alayacare/*` routes from Tasks 7–11.

- [ ] **Step 1: Build the static export**

```bash
cd decoy-src
npm run build
```
Expected: `decoy-src/out/alayacare/dashboard/index.html`, `.../clients/index.html`, `.../schedules/index.html`, `.../help/index.html` all present, alongside the existing `/dynamics/*` routes.

- [ ] **Step 2: Copy output into the deploy path**

```bash
cd "c:\Users\grant.hansen\AppData\Local\Temp\wxcc-build"
rm -rf decoy && mkdir -p decoy && cp -r decoy-src/out/. decoy/
```

- [ ] **Step 3: Verify locally**

```bash
npx --yes serve -l 4173 .
```
In another shell:
```bash
curl -s -o /dev/null -w "clients: %{http_code}\n" http://localhost:4173/decoy/alayacare/clients/
curl -s -o /dev/null -w "schedules: %{http_code}\n" http://localhost:4173/decoy/alayacare/schedules/
curl -s -o /dev/null -w "dashboard: %{http_code}\n" http://localhost:4173/decoy/alayacare/dashboard/
curl -s -o /dev/null -w "help: %{http_code}\n" http://localhost:4173/decoy/alayacare/help/
```
Expected: all 200.

- [ ] **Step 4: Commit**

```bash
git add decoy
git commit -m "feat(decoy): build and deploy alayacare v1 to /decoy/"
```

---

### Task 13: Cross-system switcher

**Files:**
- Create: `decoy-src/components/SystemSwitcher.tsx`
- Modify: `decoy-src/app/layout.tsx`

**Interfaces:**
- Produces: a persistent top banner rendered above both `/dynamics/*` and `/alayacare/*` (and every other route), linking between the two systems' dashboards.

- [ ] **Step 1: Write the switcher**

`decoy-src/components/SystemSwitcher.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SYSTEMS = [
  { label: 'Dynamics 365', href: '/dynamics/dashboard', prefix: '/dynamics' },
  { label: 'Alayacare', href: '/alayacare/dashboard', prefix: '/alayacare' },
];

export function SystemSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex h-8 items-center gap-4 bg-black px-4 text-xs text-white">
      <span className="font-semibold uppercase tracking-wide text-white/50">Decoy</span>
      {SYSTEMS.map((system) => (
        <Link
          key={system.href}
          href={system.href}
          className={pathname?.startsWith(system.prefix) ? 'font-semibold text-white' : 'text-white/60 hover:text-white'}
        >
          {system.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the root layout**

`decoy-src/app/layout.tsx` — add the import and render it as the first child of `body`, above `{children}`:
```tsx
import './globals.css';
import { SystemSwitcher } from '@/components/SystemSwitcher';

export const metadata = { title: "Decoy - ArchiTech's own CRM/EMR/PAS/EHR Simulator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <SystemSwitcher />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

```bash
cd decoy-src
npx tsc --noEmit
rm -rf out .next
npm run build
```
Expected: no errors; every route's HTML now includes the switcher banner (spot-check `grep -l "System" out/dynamics/dashboard/index.html out/alayacare/dashboard/index.html`).

- [ ] **Step 4: Copy, verify locally, and commit**

```bash
cd "c:\Users\grant.hansen\AppData\Local\Temp\wxcc-build"
rm -rf decoy && mkdir -p decoy && cp -r decoy-src/out/. decoy/
git add decoy decoy-src/components/SystemSwitcher.tsx decoy-src/app/layout.tsx
git commit -m "feat(decoy): add cross-system switcher banner (Dynamics <-> Alayacare)"
```

- [ ] **Step 5: Push**

```bash
git fetch origin
git log HEAD..origin/master --oneline
git push origin master
```
Only push if the fetch shows no unexpected upstream commits (or after merging them per `CLAUDE.md`'s guidance) — this is what makes GitHub Pages actually serve the finished Alayacare build.

---

## What's next (not in this plan)

Employee, Tasks, Extensions (need real captures first), Client Intelligence
(risk scoring — its own spec/plan cycle), and Epic (FHIR EHR, the last
system in the original build order) all come after this ships.
