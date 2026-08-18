# ArchiTech Health (Epic) demo rebuild — design spec

## What this is

Replace `emrdemo/` (the current "ArchiTech Health (Epic)" TOC-linked demo, built around
WXCC-staged sales-demo machinery — `DemoStageControl`, staged patient journey, WXCC toast)
with a new, simpler demo inspired by
[patient-emr-dashboard](https://github.com/sairamdgitte/patient-emr-dashboard) /
[live site](https://sairamdgitte.github.io/patient-emr-dashboard/) — an Epic-style clinical
worklist + patient chart, no staging/WXCC-integration machinery, ArchiTech-branded.

This is an "inspired rebuild," not a fork: own component code, own styling, reusing only the
existing ArchiTech-themed patient dataset already in this repo.

## Scope

**In:**
- Patient worklist (table, filters, search, sort, status badges)
- Patient detail view (Summary / Medications / Conditions / Observations / Webex tabs)
- Admit-patient modal (adds a synthetic patient to the in-memory list)
- Shell chrome: header, sidebar nav, footer — ArchiTech Health branded
- The same black `SystemSwitcher` bar used by `decoy-src`, replicated here (plain HTML/CSS,
  no Next.js dependency), linking to all three apps
- `decoy-src/components/SystemSwitcher.tsx` gains a 3rd entry, "ArchiTech Health", linking to
  `/archihealth/dist/`

**Out (explicitly dropped, not deferred):**
- Digital Twin 3D visualization/tab (heaviest lift in the source app, no product need here)
- DemoStageControl / staged patient journey / WXCC toast (emrdemo's existing sales-demo
  staging machinery — being removed, not carried over)
- Appointments / JourneySummary / DemoGuide pages (emrdemo-specific, staging-only)
- Real Webex Contact Center wiring on the "Webex" patient tab — it's cosmetic/inert (shows
  numbers, "Initiate connection" opens a static modal, no real call)
- Automated tests — consistent with `emrdemo`/`decoy-src`, this repo's demo folders have none

## Project & architecture

- New folder: `archihealth/` at repo root, sibling to `decoy-src/` and `emrdemo/`.
- Stack: Vite + React 18 + TypeScript + Tailwind CSS.
- Routing: no router library. Local component state switches between `worklist` and
  `patient` views (mirrors the source app's approach), matching the scale of the app.
- Build output: `npm run build` → Vite's default `dist/`, committed to `archihealth/dist/`
  and served statically — same pattern as `emrdemo/dist/`.
- `emrdemo/` is deleted entirely (folder + git-tracked files) once the new app replaces it.
- `index.html` (TOC) "ArchiTech Health (Epic)" entry href changes from `/emrdemo/dist/` to
  `/archihealth/dist/`.

## Data

- Source: `emrdemo/client/src/lib/data.ts` (12 patients, headed by Margaret Thompson) and
  `emrdemo/client/src/types/index.ts`, both already ArchiTech-branded
  (`facility: "ArchiTech Hospital"`, e.g. "Dr James Chen").
- Ported into `archihealth/src/lib/data.ts` + `archihealth/src/types/index.ts` before
  `emrdemo/` is deleted.
- Dropped from the type/data during the port: `DemoStage` type, `Patient.demoStages`,
  `Patient.isHeroPatient`, `Appointment` type and any appointment data (all staging-only,
  unused by worklist/detail/admit).
- Kept as-is: `Allergy`, `Diagnosis`, `Medication`, `VitalReading`, `Encounter`, `NextOfKin`,
  `GP`, and the full `Patient` shape minus the two dropped fields above.

## Components & pages

**Shell**
- Header: ArchiTech Health wordmark/logo, breadcrumb, search input (stub, non-functional),
  user profile (e.g. "Dr. Anya Mehta").
- Sidebar: "Today" section (Overview, My Patients — My Patients is the only wired item,
  opens the worklist), "Clinical" section (Orders, Medications, Results, Notes — inert,
  `title="Not part of this demo"` like other decoy inert nav items).
- Footer: ArchiTech branding, version tag, partner logos (reuse existing ArchiTech/Webex
  logo assets from `emrdemo/client/src/assets/` before deletion).
- `SystemSwitcher` bar (new, plain HTML/CSS component in `archihealth/src/components/`):
  black bar, links to `/decoy/alayacare/dashboard/`, `/decoy/dynamics/dashboard/`, and itself
  — mirrors `decoy-src/components/SystemSwitcher.tsx` visually and structurally.

**Worklist**
- Table columns: Patient (avatar/name/IHI/age/sex), Status (Critical/Watch/Stable — derived
  from `ewsScore`: ≥5 Critical, 3–4 Watch, <3 Stable), Ward·Room, Reason (primary active
  diagnosis' `shortName`), LOS (days since `admissionDate`), HR sparkline (from `vitals[]`
  heart rate series), Conditions (diagnosis tags + allergy alert icon if any `severity`
  Severe/Life-threatening), Attending (`treatingClinician`), Updated (relative time from
  latest vital timestamp), Actions (delete for newly-admitted only, open-detail chevron).
- Status filter chips with counts (All/Critical/Watch/Stable), search by name/IHI, sort
  toggle (priority default / name), row select-highlight, double-click or chevron opens
  detail.

**PatientView**
- Header: avatar, name/age/sex/DOB, IHI, ward/room, LOS, allergy tags as critical warnings.
- Tabs: Summary, Medications, Conditions, Observations, Webex.
- Summary tab: vitals strip (HR, BP, SpO₂, RR, weight — status-colored against reference
  ranges), two-column body — left: active conditions + allergies, plan-of-care checklist
  (static/demo items), medications preview + "View all", recent observations grid (latest
  unique types); right (320px sidebar): care team (static list), 24h activity timeline
  (derived from latest `encounters`/`vitals`), lab-integration blurb text.
- Medications tab: full table (name, status tag, route/class).
- Conditions tab: full list of diagnoses with status tags.
- Observations tab: full vitals-derived table (date, type, value, unit, reference, status),
  reverse-chronological.
- Webex tab: static card — patient/clinician numbers shown in monospace, "Initiate
  connection" opens an inert confirmation modal (no real integration).

**AdmitPatientModal**
- Fields: Demographics (full name, gender select, DOB date picker, allergies text,
  preferred language), Admission details (ward select, room text, bed select, attending
  select, reason text), Clinical (conditions text, medications text), Vitals (BP, HR, SpO₂,
  RR, temperature, height, weight — all text).
- Required: name, DOB, gender (matches source's validation message).
- Submit: builds a synthetic `Patient`, comma-separated fields (allergies/conditions/
  medications) parsed into arrays filtering "none", vitals wrapped into one `VitalReading`
  timestamped now, prepended to in-memory list. No persistence (page refresh resets to seed
  data, same as the source app and as `emrdemo`).

## Styling

- Tailwind CSS. Status colors: critical red, watch amber, stable green (CSS custom
  properties, matching the source app's approach).
- Header/switcher navy `#0a1e4a` (matches `ArchicareTopNav`'s existing ArchiTech blue)
  instead of the source app's indigo/HTL theme.
- Monospace for vitals/codes/IHI numbers, card-based panels with subtle borders, consistent
  with the rest of this repo's demo styling conventions.

## Error handling & testing

- No backend — errors are limited to: empty-state guard on the worklist (no patients),
  required-field validation on the admit modal (inline message, same wording as source).
- No automated test suite, matching `emrdemo`/`decoy-src` convention in this repo.
- Verification: `npm run build` succeeds, then a manual browser pass through worklist →
  filter/search/sort → open patient → all 5 tabs → admit modal → new patient appears →
  SystemSwitcher links resolve in both directions (archihealth ↔ decoy).

## Migration steps (for the implementation plan)

1. Scaffold `archihealth/` (Vite + React + TS + Tailwind).
2. Port `data.ts` + `types/index.ts` from `emrdemo/`, stripping staging-only fields.
3. Build `Shell` (header/sidebar/footer) + new `SystemSwitcher` component.
4. Build `Worklist`.
5. Build `PatientView` (5 tabs).
6. Build `AdmitPatientModal`.
7. Wire `App.tsx` view-state switching + branding assets (copy needed logos from
   `emrdemo/client/src/assets/`).
8. `npm run build`, commit `archihealth/dist/`.
9. Update `index.html` TOC href.
10. Add "ArchiTech Health" entry to `decoy-src/components/SystemSwitcher.tsx`, rebuild
    `decoy-src` (`npm run build`, sync `decoy-src/out/` → `decoy/`), commit.
11. Delete `emrdemo/` entirely.
12. Manual verification pass (see above).
