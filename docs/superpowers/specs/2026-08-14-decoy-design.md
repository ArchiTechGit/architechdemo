# ArchiTech Decoy — Design Spec

## Purpose

Decoy emulates the look, feel, and data behaviour of real EMR/EHR/PAS/CRM
systems (Microsoft Dynamics, Alayacare, Epic) for sales demos and
integration conversations — without being any of them. A client sees "this
matches the shape of our Dynamics/Epic/etc data" instead of a generic mockup.

Replaces `emrdemo` (HealthCore) once Decoy's Epic system ships. `emrdemo`
stays untouched until then.

## Systems in scope (v1)

Microsoft Dynamics (CRM), Alayacare (aged-care EMR/PAS), Epic (EHR).
Build order: Dynamics → Alayacare → Epic (Epic is nested FHIR JSON, hardest).

## Architecture

- **Source repo**: new project dir (`thesenate/projects/decoy`), Next.js,
  `output: 'export'`, `basePath: '/decoy'` — mirrors the `wxccroi` build
  pattern in this repo's `CONTEXT.md`.
- **Deploy**: static export copied into `wxcc-build/decoy/` in this
  (deploy-only) repo, served at `architechdemo.com/decoy/`. Add a TOC entry
  in root `index.html`.
- **Backend**: one Supabase project. Separate Postgres **schema per system**
  (`dynamics`, `alayacare`, `epic`) — not shared/namespaced tables — so each
  system's shape stays faithful to the real thing.
- **Data lifecycle**: each schema has a seed SQL script
  (`supabase/seed/<system>.sql`, idempotent: truncate + insert). Data is
  live-editable through the UI after seeding. A "Reset demo data" button
  (scoped to the active system) re-runs that system's seed script.
- **Client/server split — Dataverse Web API shim**: the core value prop is
  showing a customer real Dynamics integration traffic against a system that
  isn't Dynamics. So the browser does **not** call `supabase-js` directly.
  Instead it calls a Supabase Edge Function that exposes the real Dataverse
  Web API v9.2 (OData v4) shape on the outside — `GET/POST/PATCH/DELETE
  .../api/data/v9.2/<entityset>[(id)]`, `$select`/`$expand`/`$orderby` query
  params, `"<lookup>@odata.bind": "/accounts(guid)"` for FK writes on
  create/update, `{"@odata.context": ..., "value": [...]}` collection
  envelopes, `OData-MaxVersion`/`OData-Version: 4.0` headers — and translates
  that into Postgres queries against the `dynamics` schema underneath. What
  shows up in a browser's network tab during the demo is the same request
  shape a real Dynamics integration would send.
  Scope is capped to the exact call shapes the four entity pages actually
  use (their `$select`/`$expand`/`@odata.bind` combinations) — this is not a
  general-purpose OData parser for arbitrary queries nobody's demoing.
  Reset needs elevated privilege an anon key shouldn't have, so it stays a
  separate, bespoke Supabase **Edge Function** (service role) — it has no
  real-Dynamics equivalent, so it isn't part of the Web API shim.
- **Auth for Decoy itself**: none. Open on load, like the other demos on
  this site.
- **Navigation**: single top nav switches active system, swapping route
  group, layout, and active schema. One pane of glass. System switcher UI
  itself is built last, once ≥2 systems exist (per original plan) — for v1
  (Dynamics only) there's nothing to switch between yet.

## v1 scope: Dynamics

Route group `/dynamics`, four connected views with real FK relationships,
matching Dynamics' actual navigation (not a flat single table):

- **Account** — organisation, central table most records attach to.
- **Contact** — person, linked to an Account.
- **Opportunity** — linked to an Account/Contact; tracks estimated revenue,
  close date, stage/rating.
- **Lead** — pre-opportunity stage.

Each: list view + detail view, full CRUD (add/edit/delete) via the Dataverse
Web API shim (see Architecture). Shared per-entity data hook (thin
fetch+`useState` wrapper, e.g. `useDataverseTable`) hides the OData request
construction and `@odata.bind` translation from the page components — no
React Query or other state library; add one only if this actually becomes
painful.

## Explicitly not building now

- Alayacare schema/UI, Epic schema/UI (FHIR shape, fake login screen).
- System-switcher nav (needs ≥2 systems to be meaningful).
- Any GitHub Pages pipeline work beyond what's needed to ship Dynamics.

## Testing

No test framework — this is a sales demo, not a product. One real check
worth doing: verify RLS policies actually block cross-schema/out-of-shape
writes (a quick negative test run directly against Supabase, not part of
the app).

## Open items (deferred, not v1-blocking)

- Alayacare and Epic data depth (how many linked entities beyond the core
  object) — scope when those builds start.
- Exact Edge Function implementation details for reset (per-schema seed
  script invocation) — nail down during Dynamics implementation since it's
  needed there too.
