# ArchiTech WebPAS — HL7 v2 ADT shim (webpas-api) — design spec

## What this is

Sub-project 1 of 4 for replicating Dedalus WebPAS as Decoy's fourth vendor
system. Adds a new API shim — `webpas-api` — alongside `dataverse-api`
(Dynamics), `archicare-api` (ArchiTech Care), and `epic-api` (ArchiTech
Health), giving ArchiTech WebPAS's demo traffic the shape of a real PAS
integration: genuine HL7 v2 ADT message content (the standard hospital
integration mechanism), plus a plain REST layer backing the UI directly.

Sub-projects 2-4 (not this spec) build the frontend: ADT + Bed Board (2),
Waiting List + Outpatients (3), Clinical Coding/Billing (4).

## Research basis

Per research into Dedalus WebPAS (dedalus.com/anz, ANZ health procurement
coverage): WebPAS is a Patient Administration System (252+ ANZ sites,
~23% of ANZ hospital beds) covering ADT, bed management, waiting lists,
outpatient scheduling, and billing/clinical coding. Real PAS-to-system
integration in Australian hospitals is HL7 v2 over MLLP (AS4700-profiled),
not REST/FHIR — no public webPAS-specific API documentation exists, but
HL7 v2 ADT message structure itself (MSH/EVN/PID/PV1 segments, ADT^A01
admit / A02 transfer / A03 discharge / A08 update trigger events) is a
public HL7 International standard, independent of vendor. No public
webPAS screenshots exist — this sub-project is backend-only regardless,
so that gap doesn't block it.

## Scope

**In:**
- New Postgres schema `webpas` in the existing Supabase project
  (`kjapsnzcaicecjnctmoh`), alongside `dynamics`, `archicare`, `epic`.
- New Edge Function `webpas-api`:
  - Plain REST layer: `GET/POST /patients`, `/encounters`, `/wards`,
    `/beds` — backs the UI directly.
  - HL7 v2 layer: `POST /hl7v2/adt` (triggers an ADT event, generates and
    stores a real HL7 v2 message + returns a real HL7 ACK), `GET
    /hl7v2/adt?patient=<id>` (message history).
- Seed data: wards/beds for "ArchiTech Hospital", reusing the same 12
  patient identities already established across ArchiTech Care/Health
  (same universe, different system's view of them — PAS-shaped fields:
  MRN, episode/encounter, ward, bed — not full clinical chart data).
- `reset-demo` gains `'webpas'` in `ALLOWED_SCHEMAS`.
- `/webpas/help` API reference page (built in sub-project 2, alongside
  the first UI page, matching how `epic-api`'s help page shipped with
  the backend but `archihealth`'s original help page shipped with the
  first UI pass — either sub-project 1 or 2 may host it; deferred to
  sub-project 2's plan since it needs the UI's page-routing conventions
  decided first).

**Out (this sub-project):**
- Any frontend/UI — sub-projects 2-4.
- Real MLLP/TCP transport — infeasible for a browser-based demo and
  Deno Edge Functions (stateless HTTP only); HL7 v2 message *content* is
  real, transport is HTTPS/JSON, matching the compromise already made
  for Dataverse OData/FHIR/AlayaCare REST in the other three shims.
- Clinical coding/billing data model — sub-project 4's concern.
- Waiting list/outpatient appointment data model — sub-project 3's
  concern.
- Real auth — cosmetic only, matching the site's no-real-auth policy.

## Architecture

```
Browser (ArchiTech WebPAS UI, sub-projects 2-4)
  → REST: GET/POST .../functions/v1/webpas-api/patients[/id]
  → REST: GET/POST .../functions/v1/webpas-api/encounters[/id]
  → REST: GET/POST .../functions/v1/webpas-api/wards, /beds
  → HL7:  POST .../functions/v1/webpas-api/hl7v2/adt
          { messageType: "A01"|"A02"|"A03"|"A08", patientId, encounterId, ... }
          → { message: "MSH|^~\&|WEBPAS|ARCHITECH HOSPITAL|...", ack: "MSA|AA|<control-id>" }
  → GET   .../functions/v1/webpas-api/hl7v2/adt?patient=<id>
          → { messages: ["MSH|...", "MSH|...", ...] }
  → webpas-api Edge Function (Deno)
    REST layer: plain CRUD against webpas.* tables
    HL7 layer: builds a real MSH/EVN/PID/PV1 message string, stores it
    in webpas.hl7_message, returns message + a real MSA ACK
  → Postgres, schema `webpas`
```

Independent of the other three shims, matching their independence from
each other.

## Schema

```sql
create table webpas.ward (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table webpas.bed (
  id text primary key,
  ward_id text not null references webpas.ward(id),
  label text not null, -- e.g. "Bed 12"
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'blocked')),
  created_at timestamptz not null default now()
);

create table webpas.patient (
  id text primary key,
  mrn text not null,
  first_name text not null,
  last_name text not null,
  dob date not null,
  sex text not null,
  created_at timestamptz not null default now()
);

create table webpas.encounter (
  id text primary key,
  patient_id text not null references webpas.patient(id),
  status text not null default 'pre-admission' check (status in ('pre-admission', 'admitted', 'discharged')),
  ward_id text references webpas.ward(id),
  bed_id text references webpas.bed(id),
  admitted_at timestamptz,
  discharged_at timestamptz,
  created_at timestamptz not null default now()
);

create table webpas.hl7_message (
  id text primary key default gen_random_uuid()::text,
  message_type text not null, -- 'A01' | 'A02' | 'A03' | 'A08'
  raw_message text not null,
  ack_message text not null,
  patient_id text not null references webpas.patient(id),
  encounter_id text not null references webpas.encounter(id),
  created_at timestamptz not null default now()
);
```

RLS: fully permissive on every table, matching the other three schemas.

## HL7 v2 message construction

Real segment structure, minimally populated (matching the "conformant
shape, not exhaustive field population" approach used for FHIR resources
in `epic-api`):

- **MSH** (Message Header): `MSH|^~\&|WEBPAS|ARCHITECH HOSPITAL|||<timestamp>||ADT^<trigger>|<control-id>|P|2.4`
  — sending application/facility named for ArchiTech, version 2.4
  (matching the AS4700/Australian-profile convention noted in research).
- **EVN** (Event Type): `EVN|<trigger>|<timestamp>`
- **PID** (Patient Identification): `PID|1||<mrn>||<lastName>^<firstName>||<dob>|<sex>`
- **PV1** (Patient Visit): `PV1|1|<patientClass>|<ward>^<bed>|||||||||||||||<encounterId>`
  — `patientClass` derived from encounter status (`I` for inpatient once
  admitted).

Trigger-event mapping:
- **A01** (admit): encounter transitions to `admitted`, ward/bed assigned.
- **A02** (transfer): ward/bed changed on an already-admitted encounter.
- **A03** (discharge): encounter transitions to `discharged`, bed freed
  (`webpas.bed.status` back to `vacant`).
- **A08** (update): patient demographic fields changed, no status/bed
  change.

ACK message: `MSA|AA|<control-id>` (Application Accept) on success —
real HL7 ACK shape, always succeeds in this demo (no rejection-path
fidelity needed for a sales demo).

## Seed data

Reuses the same 12 patient identities from `epic.patient`/archihealth's
original roster (Margaret Thompson, Astrid Nygaard, etc.) — same
characters across ArchiTech Care, ArchiTech Health, and now ArchiTech
WebPAS, each system modeling them through that system's own lens (PAS:
MRN + ward/bed + episode status, not clinical chart data). A handful of
wards (e.g. 4A, 4B, 5A, ICU, ED, DAY) each with several beds, matching
the ward names already used in `epic.encounter`'s seed data for
continuity. Initial `hl7_message` log seeded with one A01 (admit) message
per currently-admitted patient, matching their current encounter status.

## Error handling & testing

- Malformed `messageType` on `POST /hl7v2/adt` → REST-style JSON error
  (`{error: {message}}`, matching `dataverse-api`/`archicare-api`'s
  convention — no FHIR `OperationOutcome` here, this isn't a FHIR shim).
- Transfer/discharge triggers on a non-admitted encounter → error, not a
  silent no-op.
- No test framework, matching repo convention. Verification: curl every
  REST endpoint + verb, and the HL7 endpoint for all 4 trigger types,
  against the deployed function.

## Migration steps (for the implementation plan)

1. Migration `0007_webpas_schema.sql`: create `webpas` schema + 5 tables
   + RLS + `webpas.reset_demo_data()`.
2. Seed data: wards/beds + the 12 reused patient identities + initial
   encounters + seed A01 message log.
3. Build `webpas-api` Edge Function: REST layer first (patients,
   encounters, wards, beds), then the HL7 v2 layer (message construction
   + ACK + trigger-event state transitions).
4. Add `'webpas'` to `reset-demo`'s `ALLOWED_SCHEMAS`.
5. Add `webpas` to the exposed PostgREST schema list.
6. Deploy `webpas-api` + updated `reset-demo`, apply migration/seed to
   the linked project.
7. Verify: curl every REST endpoint/verb, curl `/hl7v2/adt` for each of
   A01/A02/A03/A08 and confirm real HL7 v2 message shape + ACK, confirm
   bed status updates correctly on admit/transfer/discharge.
