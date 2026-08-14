# Decoy — Dynamics v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a live-editable Dynamics 365 CRM demo (Accounts, Contacts, Opportunities, Leads, Notes) where the browser talks to the backend using the real Dataverse Web API (OData v4) request shape — same URLs, query params, body format, and headers a genuine Dynamics integration would use — deployed as a static-export Next.js app at `architechdemo.com/decoy/`.

**Architecture:** Next.js app (source at `decoy-src/` in this repo — see Constraint below) never calls Postgres or `supabase-js` directly from the browser. Instead it calls a Supabase Edge Function (`dataverse-api`) that exposes `GET/POST/PATCH/DELETE .../api/data/v9.2/<entityset>[(id)]` with `$select`/`$expand`/`$orderby` and `"<lookup>@odata.bind"` FK writes — the actual Dataverse Web API surface — and that function translates the request into a query against the `dynamics` Postgres schema. What appears in a browser's network tab during a demo is the same request shape a real Dynamics integration sends. A separate "Reset demo data" button calls a second, bespoke Edge Function (service-role privileged) — reset has no real-Dynamics equivalent, so it isn't part of the API shim.

**Tech Stack:** Next.js 14 (App Router, `output: 'export'`), TypeScript, Tailwind CSS, Supabase Postgres + Edge Functions (Deno, using `@supabase/supabase-js` server-side only inside the functions). No `supabase-js` in the browser bundle — the frontend only ever does `fetch()`. No app test framework (spec requirement — this is a sales demo).

**Spec:** `docs/superpowers/specs/2026-08-14-decoy-design.md`

## Global Constraints

- `output: 'export'` and `basePath: '/decoy'` in `next.config.mjs` (spec: static export, deploy-only repo).
- One Supabase project; `dynamics` lives in its own Postgres schema, never mixed into `public` or a future `alayacare`/`epic` schema (spec: schema-per-system).
- **Schema fidelity**: table and column names match real Dataverse logical names (`account`/`accountid`, `contact`/`parentcustomerid`, `opportunity`/`estimatedvalue`/`salesstage`, `lead`/`statuscode`, `annotation` for Notes). Capped scope: no `systemuser`/`ownerid`, no dual `statecode`+`statuscode`, no `createdby`/`modifiedby` — user confirmed only the manipulable demo data (customer details, notes, phone, email) needs to be schema-accurate.
- **API fidelity**: the browser talks to the backend using real Dataverse Web API v9.2 shape (URL pattern, `$select`/`$expand`/`$orderby`, `@odata.bind` for lookups, `{"@odata.context":...,"value":[...]}` envelopes, `OData-MaxVersion`/`OData-Version: 4.0` headers, 204-on-PATCH/DELETE, 201-with-body-on-POST). Capped scope: only the exact call shapes the four entity pages use — not a general OData parser.
- No app test framework. Verification steps in this plan are manual (build succeeds, `curl`/browser checks) — do not add Jest/Vitest/Playwright (spec: no test framework, sales demo not a product).
- Decoy has no login of its own — every page loads open (spec: open, no login). The Dataverse shim sends a cosmetic static `Authorization: Bearer` header (looks like a real OAuth-authenticated call in the network tab) — the Edge Function ignores its value.
- Reset-to-seed is the only privileged operation, stays on its own Edge Function (service role), never callable with by the browser directly — its DB function has `EXECUTE` revoked from `anon`/`authenticated`.
- Use `npm`, not `pnpm` (`CONTEXT.md`: pnpm fails on Google Drive paths; npm is the repo-wide convention regardless of source location).
- Deploy target: static export output copied into `wxcc-build/decoy/` at repo root, with a new TOC row added to root `index.html` (repo convention for all existing demos).
- Source deviation from spec: spec says source lives in a separate `thesenate/projects/decoy` dir on Google Drive. That drive isn't mounted in this environment, so source lives at `decoy-src/` inside this repo instead (git-tracked, `node_modules`/`.next`/`out` ignored) — same as the existing `emrdemo` demo already does it. Functionally equivalent; only the source location differs from the spec's example path.

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `decoy-src/package.json`
- Create: `decoy-src/next.config.mjs`
- Create: `decoy-src/tsconfig.json`
- Create: `decoy-src/tailwind.config.ts`
- Create: `decoy-src/postcss.config.mjs`
- Create: `decoy-src/app/layout.tsx`
- Create: `decoy-src/app/globals.css`
- Create: `decoy-src/app/page.tsx`
- Modify: `.gitignore` (repo root)

**Interfaces:**
- Produces: a working `npm run dev` and `npm run build` (emits `decoy-src/out/`) for every later task to add pages into.

- [ ] **Step 1: Create the app scaffold**

```bash
cd "c:\Users\grant.hansen\AppData\Local\Temp\wxcc-build"
mkdir decoy-src
cd decoy-src
npm init -y
npm install next@14 react@18 react-dom@18
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer
```

- [ ] **Step 2: Write `package.json` scripts**

Note: no `@supabase/supabase-js` dependency here — the browser only does `fetch()`; `supabase-js` is used server-side inside the Edge Functions (Tasks 3–4), imported there directly from `esm.sh`, not from this package.json.

```json
{
  "name": "decoy",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/react": "18.3.3",
    "@types/node": "20.14.15",
    "tailwindcss": "3.4.7",
    "postcss": "8.4.40",
    "autoprefixer": "10.4.19"
  }
}
```

Then install the pinned versions: `npm install`.

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/decoy',
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write Tailwind config and CSS**

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

`postcss.config.mjs`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Write root layout and placeholder home page**

`app/layout.tsx`:
```tsx
import './globals.css';

export const metadata = { title: 'Decoy' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
```

`app/page.tsx` (redirects to Dynamics accounts once that page exists — for now, a placeholder):
```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Decoy</h1>
      <p className="mt-2 text-gray-600">System demos load under their own section.</p>
    </main>
  );
}
```

- [ ] **Step 7: Add ignores for the new source dir**

Add to root `.gitignore`:
```
decoy-src/node_modules
decoy-src/.next
decoy-src/out
```

- [ ] **Step 8: Verify build**

```bash
cd decoy-src
npm run build
```
Expected: completes without error, produces `decoy-src/out/index.html`.

- [ ] **Step 9: Commit**

```bash
git add decoy-src .gitignore
git commit -m "feat(decoy): scaffold Next.js static-export app"
```

---

### Task 2: Supabase schema, RLS, and seed data for Dynamics (Dataverse field names)

**Files:**
- Create: `decoy-src/supabase/migrations/0001_dynamics_schema.sql`
- Create: `decoy-src/supabase/seed/dynamics.sql`

**Interfaces:**
- Produces: Postgres schema `dynamics` with tables `account`, `contact`, `opportunity`, `lead`, `annotation` (Notes — polymorphic, attaches to any of the other four via `objectid`/`objecttypecode`), using real Dataverse logical column names. A `dynamics.reset_demo_data()` function Task 4's Edge Function will call. Task 3's Edge Function will map these table names to Dataverse entity-set names (`accounts`, `contacts`, `opportunities`, `leads`, `annotations`).

- [ ] **Step 1: Write the schema migration**

`decoy-src/supabase/migrations/0001_dynamics_schema.sql`:
```sql
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
```

- [ ] **Step 2: Write the seed script as a reusable reset function**

`decoy-src/supabase/seed/dynamics.sql`:
```sql
create or replace function dynamics.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = dynamics, pg_temp
as $$
begin
  truncate table dynamics.annotation, dynamics.opportunity, dynamics.contact, dynamics.lead, dynamics.account restart identity cascade;

  insert into dynamics.account (accountid, name, telephone1, websiteurl, address1_line1, address1_city, address1_stateorprovince, address1_postalcode, address1_country, industrycode) values
    ('11111111-1111-1111-1111-111111111111', 'Northwind Health', '02 9000 1111', 'northwindhealth.example', '1 Flinders St', 'Melbourne', 'VIC', '3000', 'Australia', 'Healthcare'),
    ('11111111-1111-1111-1111-111111111112', 'Contoso Aged Care', '02 9000 1112', 'contosoagedcare.example', '22 George St', 'Sydney', 'NSW', '2000', 'Australia', 'Aged Care'),
    ('11111111-1111-1111-1111-111111111113', 'Fabrikam Retail', '02 9000 1113', 'fabrikamretail.example', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia', 'Retail');

  insert into dynamics.contact (contactid, parentcustomerid, firstname, lastname, jobtitle, emailaddress1, emailaddress2, telephone1, telephone2, mobilephone, address1_line1, address1_city, address1_stateorprovince, address1_postalcode, address1_country) values
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nathan', 'IT Director', 'priya.nathan@northwindhealth.example', null, '02 9000 1121', null, '0400 111 221', '1 Flinders St', 'Melbourne', 'VIC', '3000', 'Australia'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Tom', 'Reilly', 'Operations Manager', 'tom.reilly@contosoagedcare.example', null, '02 9000 1122', null, '0400 111 222', '22 George St', 'Sydney', 'NSW', '2000', 'Australia'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111113', 'Ava', 'Chen', 'CX Lead', 'ava.chen@fabrikamretail.example', null, '02 9000 1123', null, '0400 111 223', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia');

  insert into dynamics.opportunity (opportunityid, parentaccountid, parentcontactid, name, estimatedvalue, estimatedclosedate, salesstage) values
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Contact Centre Modernisation', 185000, '2026-10-15', 'Develop'),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Scheduling Integration', 92000, '2026-09-01', 'Propose'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222223', 'Digital Front Door Rollout', 260000, '2026-11-30', 'Qualify');

  insert into dynamics.lead (leadid, firstname, lastname, companyname, subject, emailaddress1, telephone1, mobilephone, statuscode) values
    ('44444444-4444-4444-4444-444444444441', 'Sam', 'Doyle', 'Woodgrove Bank', 'Interested in contact centre demo', 'sam.doyle@woodgrove.example', '02 9000 1441', '0400 111 441', 'New'),
    ('44444444-4444-4444-4444-444444444442', 'Lena', 'Kaur', 'Adatum Insurance', 'Requested pricing for scheduling module', 'lena.kaur@adatum.example', '02 9000 1442', '0400 111 442', 'Contacted');

  insert into dynamics.annotation (objectid, objecttypecode, subject, notetext) values
    ('22222222-2222-2222-2222-222222222221', 'contact', 'Renewal call', 'Discussed renewal timeline, wants a demo of the reporting dashboard before committing.'),
    ('22222222-2222-2222-2222-222222222222', 'contact', 'Onboarding note', 'Prefers email over phone. Best reached after 2pm.');
end;
$$;

-- Only the service role (used by the Edge Function) may call this.
revoke execute on function dynamics.reset_demo_data() from public, anon, authenticated;
grant execute on function dynamics.reset_demo_data() to service_role;

-- Run it once now to populate initial data.
select dynamics.reset_demo_data();
```

- [ ] **Step 3: Apply both files to the Supabase project**

```bash
cd decoy-src
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db execute --file supabase/migrations/0001_dynamics_schema.sql
npx supabase db execute --file supabase/seed/dynamics.sql
```
Expected: both run with no errors.

- [ ] **Step 4: Verify via REST**

```bash
curl "https://<project-ref>.supabase.co/rest/v1/account?select=name" \
  -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>" \
  -H "Accept-Profile: dynamics"
```
Expected: JSON array of the 3 seeded account names.

- [ ] **Step 5: Commit**

```bash
git add decoy-src/supabase
git commit -m "feat(decoy): add dynamics schema (Dataverse field names), RLS policies, notes table, and seed/reset function"
```

---

### Task 3: Dataverse Web API shim (Edge Function)

**Files:**
- Create: `decoy-src/supabase/functions/dataverse-api/index.ts`

**Interfaces:**
- Consumes: `dynamics.account`/`contact`/`opportunity`/`lead`/`annotation` tables from Task 2.
- Produces: `GET/POST/PATCH/DELETE {SUPABASE_URL}/functions/v1/dataverse-api/api/data/v9.2/<entityset>[(id)]` — the real Dataverse Web API v9.2 URL/query/body shape. Task 5's `useDataverseTable` hook is the only consumer.
  - `GET .../accounts?$select=...&$orderby=...&$expand=<nav>($select=...)` → `200 {"@odata.context": "$metadata#accounts", "value": [...]}`
  - `GET .../accounts(id)` → `200 <entity object>`
  - `POST .../contacts` body may include `"parentcustomerid_account@odata.bind": "/accounts(guid)"` → `201 <created entity>`
  - `PATCH .../contacts(id)` (same body shape) → `204`
  - `DELETE .../contacts(id)` → `204`

- [ ] **Step 1: Write the function**

`decoy-src/supabase/functions/dataverse-api/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface LookupDef {
  bindProperty: string;
  targetSet: string;
  targetTable: string;
  targetPk: string;
}

interface EntityConfig {
  table: string;
  pk: string;
  lookups: Record<string, LookupDef>;
}

const ENTITIES: Record<string, EntityConfig> = {
  accounts: { table: 'account', pk: 'accountid', lookups: {} },
  contacts: {
    table: 'contact',
    pk: 'contactid',
    lookups: {
      parentcustomerid: {
        bindProperty: 'parentcustomerid_account',
        targetSet: 'accounts',
        targetTable: 'account',
        targetPk: 'accountid',
      },
    },
  },
  opportunities: {
    table: 'opportunity',
    pk: 'opportunityid',
    lookups: {
      parentaccountid: {
        bindProperty: 'parentaccountid_account',
        targetSet: 'accounts',
        targetTable: 'account',
        targetPk: 'accountid',
      },
      parentcontactid: {
        bindProperty: 'parentcontactid_contact',
        targetSet: 'contacts',
        targetTable: 'contact',
        targetPk: 'contactid',
      },
    },
  },
  leads: { table: 'lead', pk: 'leadid', lookups: {} },
  annotations: { table: 'annotation', pk: 'annotationid', lookups: {} },
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function parsePath(pathname: string) {
  const match = pathname.match(/\/api\/data\/v9\.2\/([a-z]+)(?:\(([0-9a-fA-F-]+)\))?$/);
  if (!match) return null;
  return { entitySet: match[1], id: match[2] as string | undefined };
}

function guidFromBind(bindValue: string): string | null {
  const match = bindValue.match(/\(([0-9a-fA-F-]+)\)$/);
  return match ? match[1] : null;
}

function translateWriteBody(config: EntityConfig, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const bindKeyToColumn = new Map(
    Object.entries(config.lookups).map(([column, lookup]) => [`${lookup.bindProperty}@odata.bind`, column]),
  );
  for (const [key, value] of Object.entries(body)) {
    const column = bindKeyToColumn.get(key);
    if (column) {
      out[column] = typeof value === 'string' ? guidFromBind(value) : null;
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function expandRows(
  config: EntityConfig,
  rows: Record<string, unknown>[],
  expandParam: string | null,
) {
  if (!expandParam) return rows;
  const match = expandParam.match(/^([a-zA-Z_]+)(?:\(\$select=([a-zA-Z0-9_,]+)\))?$/);
  if (!match) return rows;
  const [, navProperty, selectList] = match;
  const entry = Object.entries(config.lookups).find(([, l]) => l.bindProperty === navProperty);
  if (!entry) return rows;
  const [column, lookup] = entry;
  const ids = [...new Set(rows.map((r) => r[column]).filter((v): v is string => typeof v === 'string'))];
  if (ids.length === 0) return rows;
  const cols = selectList ? `${lookup.targetPk},${selectList}` : '*';
  const { data: related } = await supabase
    .schema('dynamics')
    .from(lookup.targetTable)
    .select(cols)
    .in(lookup.targetPk, ids);
  const byId = new Map((related ?? []).map((r: any) => [r[lookup.targetPk], r]));
  return rows.map((r) => ({ ...r, [navProperty]: byId.get(r[column] as string) ?? null }));
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parsed = parsePath(url.pathname);
  if (!parsed) {
    return new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 });
  }

  const config = ENTITIES[parsed.entitySet];
  if (!config) {
    return new Response(JSON.stringify({ error: { message: `unknown entity set ${parsed.entitySet}` } }), {
      status: 404,
    });
  }

  const db = supabase.schema('dynamics').from(config.table);
  const jsonHeaders = { 'content-type': 'application/json', 'odata-version': '4.0' };

  if (req.method === 'GET' && !parsed.id) {
    const select = url.searchParams.get('$select') ?? '*';
    const orderby = url.searchParams.get('$orderby');
    let query = db.select(select);
    if (orderby) {
      const [col, dir] = orderby.trim().split(/\s+/);
      query = query.order(col, { ascending: (dir ?? 'asc').toLowerCase() !== 'desc' });
    } else {
      query = query.order('createdon', { ascending: false });
    }
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 });
    const expanded = await expandRows(config, data ?? [], url.searchParams.get('$expand'));
    return new Response(
      JSON.stringify({ '@odata.context': `$metadata#${parsed.entitySet}`, value: expanded }),
      { headers: jsonHeaders },
    );
  }

  if (req.method === 'GET' && parsed.id) {
    const { data, error } = await db.select('*').eq(config.pk, parsed.id).single();
    if (error) return new Response(JSON.stringify({ error: { message: error.message } }), { status: 404 });
    return new Response(JSON.stringify(data), { headers: jsonHeaders });
  }

  if (req.method === 'POST') {
    const body = translateWriteBody(config, await req.json());
    const { data, error } = await db.insert(body).select('*').single();
    if (error) return new Response(JSON.stringify({ error: { message: error.message } }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 201, headers: jsonHeaders });
  }

  if (req.method === 'PATCH' && parsed.id) {
    const body = translateWriteBody(config, await req.json());
    const { error } = await db.update(body).eq(config.pk, parsed.id);
    if (error) return new Response(JSON.stringify({ error: { message: error.message } }), { status: 400 });
    return new Response(null, { status: 204 });
  }

  if (req.method === 'DELETE' && parsed.id) {
    const { error } = await db.delete().eq(config.pk, parsed.id);
    if (error) return new Response(JSON.stringify({ error: { message: error.message } }), { status: 400 });
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: { message: 'method not allowed' } }), { status: 405 });
});
```

- [ ] **Step 2: Deploy it**

```bash
cd decoy-src
npx supabase functions deploy dataverse-api --no-verify-jwt
```
`--no-verify-jwt` because Decoy has no login (Global Constraints) — the frontend sends a cosmetic static bearer token, not a real Supabase JWT.

- [ ] **Step 3: Verify each verb**

```bash
BASE="https://<project-ref>.supabase.co/functions/v1/dataverse-api/api/data/v9.2"

curl "$BASE/accounts?\$select=name&\$orderby=name" -H "Accept: application/json"
# Expected: {"@odata.context":"$metadata#accounts","value":[{"name":"Contoso Aged Care"}, ...]}

curl "$BASE/contacts?\$expand=parentcustomerid_account(\$select=name)"
# Expected: each contact has a nested "parentcustomerid_account": {"accountid": "...", "name": "..."}

curl -X POST "$BASE/leads" -H "Content-Type: application/json" \
  -d '{"firstname":"Test","lastname":"Lead","subject":"Verify POST","statuscode":"New"}'
# Expected: 201 with the created lead including a generated leadid

curl -X DELETE "$BASE/leads(<the-leadid-from-above>)"
# Expected: 204 empty body
```

- [ ] **Step 4: Commit**

```bash
git add decoy-src/supabase/functions/dataverse-api
git commit -m "feat(decoy): add dataverse-api edge function (real Dataverse Web API shape over dynamics schema)"
```

---

### Task 4: Reset Edge Function

**Files:**
- Create: `decoy-src/supabase/functions/reset-demo/index.ts`

**Interfaces:**
- Consumes: `dynamics.reset_demo_data()` from Task 2 (service-role only).
- Produces: `POST /functions/v1/reset-demo` with body `{ "schema": "dynamics" }` → `200 { "ok": true }`. This is a bespoke demo-control endpoint, not part of the Dataverse Web API shim in Task 3 — it has no real-Dynamics equivalent. Later systems (`alayacare`, `epic`) add their own `reset_demo_data()` function in their schema and this same function routes to it — the `schema` field is validated against an allow-list here so it never runs arbitrary SQL.

- [ ] **Step 1: Write the function**

`decoy-src/supabase/functions/reset-demo/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ALLOWED_SCHEMAS = ['dynamics'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  const { schema } = await req.json().catch(() => ({ schema: undefined }));

  if (typeof schema !== 'string' || !ALLOWED_SCHEMAS.includes(schema)) {
    return new Response(JSON.stringify({ error: 'unknown schema' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.schema(schema).rpc('reset_demo_data');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy it**

```bash
cd decoy-src
npx supabase functions deploy reset-demo --no-verify-jwt
```

- [ ] **Step 3: Verify**

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/reset-demo" \
  -H "Content-Type: application/json" \
  -d '{"schema":"dynamics"}'
```
Expected: `{"ok":true}`. Re-run the Task 3 Step 3 `accounts` `curl` afterward — same 3 account names should reappear even after manually deleting/editing rows in between.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/supabase/functions/reset-demo
git commit -m "feat(decoy): add reset-demo edge function"
```

---

### Task 5: Dataverse API client hook and shared types

**Files:**
- Create: `decoy-src/lib/types.ts`
- Create: `decoy-src/lib/dataverseApi.ts`
- Create: `decoy-src/lib/resetDemoData.ts`
- Create: `decoy-src/.env.local` (untracked — real project values)
- Create: `decoy-src/.env.local.example` (tracked — placeholder values, documents required vars)

**Interfaces:**
- Produces: `useDataverseTable<T>(entitySet: string, lookups?: LookupConfig, expand?: string)` returning `{ rows: T[], loading: boolean, error: string | null, refresh(): void, insert(values): Promise<void>, update(id, values): Promise<void>, remove(id): Promise<void> }`. Every entity page in Tasks 6–9 consumes this against Task 3's `dataverse-api` function.
- Produces: `resetDemoData(schema: string): Promise<void>`, calling Task 4's `reset-demo` function. Consumed by Task 6's `TopNav`.
- Produces: `Account`, `Contact`, `Opportunity`, `Lead`, `Annotation` types from `lib/types.ts`, including the optional expanded-nav-property fields (`parentcustomerid_account`, `parentaccountid_account`, `parentcontactid_contact`) that show up when a page requests `$expand`.

- [ ] **Step 1: Write env files**

`decoy-src/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
```

`decoy-src/.env.local` (fill in the real value from the Supabase dashboard, gitignored by the root `.env*` rule already in `.gitignore`):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```
No anon key needed client-side — the frontend never talks to Supabase's own REST/Postgres endpoints, only to the two Edge Functions, which don't require the `apikey` header.

- [ ] **Step 2: Write shared types**

`decoy-src/lib/types.ts`:
```ts
export interface Account {
  accountid: string;
  name: string;
  telephone1: string | null;
  websiteurl: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_stateorprovince: string | null;
  address1_postalcode: string | null;
  address1_country: string | null;
  industrycode: string | null;
  createdon: string;
}

export interface Contact {
  contactid: string;
  parentcustomerid: string | null;
  firstname: string;
  lastname: string;
  jobtitle: string | null;
  emailaddress1: string | null;
  emailaddress2: string | null;
  telephone1: string | null;
  telephone2: string | null;
  mobilephone: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_stateorprovince: string | null;
  address1_postalcode: string | null;
  address1_country: string | null;
  createdon: string;
  parentcustomerid_account?: { accountid: string; name: string } | null;
}

export interface Opportunity {
  opportunityid: string;
  parentaccountid: string | null;
  parentcontactid: string | null;
  name: string;
  estimatedvalue: number | null;
  estimatedclosedate: string | null;
  salesstage: 'Qualify' | 'Develop' | 'Propose' | 'Close';
  createdon: string;
  parentaccountid_account?: { accountid: string; name: string } | null;
  parentcontactid_contact?: { contactid: string; firstname: string; lastname: string } | null;
}

export interface Lead {
  leadid: string;
  firstname: string;
  lastname: string;
  companyname: string | null;
  subject: string;
  emailaddress1: string | null;
  telephone1: string | null;
  mobilephone: string | null;
  leadsourcecode: string | null;
  statuscode: 'New' | 'Contacted' | 'Qualified' | 'Disqualified';
  createdon: string;
}

export interface Annotation {
  annotationid: string;
  objectid: string;
  objecttypecode: 'account' | 'contact' | 'lead' | 'opportunity';
  subject: string | null;
  notetext: string | null;
  createdon: string;
}
```

- [ ] **Step 3: Write the Dataverse API hook**

`decoy-src/lib/dataverseApi.ts`:
```ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dataverse-api/api/data/v9.2`;

const ODATA_HEADERS = {
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0',
  'Content-Type': 'application/json; charset=utf-8',
  Accept: 'application/json',
  Authorization: 'Bearer demo-token',
};

export interface LookupConfig {
  [column: string]: { bindProperty: string; targetSet: string };
}

export function useDataverseTable<T extends Record<string, unknown>>(
  entitySet: string,
  lookups: LookupConfig = {},
  expand?: string,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ $orderby: 'createdon desc' });
    if (expand) params.set('$expand', expand);
    fetch(`${API_BASE}/${entitySet}?${params.toString()}`, { headers: ODATA_HEADERS })
      .then((res) => res.json())
      .then((body) => {
        if (body.error) setError(body.error.message);
        else setRows(body.value as T[]);
        setLoading(false);
      });
  }, [entitySet, expand]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function toWireBody(values: Partial<T>) {
    const out: Record<string, unknown> = { ...values };
    for (const [column, lookup] of Object.entries(lookups)) {
      if (column in out) {
        const value = out[column];
        delete out[column];
        if (value) out[`${lookup.bindProperty}@odata.bind`] = `/${lookup.targetSet}(${value})`;
      }
    }
    return out;
  }

  const insert = useCallback(
    async (values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${entitySet}`, {
        method: 'POST',
        headers: ODATA_HEADERS,
        body: JSON.stringify(toWireBody(values)),
      });
      if (!res.ok) throw new Error(`insert failed: ${res.status}`);
      refresh();
    },
    [entitySet, lookups, refresh],
  );

  const update = useCallback(
    async (id: string, values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${entitySet}(${id})`, {
        method: 'PATCH',
        headers: ODATA_HEADERS,
        body: JSON.stringify(toWireBody(values)),
      });
      if (!res.ok) throw new Error(`update failed: ${res.status}`);
      refresh();
    },
    [entitySet, lookups, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`${API_BASE}/${entitySet}(${id})`, {
        method: 'DELETE',
        headers: ODATA_HEADERS,
      });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      refresh();
    },
    [entitySet, refresh],
  );

  return { rows, loading, error, refresh, insert, update, remove };
}
```

- [ ] **Step 4: Write the reset helper**

`decoy-src/lib/resetDemoData.ts`:
```ts
export async function resetDemoData(schema: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema }),
  });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}
```

- [ ] **Step 5: Verify**

```bash
cd decoy-src
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add decoy-src/lib decoy-src/.env.local.example
git commit -m "feat(decoy): add dataverse api hook, reset helper, and dataverse-shaped types"
```

---

### Task 6: Dynamics layout and top nav (with Reset button)

**Files:**
- Create: `decoy-src/app/dynamics/layout.tsx`
- Create: `decoy-src/components/TopNav.tsx`
- Modify: `decoy-src/app/page.tsx`

**Interfaces:**
- Consumes: `resetDemoData` from `lib/resetDemoData.ts` (Task 5).
- Produces: `<TopNav />` rendered above every `/dynamics/*` page; links to Accounts, Contacts, Opportunities, Leads.

- [ ] **Step 1: Write the nav component**

`decoy-src/components/TopNav.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';

const LINKS = [
  { href: '/dynamics/accounts', label: 'Accounts' },
  { href: '/dynamics/contacts', label: 'Contacts' },
  { href: '/dynamics/opportunities', label: 'Opportunities' },
  { href: '/dynamics/leads', label: 'Leads' },
];

export function TopNav() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all Dynamics demo data to the seed set? This deletes any edits.')) return;
    setResetting(true);
    try {
      await resetDemoData('dynamics');
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-blue-700">Dynamics 365</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? 'text-blue-700 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleReset}
        disabled={resetting}
        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        {resetting ? 'Resetting…' : 'Reset demo data'}
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Write the Dynamics section layout**

`decoy-src/app/dynamics/layout.tsx`:
```tsx
import { TopNav } from '@/components/TopNav';

export default function DynamicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Redirect root page into Dynamics**

`decoy-src/app/page.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dynamics/accounts');
  }, [router]);
  return null;
}
```

- [ ] **Step 4: Verify**

```bash
cd decoy-src
npm run build
```
Expected: succeeds (accounts page doesn't exist yet, so this will 404 at runtime — that's expected until Task 7; the build itself must still succeed since these are all static/client components with no dynamic route params).

- [ ] **Step 5: Commit**

```bash
git add decoy-src/app/dynamics/layout.tsx decoy-src/components/TopNav.tsx decoy-src/app/page.tsx
git commit -m "feat(decoy): add dynamics layout, top nav, and reset button"
```

---

### Task 7: Accounts page (list + detail, full CRUD)

**Files:**
- Create: `decoy-src/app/dynamics/accounts/page.tsx`

**Interfaces:**
- Consumes: `useDataverseTable<Account>('accounts')` (Task 5). No lookups (Account has none).
- Produces: the pattern every later entity page (Tasks 8–9) copies — list table on the left, selected-record form on the right, "New" clears the form for insert.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/accounts/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import type { Account } from '@/lib/types';

type FormState = Omit<Account, 'accountid' | 'createdon'>;

const BLANK: FormState = {
  name: '',
  telephone1: '',
  websiteurl: '',
  address1_line1: '',
  address1_city: '',
  address1_stateorprovince: '',
  address1_postalcode: '',
  address1_country: '',
  industrycode: '',
};

export default function AccountsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Account>('accounts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: Account) {
    setSelectedId(row.accountid);
    setForm({
      name: row.name,
      telephone1: row.telephone1 ?? '',
      websiteurl: row.websiteurl ?? '',
      address1_line1: row.address1_line1 ?? '',
      address1_city: row.address1_city ?? '',
      address1_stateorprovince: row.address1_stateorprovince ?? '',
      address1_postalcode: row.address1_postalcode ?? '',
      address1_country: row.address1_country ?? '',
      industrycode: row.industrycode ?? '',
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
    if (!confirm('Delete this account?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Accounts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            New
          </button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Industry</th>
              <th className="p-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.accountid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.accountid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.industrycode}</td>
                <td className="p-2">{row.telephone1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit account' : 'New account'}</h2>
        <div className="space-y-2">
          <input className="w-full rounded border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Industry" value={form.industrycode ?? ''} onChange={(e) => setForm({ ...form, industrycode: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Phone" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Website" value={form.websiteurl ?? ''} onChange={(e) => setForm({ ...form, websiteurl: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Street" value={form.address1_line1 ?? ''} onChange={(e) => setForm({ ...form, address1_line1: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input className="rounded border p-2" placeholder="City" value={form.address1_city ?? ''} onChange={(e) => setForm({ ...form, address1_city: e.target.value })} />
            <input className="rounded border p-2" placeholder="State" value={form.address1_stateorprovince ?? ''} onChange={(e) => setForm({ ...form, address1_stateorprovince: e.target.value })} />
            <input className="rounded border p-2" placeholder="Postcode" value={form.address1_postalcode ?? ''} onChange={(e) => setForm({ ...form, address1_postalcode: e.target.value })} />
          </div>
          <input className="w-full rounded border p-2" placeholder="Country" value={form.address1_country ?? ''} onChange={(e) => setForm({ ...form, address1_country: e.target.value })} />
        </div>
        <div className="mt-4 flex gap-2">
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
Open `http://localhost:3000/decoy/dynamics/accounts` and the browser devtools Network tab. Expected: 3 seeded accounts listed; the list request shows as `GET .../api/data/v9.2/accounts?$orderby=createdon+desc` with `OData-Version: 4.0` response header; clicking a row populates the form; Save fires a `PATCH .../accounts(id)` returning 204; New + fill + Save fires a `POST .../accounts` returning 201; Delete fires `DELETE .../accounts(id)` returning 204.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/accounts
git commit -m "feat(decoy): add accounts list/detail page with CRUD"
```

---

### Task 8: Contacts page (linked to Account via @odata.bind/$expand, with Notes)

**Files:**
- Create: `decoy-src/app/dynamics/contacts/page.tsx`

**Interfaces:**
- Consumes: `useDataverseTable<Contact>('contacts', { parentcustomerid: { bindProperty: 'parentcustomerid_account', targetSet: 'accounts' } }, 'parentcustomerid_account($select=name)')` for the list (demonstrates `$expand`); a second `useDataverseTable<Account>('accounts')` for the account-picker dropdown; `useDataverseTable<Annotation>('annotations')` for Notes. All from Task 5.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/contacts/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import type { Account, Annotation, Contact } from '@/lib/types';

type FormState = Omit<Contact, 'contactid' | 'createdon' | 'parentcustomerid_account'>;

const BLANK: FormState = {
  parentcustomerid: null,
  firstname: '',
  lastname: '',
  jobtitle: '',
  emailaddress1: '',
  emailaddress2: '',
  telephone1: '',
  telephone2: '',
  mobilephone: '',
  address1_line1: '',
  address1_city: '',
  address1_stateorprovince: '',
  address1_postalcode: '',
  address1_country: '',
};

const CONTACT_LOOKUPS = {
  parentcustomerid: { bindProperty: 'parentcustomerid_account', targetSet: 'accounts' },
};

export default function ContactsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Contact>(
    'contacts',
    CONTACT_LOOKUPS,
    'parentcustomerid_account($select=name)',
  );
  const { rows: accounts } = useDataverseTable<Account>('accounts');
  const { rows: notes, insert: insertNote } = useDataverseTable<Annotation>('annotations');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [noteText, setNoteText] = useState('');

  function selectRow(row: Contact) {
    setSelectedId(row.contactid);
    setForm({
      parentcustomerid: row.parentcustomerid,
      firstname: row.firstname,
      lastname: row.lastname,
      jobtitle: row.jobtitle ?? '',
      emailaddress1: row.emailaddress1 ?? '',
      emailaddress2: row.emailaddress2 ?? '',
      telephone1: row.telephone1 ?? '',
      telephone2: row.telephone2 ?? '',
      mobilephone: row.mobilephone ?? '',
      address1_line1: row.address1_line1 ?? '',
      address1_city: row.address1_city ?? '',
      address1_stateorprovince: row.address1_stateorprovince ?? '',
      address1_postalcode: row.address1_postalcode ?? '',
      address1_country: row.address1_country ?? '',
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
    if (!confirm('Delete this contact?')) return;
    await remove(selectedId);
    startNew();
  }

  async function handleAddNote() {
    if (!selectedId || !noteText.trim()) return;
    await insertNote({
      objectid: selectedId,
      objecttypecode: 'contact',
      subject: 'Note',
      notetext: noteText.trim(),
    });
    setNoteText('');
  }

  const contactNotes = notes
    .filter((n) => n.objecttypecode === 'contact' && n.objectid === selectedId)
    .sort((a, b) => (a.createdon < b.createdon ? 1 : -1));

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Contacts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Account</th>
              <th className="p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.contactid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.contactid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.firstname} {row.lastname}</td>
                <td className="p-2">{row.parentcustomerid_account?.name ?? '—'}</td>
                <td className="p-2">{row.emailaddress1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="rounded bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">{selectedId ? 'Edit contact' : 'New contact'}</h2>
          <div className="space-y-2">
            <select className="w-full rounded border p-2" value={form.parentcustomerid ?? ''} onChange={(e) => setForm({ ...form, parentcustomerid: e.target.value || null })}>
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.accountid} value={a.accountid}>{a.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded border p-2" placeholder="First name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
              <input className="rounded border p-2" placeholder="Last name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </div>
            <input className="w-full rounded border p-2" placeholder="Job title" value={form.jobtitle ?? ''} onChange={(e) => setForm({ ...form, jobtitle: e.target.value })} />
            <input className="w-full rounded border p-2" placeholder="Email" value={form.emailaddress1 ?? ''} onChange={(e) => setForm({ ...form, emailaddress1: e.target.value })} />
            <input className="w-full rounded border p-2" placeholder="Secondary email" value={form.emailaddress2 ?? ''} onChange={(e) => setForm({ ...form, emailaddress2: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input className="rounded border p-2" placeholder="Phone" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
              <input className="rounded border p-2" placeholder="Phone 2" value={form.telephone2 ?? ''} onChange={(e) => setForm({ ...form, telephone2: e.target.value })} />
              <input className="rounded border p-2" placeholder="Mobile" value={form.mobilephone ?? ''} onChange={(e) => setForm({ ...form, mobilephone: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
            {selectedId && (
              <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
            )}
          </div>
        </div>

        {selectedId && (
          <div className="rounded bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium">Notes</h2>
            <div className="mb-3 space-y-2">
              <textarea
                className="w-full rounded border p-2 text-sm"
                rows={2}
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button onClick={handleAddNote} className="rounded bg-gray-800 px-3 py-1 text-sm text-white">Add note</button>
            </div>
            <ul className="space-y-2 text-sm">
              {contactNotes.map((n) => (
                <li key={n.annotationid} className="border-b pb-2">
                  <div className="text-gray-500">{new Date(n.createdon).toLocaleString()}</div>
                  <div>{n.notetext}</div>
                </li>
              ))}
              {contactNotes.length === 0 && <li className="text-gray-500">No notes yet.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open `http://localhost:3000/decoy/dynamics/contacts` with devtools Network tab open. Expected: the list request is `GET .../contacts?$orderby=createdon+desc&$expand=parentcustomerid_account($select=name)`; each row's Account column reads directly off the expanded `parentcustomerid_account.name`, no client-side join; the two seeded notes appear under Priya Nathan and Tom Reilly when selected; adding a note appends it immediately; changing the account dropdown and saving sends a PATCH body containing `"parentcustomerid_account@odata.bind": "/accounts(<id>)"`.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/contacts
git commit -m "feat(decoy): add contacts list/detail page using \$expand and @odata.bind, with notes"
```

---

### Task 9: Opportunities page (linked to Account + Contact via @odata.bind)

**Files:**
- Create: `decoy-src/app/dynamics/opportunities/page.tsx`

**Interfaces:**
- Consumes: `useDataverseTable<Opportunity>('opportunities', OPPORTUNITY_LOOKUPS)`, plus `useDataverseTable<Account>('accounts')` and `useDataverseTable<Contact>('contacts')` for the pickers, from Task 5.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/opportunities/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import type { Account, Contact, Opportunity } from '@/lib/types';

const STAGES: Opportunity['salesstage'][] = ['Qualify', 'Develop', 'Propose', 'Close'];

type FormState = Omit<Opportunity, 'opportunityid' | 'createdon' | 'parentaccountid_account' | 'parentcontactid_contact'>;

const BLANK: FormState = {
  parentaccountid: null,
  parentcontactid: null,
  name: '',
  estimatedvalue: null,
  estimatedclosedate: null,
  salesstage: 'Qualify',
};

const OPPORTUNITY_LOOKUPS = {
  parentaccountid: { bindProperty: 'parentaccountid_account', targetSet: 'accounts' },
  parentcontactid: { bindProperty: 'parentcontactid_contact', targetSet: 'contacts' },
};

export default function OpportunitiesPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Opportunity>(
    'opportunities',
    OPPORTUNITY_LOOKUPS,
  );
  const { rows: accounts } = useDataverseTable<Account>('accounts');
  const { rows: contacts } = useDataverseTable<Contact>('contacts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function accountName(id: string | null) {
    return accounts.find((a) => a.accountid === id)?.name ?? '—';
  }

  function selectRow(row: Opportunity) {
    setSelectedId(row.opportunityid);
    setForm({
      parentaccountid: row.parentaccountid,
      parentcontactid: row.parentcontactid,
      name: row.name,
      estimatedvalue: row.estimatedvalue,
      estimatedclosedate: row.estimatedclosedate,
      salesstage: row.salesstage,
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
    if (!confirm('Delete this opportunity?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Opportunities</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Account</th>
              <th className="p-2">Est. value</th>
              <th className="p-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.opportunityid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.opportunityid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{accountName(row.parentaccountid)}</td>
                <td className="p-2">{row.estimatedvalue ?? '—'}</td>
                <td className="p-2">{row.salesstage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit opportunity' : 'New opportunity'}</h2>
        <div className="space-y-2">
          <input className="w-full rounded border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="w-full rounded border p-2" value={form.parentaccountid ?? ''} onChange={(e) => setForm({ ...form, parentaccountid: e.target.value || null })}>
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.accountid} value={a.accountid}>{a.name}</option>
            ))}
          </select>
          <select className="w-full rounded border p-2" value={form.parentcontactid ?? ''} onChange={(e) => setForm({ ...form, parentcontactid: e.target.value || null })}>
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.contactid} value={c.contactid}>{c.firstname} {c.lastname}</option>
            ))}
          </select>
          <input type="number" className="w-full rounded border p-2" placeholder="Estimated value" value={form.estimatedvalue ?? ''} onChange={(e) => setForm({ ...form, estimatedvalue: e.target.value ? Number(e.target.value) : null })} />
          <input type="date" className="w-full rounded border p-2" value={form.estimatedclosedate ?? ''} onChange={(e) => setForm({ ...form, estimatedclosedate: e.target.value || null })} />
          <select className="w-full rounded border p-2" value={form.salesstage} onChange={(e) => setForm({ ...form, salesstage: e.target.value as Opportunity['salesstage'] })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
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

`npm run dev`, open `http://localhost:3000/decoy/dynamics/opportunities`. Expected: 3 seeded opportunities with account names and stages showing; editing stage via dropdown and saving persists via a `PATCH .../opportunities(id)` body containing plain `salesstage` (not a lookup — no bind needed) alongside any `@odata.bind` keys for account/contact changes; New + fill creates a 4th linked to any account/contact via `@odata.bind`.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/opportunities
git commit -m "feat(decoy): add opportunities list/detail page linked to accounts and contacts via @odata.bind"
```

---

### Task 10: Leads page

**Files:**
- Create: `decoy-src/app/dynamics/leads/page.tsx`

**Interfaces:**
- Consumes: `useDataverseTable<Lead>('leads')` from Task 5. No lookups (Lead has none in this schema).

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/leads/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import type { Lead } from '@/lib/types';

const STATUSES: Lead['statuscode'][] = ['New', 'Contacted', 'Qualified', 'Disqualified'];

type FormState = Omit<Lead, 'leadid' | 'createdon'>;

const BLANK: FormState = {
  firstname: '',
  lastname: '',
  companyname: '',
  subject: '',
  emailaddress1: '',
  telephone1: '',
  mobilephone: '',
  leadsourcecode: '',
  statuscode: 'New',
};

export default function LeadsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Lead>('leads');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: Lead) {
    setSelectedId(row.leadid);
    setForm({
      firstname: row.firstname,
      lastname: row.lastname,
      companyname: row.companyname ?? '',
      subject: row.subject,
      emailaddress1: row.emailaddress1 ?? '',
      telephone1: row.telephone1 ?? '',
      mobilephone: row.mobilephone ?? '',
      leadsourcecode: row.leadsourcecode ?? '',
      statuscode: row.statuscode,
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
    if (!confirm('Delete this lead?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Leads</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Company</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.leadid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.leadid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.firstname} {row.lastname}</td>
                <td className="p-2">{row.companyname}</td>
                <td className="p-2">{row.statuscode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit lead' : 'New lead'}</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded border p-2" placeholder="First name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
            <input className="rounded border p-2" placeholder="Last name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
          </div>
          <input className="w-full rounded border p-2" placeholder="Company" value={form.companyname ?? ''} onChange={(e) => setForm({ ...form, companyname: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Topic" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <input className="w-full rounded border p-2" placeholder="Email" value={form.emailaddress1 ?? ''} onChange={(e) => setForm({ ...form, emailaddress1: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded border p-2" placeholder="Phone" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
            <input className="rounded border p-2" placeholder="Mobile" value={form.mobilephone ?? ''} onChange={(e) => setForm({ ...form, mobilephone: e.target.value })} />
          </div>
          <select className="w-full rounded border p-2" value={form.statuscode} onChange={(e) => setForm({ ...form, statuscode: e.target.value as Lead['statuscode'] })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
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

`npm run dev`, open `http://localhost:3000/decoy/dynamics/leads`. Expected: 2 seeded leads; status dropdown edits persist; New + fill adds a lead.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/leads
git commit -m "feat(decoy): add leads list/detail page"
```

---

### Task 11: Build and deploy to the site

**Files:**
- Create: `wxcc-build/decoy/` (build output, copied — not hand-written)
- Modify: `wxcc-build/index.html` (add TOC row)

**Interfaces:**
- Consumes: `decoy-src/out/` produced by `npm run build` (Task 1's build target, now with real pages from Tasks 7–10).

- [ ] **Step 1: Build the static export**

```bash
cd decoy-src
npm run build
```
Expected: `decoy-src/out/` contains `index.html`, `dynamics/accounts/index.html`, `dynamics/contacts/index.html`, `dynamics/opportunities/index.html`, `dynamics/leads/index.html`, plus `_next/` assets.

- [ ] **Step 2: Copy output into the deploy path**

```bash
cd "c:\Users\grant.hansen\AppData\Local\Temp\wxcc-build"
mkdir -p decoy
cp -r decoy-src/out/. decoy/
```

- [ ] **Step 3: Add a TOC row to root `index.html`**

Open `index.html`, find the existing table of demo links (same pattern used for `wxccroi`, `wxcc`, `emrdemo` rows), and add a row for Decoy following that exact markup pattern, pointing at `/decoy/`, numbered as the next sequential entry, labelled e.g. "Decoy — Dynamics 365 CRM Demo".

- [ ] **Step 4: Verify locally**

Serve the repo root with any static file server (e.g. `npx serve .`) and open `/decoy/`. Expected: redirects to `/decoy/dynamics/accounts`, nav works, all four pages load data over the `dataverse-api` function (check Network tab shows `/api/data/v9.2/...` URLs), Reset button hits the `reset-demo` function and reloads seeded data.

- [ ] **Step 5: Commit**

```bash
git add decoy index.html
git commit -m "feat(decoy): build and deploy dynamics v1 to /decoy/"
```

---

## What's next (not in this plan)

Alayacare schema/UI, Epic schema/UI, and the cross-system top-level switcher come after this ships — each gets its own spec-scoped plan per the design doc. Retiring `emrdemo` happens once Epic is live, not before.
