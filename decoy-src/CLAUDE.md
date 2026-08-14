# Decoy — ArchiTech's own CRM/EMR/PAS/EHR Simulator

## What this is

Decoy emulates real EMR/EHR/PAS/CRM systems (Microsoft Dynamics, Alayacare,
Epic) for sales demos and integration conversations — without being any of
them. The point isn't just visual resemblance: the browser talks to the
backend using each real system's actual API shape, so network traffic in a
demo looks identical to a genuine integration against that system.

v1 (done): Microsoft Dynamics 365 (Dataverse) — Accounts, Contacts,
Opportunities, Leads, Notes, and a Sales Dashboard (5 KPI tiles + 5 chart
panels — 3 bar-lists, a donut, and a trend line — styled like a real D365
dashboard but computed client-side from Decoy's own live data — see
`app/dynamics/dashboard/page.tsx`). Dashboard is the landing page after
`/decoy/`, matching real D365 behavior.

Seed data (`supabase/seed/dynamics.sql`) is themed healthcare / aged care /
emergency services / critical services: 13 fictional accounts (hospitals,
aged care groups, ambulance/fire/SES, poison control/crisis lines), 13
contacts, 13 opportunities (each a contact-centre-shaped deal), 7 leads,
5 notes. Extend this theme for new fake data rather than introducing an
unrelated industry — it's deliberate, matching ArchiTech's actual customer
base.

UI chrome (top command bar, left sidebar nav, chevron stage tracker on
Opportunities/Leads) is styled to match real D365 — see `components/TopNav.tsx`
(command bar), `components/Sidebar.tsx` (nav, some items are inert — no
backing page yet, e.g. Calendar/Tasks/Forecasts), `components/StageTracker.tsx`.
A full API reference page lives at `/dynamics/help` (linked from the top
bar's "?" icon) — keep it in sync whenever the `dataverse-api` entity sets,
fields, or enum values change; it's the doc the client actually points
Webex Contact Center flow integrations at, not just a nice-to-have.

v1 (done): Alayacare (aged-care EMR/PAS) — Clients, Schedules (Visits),
a care-team lookup, and a Live Dashboard, at `/alayacare/*`. Built from
**real captured Alayacare API traffic** the user supplied (not just
inferred like Dynamics' schema fidelity) — see Architecture below for
which endpoints are captured-exact vs inferred.

The UI/UX went through several rework passes (after an initial pass that
was fairly reported as "just Dynamics with different colors") to feel
like the actual product, grounded in researching AlayaCare's real
platform (Back Office Suite: scheduling, visit verification,
coordination; Clinical Suite: care plans, forms, ADLs/vitals — see
`docs/superpowers/specs/2026-08-14-decoy-alayacare-v1-design.md` for
sources) plus a growing set of real product screenshots the user
supplied over time. **When a later real screenshot conflicts with an
earlier guess, the later real one wins, and earlier guesses get thrown
out, not layered on top** — this has happened repeatedly: the dashboard
was first built against a loading-*skeleton* screenshot (guessed panel
shapes from grey placeholder blocks), then rebuilt against a real
product-tour screenshot once that arrived (KPI tiles + Real Time
Activity + Map, not a data-table-plus-chart); the client detail page's
tab set was first invented (Overview/Demographics/Care Plan/Scheduling),
then replaced outright once a real client-detail screenshot arrived
(Overview/Client Info/Scheduling/Care Management/Care Delivery/
Accounting/Events/Patient Risk Dashboard). Expect more of this as more
real screenshots show up — don't treat any current layout as settled.

Concretely, as it stands now:
- **Visible brand chrome says "ArchiTech Care", not "AlayaCare"** — the
  top nav wordmark (`components/AlayacareTopNav.tsx`) and the
  cross-system switcher label were renamed on request. This is
  cosmetic-only: the route path (`/alayacare/*`), component/file names,
  Postgres schema (`alayacare`), Edge Function (`alayacare-api`), and
  the `/alayacare/help` API reference content all stay as "Alayacare"
  since they're technically accurate documentation of the real system
  being emulated, not customer-facing brand chrome. Don't let a future
  "rename it" request cascade into renaming the technical layer too
  without asking — those are two different kinds of "name."
- `components/AlayacareSidebar.tsx` — real inline SVG icons per nav item
  (stacked above the label), not bare text. Matches the reference
  screenshots' icon-above-label structure.
- `components/MapPanel.tsx` — a purely decorative static map (inline
  SVG roads + a pin + a fixed tooltip card), added to the dashboard
  beside Real Time Activity. No real coordinate data exists anywhere in
  this schema (clients only have city/postcode text) — this can never
  become a real interactive map without adding real geo data first.
- `app/alayacare/clients/page.tsx` — a tabbed chart. Real tabs: Overview
  (Client Information block, Risks, Services — all editable), Client
  Info (the granular demographics form: salutation, birthday, full
  address, comms prefs), Scheduling (that client's visits). Inert tabs:
  Care Management, Care Delivery, Accounting, Events, Patient Risk
  Dashboard (`REAL_TABS` array in that file controls which are
  clickable). The list view has a sub-tab row (Client List real, the
  rest inert) and a filter row (Status is a real functional filter;
  Groups/Tags/Risk Level are decorative selects, no backing dimensions
  modeled). List columns include **Risk Review / Risk Trend / Factors,
  which are deliberately cosmetic** — see the `cosmeticRisk()` comment
  in that file. They're a deterministic hash of `client_id`, not real
  risk scoring. Client Intelligence (the real AlayaCare feature this
  mimics) stays deferred — don't wire real logic into these columns
  without a separate spec, and don't mistake the hash output for
  meaningful data when reasoning about the app's behavior. By contrast,
  **Risks (free text) and Services (`text[]`) on the detail page are
  real, editable fields** — the distinction is that these are just
  case-manager-entered text/tags, cheap to make real, unlike Risk Trend
  which would need real event data (hospitalisations, falls, pain
  mentions) we don't have.
- `app/alayacare/schedules/page.tsx` — groups visits under date headers
  (a roster), not a flat sortable table.
- `app/alayacare/dashboard/page.tsx` — a KPI tile row (Scheduled/Vacant/
  Late/Cancelled Visits, Active Clients, Care Team Members — all real,
  computed from actual data), a Map panel (see above, decorative), and
  a "Real Time Activity" feed (real visits ordered by creation time,
  message text repurposed from the real product's clock-in/form-fill
  feed semantics since we don't model those). The real product's KPI
  row also has tiles for mobile clock-in, employee skills/certs, forms
  approval, shift offers, and family portal — all skipped, not faked,
  since none of those features are modeled.

**Clock-in/clock-out (Visit Verification) was explicitly declined** —
status stays a plain dropdown, no `checked_in_at`/`checked_out_at`
fields exist. If asked to add it later, that's new schema, not an
oversight to "restore."

`alayacare.client` has grown several real, editable fields across
follow-up migrations: `status` (Active/Inactive), a real address
(`address_line`/`city`/`state`, alongside the original `zip`),
`external_id` (a second identifier distinct from `client_id`/"AlayaCare
ID"), `risks` (free text), and `services` (`text[]`). None of these are
cosmetic like the list page's risk columns.

A **cross-system switcher** banner (`components/SystemSwitcher.tsx`,
wired into the root `app/layout.tsx`) sits above both systems' own top
bars, linking `/dynamics/dashboard` ↔ `/alayacare/dashboard`. It's global
— every route under either system renders it.

Next build: Epic (FHIR EHR, hardest — nested FHIR resources, fake login
screen).

Full history: `docs/superpowers/specs/2026-08-14-decoy-design.md`,
`docs/superpowers/plans/2026-08-14-decoy-dynamics-v1.md`,
`docs/superpowers/specs/2026-08-14-decoy-alayacare-v1-design.md`, and
`docs/superpowers/plans/2026-08-14-decoy-alayacare-v1.md` in the repo root
(one level up from this file) — read those for the reasoning behind design
decisions, not just the what.

## Repo layout — where this fits

This is `wxcc-build`, ArchiTech's **deploy-only** repo for
`architechdemo.com` (GitHub Pages, no Jekyll — see root `.nojekyll`). It has
no build tooling of its own; every demo here is either committed source +
build output together (this project, `emrdemo`) or built externally and
copied in (`wxccroi`, per the repo's `CONTEXT.md`).

- `decoy-src/` (this directory) — the actual Next.js source. Edit here.
- `decoy/` (sibling, repo root) — the **static export build output**.
  Never hand-edit anything in `decoy/` — it's fully regenerated by
  `npm run build` + copy (see Deploying below). It's the thing GitHub Pages
  actually serves at `architechdemo.com/decoy/`.
- Root `index.html` — the site's table-of-contents landing page. Decoy is
  entry #1 under "WxCC Demos": `Decoy - ArchiTech's own CRM/EMR/PAS/EHR Simulator`.

## Architecture

**The core idea:** the browser never calls Supabase directly. It calls a
Supabase Edge Function (`dataverse-api`) that exposes the *real* Dataverse
Web API v9.2 (OData v4) shape — same URL pattern, query params, body
format, and headers a genuine Dynamics integration sends — and that
function translates the request into a query against Postgres. What shows
up in a browser's network tab during a demo is the request shape a real
Dynamics integration would produce, not a Supabase REST call.

```
Browser (Next.js static export)
  → fetch GET/POST/PATCH/DELETE .../functions/v1/dataverse-api/api/data/v9.2/<entityset>[(id)]
    with $select / $expand / $orderby, "<lookup>@odata.bind" for FK writes
  → dataverse-api Edge Function (Deno)
    translates entityset → Postgres table, @odata.bind → FK column,
    $expand → a second query + nested nav-property object
  → Postgres, schema `dynamics` (service role, via supabase-js server-side)
```

Reset-to-seed is a **separate**, bespoke Edge Function (`reset-demo`) — it
has no real-Dynamics equivalent, so it isn't part of the API shim. It calls
a `dynamics.reset_demo_data()` Postgres function that only `service_role`
can execute (revoked from `anon`/`authenticated`), so the browser can never
trigger a reset except through this one controlled endpoint.

**Why this shape, specifically** (in case it looks like overkill later):
the client explicitly said the value of this project is proving "we can
integrate with Dynamics without actually using Dynamics" — the API fidelity
*is* the product, not a nice-to-have. See the spec's "Client/server
split — Dataverse Web API shim" section for the full reasoning and the
conversation that led to the pivot (originally this was going to be plain
`supabase-js` calls from the browser; that was explicitly rejected mid-build).

**Alayacare follows the identical pattern with a different wire format**:
a second Edge Function, `alayacare-api`, exposes Alayacare's real REST API
shape (`/AlayaCare/v1/<resource>[/<id>][?query]`, plain REST verbs, no
OData) against a separate `alayacare` Postgres schema. Each system's shim
is independent — they don't share a translation layer, because the two
real systems don't share a wire format. **Three of `alayacare-api`'s
endpoints are captured-exact**, reproduced byte-for-byte from real traffic
the user supplied (`GET client-profile/{id}`, `GET scheduled-visits`, `GET
cancelled-visit/staff-contacts/{visit_id}` — yes, that last path name is
real and stays even though it works for non-cancelled visits too, see the
spec). Every write endpoint (POST/PATCH/DELETE) and the list-all
`client-profile` GET are **inferred** — built to match the captured
conventions, never observed in real traffic. `/alayacare/help` marks each
endpoint Captured or Inferred explicitly; keep that distinction visible
if you add more endpoints — don't let an inferred addition read as
equally certain to a captured one.

## Schema fidelity — how far it goes, and how far it doesn't

Tables and columns use real Dataverse **logical names**: `account.accountid`,
`contact.parentcustomerid`, `opportunity.estimatedvalue`/`salesstage`,
`lead.statuscode`, `annotation` for Notes (polymorphic via
`objectid`/`objecttypecode`, exactly like real Dataverse Notes).

Deliberately **not** replicated (client's call — "don't overcomplicate,
only care about data I can manipulate on a demo"):
- No `systemuser`/`ownerid` — no user/security model.
- No dual `statecode` + `statuscode` — just one status field per entity.
- No `createdby`/`modifiedby` audit trail — just `createdon`.

If a future ask wants deeper fidelity here, it's an explicit scope
expansion, not an oversight — flag it and confirm before adding audit/owner
tables, don't just add them because "more real = better."

Same capping applies to the API shim: `dataverse-api` only implements the
exact `$select`/`$expand`/`@odata.bind` call shapes the four Dynamics pages
actually use. It is **not** a general OData parser — don't expect it to
handle arbitrary `$filter` expressions, multi-level `$expand`, or `$top`/
`$skip` without adding that support first (see `supabase/functions/dataverse-api/index.ts`,
`ENTITIES` config + `expandRows`/`translateWriteBody`).

## Adding a new lookup field or entity (Dynamics)

To add a new FK field to an existing entity (e.g. a new lookup on Lead):
1. Add the column + FK constraint in a new migration file under
   `supabase/migrations/`.
2. Add the lookup to that entity's `lookups` map in
   `supabase/functions/dataverse-api/index.ts` (`bindProperty`, `targetSet`,
   `targetTable`, `targetPk`).
3. Add the same `{ bindProperty, targetSet }` pair to the `LookupConfig`
   passed into `useDataverseTable` on the page component (see
   `CONTACT_LOOKUPS` in `app/dynamics/contacts/page.tsx` for the pattern).
4. Redeploy `dataverse-api` (see Deploying below).

To add a whole new entity: add a table + RLS policy in a migration, add an
entry to `ENTITIES` in the edge function, add its interface to
`lib/types.ts`, add a page under `app/dynamics/<entity>/page.tsx` copying
the Accounts page as the simplest template (no lookups) or Contacts/
Opportunities (has lookups + `$expand`).

## Supabase project

Project ref: `kjapsnzcaicecjnctmoh` (`https://kjapsnzcaicecjnctmoh.supabase.co`).
One project for all of Decoy — `dynamics` and `alayacare` schemas both
live here now; Epic will get its own Postgres schema (`epic`) in this same
project too, not a new project.

**Non-obvious setup step:** PostgREST only exposes `public`/`graphql_public`
by default. Any new schema (this project already did it for `dynamics`)
needs adding to the exposed schema list via the Management API, since
there's no CLI command for it:
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kjapsnzcaicecjnctmoh/postgrest" \
  -H "Authorization: Bearer <personal-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"db_schema":"public,graphql_public,dynamics,alayacare"}'
```
Without this, every `supabase-js` `.schema('alayacare')` call — from *both*
the browser and Edge Functions — fails with `PGRST106: Invalid schema`,
even using the service role key. Schema exposure is a PostgREST-layer
setting, not an RLS/permissions thing.

**Auth for the CLI:** the Supabase CLI needs a **Personal Access Token**
(`SUPABASE_ACCESS_TOKEN` env var), not the service role key or anon key —
those are project-level keys, the access token is account-level and is
what `supabase link`/`db query`/`functions deploy`/`secrets set` all need.
`supabase login`'s browser OAuth flow doesn't work in a headless/agent
session; generate a token from the Supabase dashboard (account icon →
Access Tokens) and pass it inline instead:
```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase <command> --project-ref kjapsnzcaicecjnctmoh
```

**Don't try to set `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` as Edge
Function secrets** — names starting with `SUPABASE_` are reserved; the
platform auto-injects both into every Edge Function already. Both edge
functions read them straight off `Deno.env.get(...)` with no setup needed.

**Local `.env.local`** (`decoy-src/.env.local`, gitignored) only needs:
```
NEXT_PUBLIC_SUPABASE_URL=https://kjapsnzcaicecjnctmoh.supabase.co
```
No anon/publishable key needed client-side — the browser never talks to
Supabase's own REST endpoint directly, only to the two Edge Functions,
which don't require an `apikey` header.

## Building and deploying

```bash
cd decoy-src
npm run build          # emits decoy-src/out/
cd ..
rm -rf decoy && mkdir decoy && cp -r decoy-src/out/. decoy/
git add decoy decoy-src
git commit -m "..."
git push origin master  # this is what actually makes GitHub Pages rebuild
```

**`trailingSlash: true` in `next.config.mjs` is load-bearing, not optional.**
Without it, static export emits `dynamics/accounts.html` instead of
`dynamics/accounts/index.html`, and GitHub Pages (no Jekyll — it won't guess
`.html` extensions) can't resolve the extensionless routes the nav links to.
Don't remove it.

**Remember to actually push.** This repo had 18+ commits sit local-only for
an entire build session before anyone noticed nothing was live — `git log
origin/master..HEAD` before assuming something is deployed. Always check
for upstream changes first (`git fetch && git log HEAD..origin/master
--oneline`) since other people/sessions push to this same deploy repo.

## Redeploying Edge Functions

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy dataverse-api --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy alayacare-api --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy reset-demo --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
```
`--no-verify-jwt` is required — Decoy has no login of its own (deliberate;
it's a public sales demo, same trust model as every other demo on this
site), so there's no real Supabase JWT for the platform to verify. The
`Authorization: Bearer demo-token` header the client sends is cosmetic —
it makes the network tab look like an authenticated call, the function
ignores its actual value.

## Applying schema changes

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase link --project-ref kjapsnzcaicecjnctmoh
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/migrations/000X_something.sql
```
(`supabase db execute` doesn't exist in this CLI version — it's
`db query --file`, and `--linked` targets the linked project via the
Management API rather than a local Docker Postgres.)

## Key gotchas hit during the build (avoid re-discovering these)

- **Every `useXTable`/`useXResource` hook is generic over `T extends
  object`, not `Record<string, unknown>`** — plain TS interfaces
  (`Account`, `Contact`, `AlayacareClient`, ...) have no index signature and
  fail the stricter constraint. Hit this twice now (`useDataverseTable`,
  then `useAlayacareResource`) — if you add a new typed hook, start with
  `T extends object` and save yourself the round-trip.
- **A Postgres sequence-based default (`default ('C' || lpad(nextval(...)))`)
  doesn't advance when a row is inserted with an explicit literal value for
  that column.** The `alayacare.client` seed data uses literal `client_id`
  values (`C0100001`-`C0100005`) so the sequence never moves — the first
  real auto-generated id came back as `C0100000`, colliding with/preceding
  the seeded range, until the reset function's `alter sequence ... restart
  with 200000` was bumped well above it. Any new seeded table with a
  sequence-backed id column needs the same restart-value gap.
- **`supabase/functions/**` is excluded from `decoy-src/tsconfig.json`** —
  those files are Deno runtime (`Deno.serve`, `https://esm.sh/...` remote
  imports), not part of the Next.js TS project. `npx tsc --noEmit` from
  `decoy-src` only checks the app code; it will never catch Edge Function
  type errors. Check those by reading them carefully or testing against the
  deployed function directly.
- **No app test framework, on purpose** — this is a sales demo, not a
  product; don't add Jest/Vitest/Playwright. The verification pattern used
  throughout the build was: `npx tsc --noEmit` + `npm run build` for every
  page, then `curl` against the deployed Edge Function for each HTTP verb
  once a real project existed. Follow that pattern for new work rather than
  introducing a test runner.
- **RLS policies on every schema's tables are fully permissive**
  (`using (true) with check (true)`) — this is intentional, not a
  placeholder to tighten later. Isolation between systems comes from the
  Postgres **schema** boundary (`dynamics` vs `alayacare` vs a future
  `epic`), not from row-level rules. Don't add per-row restrictions unless
  a specific new requirement calls for it.
- **Every Edge Function must handle CORS itself, including `OPTIONS`
  preflight.** This bit us once live: the browser's `fetch()` calls from
  `architechdemo.com` were silently failing every request because
  `dataverse-api`/`reset-demo` had no `Access-Control-Allow-*` headers and
  no `OPTIONS` handler (Supabase doesn't add CORS for you), and the pages
  had no `.catch()` on the fetch chain, so every page just hung on
  "Loading…" forever with no visible error. Any new Edge Function needs the
  same `CORS_HEADERS` object + `if (req.method === 'OPTIONS') return new
  Response(null, { status: 204, headers: CORS_HEADERS })` pattern from
  `dataverse-api/index.ts`, and every client hook needs a `.catch()` that
  sets an error state — never let a fetch chain fail silently into an
  infinite loading spinner.

## What's explicitly out of scope right now

- Epic schema/UI/API shim — the last system in the build order. Same
  process as Dynamics and Alayacare: brainstorming → spec → writing-plans
  → executing-plans.
- Alayacare Employee (standalone entity), Tasks, Extensions — need real
  captured traffic before building, per the Alayacare spec's decision;
  don't extrapolate these blind the way the writes were (writes were
  explicitly approved as inferred; these three weren't).
- Alayacare Client Intelligence (risk scoring: risk factors, trend chart,
  event history) — a real Alayacare feature, screenshot supplied for
  chrome/style reference only. Its own spec/plan cycle if/when prioritized.
- Retiring `emrdemo` (the old single-vendor fake-EMR demo elsewhere in this
  repo) — happens once Epic ships, replacing it. Don't touch `emrdemo`
  before then.
- Any login/auth for Decoy itself — deliberately open, matches every other
  demo on this site.
