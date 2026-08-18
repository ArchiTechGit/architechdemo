# Epic FHIR API shim (epic-api) — design spec

## What this is

Sub-project 1 of 2 for replicating Epic Systems' platform in Decoy. Adds a
third vendor API shim — `epic-api` — alongside the existing `dataverse-api`
(Dynamics 365) and `archicare-api` (ArchiTech Care), giving archihealth's
demo network traffic the shape of a real Epic FHIR R4 integration: same
URL pattern, OAuth2/SMART-on-FHIR token flow, and FHIR resource JSON shape
a genuine Epic integration would produce.

Sub-project 2 (not this spec) reworks archihealth's frontend into
Hyperspace-style UI conventions and wires it to this API instead of its
current static in-memory patient array.

## Research basis

Per research into Epic's public surface (epic.com, fhir.epic.com,
open.epic.com): Epic's FHIR R4 API is the one genuinely open,
standardized, well-documented layer of the platform (Hyperspace's actual
UI is closed/access-gated with no official screenshots). This sub-project
targets that FHIR layer specifically because it's legitimately
reproducible — a public HL7 standard Epic conforms to — not guesswork.

## Scope

**In:**
- New Postgres schema `epic` in the existing Supabase project
  (`kjapsnzcaicecjnctmoh`), alongside `dynamics` and `archicare`.
- New Edge Function `epic-api` exposing 10 FHIR R4 resource types:
  `Patient`, `Encounter`, `Condition`, `MedicationRequest`, `Observation`,
  `AllergyIntolerance`, `DiagnosticReport`, `Procedure`, `Practitioner`,
  `PractitionerRole`.
- A cosmetic OAuth2/SMART-on-FHIR-shaped token endpoint.
- Seed data migrating archihealth's existing 11 patients into FHIR-shaped
  rows.
- `/epic/help` API reference page (new page in `decoy-src/app/epic/help/`).
- `reset-demo` gains `'epic'` in `ALLOWED_SCHEMAS` + a
  `epic.reset_demo_data()` Postgres function.

**Out (this sub-project):**
- Any frontend/UI work — that's sub-project 2.
- Real auth/JWT validation — cosmetic only, matches the other two shims
  and the site's no-real-auth policy.
- FHIR resources beyond the 10 listed (e.g. `Appointment`, `CarePlan`,
  `Coverage`) — not needed by archihealth's current worklist/chart scope.
- Write endpoints beyond what archihealth's Admit-Patient flow needs
  (`POST Patient`, `POST Encounter`, `POST Condition`,
  `POST MedicationRequest` — matching the "admit creates a new patient +
  their initial data" flow). No `PATCH`/`DELETE` on any resource — nothing
  in archihealth currently edits or removes existing clinical data.

## Architecture

```
Browser (archihealth, or curl for demo purposes)
  → fetch GET  .../functions/v1/epic-api/api/FHIR/R4/<ResourceType>[/<id>][?query]
  → fetch POST .../functions/v1/epic-api/api/FHIR/R4/<ResourceType>
  → fetch POST .../functions/v1/epic-api/oauth2/token   (SMART Backend Services shape)
  → epic-api Edge Function (Deno)
    reads/writes epic.<table>, wraps search results in a FHIR Bundle
  → Postgres, schema `epic` (service role, via supabase-js server-side)
```

Independent of `dataverse-api`/`archicare-api` — no shared translation
layer, matching those two shims' independence from each other.

## Schema

One table per resource type, all following the same shape:

```sql
create table epic.patient (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table epic.encounter (
  id text primary key,
  data jsonb not null,
  patient_id text not null references epic.patient(id),
  created_at timestamptz not null default now()
);
-- condition, medication_request, observation, allergy_intolerance,
-- diagnostic_report, procedure, practitioner_role: same shape as
-- encounter (patient_id FK + data jsonb).
-- practitioner: same shape as patient (no patient_id — it's the
-- practitioner's own resource).
```

`data` holds the complete FHIR R4 resource JSON (`resourceType`, `id`,
`meta.versionId`/`lastUpdated`, and all resource-specific fields) exactly
as it would be returned. `patient_id` is denormalized from the resource's
`subject`/`patient` reference specifically so the Edge Function can filter
with a plain indexed `eq()` query instead of parsing jsonb paths — mirrors
`archicare-api`'s pattern of keeping the wire-format-authentic part
(`data`) separate from the query-convenience part (`patient_id`).

`practitioner_role.data` embeds a reference to its `practitioner_id`
(denormalized the same way) so `PractitionerRole?practitioner=<id>` search
works the same way.

RLS: fully permissive on every table (`using (true) with check (true)`),
matching `dynamics`/`archicare`'s existing policy — schema-boundary
isolation, not row-level rules.

## FHIR resource shapes (what `data` contains per type)

- **Patient**: `identifier` (array: MRN + IHI, each `{system, value}`),
  `name` (array: `{family, given, use: "official"}`), `gender`,
  `birthDate`, `address` (array: `{line, city, state, postalCode}`),
  `telecom` (array: `{system: "phone", value}`).
- **Encounter**: `status` (`"finished"`/`"in-progress"`), `class`
  (`{code}` — maps `admissionStatus`), `subject` (`{reference:
  "Patient/<id>"}`), `period` (`{start, end?}`), `serviceProvider`
  (`{display: "ArchiTech Hospital"}`), `location` (array: ward/bed).
- **Condition**: `clinicalStatus` (`{coding: [{code}]}` —
  active/resolved/chronic), `code` (`{coding: [{system: "icd-10",
  code}], text: shortName}`), `subject`.
- **MedicationRequest**: `status`, `medicationCodeableConcept`
  (`{text: name}`), `subject`, `dosageInstruction` (array:
  `{text: "<dose> <frequency>", route: {text}}`), `authoredOn`.
- **Observation**: `status: "final"`, `code` (`{coding: [{system:
  "http://loinc.org", code, display}]}` — one per vital type: heart rate
  8867-4, systolic 8480-6, diastolic 8462-4, SpO2 59408-5, resp rate
  9279-1, temp 8310-5), `subject`, `effectiveDateTime`, `valueQuantity`
  (`{value, unit}`).
- **AllergyIntolerance**: `clinicalStatus`, `code` (`{text: allergen}`),
  `patient`, `reaction` (array: `{manifestation: [{text}], severity}`).
- **DiagnosticReport** / **Procedure**: derived from `Encounter` notes
  where applicable (e.g. Astrid Nygaard's TKR procedure) — `status`,
  `code`, `subject`, `performedDateTime`/`effectiveDateTime`.
- **Practitioner**: `name` (array), `identifier`.
- **PractitionerRole**: `practitioner` (`{reference: "Practitioner/<id>"}`),
  `specialty` (array: `{text: department}`).

## Edge Function behavior

- `GET .../Patient` — search, returns `Bundle` of all patients (no real
  pagination needed at 11 rows, but shape is still a Bundle).
- `GET .../Patient/<id>` — single resource, 404 `OperationOutcome`-shaped
  error if missing.
- `GET .../<ResourceType>?patient=<id>` — search filtered by `patient_id`,
  returns `Bundle`.
- `GET .../PractitionerRole?practitioner=<id>` — search filtered by
  practitioner.
- `POST .../Patient`, `POST .../Encounter`, `POST .../Condition`,
  `POST .../MedicationRequest` — insert; body must already be FHIR-shaped
  (frontend constructs it, matching how `AdmitPatientModal` already builds
  a `Patient` object in sub-project 2's scope); returns the created
  resource with a generated `id`.
- `POST .../oauth2/token` — ignores body content beyond confirming
  `grant_type` is present, returns the stub token JSON described above.
- Any other path/method — 404 `OperationOutcome`-shaped error (FHIR's
  real error resource shape: `{resourceType: "OperationOutcome", issue:
  [{severity: "error", code, diagnostics}]}`), not a bare `{error}` object
  like the other two shims — this is the one place Epic fidelity requires
  a different error shape than the existing convention.

## Seed data migration

New file `decoy-src/supabase/seed/epic.sql` (or a seed step in the
`0006_epic_schema.sql` migration, matching whichever convention
`dynamics.sql`/`archicare` seeding already uses — check
`supabase/seed/dynamics.sql` for the established pattern before writing
this). Converts each of archihealth's 11 patients
(`archihealth/src/lib/data.ts`) into the row shapes above:

- 1 `patient` row per patient (11 total).
- 1 `encounter` row per patient (their admission).
- N `condition` rows per patient (one per diagnosis).
- N `medication_request` rows per patient (one per medication).
- N `observation` rows per patient (one per vital-sign-per-reading —
  e.g. Margaret Thompson's 5 vitals readings × 6 vital-sign-types = 30
  Observation rows for her alone).
- N `allergy_intolerance` rows (one per allergy).
- `diagnostic_report`/`procedure` rows only where an encounter note
  describes one (e.g. Astrid Nygaard's TKR).
- `practitioner`/`practitioner_role` rows deduplicated across patients
  (e.g. "Dr James Chen" appears once as a `Practitioner`, referenced by
  every encounter/patient he treats).

## Help page

`decoy-src/app/epic/help/page.tsx`, structurally matching
`app/alayacare/help/page.tsx` / `app/dynamics/help/page.tsx`: Base URL,
Authentication (the token endpoint + bearer header), one section per
resource type (fields, example request/response), a "Fidelity" callout
marking every endpoint **"FHIR R4 (public spec)"** instead of
Captured/Inferred — explain in-page that this differs from ArchiTech
Care's Captured/Inferred distinction because there's no real Epic traffic
sample to compare against, only conformance to the open standard.

## Error handling & testing

- Malformed search params (e.g. non-existent `patient` id) → empty
  Bundle (`total: 0, entry: []`), not an error — matches real FHIR search
  behavior.
- Missing/malformed resource id on a direct `GET .../<Type>/<id>` → 404
  with an `OperationOutcome` body.
- No test framework, matching repo convention. Verification:
  `npx tsc --noEmit` is not applicable (Edge Functions are Deno, excluded
  from `decoy-src/tsconfig.json` per existing repo note) — verify instead
  by curling the deployed function for each resource type and each verb
  once deployed, same pattern used for `dataverse-api`/`archicare-api`.

## Migration steps (for the implementation plan)

1. Migration `0006_epic_schema.sql`: create `epic` schema + 10 tables +
   RLS policies + `epic.reset_demo_data()` function.
2. Seed data: write and run the patient→FHIR conversion (script or SQL,
   whichever matches the existing seed convention).
3. Build `epic-api` Edge Function: token endpoint, then one resource type
   at a time (Patient first, since everything else references it).
4. Add `'epic'` to `reset-demo`'s `ALLOWED_SCHEMAS`.
5. Add `epic` to the exposed PostgREST schema list (Management API
   `db_schema` PATCH, same as the existing `dynamics,archicare` setup).
6. Build `/epic/help` page.
7. Deploy `epic-api` + updated `reset-demo`, apply the migration to the
   linked Supabase project.
8. Verify: curl every resource type/verb against the deployed function,
   confirm `/epic/help` renders, confirm reset-demo works for `epic`.
