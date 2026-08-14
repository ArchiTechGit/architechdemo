# Decoy — Dynamics v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a live-editable, Supabase-backed Dynamics 365 CRM demo (Accounts, Contacts, Opportunities, Leads) as a static-export Next.js app deployed at `architechdemo.com/decoy/`.

**Architecture:** Next.js app (source lives in this repo at `decoy-src/`, since the Google Drive source-project convention in `CONTEXT.md` isn't reachable from this environment — see Constraint below) queries Supabase directly from the browser via `supabase-js` against a dedicated `dynamics` Postgres schema. Each entity is one page combining a list table and an edit/detail panel (master-detail on one page) — this sidesteps Next's static-export requirement that dynamic route segments (`[id]`) be known at build time, which doesn't fit data that's seeded/edited at demo-time. A "Reset demo data" button calls a Supabase Edge Function (service-role privileged) that re-seeds the schema; the anon browser key never gets that privilege directly.

**Tech Stack:** Next.js 14 (App Router, `output: 'export'`), TypeScript, Tailwind CSS, `@supabase/supabase-js`, Supabase Postgres + Edge Functions (Deno). No app test framework (spec requirement — this is a sales demo).

**Spec:** `docs/superpowers/specs/2026-08-14-decoy-design.md`

## Global Constraints

- `output: 'export'` and `basePath: '/decoy'` in `next.config.mjs` (spec: static export, deploy-only repo).
- One Supabase project; `dynamics` lives in its own Postgres schema, never mixed into `public` or a future `alayacare`/`epic` schema (spec: schema-per-system).
- No app test framework. Verification steps in this plan are manual (build succeeds, `curl`/browser checks) — do not add Jest/Vitest/Playwright (spec: no test framework, sales demo not a product).
- Decoy has no login of its own — every page loads open (spec: open, no login).
- Reset-to-seed is the only privileged operation. It must go through the Edge Function (service-role key), never be callable with the anon key directly — the DB function it wraps has `EXECUTE` revoked from `anon`/`authenticated` (spec: reset button, elevated privilege isolated from browser).
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
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "2.45.4"
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

### Task 2: Supabase schema, RLS, and seed data for Dynamics

**Files:**
- Create: `decoy-src/supabase/migrations/0001_dynamics_schema.sql`
- Create: `decoy-src/supabase/seed/dynamics.sql`

**Interfaces:**
- Produces: Postgres schema `dynamics` with tables `accounts`, `contacts`, `opportunities`, `leads`; a `dynamics.reset_demo_data()` function later tasks' Edge Function will call.

- [ ] **Step 1: Write the schema migration**

`decoy-src/supabase/migrations/0001_dynamics_schema.sql`:
```sql
create schema if not exists dynamics;

create table dynamics.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  phone text,
  website text,
  address text,
  created_at timestamptz not null default now()
);

create table dynamics.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references dynamics.accounts(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  job_title text,
  created_at timestamptz not null default now()
);

create table dynamics.opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references dynamics.accounts(id) on delete set null,
  contact_id uuid references dynamics.contacts(id) on delete set null,
  name text not null,
  estimated_revenue numeric,
  close_date date,
  stage text not null default 'Qualify' check (stage in ('Qualify','Develop','Propose','Close')),
  created_at timestamptz not null default now()
);

create table dynamics.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company_name text,
  email text,
  phone text,
  status text not null default 'New' check (status in ('New','Contacted','Qualified','Disqualified')),
  created_at timestamptz not null default now()
);

-- Expose schema to PostgREST and grant CRUD to the anon demo role.
grant usage on schema dynamics to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema dynamics to anon, authenticated;
grant all on all tables in schema dynamics to service_role;
alter default privileges in schema dynamics grant select, insert, update, delete on tables to anon, authenticated;

-- RLS on, permissive policies: this is a public sales demo, isolation comes
-- from the dedicated schema, not from row-level restriction.
alter table dynamics.accounts enable row level security;
alter table dynamics.contacts enable row level security;
alter table dynamics.opportunities enable row level security;
alter table dynamics.leads enable row level security;

create policy "anon full access" on dynamics.accounts for all using (true) with check (true);
create policy "anon full access" on dynamics.contacts for all using (true) with check (true);
create policy "anon full access" on dynamics.opportunities for all using (true) with check (true);
create policy "anon full access" on dynamics.leads for all using (true) with check (true);
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
  truncate table dynamics.opportunities, dynamics.contacts, dynamics.leads, dynamics.accounts restart identity cascade;

  insert into dynamics.accounts (id, name, industry, phone, website, address) values
    ('11111111-1111-1111-1111-111111111111', 'Northwind Health', 'Healthcare', '02 9000 1111', 'northwindhealth.example', '1 Flinders St, Melbourne VIC'),
    ('11111111-1111-1111-1111-111111111112', 'Contoso Aged Care', 'Aged Care', '02 9000 1112', 'contosoagedcare.example', '22 George St, Sydney NSW'),
    ('11111111-1111-1111-1111-111111111113', 'Fabrikam Retail', 'Retail', '02 9000 1113', 'fabrikamretail.example', '5 Queen St, Brisbane QLD');

  insert into dynamics.contacts (id, account_id, first_name, last_name, email, phone, job_title) values
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nathan', 'priya.nathan@northwindhealth.example', '0400 111 221', 'IT Director'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Tom', 'Reilly', 'tom.reilly@contosoagedcare.example', '0400 111 222', 'Operations Manager'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111113', 'Ava', 'Chen', 'ava.chen@fabrikamretail.example', '0400 111 223', 'CX Lead');

  insert into dynamics.opportunities (id, account_id, contact_id, name, estimated_revenue, close_date, stage) values
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Contact Centre Modernisation', 185000, '2026-10-15', 'Develop'),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Scheduling Integration', 92000, '2026-09-01', 'Propose'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222223', 'Digital Front Door Rollout', 260000, '2026-11-30', 'Qualify');

  insert into dynamics.leads (id, first_name, last_name, company_name, email, phone, status) values
    ('44444444-4444-4444-4444-444444444441', 'Sam', 'Doyle', 'Woodgrove Bank', 'sam.doyle@woodgrove.example', '0400 111 441', 'New'),
    ('44444444-4444-4444-4444-444444444442', 'Lena', 'Kaur', 'Adatum Insurance', 'lena.kaur@adatum.example', '0400 111 442', 'Contacted');
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
curl "https://<project-ref>.supabase.co/rest/v1/accounts?select=name" \
  -H "apikey: <anon-key>" -H "Authorization: Bearer <anon-key>" \
  -H "Accept-Profile: dynamics"
```
Expected: JSON array of the 3 seeded account names.

- [ ] **Step 5: Commit**

```bash
git add decoy-src/supabase
git commit -m "feat(decoy): add dynamics schema, RLS policies, and seed/reset function"
```

---

### Task 3: Reset Edge Function

**Files:**
- Create: `decoy-src/supabase/functions/reset-demo/index.ts`

**Interfaces:**
- Consumes: `dynamics.reset_demo_data()` from Task 2 (service-role only).
- Produces: `POST /functions/v1/reset-demo` with body `{ "schema": "dynamics" }` → `200 { "ok": true }`. Later systems (`alayacare`, `epic`) add their own `reset_demo_data()` function in their schema and this same function will route to it — the `schema` field is validated against an allow-list here so it never runs arbitrary SQL.

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
`--no-verify-jwt` because Decoy has no login (Global Constraints) — anyone with the URL can hit it, same trust level as every other button in this public demo.

- [ ] **Step 3: Verify**

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/reset-demo" \
  -H "Content-Type: application/json" \
  -d '{"schema":"dynamics"}'
```
Expected: `{"ok":true}`. Re-run the Task 2 Step 4 `curl` afterward — same 3 account names should reappear even after manually deleting/editing rows in between.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/supabase/functions
git commit -m "feat(decoy): add reset-demo edge function"
```

---

### Task 4: Supabase client and generic table hook

**Files:**
- Create: `decoy-src/lib/supabase.ts`
- Create: `decoy-src/lib/types.ts`
- Create: `decoy-src/lib/useSupabaseTable.ts`
- Create: `decoy-src/.env.local` (untracked — real project values)
- Create: `decoy-src/.env.local.example` (tracked — placeholder values, documents required vars)

**Interfaces:**
- Produces: `useSupabaseTable<T>(schema: string, table: string)` returning `{ rows: T[], loading: boolean, error: string | null, refresh(): void, insert(values): Promise<void>, update(id, values): Promise<void>, remove(id): Promise<void> }`. Every entity page in Tasks 6–9 consumes this.
- Produces: `Account`, `Contact`, `Opportunity`, `Lead` types from `lib/types.ts`.

- [ ] **Step 1: Write env files**

`decoy-src/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`decoy-src/.env.local` (fill in real values from the Supabase dashboard, this file is gitignored by the root `.env*` rule already in `.gitignore`):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 2: Write the Supabase client**

`decoy-src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function resetDemoData(schema: string): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-demo`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schema }),
    },
  );
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}
```

- [ ] **Step 3: Write shared types**

`decoy-src/lib/types.ts`:
```ts
export interface Account {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  account_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  account_id: string | null;
  contact_id: string | null;
  name: string;
  estimated_revenue: number | null;
  close_date: string | null;
  stage: 'Qualify' | 'Develop' | 'Propose' | 'Close';
  created_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: 'New' | 'Contacted' | 'Qualified' | 'Disqualified';
  created_at: string;
}
```

- [ ] **Step 4: Write the generic hook**

`decoy-src/lib/useSupabaseTable.ts`:
```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSupabaseTable<T extends { id: string }>(schema: string, table: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    supabase
      .schema(schema)
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data ?? []) as T[]);
        setLoading(false);
      });
  }, [schema, table]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = useCallback(
    async (values: Partial<T>) => {
      const { error } = await supabase.schema(schema).from(table).insert(values);
      if (error) throw new Error(error.message);
      refresh();
    },
    [schema, table, refresh],
  );

  const update = useCallback(
    async (id: string, values: Partial<T>) => {
      const { error } = await supabase.schema(schema).from(table).update(values).eq('id', id);
      if (error) throw new Error(error.message);
      refresh();
    },
    [schema, table, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.schema(schema).from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
      refresh();
    },
    [schema, table, refresh],
  );

  return { rows, loading, error, refresh, insert, update, remove };
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
git commit -m "feat(decoy): add supabase client, shared types, and useSupabaseTable hook"
```

---

### Task 5: Dynamics layout and top nav (with Reset button)

**Files:**
- Create: `decoy-src/app/dynamics/layout.tsx`
- Create: `decoy-src/components/TopNav.tsx`
- Modify: `decoy-src/app/page.tsx`

**Interfaces:**
- Consumes: `resetDemoData` from `lib/supabase.ts` (Task 4).
- Produces: `<TopNav />` rendered above every `/dynamics/*` page; links to Accounts, Contacts, Opportunities, Leads.

- [ ] **Step 1: Write the nav component**

`decoy-src/components/TopNav.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { resetDemoData } from '@/lib/supabase';

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
Expected: succeeds (accounts page doesn't exist yet, so this will 404 at runtime — that's expected until Task 6; the build itself must still succeed since these are all static/client components with no dynamic route params).

- [ ] **Step 5: Commit**

```bash
git add decoy-src/app/dynamics/layout.tsx decoy-src/components/TopNav.tsx decoy-src/app/page.tsx
git commit -m "feat(decoy): add dynamics layout, top nav, and reset button"
```

---

### Task 6: Accounts page (list + detail, full CRUD)

**Files:**
- Create: `decoy-src/app/dynamics/accounts/page.tsx`

**Interfaces:**
- Consumes: `useSupabaseTable<Account>('dynamics', 'accounts')` (Task 4).
- Produces: the pattern every later entity page (Tasks 7–9) copies — list table on the left, selected-record form on the right, "New" clears the form for insert.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/accounts/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSupabaseTable } from '@/lib/useSupabaseTable';
import type { Account } from '@/lib/types';

const BLANK: Omit<Account, 'id' | 'created_at'> = {
  name: '',
  industry: '',
  phone: '',
  website: '',
  address: '',
};

export default function AccountsPage() {
  const { rows, loading, error, insert, update, remove } = useSupabaseTable<Account>(
    'dynamics',
    'accounts',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  function selectRow(row: Account) {
    setSelectedId(row.id);
    setForm({
      name: row.name,
      industry: row.industry ?? '',
      phone: row.phone ?? '',
      website: row.website ?? '',
      address: row.address ?? '',
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
                key={row.id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.industry}</td>
                <td className="p-2">{row.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit account' : 'New account'}</h2>
        <div className="space-y-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Industry"
            value={form.industry ?? ''}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Phone"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Website"
            value={form.website ?? ''}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Address"
            value={form.address ?? ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            Save
          </button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">
              Delete
            </button>
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
Open `http://localhost:3000/decoy/dynamics/accounts`. Expected: 3 seeded accounts listed; clicking a row populates the form; editing name and clicking Save updates the table; New + fill + Save adds a 4th row; Delete removes the selected row.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/accounts
git commit -m "feat(decoy): add accounts list/detail page with CRUD"
```

---

### Task 7: Contacts page (linked to Account)

**Files:**
- Create: `decoy-src/app/dynamics/contacts/page.tsx`

**Interfaces:**
- Consumes: `useSupabaseTable<Contact>('dynamics', 'contacts')` and `useSupabaseTable<Account>('dynamics', 'accounts')` (for the account picker) from Task 4.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/contacts/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSupabaseTable } from '@/lib/useSupabaseTable';
import type { Account, Contact } from '@/lib/types';

const BLANK: Omit<Contact, 'id' | 'created_at'> = {
  account_id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
};

export default function ContactsPage() {
  const { rows, loading, error, insert, update, remove } = useSupabaseTable<Contact>(
    'dynamics',
    'contacts',
  );
  const { rows: accounts } = useSupabaseTable<Account>('dynamics', 'accounts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  function accountName(id: string | null) {
    return accounts.find((a) => a.id === id)?.name ?? '—';
  }

  function selectRow(row: Contact) {
    setSelectedId(row.id);
    setForm({
      account_id: row.account_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email ?? '',
      phone: row.phone ?? '',
      job_title: row.job_title ?? '',
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

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Contacts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            New
          </button>
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
                key={row.id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">
                  {row.first_name} {row.last_name}
                </td>
                <td className="p-2">{accountName(row.account_id)}</td>
                <td className="p-2">{row.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit contact' : 'New contact'}</h2>
        <div className="space-y-2">
          <select
            className="w-full rounded border p-2"
            value={form.account_id ?? ''}
            onChange={(e) => setForm({ ...form, account_id: e.target.value || null })}
          >
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded border p-2"
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Phone"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Job title"
            value={form.job_title ?? ''}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            Save
          </button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open `http://localhost:3000/decoy/dynamics/contacts`. Expected: 3 seeded contacts, each showing its linked account name; changing the account dropdown and saving updates the link; New + fill + Save adds a contact linked to a chosen account.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/contacts
git commit -m "feat(decoy): add contacts list/detail page linked to accounts"
```

---

### Task 8: Opportunities page (linked to Account + Contact)

**Files:**
- Create: `decoy-src/app/dynamics/opportunities/page.tsx`

**Interfaces:**
- Consumes: `useSupabaseTable<Opportunity>`, `useSupabaseTable<Account>`, `useSupabaseTable<Contact>` from Task 4.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/opportunities/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSupabaseTable } from '@/lib/useSupabaseTable';
import type { Account, Contact, Opportunity } from '@/lib/types';

const STAGES: Opportunity['stage'][] = ['Qualify', 'Develop', 'Propose', 'Close'];

const BLANK: Omit<Opportunity, 'id' | 'created_at'> = {
  account_id: null,
  contact_id: null,
  name: '',
  estimated_revenue: null,
  close_date: null,
  stage: 'Qualify',
};

export default function OpportunitiesPage() {
  const { rows, loading, error, insert, update, remove } = useSupabaseTable<Opportunity>(
    'dynamics',
    'opportunities',
  );
  const { rows: accounts } = useSupabaseTable<Account>('dynamics', 'accounts');
  const { rows: contacts } = useSupabaseTable<Contact>('dynamics', 'contacts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  function accountName(id: string | null) {
    return accounts.find((a) => a.id === id)?.name ?? '—';
  }

  function selectRow(row: Opportunity) {
    setSelectedId(row.id);
    setForm({
      account_id: row.account_id,
      contact_id: row.contact_id,
      name: row.name,
      estimated_revenue: row.estimated_revenue,
      close_date: row.close_date,
      stage: row.stage,
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
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            New
          </button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Account</th>
              <th className="p-2">Revenue</th>
              <th className="p-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{accountName(row.account_id)}</td>
                <td className="p-2">{row.estimated_revenue ?? '—'}</td>
                <td className="p-2">{row.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit opportunity' : 'New opportunity'}</h2>
        <div className="space-y-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="w-full rounded border p-2"
            value={form.account_id ?? ''}
            onChange={(e) => setForm({ ...form, account_id: e.target.value || null })}
          >
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded border p-2"
            value={form.contact_id ?? ''}
            onChange={(e) => setForm({ ...form, contact_id: e.target.value || null })}
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="w-full rounded border p-2"
            placeholder="Estimated revenue"
            value={form.estimated_revenue ?? ''}
            onChange={(e) => setForm({ ...form, estimated_revenue: e.target.value ? Number(e.target.value) : null })}
          />
          <input
            type="date"
            className="w-full rounded border p-2"
            value={form.close_date ?? ''}
            onChange={(e) => setForm({ ...form, close_date: e.target.value || null })}
          />
          <select
            className="w-full rounded border p-2"
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as Opportunity['stage'] })}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            Save
          </button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open `http://localhost:3000/decoy/dynamics/opportunities`. Expected: 3 seeded opportunities with account names and stages showing; editing stage via dropdown and saving persists; New + fill creates a 4th linked to any account/contact.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/app/dynamics/opportunities
git commit -m "feat(decoy): add opportunities list/detail page linked to accounts and contacts"
```

---

### Task 9: Leads page

**Files:**
- Create: `decoy-src/app/dynamics/leads/page.tsx`

**Interfaces:**
- Consumes: `useSupabaseTable<Lead>('dynamics', 'leads')` from Task 4.

- [ ] **Step 1: Write the page**

`decoy-src/app/dynamics/leads/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useSupabaseTable } from '@/lib/useSupabaseTable';
import type { Lead } from '@/lib/types';

const STATUSES: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Disqualified'];

const BLANK: Omit<Lead, 'id' | 'created_at'> = {
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  status: 'New',
};

export default function LeadsPage() {
  const { rows, loading, error, insert, update, remove } = useSupabaseTable<Lead>(
    'dynamics',
    'leads',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  function selectRow(row: Lead) {
    setSelectedId(row.id);
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      company_name: row.company_name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      status: row.status,
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
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            New
          </button>
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
                key={row.id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">
                  {row.first_name} {row.last_name}
                </td>
                <td className="p-2">{row.company_name}</td>
                <td className="p-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit lead' : 'New lead'}</h2>
        <div className="space-y-2">
          <input
            className="w-full rounded border p-2"
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Company"
            value={form.company_name ?? ''}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Phone"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select
            className="w-full rounded border p-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Lead['status'] })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            Save
          </button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">
              Delete
            </button>
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

### Task 10: Build and deploy to the site

**Files:**
- Create: `wxcc-build/decoy/` (build output, copied — not hand-written)
- Modify: `wxcc-build/index.html` (add TOC row)

**Interfaces:**
- Consumes: `decoy-src/out/` produced by `npm run build` (Task 1's build target, now with real pages from Tasks 6–9).

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

Serve the repo root with any static file server (e.g. `npx serve .`) and open `/decoy/`. Expected: redirects to `/decoy/dynamics/accounts`, nav works, Reset button hits the deployed Edge Function and reloads seeded data.

- [ ] **Step 5: Commit**

```bash
git add decoy index.html
git commit -m "feat(decoy): build and deploy dynamics v1 to /decoy/"
```

---

## What's next (not in this plan)

Alayacare schema/UI, Epic schema/UI, and the cross-system top-level switcher come after this ships — each gets its own spec-scoped plan per the design doc. Retiring `emrdemo` happens once Epic is live, not before.
