# Decoy — Alayacare v1 Design Spec

## Purpose

Second system in Decoy (after Dynamics 365): emulate Alayacare, the aged-care
EMR/PAS Uniting (and similar providers) actually integrate against. Same
value prop as Dynamics — the browser talks to a backend using Alayacare's
real REST API shape, so a demo's network traffic looks like a genuine
Alayacare integration.

## Source material — real captured API traffic

The user supplied real captured HTTP traffic from a live Alayacare
integration (via what appears to be a middleware/Logic Apps proxy at
`api.uniting.org/AlayaCare/v1/...` — `x-ms-workflow-*` response headers on
one call confirm an Azure Logic Apps layer in front of Alayacare, not a
direct call to Alayacare's own domain). This is exact, not inferred:

- `GET /AlayaCare/v1/client-profile/{client_id}` → flat client object.
  Fields observed: `salutation`, `first_name`, `last_name`, `birthday`
  (date), `zip`, `phone_main`, `ai_agent_opt_out`, `channels_of_communication`,
  `types_of_communication`, `notification_recipient`, `contacts` (array,
  empty in the sample — inner shape not observed).
- `GET /AlayaCare/v1/scheduled-visits?client_id=&start_at=&end_at=&page=`
  → paginated envelope `{ count, page, total_pages, items: [...] }`. Item
  fields: `alayacare_service_id`, `alayacare_visit_id`, `employee_id`
  (mixed formats — `"056567"` numeric-string for internal staff,
  `"S0012389"` / `"S2108863"` S-prefixed for subcontractors — replicate
  this mix, it's a real distinguishing detail), `service_code_id`,
  `status` (`"scheduled"` observed), `start_at`/`end_at` (ISO 8601 with
  offset), `cancelled` (boolean), `client_id`.
- `GET /AlayaCare/v1/cancelled-visit/staff-contacts/{visit_id}` →
  `{ care_team: [{ employee_id, first_name, last_name, role, email }] }`.
  Despite the "cancelled-visit" path segment, the sample calls it for a
  visit with `status: "scheduled"` — so this endpoint returns a client's
  assigned care team for any visit id, not just cancelled ones. **Keep this
  literal path even though it reads oddly** — that's what the real
  integration calls, and "fixing" it would break the fidelity this whole
  project exists for.
- The traffic is 100% read-only (GET only) and the field set
  (`ai_agent_opt_out`, `channels_of_communication`) strongly suggests this
  feed powers a conversational/voice AI agent, not a human-facing screen —
  relevant context, not something to build around specially.

**Confidence levels, stated plainly:**
- Captured and exact: the three endpoints above, their query params, and
  their response shapes.
- **Inferred, not captured**: POST/PATCH/DELETE on `client-profile` and
  `scheduled-visits` (needed for live-editable demo data; nothing in the
  capture shows writes). These follow the same path/field conventions as
  the captured GETs. Flagged as inferred in the `/alayacare/help` reference
  page, same as the captured endpoints are flagged as captured — anyone
  building a real integration against this demo should know which parts to
  trust as ground truth.
- The `contacts` array inner shape on `client-profile` was never observed
  (empty in the sample) — stored as opaque `jsonb`, defaulted to `[]`,
  not modeled further until a real example turns up.

## UI reference — real screenshots

Two real Alayacare screenshots were supplied, used for chrome and style
only (not scope — see below):

1. **Live Dashboard** (`Explore` breadcrumb, "Jessica Chavez's Exec
   Dashboard"): dark navy top bar (logo, search input, right-side
   user/UTC/avatar/mail/logout), left icon sidebar (Dashboard, Clients,
   Employees, Accounting, Schedules, Settings — Dashboard highlighted
   active), a secondary white tab row below the top bar (Live Dashboard,
   Visit Reports, Forms, Client Intake, Marketplace, Data Exploration,
   Tasks), and a dashboard body: a data-table panel + adjacent line-chart
   panel, then a donut-chart panel + list panel below. This screenshot was
   captured mid-load (all content is grey skeleton placeholders) — it
   confirms layout, not real values.
2. **Client detail / Client Intelligence tab**: client header (avatar
   initials in a square, full name, "{age} yrs, {city}/{country}"
   subtitle), a tab row (Overview, Demographics, Clients, Skills, Tasks,
   Client Intelligence), status badges (green "ACTIVE" pill, colored risk
   banners), and a risk-trend line chart with colored event-marker bands.
   **The Client Intelligence feature itself (risk factors, risk trend,
   event history) is explicitly deferred to a v1.1 follow-up** — the user
   supplied this screenshot purely to show more of the real chrome/style
   (navy palette variant, avatar+subtitle header pattern, status-badge
   styling), not to request the risk-scoring feature now.

Reusable style cues pulled from both: Alayacare's navy (`#0f2a5c`-ish,
distinct from Dynamics' near-black command bar), an avatar-initials +
name + subtitle header pattern for the Client detail page, and a
pill-shaped status-badge component (colored background, dark text) for
visit status.

## v1 scope

**In scope:**
- **Client** — the captured `client-profile` shape, full CRUD.
- **Visit** (`scheduled-visits`) — the captured shape, full CRUD, linked to
  a Client.
- **Care team lookup** (`cancelled-visit/staff-contacts`) — read-only,
  shown when a Visit is selected; backed by a `care_team_member` table
  keyed to the Client (a client's assigned support worker/team leader,
  not per-visit).
- **Live Dashboard** page styled like the reference screenshot's layout,
  populated with real aggregates from Decoy's own Client/Visit data (same
  approach as the Dynamics Sales Dashboard — structure borrowed, data real).
- Alayacare-styled top bar + left icon sidebar + secondary tab row, with
  Clients/Schedules/Dashboard functional and Employees/Accounting/Settings
  (sidebar) plus Visit Reports/Forms/Client Intake/Marketplace/Data
  Exploration/Tasks (tab row) inert — same "styled but not wired" pattern
  as Dynamics' unbuilt nav items.
- `/alayacare/help` API reference page, same purpose as the Dynamics one:
  the doc a real integration (Webex CC flow or otherwise) would be pointed
  at. Must clearly flag which endpoints are captured-exact vs inferred.
- **Cross-system switcher** — a single top-level banner (above both
  systems' own top bars) linking `/dynamics` ↔ `/alayacare`. The original
  Decoy spec deferred this until ≥2 systems existed "to switch between" —
  that condition is met once Alayacare ships, so this is the last task of
  the Alayacare implementation plan rather than its own cycle. Small,
  additive, doesn't restructure either system's existing layout.

**Explicitly deferred:**
- Employee (standalone entity/page) — no capture, no immediate need beyond
  the care-team lookup's embedded employee fields.
- Tasks, Extensions (dynamic custom assessment fields) — mentioned in the
  original Decoy plan as a distinctive Alayacare pattern worth replicating
  eventually, but no capture exists yet and the user chose to drop v1 scope
  to Client + Visit only rather than extrapolate them blind.
- Client Intelligence (risk factors/trend/events) — screenshot supplied for
  style reference only; real feature is a v1.1+ follow-up with its own
  spec/plan cycle once/if prioritized.
- Accounting, Marketplace, Data Exploration, Client Intake, Visit Reports,
  Forms — real Alayacare features with no captured API and no immediate
  demo need; sidebar/tab entries exist visually (matching the real nav) but
  are inert, consistent with how Dynamics handles Calendar/Tasks/Forecasts.

## Architecture

Identical pattern to Dynamics, different wire format:

```
Browser (Next.js static export, same app, new /alayacare route group)
  → fetch GET/POST/PATCH/DELETE .../functions/v1/alayacare-api/AlayaCare/v1/<resource>[/<id>][?query]
  → alayacare-api Edge Function (Deno)
    translates resource path → Postgres table/query
  → Postgres, schema `alayacare` (service role, via supabase-js server-side)
```

- One new Edge Function, `alayacare-api`, alongside the existing
  `dataverse-api` — each system gets its own function matching its own
  real wire format, they don't share a shim.
- Reset reuses the existing `reset-demo` function: its `ALLOWED_SCHEMAS`
  allow-list grows to include `"alayacare"`, and a new
  `alayacare.reset_demo_data()` Postgres function (same revoke-from-anon
  pattern as `dynamics.reset_demo_data()`) gets added.
- New Postgres schema `alayacare`, exposed via the same Management API
  `db_schema` PATCH call already documented in `CLAUDE.md` (`public,
  graphql_public,dynamics,alayacare`).

## Data model

```sql
alayacare.client (
  client_id text primary key,          -- format "C0######", matches capture
  salutation text,
  first_name text,
  last_name text,
  birthday date,
  zip text,
  phone_main text,
  ai_agent_opt_out text,               -- captured as empty string, not a real boolean in the sample
  channels_of_communication text,
  types_of_communication text,
  notification_recipient text,
  contacts jsonb not null default '[]',-- inner shape unobserved, opaque for now
  createdon timestamptz not null default now()
)

alayacare.visit (
  alayacare_visit_id bigint generated always as identity primary key,
  alayacare_service_id bigint,
  employee_id text,                    -- free text: "056567" or "S0012389" style
  service_code_id integer,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','cancelled','missed')),
  start_at timestamptz,
  end_at timestamptz,
  cancelled boolean not null default false,
  client_id text references alayacare.client(client_id) on delete set null,
  createdon timestamptz not null default now()
)

alayacare.care_team_member (
  id uuid primary key default gen_random_uuid(),
  client_id text references alayacare.client(client_id) on delete cascade,
  employee_id text,                    -- captured sample had this empty for external contacts
  first_name text,
  last_name text,
  role text,                           -- "Support Worker", "Team Leader", etc.
  email text,
  createdon timestamptz not null default now()
)
```

RLS: same permissive-by-schema-boundary approach as `dynamics` — enabled,
`using (true) with check (true)` on all three tables. Isolation is the
Postgres schema, not row-level rules (see `CLAUDE.md` for why).

## API endpoints

Base: `{SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1`

| Method | Path | Captured? | Notes |
|---|---|---|---|
| GET | `/client-profile/{client_id}` | Yes | Exact captured shape |
| POST | `/client-profile` | Inferred | Create |
| PATCH | `/client-profile/{client_id}` | Inferred | Update |
| DELETE | `/client-profile/{client_id}` | Inferred | Delete |
| GET | `/scheduled-visits?client_id=&start_at=&end_at=&page=` | Yes | Exact captured envelope |
| POST | `/scheduled-visits` | Inferred | Create |
| PATCH | `/scheduled-visits/{visit_id}` | Inferred | Update |
| DELETE | `/scheduled-visits/{visit_id}` | Inferred | Delete |
| GET | `/cancelled-visit/staff-contacts/{visit_id}` | Yes | Read-only, derived from the visit's client's care team |

No CORS surprises this time — `alayacare-api` ships with the same
`CORS_HEADERS` + `OPTIONS` handling pattern from day one (this bit the
Dynamics build after the fact; see `CLAUDE.md`'s CORS gotcha).

## UI

New `/alayacare` route group, parallel to `/dynamics`:

- `components/AlayacareTopNav.tsx` — navy top bar: wordmark, decorative
  search input, decorative right-side chips (user/UTC/mail/logout), and
  the functional reset control.
- `components/AlayacareSidebar.tsx` — navy icon sidebar: Dashboard,
  Clients, Schedules functional; Employees, Accounting, Settings inert.
- `app/alayacare/layout.tsx` — top nav + sidebar + secondary tab row
  (Live Dashboard functional, rest inert) + content area.
- `app/alayacare/dashboard/page.tsx` — landing page. Reuses the existing
  `StatTile`/`BarList`/`DonutChart`/`TrendChart` components (already
  system-agnostic) with Alayacare-relevant aggregates: total clients,
  upcoming visits count, visits by status (donut), visits per week trend
  (line), care team roster size.
- `app/alayacare/clients/page.tsx` — list+detail, same master-detail
  pattern as Dynamics pages, styled with the avatar-initials + name +
  "{age} yrs, {city}/{country}" header from the reference screenshot.
- `app/alayacare/schedules/page.tsx` — Visit list+detail; selecting a visit
  shows its client's care team (calls the staff-contacts endpoint) below
  the edit form.
- `app/alayacare/help/page.tsx` — same structure as the Dynamics help page,
  captured-vs-inferred clearly marked per endpoint.
- A new `components/StatusBadge.tsx` (pill, colored background) for visit
  status — first reusable piece of chrome pulled from the reference
  screenshots rather than invented from scratch.

## Seed data

New fictional aged-care clients/visits/care-team members, same
healthcare/aged-care theme as the Dynamics seed data. Fresh invented names
— not reusing "Jane Doe" / "Carly White" / "Kerry Kline" from the captured
sample verbatim, since those read as sanitized-but-real-looking test data
from someone else's integration, not ours to repurpose as-is.

## Testing

Same approach as Dynamics: no test framework. `npx tsc --noEmit` + 
`npm run build` per page, then `curl` against each deployed endpoint verb
once applied to the live Supabase project, matching the exact captured
response shapes byte-for-byte where a capture exists.

## Open items (deferred, not v1-blocking)

- Employee, Tasks, Extensions entities — need real captures before
  building, per this session's decision.
- Client Intelligence (risk scoring) — v1.1+, own spec/plan cycle.
