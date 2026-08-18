# Epic FHIR API Shim (epic-api) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third Decoy vendor API shim, `epic-api`, giving archihealth's demo traffic the shape of a real Epic FHIR R4 integration (URL pattern, OAuth2/SMART-on-FHIR token flow, FHIR resource JSON).

**Architecture:** New Supabase Edge Function `epic-api` + new Postgres schema `epic` (10 tables, one per FHIR resource type), following the exact independent-shim pattern already used by `dataverse-api`/`archicare-api`. Seed data migrates archihealth's existing 11 patients into FHIR-shaped rows via a generator script (too much data to hand-transcribe reliably).

**Tech Stack:** Deno (Edge Functions, matching `dataverse-api`/`archicare-api`), Postgres/Supabase, a one-off Node/TypeScript generator script for seed data.

**Spec:** `docs/superpowers/specs/2026-08-18-decoy-epic-api-v1-design.md`

## Global Constraints

- No real auth/JWT validation anywhere in `epic-api` — cosmetic only, matches `dataverse-api`/`archicare-api` and the site's no-real-auth policy.
- Error shape for `epic-api` is FHIR's own `OperationOutcome` (`{resourceType: "OperationOutcome", issue: [{severity, code, diagnostics}]}`), NOT the bare `{error: {message}}` shape the other two shims use — this is deliberate, matching the spec.
- RLS on every `epic.*` table is fully permissive (`using (true) with check (true))`), matching `dynamics`/`archicare`.
- No test framework — verify Edge Function code by careful reading (no local Deno runtime available in this environment) and by curling the deployed function once live, per repo convention.
- Deploy/migration-apply steps require `SUPABASE_ACCESS_TOKEN` (a personal access token from the Supabase dashboard) — this session has no such token. Those steps are written out precisely but may need to be run by whoever has the token if the executing agent doesn't.
- Resource scope: exactly these 10 FHIR R4 types — `Patient`, `Encounter`, `Condition`, `MedicationRequest`, `Observation`, `AllergyIntolerance`, `DiagnosticReport`, `Procedure`, `Practitioner`, `PractitionerRole`. No others.

---

### Task 1: Create the `epic` Postgres schema

**Files:**
- Create: `decoy-src/supabase/migrations/0006_epic_schema.sql`

**Interfaces:**
- Produces: 10 tables under schema `epic`, each `(id text primary key default gen_random_uuid()::text, data jsonb not null, created_at timestamptz not null default now())`, plus `patient_id text` on every table except `patient` and `practitioner`, plus `practitioner_id text` additionally on `practitioner_role`.

- [ ] **Step 1: Write the migration file**

```sql
create schema if not exists epic;

create table epic.patient (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table epic.practitioner (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table epic.encounter (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.condition (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.medication_request (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.observation (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.allergy_intolerance (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.diagnostic_report (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.procedure (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  patient_id text not null references epic.patient(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table epic.practitioner_role (
  id text primary key default gen_random_uuid()::text,
  data jsonb not null,
  practitioner_id text not null references epic.practitioner(id) on delete cascade,
  created_at timestamptz not null default now()
);

grant usage on schema epic to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema epic to anon, authenticated, service_role;
alter default privileges in schema epic grant select, insert, update, delete on tables to anon, authenticated;

alter table epic.patient enable row level security;
alter table epic.practitioner enable row level security;
alter table epic.encounter enable row level security;
alter table epic.condition enable row level security;
alter table epic.medication_request enable row level security;
alter table epic.observation enable row level security;
alter table epic.allergy_intolerance enable row level security;
alter table epic.diagnostic_report enable row level security;
alter table epic.procedure enable row level security;
alter table epic.practitioner_role enable row level security;

create policy "anon full access" on epic.patient for all using (true) with check (true);
create policy "anon full access" on epic.practitioner for all using (true) with check (true);
create policy "anon full access" on epic.encounter for all using (true) with check (true);
create policy "anon full access" on epic.condition for all using (true) with check (true);
create policy "anon full access" on epic.medication_request for all using (true) with check (true);
create policy "anon full access" on epic.observation for all using (true) with check (true);
create policy "anon full access" on epic.allergy_intolerance for all using (true) with check (true);
create policy "anon full access" on epic.diagnostic_report for all using (true) with check (true);
create policy "anon full access" on epic.procedure for all using (true) with check (true);
create policy "anon full access" on epic.practitioner_role for all using (true) with check (true);
```

- [ ] **Step 2: Commit** (this migration isn't applied to the live project yet — that happens in Task 8, after the seed function exists to run alongside it)

```bash
git add decoy-src/supabase/migrations/0006_epic_schema.sql
git commit -m "feat(epic-api): add epic schema migration (10 FHIR resource tables)"
```

---

### Task 2: Generate FHIR-shaped seed data from archihealth's patients

**Files:**
- Create: `archihealth/scripts/generate-epic-seed.mjs`
- Create: `decoy-src/supabase/seed/epic.sql` (generated output, then hand-wrapped per Step 4)

**Interfaces:**
- Consumes: `archihealth/src/lib/data.ts`'s `PATIENTS` export (via a transpiled copy — see Step 2).
- Produces: `decoy-src/supabase/seed/epic.sql`, structured like `decoy-src/supabase/seed/archicare.sql` (a `epic.reset_demo_data()` function containing truncate + insert statements, then a call to it).

- [ ] **Step 1: Write the generator script**

```javascript
// archihealth/scripts/generate-epic-seed.mjs
// Run after transpiling data.ts — see Task 2 Step 2 for the exact command.
import { PATIENTS } from "../../../tmp-epic-seed-build/data.js";

function sqlStr(s) {
  if (s === undefined || s === null) return "null";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function sqlJson(obj) {
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

const LOINC = {
  heartRate: ["8867-4", "Heart rate"],
  systolicBP: ["8480-6", "Systolic blood pressure"],
  diastolicBP: ["8462-4", "Diastolic blood pressure"],
  oxygenSaturation: ["59408-5", "Oxygen saturation"],
  respiratoryRate: ["9279-1", "Respiratory rate"],
  temperature: ["8310-5", "Body temperature"],
};
const UNITS = {
  heartRate: "/min", systolicBP: "mmHg", diastolicBP: "mmHg",
  oxygenSaturation: "%", respiratoryRate: "/min", temperature: "Cel",
};

const patientRows = [];
const encounterRows = [];
const conditionRows = [];
const medicationRows = [];
const observationRows = [];
const allergyRows = [];
const diagnosticReportRows = [];
const procedureRows = [];
const practitionerByName = new Map(); // name -> { id, rowSql }
const practitionerRoleRows = [];

function practitionerId(name, department) {
  if (!practitionerByName.has(name)) {
    const id = `pr-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const [given, ...rest] = name.replace(/^Dr\s+/, "").split(" ");
    const family = rest.join(" ");
    const data = { resourceType: "Practitioner", id, name: [{ family, given: [given], prefix: ["Dr"] }] };
    practitionerByName.set(name, { id, sql: `(${sqlStr(id)}, ${sqlJson(data)})` });
    practitionerRoleRows.push(
      `(${sqlStr(`role-${id}`)}, ${sqlJson({
        resourceType: "PractitionerRole",
        id: `role-${id}`,
        practitioner: { reference: `Practitioner/${id}` },
        specialty: department ? [{ text: department }] : [],
      })}, ${sqlStr(id)})`,
    );
  }
  return practitionerByName.get(name).id;
}

for (const p of PATIENTS) {
  const patientId = p.id;
  patientRows.push(
    `(${sqlStr(patientId)}, ${sqlJson({
      resourceType: "Patient",
      id: patientId,
      identifier: [
        { system: "urn:archihealth:mrn", value: p.mrn },
        { system: "urn:archihealth:ihi", value: p.ihi },
      ],
      name: [{ family: p.lastName, given: [p.firstName], use: "official" }],
      gender: p.sex.toLowerCase(),
      birthDate: p.dob,
      address: [{ line: [p.address], city: "", state: "", postalCode: "" }],
      telecom: [{ system: "phone", value: p.phone }],
    })})`,
  );

  encounterRows.push(
    `(${sqlStr(`enc-${patientId}`)}, ${sqlJson({
      resourceType: "Encounter",
      id: `enc-${patientId}`,
      status: p.admissionStatus === "Discharged" ? "finished" : "in-progress",
      class: { code: p.admissionStatus },
      subject: { reference: `Patient/${patientId}` },
      period: { start: p.admissionDate },
      serviceProvider: { display: "ArchiTech Hospital" },
      location: [{ location: { display: `Ward ${p.ward}, Bed ${p.bedNumber}` } }],
    })}, ${sqlStr(patientId)})`,
  );

  p.diagnoses.forEach((d, i) => {
    conditionRows.push(
      `(${sqlStr(`cond-${patientId}-${i}`)}, ${sqlJson({
        resourceType: "Condition",
        id: `cond-${patientId}-${i}`,
        clinicalStatus: { coding: [{ code: d.status.toLowerCase() }] },
        code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: d.icdCode }], text: d.shortName },
        subject: { reference: `Patient/${patientId}` },
      })}, ${sqlStr(patientId)})`,
    );
  });

  p.medications.forEach((m) => {
    medicationRows.push(
      `(${sqlStr(m.id)}, ${sqlJson({
        resourceType: "MedicationRequest",
        id: m.id,
        status: m.status.toLowerCase() === "active" ? "active" : "stopped",
        medicationCodeableConcept: { text: m.brandName ? `${m.name} (${m.brandName})` : m.name },
        subject: { reference: `Patient/${patientId}` },
        dosageInstruction: [{ text: `${m.dose} ${m.frequency}`, route: { text: m.route } }],
        authoredOn: m.startDate,
      })}, ${sqlStr(patientId)})`,
    );
  });

  p.vitals.forEach((v, vi) => {
    Object.keys(LOINC).forEach((key) => {
      const [code, display] = LOINC[key];
      observationRows.push(
        `(${sqlStr(`obs-${patientId}-${vi}-${key}`)}, ${sqlJson({
          resourceType: "Observation",
          id: `obs-${patientId}-${vi}-${key}`,
          status: "final",
          code: { coding: [{ system: "http://loinc.org", code, display }] },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: v.timestamp,
          valueQuantity: { value: v[key], unit: UNITS[key] },
        })}, ${sqlStr(patientId)})`,
      );
    });
  });

  p.allergies.forEach((a, i) => {
    allergyRows.push(
      `(${sqlStr(`allergy-${patientId}-${i}`)}, ${sqlJson({
        resourceType: "AllergyIntolerance",
        id: `allergy-${patientId}-${i}`,
        clinicalStatus: { coding: [{ code: "active" }] },
        code: { text: a.allergen },
        patient: { reference: `Patient/${patientId}` },
        reaction: [{ manifestation: [{ text: a.reaction }], severity: a.severity.toLowerCase() }],
      })}, ${sqlStr(patientId)})`,
    );
  });

  practitionerId(p.treatingClinician, p.department);

  // Astrid Nygaard's TKR is the one encounter note describing an actual
  // procedure — everyone else's encounter notes are ward-round/admission
  // narrative, not a discrete procedure/report event.
  if (patientId === "astrid-nygaard") {
    procedureRows.push(
      `(${sqlStr("proc-astrid-tkr")}, ${sqlJson({
        resourceType: "Procedure",
        id: "proc-astrid-tkr",
        status: "completed",
        code: { text: "Right total knee replacement" },
        subject: { reference: `Patient/${patientId}` },
        performedDateTime: "2026-04-25",
      })}, ${sqlStr(patientId)})`,
    );
    diagnosticReportRows.push(
      `(${sqlStr("dr-astrid-preop")}, ${sqlJson({
        resourceType: "DiagnosticReport",
        id: "dr-astrid-preop",
        status: "final",
        code: { text: "Pre-operative bloods" },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: "2026-04-23",
      })}, ${sqlStr(patientId)})`,
    );
  }
}

const practitionerRows = [...practitionerByName.values()].map((v) => v.sql);

function insertBlock(table, cols, rows) {
  if (rows.length === 0) return "";
  return `insert into epic.${table} (${cols}) values\n    ${rows.join(",\n    ")};\n\n`;
}

let sql = "create or replace function epic.reset_demo_data()\n";
sql += "returns void\nlanguage plpgsql\nsecurity definer\nset search_path = epic, pg_temp\nas $$\nbegin\n";
sql += "  truncate table epic.practitioner_role, epic.diagnostic_report, epic.procedure, epic.allergy_intolerance, epic.observation, epic.medication_request, epic.condition, epic.encounter, epic.patient, epic.practitioner cascade;\n\n";
sql += "  " + insertBlock("patient", "id, data", patientRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("practitioner", "id, data", practitionerRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("encounter", "id, data, patient_id", encounterRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("condition", "id, data, patient_id", conditionRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("medication_request", "id, data, patient_id", medicationRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("observation", "id, data, patient_id", observationRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("allergy_intolerance", "id, data, patient_id", allergyRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("diagnostic_report", "id, data, patient_id", diagnosticReportRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("procedure", "id, data, patient_id", procedureRows).replace(/\n/g, "\n  ");
sql += "  " + insertBlock("practitioner_role", "id, data, practitioner_id", practitionerRoleRows).replace(/\n/g, "\n  ");
sql += "end;\n$$;\n\n";
sql += "revoke execute on function epic.reset_demo_data() from public, anon, authenticated;\n";
sql += "grant execute on function epic.reset_demo_data() to service_role;\n\n";
sql += "select epic.reset_demo_data();\n";

process.stdout.write(sql);
```

- [ ] **Step 2: Transpile `data.ts` to plain JS so the script can import it**

```bash
cd archihealth
npx tsc src/lib/data.ts --module esnext --target es2020 --moduleResolution bundler --outDir ../tmp-epic-seed-build
```

Expected: `tmp-epic-seed-build/data.js` created at the repo root (sibling to `archihealth/`), with the `import type {...} from "@/types"` line stripped entirely (type-only imports produce no runtime output) and everything else copied through unchanged, since `data.ts` has no other TS-only syntax beyond type annotations.

- [ ] **Step 3: Run the generator and capture output**

```bash
node archihealth/scripts/generate-epic-seed.mjs > decoy-src/supabase/seed/epic.sql
rm -rf tmp-epic-seed-build
```

- [ ] **Step 4: Sanity-check the generated file**

Run: `grep -c "insert into epic" decoy-src/supabase/seed/epic.sql`
Expected: `9` (one insert block per table that has rows — `practitioner_role` counts only if any distinct clinicians exist, which they do).

Run: `grep -c "resourceType" decoy-src/supabase/seed/epic.sql`
Expected: a large count (>150) reflecting 11 patients × ~15 rows each — confirms the jsonb payloads are present, not empty.

- [ ] **Step 5: Commit**

```bash
git add archihealth/scripts/generate-epic-seed.mjs decoy-src/supabase/seed/epic.sql
git commit -m "feat(epic-api): generate FHIR-shaped seed data from archihealth's patients"
```

---

### Task 3: Build `epic-api` — token endpoint + Patient + Encounter

**Files:**
- Create: `decoy-src/supabase/functions/epic-api/index.ts`

**Interfaces:**
- Produces: `Deno.serve` handler routing `POST /oauth2/token`, `GET/POST /api/FHIR/R4/Patient[/{id}]`, `GET/POST /api/FHIR/R4/Encounter[/{id}]`, `GET /api/FHIR/R4/Encounter?patient={id}`.
- Consumes: `epic.patient`, `epic.encounter` tables (Task 1).

- [ ] **Step 1: Write the Edge Function scaffold + token endpoint + Patient + Encounter**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json' };

function operationOutcome(message: string, code: string, status: number) {
  return new Response(
    JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code, diagnostics: message }],
    }),
    { status, headers: JSON_HEADERS },
  );
}

function bundle(resources: any[]) {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((r) => ({ resource: r })),
  };
}

async function handleResourceType(
  table: string,
  resourceType: string,
  req: Request,
  url: URL,
  id: string | undefined,
) {
  const db = supabase.schema('epic').from(table);
  const patientFilter = url.searchParams.get('patient');

  if (req.method === 'GET' && id) {
    const { data, error } = await db.select('data').eq('id', id).single();
    if (error || !data) return operationOutcome(`${resourceType}/${id} not found`, 'not-found', 404);
    return new Response(JSON.stringify(data.data), { headers: JSON_HEADERS });
  }

  if (req.method === 'GET' && !id) {
    let query = db.select('data');
    if (patientFilter) query = query.eq('patient_id', patientFilter);
    const { data, error } = await query;
    if (error) return operationOutcome(error.message, 'exception', 500);
    return new Response(JSON.stringify(bundle((data ?? []).map((r: any) => r.data))), { headers: JSON_HEADERS });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    if (!body || body.resourceType !== resourceType) {
      return operationOutcome(`body must be a ${resourceType} resource`, 'invalid', 400);
    }
    const newId = crypto.randomUUID();
    body.id = newId;
    const patientId = body.subject?.reference?.replace('Patient/', '') ?? body.patient?.reference?.replace('Patient/', '');
    const row: Record<string, unknown> = { id: newId, data: body };
    if (table !== 'patient' && table !== 'practitioner') row.patient_id = patientId;
    const { data, error } = await db.insert(row).select('data').single();
    if (error) return operationOutcome(error.message, 'invalid', 400);
    return new Response(JSON.stringify(data.data), { status: 201, headers: JSON_HEADERS });
  }

  return operationOutcome('method not allowed', 'not-supported', 405);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.endsWith('/oauth2/token') && req.method === 'POST') {
    const body = await req.text();
    if (!body.includes('grant_type=')) {
      return operationOutcome('missing grant_type', 'invalid', 400);
    }
    return new Response(
      JSON.stringify({ access_token: 'epic-demo-token', token_type: 'Bearer', expires_in: 3600, scope: 'system/*.read' }),
      { headers: JSON_HEADERS },
    );
  }

  const match = path.match(/\/api\/FHIR\/R4\/(Patient|Encounter)(?:\/([^/]+))?$/);
  if (match) {
    const [, resourceType, id] = match;
    const table = resourceType === 'Patient' ? 'patient' : 'encounter';
    return handleResourceType(table, resourceType, req, url, id);
  }

  return operationOutcome(`unknown route: ${path}`, 'not-found', 404);
});
```

- [ ] **Step 2: Read through carefully for correctness** (no local Deno runtime available in this environment — this replaces an automated test run)

Confirm: `handleResourceType` is generic over table/resourceType so Task 4/5 can reuse it by extending the route regex; `Patient` rows never get a `patient_id` column (matches Task 1's schema, which has no such column on `epic.patient`); the 404 fallback and every error path return `OperationOutcome`, never a bare object.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/supabase/functions/epic-api/index.ts
git commit -m "feat(epic-api): add token endpoint, Patient and Encounter resources"
```

---

### Task 4: Extend `epic-api` — Condition, MedicationRequest, Observation, AllergyIntolerance

**Files:**
- Modify: `decoy-src/supabase/functions/epic-api/index.ts`

**Interfaces:**
- Consumes: `handleResourceType` from Task 3 (unchanged signature).
- Produces: routes for `Condition`, `MedicationRequest`, `Observation`, `AllergyIntolerance`, all list-filterable by `?patient={id}`.

- [ ] **Step 1: Extend the route regex and table mapping**

Replace:
```typescript
  const match = path.match(/\/api\/FHIR\/R4\/(Patient|Encounter)(?:\/([^/]+))?$/);
  if (match) {
    const [, resourceType, id] = match;
    const table = resourceType === 'Patient' ? 'patient' : 'encounter';
    return handleResourceType(table, resourceType, req, url, id);
  }
```
with:
```typescript
  const RESOURCE_TABLES: Record<string, string> = {
    Patient: 'patient',
    Encounter: 'encounter',
    Condition: 'condition',
    MedicationRequest: 'medication_request',
    Observation: 'observation',
    AllergyIntolerance: 'allergy_intolerance',
  };
  const match = path.match(/\/api\/FHIR\/R4\/([A-Za-z]+)(?:\/([^/]+))?$/);
  if (match) {
    const [, resourceType, id] = match;
    const table = RESOURCE_TABLES[resourceType];
    if (!table) return operationOutcome(`unsupported resource type: ${resourceType}`, 'not-supported', 400);
    return handleResourceType(table, resourceType, req, url, id);
  }
```

- [ ] **Step 2: Read through for correctness** — confirm the 4 new resource types all route correctly and `AllergyIntolerance`'s POST path correctly extracts `patient_id` from `body.patient.reference` (not `body.subject.reference` — `handleResourceType` already checks both, per Task 3's `subject?.reference ?? patient?.reference` fallback).

- [ ] **Step 3: Commit**

```bash
git add decoy-src/supabase/functions/epic-api/index.ts
git commit -m "feat(epic-api): add Condition, MedicationRequest, Observation, AllergyIntolerance"
```

---

### Task 5: Extend `epic-api` — DiagnosticReport, Procedure, Practitioner, PractitionerRole

**Files:**
- Modify: `decoy-src/supabase/functions/epic-api/index.ts`

**Interfaces:**
- Consumes: `handleResourceType` (unchanged), `RESOURCE_TABLES` map (Task 4).
- Produces: routes for the remaining 4 resource types; `PractitionerRole` filterable by `?practitioner={id}` in addition to the standard `?patient={id}` (Practitioner itself has no patient filter — it's not patient-scoped).

- [ ] **Step 1: Add the 4 remaining types to `RESOURCE_TABLES`**

```typescript
  const RESOURCE_TABLES: Record<string, string> = {
    Patient: 'patient',
    Encounter: 'encounter',
    Condition: 'condition',
    MedicationRequest: 'medication_request',
    Observation: 'observation',
    AllergyIntolerance: 'allergy_intolerance',
    DiagnosticReport: 'diagnostic_report',
    Procedure: 'procedure',
    Practitioner: 'practitioner',
    PractitionerRole: 'practitioner_role',
  };
```

- [ ] **Step 2: Add `?practitioner=` filter support to `handleResourceType`**

Replace:
```typescript
  const patientFilter = url.searchParams.get('patient');
```
with:
```typescript
  const patientFilter = url.searchParams.get('patient');
  const practitionerFilter = url.searchParams.get('practitioner');
```
and replace:
```typescript
    let query = db.select('data');
    if (patientFilter) query = query.eq('patient_id', patientFilter);
```
with:
```typescript
    let query = db.select('data');
    if (patientFilter) query = query.eq('patient_id', patientFilter);
    if (practitionerFilter) query = query.eq('practitioner_id', practitionerFilter);
```

- [ ] **Step 3: Update the POST branch so `Practitioner`/`PractitionerRole` skip the `patient_id` column and `PractitionerRole` gets `practitioner_id` instead**

Replace:
```typescript
    const patientId = body.subject?.reference?.replace('Patient/', '') ?? body.patient?.reference?.replace('Patient/', '');
    const row: Record<string, unknown> = { id: newId, data: body };
    if (table !== 'patient' && table !== 'practitioner') row.patient_id = patientId;
```
with:
```typescript
    const patientId = body.subject?.reference?.replace('Patient/', '') ?? body.patient?.reference?.replace('Patient/', '');
    const practitionerId = body.practitioner?.reference?.replace('Practitioner/', '');
    const row: Record<string, unknown> = { id: newId, data: body };
    if (table === 'practitioner_role') {
      row.practitioner_id = practitionerId;
    } else if (table !== 'patient' && table !== 'practitioner') {
      row.patient_id = patientId;
    }
```

- [ ] **Step 4: Read through for correctness** — confirm `Practitioner` GET-list has no patient filter applied (it's a global roster, correct per FHIR semantics), and `PractitionerRole` GET-list correctly filters by `?practitioner=`.

- [ ] **Step 5: Commit**

```bash
git add decoy-src/supabase/functions/epic-api/index.ts
git commit -m "feat(epic-api): add DiagnosticReport, Procedure, Practitioner, PractitionerRole"
```

---

### Task 6: Add `epic` to `reset-demo`

**Files:**
- Modify: `decoy-src/supabase/functions/reset-demo/index.ts:3`

**Interfaces:**
- Consumes: `epic.reset_demo_data()` (Task 2).

- [ ] **Step 1: Update `ALLOWED_SCHEMAS`**

```typescript
const ALLOWED_SCHEMAS = ['dynamics', 'archicare', 'epic'];
```

- [ ] **Step 2: Commit**

```bash
git add decoy-src/supabase/functions/reset-demo/index.ts
git commit -m "feat(epic-api): allow reset-demo to target the epic schema"
```

---

### Task 7: Build the `/epic/help` page

**Files:**
- Create: `decoy-src/app/epic/help/page.tsx`
- Create: `decoy-src/app/epic/layout.tsx` (minimal — just renders children; the full Epic UI shell is sub-project 2's scope, this page just needs to exist and render standalone for now)

**Interfaces:**
- Produces: a static page at `/decoy/epic/help/` once built, matching `/dynamics/help` and `/alayacare/help`'s structure.
- Consumes: nothing at runtime (static reference content, like the other two help pages).

- [ ] **Step 1: Create the minimal layout**

```tsx
export default function EpicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 p-6">{children}</div>;
}
```

- [ ] **Step 2: Create the help page**

```tsx
const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/api/FHIR/R4`;
const TOKEN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/oauth2/token`;

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

const RESOURCES = [
  { name: 'Patient', fields: 'identifier, name, gender, birthDate, address, telecom' },
  { name: 'Encounter', fields: 'status, class, subject, period, serviceProvider, location' },
  { name: 'Condition', fields: 'clinicalStatus, code (ICD-10), subject' },
  { name: 'MedicationRequest', fields: 'status, medicationCodeableConcept, subject, dosageInstruction, authoredOn' },
  { name: 'Observation', fields: 'status, code (LOINC), subject, effectiveDateTime, valueQuantity' },
  { name: 'AllergyIntolerance', fields: 'clinicalStatus, code, patient, reaction' },
  { name: 'DiagnosticReport', fields: 'status, code, subject, effectiveDateTime' },
  { name: 'Procedure', fields: 'status, code, subject, performedDateTime' },
  { name: 'Practitioner', fields: 'name, identifier' },
  { name: 'PractitionerRole', fields: 'practitioner, specialty' },
];

export default function EpicHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Epic API Reference (FHIR R4)</h1>
        <p className="text-sm text-gray-500">
          This demo exposes a FHIR R4-conformant REST API, matching the URL pattern, OAuth2/SMART-on-FHIR
          token flow, and resource JSON shape a genuine Epic on FHIR integration uses. Every endpoint below
          is marked <strong>FHIR R4 (public spec)</strong> rather than Captured/Inferred like ArchiTech
          Care&apos;s API reference &mdash; there is no real Epic traffic sample to compare against here,
          only conformance to the open HL7 standard Epic itself implements.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
        <p>Every resource below is a path under this base: <code>{'{base}'}/&lt;ResourceType&gt;[/&lt;id&gt;]</code>.</p>
      </Section>

      <Section title="Authentication (SMART on FHIR, cosmetic)">
        <p>
          Real Epic integrations use SMART Backend Services: a client-credentials JWT-bearer exchange at a
          token endpoint. This demo&apos;s token endpoint accepts the same shape but performs no real
          validation:
        </p>
        <Code>{`POST ${TOKEN_URL}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_assertion_type=...&client_assertion=<any-jwt-shaped-value>`}</Code>
        <p>Returns:</p>
        <Code>{`{"access_token":"epic-demo-token","token_type":"Bearer","expires_in":3600,"scope":"system/*.read"}`}</Code>
        <p>Send any value in <code>Authorization: Bearer &lt;token&gt;</code> on subsequent calls — the server ignores its actual value.</p>
      </Section>

      <Section title="Resources">
        {RESOURCES.map((r) => (
          <div key={r.name} className="border-b pb-2 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{r.name}</span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">FHIR R4 (public spec)</span>
            </div>
            <p className="font-mono text-xs text-gray-500">{r.fields}</p>
          </div>
        ))}
      </Section>

      <Section title="Example">
        <Code>{`GET ${BASE}/Patient/astrid-nygaard
Authorization: Bearer epic-demo-token`}</Code>
        <p>Search example (Bundle response):</p>
        <Code>{`GET ${BASE}/Encounter?patient=astrid-nygaard`}</Code>
      </Section>
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `cd decoy-src && npm run build`
Expected: build succeeds, `decoy-src/out/epic/help/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/app/epic/
git commit -m "feat(epic-api): add /epic/help API reference page"
```

---

### Task 8: Apply the migration, deploy, and expose the schema

**Files:** none (operational — Supabase project changes, no repo files)

**Interfaces:** none.

> Every step here requires `SUPABASE_ACCESS_TOKEN=<personal-access-token>` — generate one from the Supabase dashboard (account icon → Access Tokens) if not already set. This session does not have one; whoever runs this task needs to supply it.

- [ ] **Step 1: Link the project (if not already linked in this environment)**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase link --project-ref kjapsnzcaicecjnctmoh
```

- [ ] **Step 2: Apply the schema migration**

```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/migrations/0006_epic_schema.sql
```

Expected: no errors; `epic` schema now exists in the project.

- [ ] **Step 3: Apply the seed data (also creates `epic.reset_demo_data()` and populates the tables)**

```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/seed/epic.sql
```

Expected: no errors.

- [ ] **Step 4: Expose the `epic` schema via PostgREST**

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kjapsnzcaicecjnctmoh/postgrest" \
  -H "Authorization: Bearer <personal-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"db_schema":"public,graphql_public,dynamics,archicare,epic"}'
```

Expected: `200` response confirming the updated schema list.

- [ ] **Step 5: Deploy the Edge Functions**

```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy epic-api --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy reset-demo --project-ref kjapsnzcaicecjnctmoh --no-verify-jwt
```

- [ ] **Step 6: No commit needed** (nothing changed in the repo — this task is purely deploying already-committed code)

---

### Task 9: Verify against the deployed function

**Files:** none (verification only)

- [ ] **Step 1: Verify Patient read**

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/epic-api/api/FHIR/R4/Patient/astrid-nygaard" | head -c 500
```

Expected: a `resourceType: "Patient"` JSON object with `name`, `identifier`, `birthDate` fields populated.

- [ ] **Step 2: Verify search/Bundle shape**

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/epic-api/api/FHIR/R4/Encounter?patient=astrid-nygaard" | head -c 500
```

Expected: `resourceType: "Bundle"`, `type: "searchset"`, `total: 1`, one `entry`.

- [ ] **Step 3: Verify the token endpoint**

```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/epic-api/oauth2/token" -d "grant_type=client_credentials"
```

Expected: `{"access_token":"epic-demo-token",...}`.

- [ ] **Step 4: Verify the 404 shape**

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/epic-api/api/FHIR/R4/Patient/does-not-exist"
```

Expected: `resourceType: "OperationOutcome"` with a `not-found` issue code.

- [ ] **Step 5: Verify reset-demo**

```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/functions/v1/reset-demo" -H "Content-Type: application/json" -d '{"schema":"epic"}'
```

Expected: `{"ok":true}`.

- [ ] **Step 6: Report result**

If all 5 checks pass, sub-project 1 is complete — sub-project 2 (Hyperspace-style frontend rework of archihealth, consuming this API) can start from a fresh brainstorming pass. If anything fails, fix it in a follow-up commit referencing which check caught it.
