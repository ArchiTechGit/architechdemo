# Epic Hyperspace-style UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold `archihealth/` into `decoy-src/app/epic/*` as Decoy's third vendor system, rework its UI toward Epic/Hyperspace conventions, and wire it to the `epic-api` FHIR shim (sub-project 1) instead of a static in-memory array.

**Architecture:** New Next.js pages under `decoy-src/app/epic/`, a new `epicApi.ts` data-fetching layer that speaks FHIR Bundle/OperationOutcome shapes, components ported from archihealth and restyled/renamed to Epic conventions (Storyboard, SnapShot, Chart Review). `archihealth/` deleted once migrated.

**Tech Stack:** Next.js 14 (App Router, static export), Tailwind CSS 3 (decoy-src's existing setup, NOT archihealth's Tailwind v4/Vite plugin setup — ported components must use plain utility classes only, no `@apply` or Vite-specific config).

**Spec:** `docs/superpowers/specs/2026-08-18-decoy-epic-ui-v1-design.md`

## Global Constraints

- No dynamic routes — single page (`patients/page.tsx`) with client-side selection state, matching `alayacare/clients/page.tsx` and required by static export.
- Login gate is cosmetic only — any input/click proceeds, flag stored in-memory/sessionStorage only, never blocks real access.
- Every `epicApi.ts` fetch has a `.catch()` setting an error state — no silent infinite-spinner failures (documented gotcha in `decoy-src/CLAUDE.md`).
- No test framework. Verify with `npx tsc --noEmit` + `npm run build` from `decoy-src/`, per page.
- FHIR resources have no `ewsScore` field (that was a demo-only field on the old TS `Patient` type, never migrated into any FHIR resource in sub-project 1) — status (Critical/Watch/Stable) must be derived from heart rate + SpO2 thresholds instead, not carried over as-is.

---

### Task 1: Fix `Encounter` to reference the treating practitioner, regenerate and reapply seed data

The current `epic-api` seed data (sub-project 1) has no link from a
patient's `Encounter` to their `Practitioner` — `treatingClinician` was
never threaded through when the seed generator was written. The frontend
needs this to show "Attending: Dr X" on the chart. Fixing the generator
and reapplying seed data (no code/schema change needed — just richer
`Encounter.data`) is a prerequisite for Task 6.

**Files:**
- Modify: `archihealth/scripts/generate-epic-seed.mjs` (still present until Task 11 deletes `archihealth/` — this script's job is done after this task, its output already lives in `decoy-src/supabase/seed/epic.sql` and in Postgres)
- Modify: `decoy-src/supabase/seed/epic.sql` (regenerated output)

**Interfaces:**
- Produces: every `epic.encounter` row's `data.participant` array: `[{ individual: { reference: "Practitioner/<id>" } }]`.

- [ ] **Step 1: Add `participant` to the Encounter object in the generator**

In `archihealth/scripts/generate-epic-seed.mjs`, the encounter-building block currently reads:
```javascript
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
```
Change it to compute the practitioner id first (moving the `practitionerId(...)` call above this block) and add `participant`:
```javascript
  const treatingPractitionerId = practitionerId(p.treatingClinician, p.department);

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
      participant: [{ individual: { reference: `Practitioner/${treatingPractitionerId}` } }],
    })}, ${sqlStr(patientId)})`,
  );
```
Then delete the original standalone `practitionerId(p.treatingClinician, p.department);` call later in the loop (it's now called earlier, above the encounter block, and calling it twice is harmless but redundant — remove the later one for clarity).

- [ ] **Step 2: Regenerate the seed file**

```bash
cd archihealth
npx tsc src/lib/data.ts --module esnext --target es2020 --moduleResolution bundler --outDir ../tmp-epic-seed-build
cd ..
node archihealth/scripts/generate-epic-seed.mjs > decoy-src/supabase/seed/epic.sql
rm -rf tmp-epic-seed-build
```

- [ ] **Step 3: Sanity-check**

Run: `grep -c "participant" decoy-src/supabase/seed/epic.sql`
Expected: `11` (one per patient's encounter).

- [ ] **Step 4: Reapply to the live project**

```bash
cd decoy-src
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked --file supabase/seed/epic.sql
```

- [ ] **Step 5: Verify live**

```bash
curl -s "https://kjapsnzcaicecjnctmoh.supabase.co/functions/v1/epic-api/api/FHIR/R4/Encounter/enc-astrid-nygaard" | grep -o '"participant":\[[^]]*\]'
```
Expected: `"participant":[{"individual":{"reference":"Practitioner/pr-rachel-kim"}}]`

- [ ] **Step 6: Commit**

```bash
git add archihealth/scripts/generate-epic-seed.mjs decoy-src/supabase/seed/epic.sql
git commit -m "fix(epic-api): link Encounter to its treating Practitioner"
```

---

### Task 2: Build the FHIR data-fetching layer

**Files:**
- Create: `decoy-src/lib/epicTypes.ts`
- Create: `decoy-src/lib/epicApi.ts`

**Interfaces:**
- Produces: `Patient`, `Encounter`, `Condition`, `MedicationRequest`, `Observation`, `AllergyIntolerance`, `Practitioner` TS interfaces; `useEpicResource<T>(resourceType, params?)`, `useEpicResourceById<T>(resourceType, id)`, `createEpicResource<T>(resourceType, body)`.

- [ ] **Step 1: Create `epicTypes.ts`**

```typescript
export interface Patient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ family: string; given: string[]; use?: string }>;
  gender: string;
  birthDate: string;
  address: Array<{ line: string[]; city: string; state: string; postalCode: string }>;
  telecom: Array<{ system: string; value: string }>;
}

export interface Encounter {
  resourceType: 'Encounter';
  id: string;
  status: string;
  class: { code: string };
  subject: { reference: string };
  period: { start: string; end?: string };
  serviceProvider: { display: string };
  location: Array<{ location: { display: string } }>;
  participant?: Array<{ individual: { reference: string } }>;
}

export interface Condition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: { coding: Array<{ code: string }> };
  code: { coding: Array<{ system: string; code: string }>; text: string };
  subject: { reference: string };
}

export interface MedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: string;
  medicationCodeableConcept: { text: string };
  subject: { reference: string };
  dosageInstruction: Array<{ text: string; route: { text: string } }>;
  authoredOn: string;
}

export interface Observation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity: { value: number; unit: string };
}

export interface AllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id: string;
  clinicalStatus: { coding: Array<{ code: string }> };
  code: { text: string };
  patient: { reference: string };
  reaction: Array<{ manifestation: Array<{ text: string }>; severity: string }>;
}

export interface Practitioner {
  resourceType: 'Practitioner';
  id: string;
  name: Array<{ family: string; given: string[]; prefix?: string[] }>;
}
```

- [ ] **Step 2: Create `epicApi.ts`**

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/api/FHIR/R4`;

interface Bundle<T> {
  resourceType: 'Bundle';
  type: string;
  total: number;
  entry: Array<{ resource: T }>;
}

interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{ severity: string; code: string; diagnostics: string }>;
}

export function useEpicResource<T extends { id: string }>(
  resourceType: string,
  params: Record<string, string> = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams(params);
    fetch(`${API_BASE}/${resourceType}${query.toString() ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then((body: Bundle<T> | OperationOutcome) => {
        if (body.resourceType === 'OperationOutcome') {
          setError(body.issue[0]?.diagnostics ?? 'request failed');
        } else {
          setRows(body.entry.map((e) => e.resource));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resourceType, JSON.stringify(params)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}

export function useEpicResourceById<T extends { id: string }>(resourceType: string, id: string | null) {
  const [resource, setResource] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setResource(null);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/${resourceType}/${id}`)
      .then((res) => res.json())
      .then((body: T | OperationOutcome) => {
        if (body.resourceType === 'OperationOutcome') {
          setError((body as OperationOutcome).issue[0]?.diagnostics ?? 'not found');
          setResource(null);
        } else {
          setResource(body as T);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resourceType, id]);

  return { resource, loading, error };
}

export async function createEpicResource<T>(resourceType: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/${resourceType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, resourceType }),
  });
  if (!res.ok) throw new Error(`create ${resourceType} failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 3: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors (these files have no JSX, plain TS — should compile cleanly).

- [ ] **Step 4: Commit**

```bash
git add decoy-src/lib/epicTypes.ts decoy-src/lib/epicApi.ts
git commit -m "feat(epic-ui): add FHIR data-fetching layer (epicApi, epicTypes)"
```

---

### Task 3: Build FHIR-aware clinical helpers

**Files:**
- Create: `decoy-src/lib/epicClinical.ts`

**Interfaces:**
- Consumes: `Patient`, `Encounter`, `Condition`, `Observation`, `AllergyIntolerance` from `epicTypes.ts` (Task 2).
- Produces: `patientName`, `patientMrn`, `patientIhi`, `patientAge`, `patientSex`, `groupObservationsByTimestamp`, `VitalsReading` type, `statusFor`, `daysSince`, `relativeTime`, `hasSevereAllergy`, `primaryDiagnosis`.

- [ ] **Step 1: Create the file**

```typescript
import type { AllergyIntolerance, Condition, Observation, Patient } from './epicTypes';

const LOINC_KEY: Record<string, keyof VitalsReading> = {
  '8867-4': 'heartRate',
  '8480-6': 'systolicBP',
  '8462-4': 'diastolicBP',
  '59408-5': 'oxygenSaturation',
  '9279-1': 'respiratoryRate',
  '8310-5': 'temperature',
};

export interface VitalsReading {
  timestamp: string;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  temperature?: number;
}

export function groupObservationsByTimestamp(observations: Observation[]): VitalsReading[] {
  const byTimestamp = new Map<string, VitalsReading>();
  for (const obs of observations) {
    const code = obs.code.coding[0]?.code;
    const key = code ? LOINC_KEY[code] : undefined;
    if (!key) continue;
    const ts = obs.effectiveDateTime;
    if (!byTimestamp.has(ts)) byTimestamp.set(ts, { timestamp: ts });
    (byTimestamp.get(ts) as VitalsReading)[key] = obs.valueQuantity?.value;
  }
  return [...byTimestamp.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function patientName(p: Patient) {
  const n = p.name[0];
  return { firstName: n?.given?.[0] ?? '', lastName: n?.family ?? '' };
}

export function patientMrn(p: Patient): string {
  return p.identifier.find((i) => i.system.endsWith(':mrn'))?.value ?? '—';
}

export function patientIhi(p: Patient): string {
  return p.identifier.find((i) => i.system.endsWith(':ihi'))?.value ?? '—';
}

export function patientAge(p: Patient): number {
  const ms = Date.now() - new Date(p.birthDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

export function patientSex(p: Patient): string {
  return p.gender ? p.gender[0].toUpperCase() + p.gender.slice(1) : 'Other';
}

// FHIR Observation has no direct "early warning score" field — status is
// derived from heart rate + SpO2 thresholds instead of a stored ewsScore
// (that was a demo-only field on the old static Patient type, never
// migrated into any FHIR resource).
export function statusFor(latest: VitalsReading | undefined): 'Critical' | 'Watch' | 'Stable' {
  if (!latest) return 'Stable';
  const spo2 = latest.oxygenSaturation ?? 100;
  const hr = latest.heartRate ?? 70;
  if (spo2 < 92 || hr > 120) return 'Critical';
  if (spo2 < 95 || hr > 100) return 'Watch';
  return 'Stable';
}

export function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function relativeTime(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function hasSevereAllergy(allergies: AllergyIntolerance[]): boolean {
  return allergies.some((a) => {
    const sev = a.reaction?.[0]?.severity;
    return sev === 'severe' || sev === 'life-threatening';
  });
}

export function primaryDiagnosis(conditions: Condition[]): string {
  const active = conditions.find((c) => c.clinicalStatus.coding[0]?.code === 'active');
  return active?.code.text ?? conditions[0]?.code.text ?? '—';
}
```

- [ ] **Step 2: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/lib/epicClinical.ts
git commit -m "feat(epic-ui): add FHIR-aware clinical helper functions"
```

---

### Task 4: Build EpicShell (login gate + header)

**Files:**
- Create: `decoy-src/components/EpicShell.tsx`

**Interfaces:**
- Produces: `LoginGate` component (`{ children: React.ReactNode }`, renders a full-screen cosmetic login form until "Sign in" is clicked, then renders `children`), `EpicHeader` component (no props).

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Physician');
  const [department, setDepartment] = useState('Orthopaedics');

  if (signedIn) return <>{children}</>;

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a1e4a]">
      <div className="w-96 rounded bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-lg font-semibold text-gray-800">ArchiTech Health</h1>
        <label className="mb-3 block text-xs text-gray-500">
          User ID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            placeholder="e.g. amehta"
          />
        </label>
        <label className="mb-3 block text-xs text-gray-500">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 text-sm">
            <option>Physician</option>
            <option>RN</option>
            <option>Front Desk</option>
          </select>
        </label>
        <label className="mb-4 block text-xs text-gray-500">
          Department
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 text-sm">
            <option>Orthopaedics</option>
            <option>Cardiology</option>
            <option>General Medicine</option>
          </select>
        </label>
        <button
          onClick={() => setSignedIn(true)}
          className="w-full rounded bg-[#0a1e4a] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a1e4a]/90"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export function EpicHeader() {
  return (
    <header className="flex h-14 items-center justify-between bg-[#0a1e4a] px-4 text-white">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">ArchiTech Health</span>
        <span className="text-sm text-white/60">Ward 7B &middot; Dr. Anya Mehta</span>
      </div>
      <a
        href="/decoy/epic/help/"
        title="API Help"
        className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10"
      >
        ?
      </a>
    </header>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/components/EpicShell.tsx
git commit -m "feat(epic-ui): add EpicShell (login gate + header)"
```

---

### Task 5: Build the patient search modal + recent-patients worklist

**Files:**
- Create: `decoy-src/components/PatientSearchModal.tsx`
- Create: `decoy-src/components/EpicWorklist.tsx`

**Interfaces:**
- Consumes: `Patient` from `epicTypes.ts`, `patientName`/`patientMrn`/`patientIhi`/`patientAge`/`patientSex`/`daysSince`/`primaryDiagnosis`/`statusFor` from `epicClinical.ts` (Tasks 2-3), `useEpicResource` (Task 2).
- Produces: `PatientSearchModal` (`{ patients: Patient[]; onSelect: (id: string) => void; onClose: () => void }`), `EpicWorklist` (`{ patients: Patient[]; conditionsByPatient: Record<string, Condition[]>; onOpen: (id: string) => void }`).

- [ ] **Step 1: Create `PatientSearchModal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Patient } from '@/lib/epicTypes';
import { patientName, patientMrn } from '@/lib/epicClinical';

export function PatientSearchModal({
  patients,
  onSelect,
  onClose,
}: {
  patients: Patient[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const results = patients.filter((p) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const { firstName, lastName } = patientName(p);
    return `${firstName} ${lastName}`.toLowerCase().includes(q) || patientMrn(p).toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[70vh] w-[480px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Patient Search</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="MRN, name, or DOB"
          className="mb-4 w-full rounded border px-2 py-1.5 text-sm"
        />
        <div className="space-y-1">
          {results.map((p) => {
            const { firstName, lastName } = patientName(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{firstName} {lastName}</span>
                <span className="text-xs text-gray-400">MRN {patientMrn(p)}</span>
              </button>
            );
          })}
          {results.length === 0 && <div className="p-2 text-sm text-gray-400">No matches.</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `EpicWorklist.tsx`**

```tsx
'use client';

import type { Patient, Condition } from '@/lib/epicTypes';
import { patientName, patientMrn, patientAge, patientSex, daysSince, primaryDiagnosis } from '@/lib/epicClinical';

export function EpicWorklist({
  patients,
  conditionsByPatient,
  onOpen,
}: {
  patients: Patient[];
  conditionsByPatient: Record<string, Condition[]>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="rounded bg-white shadow-sm">
      <div className="border-b p-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Recent Patients
      </div>
      <table className="w-full text-sm">
        <tbody>
          {patients.map((p) => {
            const { firstName, lastName } = patientName(p);
            const conditions = conditionsByPatient[p.id] ?? [];
            return (
              <tr key={p.id} onDoubleClick={() => onOpen(p.id)} className="cursor-pointer border-b last:border-0 hover:bg-gray-50">
                <td className="p-2">
                  <div className="font-medium text-gray-800">{firstName} {lastName}</div>
                  <div className="text-xs text-gray-400">MRN {patientMrn(p)} &middot; {patientAge(p)}{patientSex(p)[0]}</div>
                </td>
                <td className="p-2 text-gray-600">{primaryDiagnosis(conditions)}</td>
                <td className="p-2 text-right">
                  <button onClick={() => onOpen(p.id)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                    Open &rarr;
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors (both files import from `@/lib/...` — confirm `decoy-src/tsconfig.json` already has that path alias, matching `archicareApi.ts`'s own `@/lib` usage elsewhere in this codebase).

- [ ] **Step 4: Commit**

```bash
git add decoy-src/components/PatientSearchModal.tsx decoy-src/components/EpicWorklist.tsx
git commit -m "feat(epic-ui): add patient search modal and recent-patients worklist"
```

---

### Task 6: Build Storyboard + EpicChart

**Files:**
- Create: `decoy-src/components/Storyboard.tsx`
- Create: `decoy-src/components/EpicChart.tsx`

**Interfaces:**
- Consumes: `Patient`, `Encounter`, `Condition`, `MedicationRequest`, `Observation`, `AllergyIntolerance`, `Practitioner` from `epicTypes.ts`; `patientName`/`patientMrn`/`patientIhi`/`patientAge`/`patientSex`/`daysSince`/`groupObservationsByTimestamp`/`hasSevereAllergy` from `epicClinical.ts`; `useEpicResource`, `useEpicResourceById` from `epicApi.ts`.
- Produces: `Storyboard` (`{ patient: Patient; conditions: Condition[]; allergies: AllergyIntolerance[] }`), `EpicChart` (`{ patientId: string; onBack: () => void }` — fetches its own data internally, matching how `PatientView` in archihealth received pre-fetched props but this version owns its fetching since data now lives server-side).

- [ ] **Step 1: Create `Storyboard.tsx`**

```tsx
'use client';

import type { AllergyIntolerance, Condition, Patient } from '@/lib/epicTypes';
import { patientName, patientMrn, patientIhi, patientAge, patientSex, hasSevereAllergy } from '@/lib/epicClinical';

export function Storyboard({
  patient,
  conditions,
  allergies,
}: {
  patient: Patient;
  conditions: Condition[];
  allergies: AllergyIntolerance[];
}) {
  const { firstName, lastName } = patientName(patient);
  const activeConditions = conditions.filter((c) => c.clinicalStatus.coding[0]?.code === 'active').slice(0, 3);

  return (
    <aside className="w-64 shrink-0 space-y-3 border-r bg-white p-3">
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
          {firstName[0]}{lastName[0]}
        </span>
        <div className="mt-2 text-sm font-semibold text-gray-800">{firstName} {lastName}</div>
        <div className="text-xs text-gray-400">
          {patientAge(patient)}{patientSex(patient)[0]} &middot; DOB {patient.birthDate}
        </div>
        <div className="text-xs text-gray-400">MRN {patientMrn(patient)} &middot; IHI {patientIhi(patient)}</div>
      </div>

      {hasSevereAllergy(allergies) && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-xs font-medium text-red-700">
          &#9888; Severe allergy on file
        </div>
      )}
      {allergies.length > 0 && (
        <div className="space-y-1">
          {allergies.map((a) => (
            <div key={a.id} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
              {a.code.text}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Problem List</div>
        {activeConditions.map((c) => (
          <div key={c.id} className="border-b py-1 text-xs text-gray-700 last:border-0">{c.code.text}</div>
        ))}
        {activeConditions.length === 0 && <div className="text-xs text-gray-400">None active</div>}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `EpicChart.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { AllergyIntolerance, Condition, Encounter, MedicationRequest, Observation, Patient, Practitioner } from '@/lib/epicTypes';
import { useEpicResource, useEpicResourceById } from '@/lib/epicApi';
import { Storyboard } from './Storyboard';
import { daysSince, groupObservationsByTimestamp } from '@/lib/epicClinical';

type Tab = 'snapshot' | 'medications' | 'conditions' | 'chartreview' | 'webex';

export function EpicChart({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('snapshot');
  const { resource: patient, loading: patientLoading } = useEpicResourceById<Patient>('Patient', patientId);
  const { rows: encounters } = useEpicResource<Encounter>('Encounter', { patient: patientId });
  const { rows: conditions } = useEpicResource<Condition>('Condition', { patient: patientId });
  const { rows: medications } = useEpicResource<MedicationRequest>('MedicationRequest', { patient: patientId });
  const { rows: observations } = useEpicResource<Observation>('Observation', { patient: patientId });
  const { rows: allergies } = useEpicResource<AllergyIntolerance>('AllergyIntolerance', { patient: patientId });

  const encounter = encounters[0];
  const practitionerRef = encounter?.participant?.[0]?.individual?.reference;
  const practitionerId = practitionerRef?.replace('Practitioner/', '') ?? null;
  const { resource: practitioner } = useEpicResourceById<Practitioner>('Practitioner', practitionerId);

  if (patientLoading || !patient) {
    return <div className="p-6 text-sm text-gray-400">Loading chart…</div>;
  }

  const readings = groupObservationsByTimestamp(observations);
  const latest = readings[0];
  const attending = practitioner
    ? `${practitioner.name[0]?.prefix?.[0] ?? 'Dr'} ${practitioner.name[0]?.given?.[0] ?? ''} ${practitioner.name[0]?.family ?? ''}`.trim()
    : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <Storyboard patient={patient} conditions={conditions} allergies={allergies} />
      <div className="flex-1 overflow-auto">
        <div className="border-b bg-white p-3">
          <button onClick={onBack} className="mb-2 flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
            &larr; Back to search
          </button>
          {encounter && (
            <div className="text-xs text-gray-400">
              {encounter.location[0]?.location.display} &middot; LOS {daysSince(encounter.period.start)}d
              {attending && <> &middot; Attending: {attending}</>}
            </div>
          )}
        </div>

        <div className="flex gap-6 border-b bg-white px-4 text-sm">
          {(['snapshot', 'medications', 'conditions', 'chartreview', 'webex'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 py-3 capitalize ${tab === t ? 'border-[#0a1e4a] font-medium text-[#0a1e4a]' : 'border-transparent text-gray-500'}`}
            >
              {t === 'snapshot' ? 'SnapShot' : t === 'chartreview' ? 'Chart Review' : t}
            </button>
          ))}
        </div>

        {tab === 'snapshot' && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-5 gap-3">
              {(['heartRate', 'systolicBP', 'oxygenSaturation', 'respiratoryRate', 'temperature'] as const).map((key) => (
                <div key={key} className="rounded border p-3">
                  <div className="text-xs capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="font-mono text-lg text-gray-800">{latest?.[key] ?? '—'}</div>
                </div>
              ))}
            </div>
            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Medications ({medications.length})</div>
              {medications.slice(0, 4).map((m) => (
                <div key={m.id} className="border-b py-1 text-sm last:border-0">{m.medicationCodeableConcept.text}</div>
              ))}
            </div>
          </div>
        )}

        {tab === 'medications' && (
          <div className="p-4">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-gray-500">
                <tr><th className="p-2">Medication</th><th className="p-2">Status</th><th className="p-2">Route</th></tr>
              </thead>
              <tbody>
                {medications.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-2 text-gray-700">{m.medicationCodeableConcept.text} &mdash; {m.dosageInstruction[0]?.text}</td>
                    <td className="p-2 text-gray-600">{m.status}</td>
                    <td className="p-2 text-gray-600">{m.dosageInstruction[0]?.route?.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'conditions' && (
          <div className="space-y-2 p-4">
            {conditions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <div className="font-medium text-gray-700">{c.code.text}</div>
                  <div className="text-xs text-gray-400">{c.code.coding[0]?.code}</div>
                </div>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{c.clinicalStatus.coding[0]?.code}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'chartreview' && (
          <div className="p-4">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-gray-500">
                <tr><th className="p-2">Date</th><th className="p-2">HR</th><th className="p-2">BP</th><th className="p-2">SpO2</th><th className="p-2">RR</th><th className="p-2">Temp</th></tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.timestamp} className="border-b font-mono last:border-0">
                    <td className="p-2 text-gray-600">{r.timestamp.replace('T', ' ')}</td>
                    <td className="p-2 text-gray-600">{r.heartRate ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.systolicBP ?? '—'}/{r.diastolicBP ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.oxygenSaturation ?? '—'}%</td>
                    <td className="p-2 text-gray-600">{r.respiratoryRate ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.temperature ?? '—'}&deg;C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'webex' && (
          <div className="p-4">
            <div className="rounded border bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-700">Connect (demo only)</div>
              <button
                onClick={() => alert('Instant Connect initiated (demo only — no real call placed).')}
                className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white hover:bg-[#0a1e4a]/90"
              >
                Initiate connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/components/Storyboard.tsx decoy-src/components/EpicChart.tsx
git commit -m "feat(epic-ui): add Storyboard sidebar and EpicChart (SnapShot/Chart Review/etc)"
```

---

### Task 7: Port the Admit Patient modal

**Files:**
- Create: `decoy-src/components/AdmitPatientModal.tsx`

**Interfaces:**
- Consumes: `createEpicResource` from `epicApi.ts` (Task 2).
- Produces: `AdmitPatientModal` (`{ onAdmitted: (patientId: string) => void; onClose: () => void }`).

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { createEpicResource } from '@/lib/epicApi';
import type { Patient } from '@/lib/epicTypes';

function toArray(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter((s) => s.length > 0 && s.toLowerCase() !== 'none');
}

export function AdmitPatientModal({ onAdmitted, onClose }: { onAdmitted: (patientId: string) => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gender: '', dob: '', allergies: '', conditions: '', medications: '' });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.dob || !form.gender) {
      setError('Please fill in name, date of birth, and gender.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const [firstName, ...rest] = form.name.trim().split(' ');
      const lastName = rest.join(' ') || '—';
      const patient = await createEpicResource<Patient>('Patient', {
        name: [{ family: lastName, given: [firstName], use: 'official' }],
        gender: form.gender.toLowerCase(),
        birthDate: form.dob,
        identifier: [],
        address: [],
        telecom: [],
      });

      await Promise.all([
        ...toArray(form.conditions).map((text, i) =>
          createEpicResource('Condition', {
            id: `cond-${patient.id}-${i}`,
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'NEW' }], text },
            subject: { reference: `Patient/${patient.id}` },
          }),
        ),
        ...toArray(form.medications).map((text) =>
          createEpicResource('MedicationRequest', {
            status: 'active',
            medicationCodeableConcept: { text },
            subject: { reference: `Patient/${patient.id}` },
            dosageInstruction: [{ text: '—', route: { text: 'Oral' } }],
            authoredOn: new Date().toISOString().slice(0, 10),
          }),
        ),
        ...toArray(form.allergies).map((text) =>
          createEpicResource('AllergyIntolerance', {
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: { text },
            patient: { reference: `Patient/${patient.id}` },
            reaction: [{ manifestation: [{ text: 'Unspecified' }], severity: 'mild' }],
          }),
        ),
        createEpicResource('Encounter', {
          status: 'in-progress',
          class: { code: 'Admitted' },
          subject: { reference: `Patient/${patient.id}` },
          period: { start: new Date().toISOString().slice(0, 10) },
          serviceProvider: { display: 'ArchiTech Hospital' },
          location: [{ location: { display: 'Ward TBD, Bed TBD' } }],
        }),
      ]);

      onAdmitted(patient.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'admit failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[85vh] w-[480px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Admit Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="space-y-3">
          <label className="block text-xs text-gray-500">
            Full name
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Gender
            <select className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select&hellip;</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Date of birth
            <input type="date" className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Allergies (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Conditions (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.conditions} onChange={(e) => set('conditions', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Medications (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.medications} onChange={(e) => set('medications', e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-sm text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {submitting ? 'Admitting…' : 'Admit patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd decoy-src && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add decoy-src/components/AdmitPatientModal.tsx
git commit -m "feat(epic-ui): port Admit Patient modal, wired to epic-api"
```

---

### Task 8: Wire the full page + layout

**Files:**
- Create: `decoy-src/app/epic/layout.tsx`
- Create: `decoy-src/app/epic/patients/page.tsx`

**Interfaces:**
- Consumes: `LoginGate`, `EpicHeader` (Task 4); `PatientSearchModal`, `EpicWorklist` (Task 5); `EpicChart` (Task 6); `AdmitPatientModal` (Task 7); `useEpicResource` (Task 2); `Patient`, `Condition` (Task 2).

- [ ] **Step 1: Create `app/epic/layout.tsx`**

```tsx
'use client';

import { LoginGate, EpicHeader } from '@/components/EpicShell';

export default function EpicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoginGate>
      <div className="flex h-screen flex-col">
        <EpicHeader />
        {children}
      </div>
    </LoginGate>
  );
}
```

- [ ] **Step 2: Create `app/epic/patients/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useEpicResource } from '@/lib/epicApi';
import type { Patient, Condition } from '@/lib/epicTypes';
import { PatientSearchModal } from '@/components/PatientSearchModal';
import { EpicWorklist } from '@/components/EpicWorklist';
import { EpicChart } from '@/components/EpicChart';
import { AdmitPatientModal } from '@/components/AdmitPatientModal';

export default function EpicPatientsPage() {
  const { rows: patients, refresh } = useEpicResource<Patient>('Patient');
  const { rows: conditions } = useEpicResource<Condition>('Condition');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [admitting, setAdmitting] = useState(false);

  const conditionsByPatient: Record<string, Condition[]> = {};
  for (const c of conditions) {
    const pid = c.subject.reference.replace('Patient/', '');
    (conditionsByPatient[pid] ??= []).push(c);
  }

  if (selectedId) {
    return <EpicChart patientId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setSearching(true)} className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white hover:bg-[#0a1e4a]/90">
          Patient Search
        </button>
        <button onClick={() => setAdmitting(true)} className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
          + Admit patient
        </button>
      </div>
      <EpicWorklist patients={patients} conditionsByPatient={conditionsByPatient} onOpen={setSelectedId} />
      {searching && (
        <PatientSearchModal
          patients={patients}
          onSelect={(id) => { setSelectedId(id); setSearching(false); }}
          onClose={() => setSearching(false)}
        />
      )}
      {admitting && (
        <AdmitPatientModal
          onAdmitted={(id) => { setAdmitting(false); refresh(); setSelectedId(id); }}
          onClose={() => setAdmitting(false)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Build**

Run: `cd decoy-src && npm run build`
Expected: build succeeds, `decoy-src/out/epic/patients/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add decoy-src/app/epic/layout.tsx decoy-src/app/epic/patients/
git commit -m "feat(epic-ui): wire epic/patients page and layout"
```

---

### Task 9: Update SystemSwitcher

**Files:**
- Modify: `decoy-src/components/SystemSwitcher.tsx`

**Interfaces:** none new — removes the special-cased plain anchor added in sub-project 1's decoy-side change, replacing it with a normal `Link` now that Epic lives inside `/decoy`.

- [ ] **Step 1: Replace the special-cased entry**

Replace the whole file's contents with:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SYSTEMS = [
  { label: 'Dynamics 365', href: '/dynamics/dashboard', prefix: '/dynamics' },
  { label: 'ArchiTech Care', href: '/alayacare/dashboard', prefix: '/alayacare' },
  { label: 'ArchiTech Health', href: '/epic/patients', prefix: '/epic' },
];

export function SystemSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex h-8 items-center gap-4 bg-black px-4 text-xs text-white">
      <span className="font-semibold uppercase tracking-wide text-white/50">Decoy</span>
      {SYSTEMS.map((system) => (
        <Link
          key={system.href}
          href={system.href}
          className={pathname?.startsWith(system.prefix) ? 'font-semibold text-white' : 'text-white/60 hover:text-white'}
        >
          {system.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add decoy-src/components/SystemSwitcher.tsx
git commit -m "feat(epic-ui): simplify SystemSwitcher now that Epic lives inside /decoy"
```

---

### Task 10: Update TOC, build, sync, commit

**Files:**
- Modify: `index.html`
- Create: `decoy/**` (rebuilt static export)

**Interfaces:** none.

- [ ] **Step 1: Update the TOC href**

In `index.html`, change:
```html
          <a href="/archihealth/dist/" class="entry">
```
to:
```html
          <a href="/decoy/epic/patients/" class="entry">
```
(the surrounding `entry-num`/`entry-label` lines stay unchanged).

- [ ] **Step 2: Build decoy-src and sync**

```bash
cd decoy-src
npm run build
cd ..
rm -rf decoy && cp -r decoy-src/out decoy
```

- [ ] **Step 3: Verify**

Run: `grep -o "ArchiTech Health" decoy/dynamics/dashboard/index.html decoy/alayacare/dashboard/index.html decoy/epic/patients/index.html`
Expected: all three contain "ArchiTech Health" (SystemSwitcher present on every system's pages, including Epic's own).

- [ ] **Step 4: Commit**

```bash
git add index.html decoy/
git commit -m "feat(epic-ui): point TOC at the new /decoy/epic/patients/ page"
```

---

### Task 11: Delete archihealth

**Files:**
- Delete: `archihealth/` (entire directory)

**Interfaces:** none — by this point everything needed (data already migrated to Postgres in sub-project 1, components already ported in Tasks 4-7) has been extracted.

- [ ] **Step 1: Confirm nothing outside `archihealth/` still references it**

Run: `grep -rl "archihealth" --include="*.html" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v "^\./archihealth/" | grep -v node_modules`
Expected: no output (Task 10 already repointed the only reference, the TOC href).

- [ ] **Step 2: Delete and commit**

```bash
git rm -r archihealth
git commit -m "chore(archihealth): remove, folded into decoy-src/app/epic"
```

---

### Task 12: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Full click-through**

Run: `cd decoy-src && npm run dev` (or serve the built `decoy/` output some other way that resolves `/decoy/epic/*` alongside `/decoy/dynamics/*`/`/decoy/alayacare/*`)

Walk through:
1. Visiting `/decoy/epic/patients/` shows the login gate first; any input + "Sign in" proceeds.
2. Landing view shows the recent-patients worklist (11 patients) and a "Patient Search" button.
3. Patient Search modal finds a patient by name and by MRN.
4. Opening a patient shows the Storyboard sidebar (name/age/DOB/MRN/IHI, allergy tags, problem list) persistently across all tabs.
5. SnapShot, Medications, Conditions, Chart Review, Webex tabs all render real data from `epic-api` (not stale/hardcoded).
6. Chart Review's vitals table matches the count expected (e.g. Margaret Thompson: 5 distinct timestamps).
7. Admit Patient creates a real Patient/Condition/MedicationRequest/AllergyIntolerance/Encounter via `epic-api` and the new patient appears in the worklist after `refresh()`.
8. SystemSwitcher links resolve to all three systems from any of them.
9. Root TOC (`index.html`) "ArchiTech Health (Epic)" link opens `/decoy/epic/patients/`, not the old archihealth app.

- [ ] **Step 2: Report result**

If everything above passes, sub-project 2 is complete. If anything fails, fix it in a follow-up commit referencing which verification step caught it.
