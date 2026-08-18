# Epic Hyperspace-style UI (decoy-src/app/epic) — design spec

## What this is

Sub-project 2 of 2 for replicating Epic's platform in Decoy. Migrates the
standalone `archihealth/` Vite app into `decoy-src/app/epic/*` as Decoy's
third vendor system (alongside `/decoy/dynamics/*` and `/decoy/alayacare/*`),
reworks its UI toward real Epic/Hyperspace conventions researched in
sub-project 1's spec, and wires it to the `epic-api` FHIR shim built in
sub-project 1 instead of a static in-memory array.

## Why the migration (not just a UI rework)

`archihealth` was originally built as a standalone rebuild of the old
`emrdemo` (also always separate from `decoy-src`), before it was
established that it fills Decoy's "third vendor simulator" slot. That's
now confirmed, so it should live the same way the other two systems do:
Next.js pages inside `decoy-src`, one build, one static export, one
TOC entry, no separate Vite project. `archihealth/` is deleted once
migrated, the same way `emrdemo/` was deleted once `archihealth` replaced
it.

## Scope

**In:**
- New pages under `decoy-src/app/epic/`: `layout.tsx` (cosmetic login gate
  + top chrome), `patients/page.tsx` (search + worklist + chart, single
  page with client-side selection state — no dynamic routes, matching
  `alayacare/clients/page.tsx`'s pattern and required anyway by static
  export).
- New `decoy-src/lib/epicApi.ts` — `useEpicResource` hook(s) that fetch
  from `epic-api` and unwrap FHIR `Bundle`/`OperationOutcome` shapes.
- Hyperspace-convention naming/structure: a persistent **Storyboard**
  patient-context sidebar (not archihealth's generic left nav), a
  **SnapShot** chart-landing tab (renamed from "Summary"), **Chart
  Review** for tabular history (renamed from "Observations"), MRN/name/
  DOB **patient search** dialog as the primary way to open a chart, and
  a cosmetic role/department **login gate** shown once per session.
- `decoy-src/components/SystemSwitcher.tsx` updated: the special-cased
  plain `<a>` entry for ArchiTech Health is replaced with a normal
  `Link`, since Epic now lives inside the `/decoy` basePath like the
  other two systems.
- Root `index.html` TOC entry updated: "ArchiTech Health (Epic)" href
  changes from `/archihealth/dist/` to `/decoy/epic/patients/`.
- `archihealth/` deleted entirely once migrated.

**Out:**
- Any change to `epic-api` itself (sub-project 1, already shipped) beyond
  what the frontend needs to call it correctly.
- Digital Twin or any other feature not already in archihealth.
- Real authentication — the login gate is cosmetic only (confirmed
  decision), matching the site's no-real-auth policy.
- Per-patient dynamic routes — confirmed single-page + client-state
  pattern, matching Dynamics/ArchiTech Care.

## Architecture

```
decoy-src/app/epic/
  layout.tsx          — cosmetic login gate (session-only flag) + EpicShell chrome
  patients/page.tsx    — search/worklist + Storyboard + SnapShot/Chart Review/etc chart
  help/page.tsx         — already built (sub-project 1)

decoy-src/lib/epicApi.ts
  useEpicResource<T>(resourceType, params?) — GET .../api/FHIR/R4/<ResourceType>?<params>,
    unwraps { resourceType: "Bundle", entry: [{resource}] } → T[]
  useEpicResourceById<T>(resourceType, id) — GET .../<ResourceType>/<id>,
    returns the resource directly; treats a response with
    resourceType === "OperationOutcome" as an error (not found)
  createEpicResource<T>(resourceType, body) — POST .../<ResourceType>,
    returns the created resource
```

Data flow mirrors `archicareApi.ts`'s hook shape (fetch on mount, `.catch()`
setting an error state, a `refresh()` for re-fetching) but adapted to FHIR's
Bundle/OperationOutcome envelope instead of `{items}`/`{error}`.

## Component migration map

| archihealth (deleted) | decoy-src (new) | Change |
|---|---|---|
| `App.tsx` | `app/epic/patients/page.tsx` | View-state logic ported as-is (search/worklist ↔ chart) |
| `components/Shell.tsx` (`Header`) | `components/EpicShell.tsx` (`EpicHeader`) | Restyled, Epic branding |
| `components/Shell.tsx` (`Sidebar`) | Replaced by patient-context **Storyboard** (only shown once a patient is selected — real Epic's Storyboard is patient-context, not a persistent app nav) | Structural change, not a rename |
| `components/Worklist.tsx` | Folded into `patients/page.tsx`'s landing view, plus a new **patient search modal** (MRN/name/DOB) as the primary entry point | Worklist becomes the "recent/active patients" list under the search bar, matching Epic's Patient Station convention |
| `components/PatientView.tsx` | `components/EpicChart.tsx` | Summary→SnapShot, Observations→Chart Review, same tab content otherwise |
| `components/AdmitPatientModal.tsx` | `components/AdmitPatientModal.tsx` (ported near-verbatim) | Submit now calls `createEpicResource` (Patient + Condition + MedicationRequest + Encounter posts) instead of local array prepend |
| `lib/clinical.ts` | `lib/epicClinical.ts` | Same helper functions, adapted to FHIR field shapes (e.g. `patient.name[0].given[0]` instead of `patient.firstName`) |
| `lib/data.ts`, `types/index.ts` | Deleted — data now lives in Postgres, served by `epic-api` | N/A |

## Login gate

A full-screen component rendered by `layout.tsx` before any `/epic/*`
content, gated on a `sessionStorage` flag (not real auth — purely to avoid
re-showing it on every internal navigation within one browser session):
user ID text field (any value accepted), job-role select (Physician / RN /
Front Desk), department select, "Sign in" button. Any submission — or even
an empty one — proceeds; there is no validation, matching the "cosmetic
only" decision confirmed earlier.

## Patient search + Storyboard + chart

**Landing view** (`patients/page.tsx`, no patient selected): a "Patient
Search" button opens a modal with MRN / name+DOB+sex search fields
(matching real Epic's Patient Station lookup); results list feeds into
selection. Below/alongside it, a persistent "recent patients" worklist
(reusing the existing status-chip/search/sort logic from archihealth's
`Worklist.tsx`, restyled) for one-click re-entry without a fresh search.

**Chart view** (a patient selected): left **Storyboard** sidebar — avatar/
initials, name, age/sex/DOB, allergy tags, a problem-list snippet (top 2-3
active conditions) — persistent across every tab. Main area tabs:
**SnapShot** (vitals strip, active conditions, plan-of-care-style
medications preview, care team, recent activity — same content as
archihealth's Summary tab), **Chart Review** (the full vitals/observations
history table, renamed from Observations), **Medications**, **Conditions**,
**Webex** (unchanged, still cosmetic).

## Error handling & testing

- Every `epicApi.ts` hook call has a `.catch()` setting an error state —
  no silent infinite-spinner failures, per the CORS/fetch-chain gotcha
  already documented in `decoy-src/CLAUDE.md`.
- `useEpicResourceById` treats `resourceType === "OperationOutcome"` in
  the response body as a 404-equivalent error, not a crash.
- No test framework, matching repo convention. Verify with
  `npx tsc --noEmit` + `npm run build` per page (both from `decoy-src/`),
  then a manual click-through (`npm run dev`) once the full page is built.

## Migration steps (for the implementation plan)

1. Build `decoy-src/lib/epicApi.ts` (hooks) and `decoy-src/lib/epicClinical.ts`
   (helpers ported from archihealth's `clinical.ts`).
2. Build `components/EpicShell.tsx` (header + login gate).
3. Build the patient search modal + recent-patients worklist (ported from
   `Worklist.tsx`) inside `patients/page.tsx`'s landing view.
4. Build `components/Storyboard.tsx` + `components/EpicChart.tsx` (ported
   from `PatientView.tsx`, SnapShot/Chart Review renames).
5. Port `AdmitPatientModal.tsx`, wire its submit to `createEpicResource`
   calls instead of local state.
6. Wire `patients/page.tsx`'s view-state switching (search/worklist ↔
   chart), matching archihealth's `App.tsx` logic.
7. Update `SystemSwitcher.tsx` (drop the special-cased anchor).
8. Update root `index.html` TOC href.
9. Build, sync `decoy-src/out/` → `decoy/`, commit.
10. Delete `archihealth/` entirely.
11. Manual verification pass: login gate → search/worklist → open a
    patient → all tabs render with real epic-api data → admit a patient
    → SystemSwitcher links resolve → TOC link opens the new page.
