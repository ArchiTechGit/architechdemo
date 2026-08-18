# ArchiTech Health (Epic) Demo Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `emrdemo/` (WXCC-staged demo) with a new "ArchiTech Health" clinical worklist + patient chart demo, inspired by patient-emr-dashboard, as the TOC's "ArchiTech Health (Epic)" entry.

**Architecture:** New standalone Vite + React 18 + TypeScript + Tailwind CSS project at `archihealth/`, no router library (local view-state switching), static-exported to `archihealth/dist/` and committed like the repo's other demo builds. Reuses the existing ArchiTech-branded patient dataset from `emrdemo/`, stripped of staging-only fields, before `emrdemo/` is deleted.

**Tech Stack:** Vite 7, React 18, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite` plugin, no separate config file — matches `emrdemo`'s existing setup).

**Spec:** `docs/superpowers/specs/2026-08-18-archihealth-design.md`

## Global Constraints

- Drop entirely (not deferred): Digital Twin tab, `DemoStageControl`/staged journey/WXCC toast, Appointments/JourneySummary/DemoGuide pages, `Patient.demoStages`, `Patient.isHeroPatient`, `Appointment` type/data, `HERO_PATIENT_ID`.
- "Webex" patient tab is cosmetic/inert only — no real WXCC wiring.
- No automated test framework — matches `emrdemo`/`decoy-src` convention in this repo. Each task's verification step is `npm run build` (or `tsc --noEmit`) plus, for UI tasks, a manual `npm run dev` visual check described in the step.
- Status thresholds (from spec): `ewsScore >= 5` → Critical, `3-4` → Watch, `< 3` → Stable.
- Base path for the built app: `/archihealth/dist/`.
- Header/switcher color: navy `#0a1e4a` (matches `ArchicareTopNav`).

---

### Task 1: Scaffold the Vite + React + TypeScript + Tailwind project

**Files:**
- Create: `archihealth/package.json`
- Create: `archihealth/vite.config.ts`
- Create: `archihealth/tsconfig.json`
- Create: `archihealth/index.html`
- Create: `archihealth/src/main.tsx`
- Create: `archihealth/src/index.css`
- Create: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: a running Vite dev server rendering `<App />` at `archihealth/src/App.tsx`, Tailwind utility classes available globally via `src/index.css`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "archihealth",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.14",
    "typescript": "5.6.3",
    "vite": "^7.1.7"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  base: "/archihealth/dist/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ArchiTech Health</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/index.css`**

```css
@import "tailwindcss";

:root {
  --color-critical: #dc2626;
  --color-watch: #d97706;
  --color-stable: #16a34a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create a placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <div className="p-8 text-lg">ArchiTech Health — scaffold OK</div>;
}
```

- [ ] **Step 8: Install dependencies and verify dev server**

Run: `cd archihealth && npm install && npm run dev`
Expected: Vite prints a local URL; loading it shows "ArchiTech Health — scaffold OK" styled with Tailwind's default font. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 9: Commit**

```bash
git add archihealth/package.json archihealth/package-lock.json archihealth/vite.config.ts archihealth/tsconfig.json archihealth/index.html archihealth/src/main.tsx archihealth/src/index.css archihealth/src/App.tsx archihealth/.gitignore
git commit -m "feat(archihealth): scaffold Vite + React + TS + Tailwind project"
```

Note: create `archihealth/.gitignore` containing `node_modules\ndist\n` before this commit (dist is committed later as a deliberate exception via `git add -f` in Task 9 — see that task).

---

### Task 2: Port patient data and types, stripped of staging fields

**Files:**
- Create: `archihealth/src/types/index.ts`
- Create: `archihealth/src/lib/data.ts`
- Create: `archihealth/src/assets/logo_darkbackground.png` (copy)
- Create: `archihealth/src/assets/logo_lightbackground.png` (copy)
- Create: `archihealth/src/assets/logo-webex.svg` (copy)

**Interfaces:**
- Produces: `Patient`, `Allergy`, `Diagnosis`, `Medication`, `VitalReading`, `Encounter`, `SOAPNote`, `NextOfKin`, `GP` types from `@/types`; `PATIENTS: Patient[]` from `@/lib/data`.
- Consumes: nothing (leaf module).

- [ ] **Step 1: Copy the source files verbatim**

```bash
cp emrdemo/client/src/types/index.ts archihealth/src/types/index.ts
cp emrdemo/client/src/lib/data.ts archihealth/src/lib/data.ts
cp emrdemo/client/src/assets/logo_darkbackground.png archihealth/src/assets/logo_darkbackground.png
cp emrdemo/client/src/assets/logo_lightbackground.png archihealth/src/assets/logo_lightbackground.png
cp emrdemo/client/src/assets/logo-webex.svg archihealth/src/assets/logo-webex.svg
```

- [ ] **Step 2: Strip staging-only fields from `archihealth/src/types/index.ts`**

Remove the `DemoStage` interface entirely (it starts with `export interface DemoStage {` and ends at its closing `}`).

Remove the `Appointment`-related types: `AppointmentStatus`, `AppointmentPriority` type aliases and the `Appointment` interface.

In the `Patient` interface, remove these two lines:
```typescript
  isHeroPatient?: boolean;
  demoStages?: DemoStage[];
```

- [ ] **Step 3: Strip staging-only content from `archihealth/src/lib/data.ts`**

Remove the `import type { ... }` line's now-unused `Appointment, DemoStage` names — change:
```typescript
import type { Patient, Appointment, VitalReading, Encounter, Medication, Allergy, Diagnosis, DemoStage } from "@/types";
```
to:
```typescript
import type { Patient, VitalReading, Encounter, Medication, Allergy, Diagnosis } from "@/types";
```

Delete every top-level `const <name>DemoStages: DemoStage[] = [...]` block (e.g. `astridDemoStages`) and every top-level `const <name>Medications` block that exists *only* to feed a `DemoStage` (check each such array is not otherwise referenced by a patient's own `medications:` field before deleting — if it is referenced there too, keep the array and only remove the `DemoStage`-only usage).

In each patient object, delete the `demoStages: <name>DemoStages,` line and the `isHeroPatient: true,` line (only `astridNygaard` has these).

Delete the `export const HERO_PATIENT_ID = "astrid-nygaard";` line.

Delete the entire `export const APPOINTMENTS: Appointment[] = [...]` block (runs from that line to its closing `];`).

Keep `export const PATIENTS: Patient[] = [...supportingPatients, astridNygaard];` and the `supportingPatients` array exactly as-is.

- [ ] **Step 4: Verify with the TypeScript compiler**

Run: `cd archihealth && npm run check`
Expected: no errors. If errors reference `DemoStage`, `Appointment`, `isHeroPatient`, or `demoStages`, find and remove the remaining reference (Step 2/3 missed a spot).

- [ ] **Step 5: Commit**

```bash
git add archihealth/src/types/index.ts archihealth/src/lib/data.ts archihealth/src/assets/
git commit -m "feat(archihealth): port ArchiTech-branded patient dataset, strip staging fields"
```

---

### Task 3: Build the SystemSwitcher bar

**Files:**
- Create: `archihealth/src/components/SystemSwitcher.tsx`
- Modify: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: `SystemSwitcher` component (no props), rendered at the top of `App`.
- Consumes: nothing.

- [ ] **Step 1: Create `SystemSwitcher.tsx`**

Mirrors `decoy-src/components/SystemSwitcher.tsx` visually (black bar, active-system underline), but as plain HTML anchors (no Next.js `Link`/`usePathname` — this project isn't Next.js) since the three systems are separate static builds under different paths.

```tsx
const SYSTEMS = [
  { label: "Dynamics 365", href: "/decoy/dynamics/dashboard/" },
  { label: "ArchiTech Care", href: "/decoy/alayacare/dashboard/" },
  { label: "ArchiTech Health", href: "/archihealth/dist/" },
];

export function SystemSwitcher() {
  const current = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="flex h-8 items-center gap-4 bg-black px-4 text-xs text-white">
      {SYSTEMS.map((system) => {
        const isActive = current.startsWith(system.href.replace(/\/$/, ""));
        return (
          <a
            key={system.label}
            href={system.href}
            className={`border-b-2 px-1 py-1.5 ${
              isActive ? "border-white font-medium" : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {system.label}
          </a>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Mount it in `App.tsx`**

```tsx
import { SystemSwitcher } from "./components/SystemSwitcher";

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <div className="p-8 text-lg">ArchiTech Health — scaffold OK</div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: black bar at top with "Dynamics 365", "ArchiTech Care", "ArchiTech Health" (this one underlined/bold since the dev URL path won't match `/archihealth/dist/` exactly — that's fine, confirm the bar renders and links have `href` attributes pointing to the three paths above).

- [ ] **Step 4: Commit**

```bash
git add archihealth/src/components/SystemSwitcher.tsx archihealth/src/App.tsx
git commit -m "feat(archihealth): add cross-app SystemSwitcher bar"
```

---

### Task 4: Build the Shell (Header, Sidebar, Footer)

**Files:**
- Create: `archihealth/src/components/Shell.tsx`
- Modify: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: `Header`, `Sidebar`, `Footer` components exported from `Shell.tsx`. `Sidebar` accepts `{ active: "overview" | "worklist"; onSelect: (view: "overview" | "worklist") => void }`.
- Consumes: `logo_darkbackground.png`, `logo_lightbackground.png`, `logo-webex.svg` from `@/assets` (Task 2).

- [ ] **Step 1: Create `Shell.tsx`**

```tsx
import logoDark from "@/assets/logo_darkbackground.png";
import logoLight from "@/assets/logo_lightbackground.png";
import logoWebex from "@/assets/logo-webex.svg";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between bg-[#0a1e4a] px-4 text-white">
      <div className="flex items-center gap-4">
        <img src={logoDark} alt="ArchiTech" className="h-6" />
        <span className="text-lg font-semibold tracking-tight">ArchiTech Health</span>
        <span className="text-sm text-white/60">Ward 7B &middot; Dr. Anya Mehta</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="flex w-56 items-center gap-2 rounded bg-white px-3 py-1.5 text-sm text-gray-500">
          <span className="flex-1">Search&hellip;</span>
          <span className="rounded border px-1 text-[10px]">&#8984;K</span>
        </div>
        <button title="Not part of this demo" className="rounded p-1.5 hover:bg-white/10">Inbox</button>
        <button title="Not part of this demo" className="rounded p-1.5 hover:bg-white/10">Settings</button>
      </div>
    </header>
  );
}

type SidebarView = "overview" | "worklist";

const TODAY_ITEMS: Array<{ label: string; view: SidebarView | null }> = [
  { label: "Overview", view: "overview" },
  { label: "My Patients", view: "worklist" },
];

const CLINICAL_ITEMS = ["Orders", "Medications", "Results", "Notes"];

export function Sidebar({ active, onSelect }: { active: SidebarView; onSelect: (view: SidebarView) => void }) {
  return (
    <nav className="flex w-56 flex-col gap-6 border-r bg-white p-4 text-sm">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Today</div>
        {TODAY_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => item.view && onSelect(item.view)}
            className={`block w-full rounded px-2 py-1.5 text-left ${
              active === item.view ? "bg-[#0a1e4a]/10 font-medium text-[#0a1e4a]" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Clinical</div>
        {CLINICAL_ITEMS.map((label) => (
          <span
            key={label}
            title="Not part of this demo"
            className="block cursor-default rounded px-2 py-1.5 text-gray-300"
          >
            {label}
          </span>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="flex h-10 items-center justify-between border-t bg-white px-4 text-xs text-gray-400">
      <span>ArchiTech Health &middot; v1.0 &middot; demo data only</span>
      <img src={logoWebex} alt="Webex" className="h-4 opacity-60" />
    </footer>
  );
}
```

- [ ] **Step 2: Wire the shell into `App.tsx`**

```tsx
import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer } from "./components/Shell";

type View = "overview" | "worklist";

export default function App() {
  const [view, setView] = useState<View>("worklist");

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={view} onSelect={setView} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && <div className="text-gray-500">Worklist goes here (Task 5).</div>}
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: navy header with "ArchiTech Health", left sidebar with Overview/My Patients (clickable, switches the placeholder text) and greyed-out Clinical items, footer bar at the bottom.

- [ ] **Step 4: Commit**

```bash
git add archihealth/src/components/Shell.tsx archihealth/src/App.tsx
git commit -m "feat(archihealth): add Header/Sidebar/Footer shell"
```

---

### Task 5: Build the Worklist

**Files:**
- Create: `archihealth/src/components/Worklist.tsx`
- Create: `archihealth/src/lib/clinical.ts`
- Modify: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: `Worklist` component with props `{ patients: Patient[]; onOpen: (id: string) => void }`; `clinical.ts` exports `statusFor(patient: Patient): "Critical" | "Watch" | "Stable"`, `daysSince(dateStr: string): number`, `latestVital(patient: Patient): VitalReading | undefined`.
- Consumes: `Patient`, `VitalReading` types from `@/types`, `PATIENTS` from `@/lib/data` (Task 2).

- [ ] **Step 1: Create shared clinical helpers `lib/clinical.ts`**

```typescript
import type { Patient, VitalReading } from "@/types";

export function statusFor(patient: Patient): "Critical" | "Watch" | "Stable" {
  if (patient.ewsScore >= 5) return "Critical";
  if (patient.ewsScore >= 3) return "Watch";
  return "Stable";
}

export function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function latestVital(patient: Patient): VitalReading | undefined {
  if (patient.vitals.length === 0) return undefined;
  return [...patient.vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

export function relativeTime(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function hasSevereAllergy(patient: Patient): boolean {
  return patient.allergies.some((a) => a.severity === "Severe" || a.severity === "Life-threatening");
}

export function primaryDiagnosis(patient: Patient): string {
  const active = patient.diagnoses.find((d) => d.status === "Active");
  return active?.shortName ?? patient.diagnoses[0]?.shortName ?? "—";
}
```

- [ ] **Step 2: Create `components/Worklist.tsx`**

```tsx
import { useMemo, useState } from "react";
import type { Patient } from "@/types";
import { statusFor, daysSince, latestVital, relativeTime, hasSevereAllergy, primaryDiagnosis } from "@/lib/clinical";

const STATUS_TONE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  Watch: "bg-amber-100 text-amber-700 border-amber-300",
  Stable: "bg-green-100 text-green-700 border-green-300",
};

const BORDER_TONE: Record<string, string> = {
  Critical: "border-l-red-500",
  Watch: "border-l-amber-500",
  Stable: "border-l-transparent",
};

type SortMode = "priority" | "name";
type StatusFilter = "all" | "Critical" | "Watch" | "Stable";

export function Worklist({ patients, onOpen }: { patients: Patient[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("priority");

  const withStatus = useMemo(
    () => patients.map((p) => ({ patient: p, status: statusFor(p) })),
    [patients],
  );

  const counts = useMemo(() => {
    const c = { all: withStatus.length, Critical: 0, Watch: 0, Stable: 0 };
    withStatus.forEach(({ status }) => { c[status] += 1; });
    return c;
  }, [withStatus]);

  const visible = useMemo(() => {
    let rows = withStatus;
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase().includes(q) ||
          r.patient.ihi.toLowerCase().includes(q),
      );
    }
    const priorityRank = { Critical: 0, Watch: 1, Stable: 2 };
    return [...rows].sort((a, b) => {
      if (sortMode === "name") return a.patient.lastName.localeCompare(b.patient.lastName);
      return priorityRank[a.status] - priorityRank[b.status];
    });
  }, [withStatus, statusFilter, query, sortMode]);

  return (
    <div className="rounded bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex gap-2">
          {(["all", "Critical", "Watch", "Stable"] as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                statusFilter === key ? "border-[#0a1e4a] bg-[#0a1e4a] text-white" : "border-gray-200 text-gray-600"
              }`}
            >
              {key === "all" ? "All" : key} ({counts[key]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or IHI"
            className="rounded border px-2 py-1 text-sm"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="p-2">Patient</th>
            <th className="p-2">Status</th>
            <th className="p-2">Ward &middot; Room</th>
            <th className="p-2">Reason</th>
            <th className="p-2">LOS</th>
            <th className="p-2">HR</th>
            <th className="p-2">Conditions</th>
            <th className="p-2">Attending</th>
            <th className="p-2">Updated</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(({ patient, status }) => {
            const vital = latestVital(patient);
            return (
              <tr
                key={patient.id}
                onDoubleClick={() => onOpen(patient.id)}
                className={`cursor-pointer border-b border-l-4 hover:bg-gray-50 ${BORDER_TONE[status]}`}
              >
                <td className="p-2">
                  <div className="font-medium text-gray-800">{patient.firstName} {patient.lastName}</div>
                  <div className="text-xs text-gray-400">{patient.ihi} &middot; {patient.age}{patient.sex[0]}</div>
                </td>
                <td className="p-2">
                  <span className={`rounded border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>{status}</span>
                </td>
                <td className="p-2 text-gray-600">{patient.ward} &middot; {patient.bedNumber}</td>
                <td className="p-2 text-gray-600">{primaryDiagnosis(patient)}</td>
                <td className="p-2 text-gray-600">{daysSince(patient.admissionDate)}d</td>
                <td className="p-2 font-mono text-gray-600">{vital ? `${vital.heartRate}` : "—"}</td>
                <td className="p-2 text-gray-600">
                  {patient.diagnoses.length} condition{patient.diagnoses.length === 1 ? "" : "s"}
                  {hasSevereAllergy(patient) && <span className="ml-1 text-red-600" title="Severe allergy">&#9888;</span>}
                </td>
                <td className="p-2 text-gray-600">{patient.treatingClinician}</td>
                <td className="p-2 text-xs text-gray-400">{vital ? relativeTime(vital.timestamp) : "—"}</td>
                <td className="p-2 text-right">
                  <button onClick={() => onOpen(patient.id)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
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

- [ ] **Step 3: Wire it into `App.tsx`**

```tsx
import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer } from "./components/Shell";
import { Worklist } from "./components/Worklist";
import { PATIENTS } from "@/lib/data";

type View = "overview" | "worklist";

export default function App() {
  const [view, setView] = useState<View>("worklist");
  const [patients] = useState(PATIENTS);

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={view} onSelect={setView} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && <Worklist patients={patients} onOpen={(id) => console.log("open", id)} />}
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: 11-row patient table, status filter chips with correct counts, search narrows rows by name/IHI, sort toggle reorders rows, clicking "Open →" logs the patient id to the browser console.

- [ ] **Step 5: Commit**

```bash
git add archihealth/src/lib/clinical.ts archihealth/src/components/Worklist.tsx archihealth/src/App.tsx
git commit -m "feat(archihealth): add patient Worklist with filter/search/sort"
```

---

### Task 6: Build PatientView header + Summary tab

**Files:**
- Create: `archihealth/src/components/PatientView.tsx`
- Modify: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: `PatientView` component with props `{ patient: Patient; onBack: () => void }`. Internal tab state: `"summary" | "medications" | "conditions" | "observations" | "webex"`.
- Consumes: `Patient`, `VitalReading` from `@/types`; `daysSince`, `relativeTime`, `hasSevereAllergy` from `@/lib/clinical` (Task 5).

- [ ] **Step 1: Create `components/PatientView.tsx` with header + tab shell + Summary tab**

```tsx
import { useState } from "react";
import type { Patient, VitalReading } from "@/types";
import { daysSince, relativeTime, hasSevereAllergy } from "@/lib/clinical";

type Tab = "summary" | "medications" | "conditions" | "observations" | "webex";

const VITAL_REFS: Array<{
  key: keyof VitalReading;
  label: string;
  unit: string;
  ref: string;
  isOk: (v: number) => boolean;
}> = [
  { key: "heartRate", label: "Heart Rate", unit: "bpm", ref: "60–100", isOk: (v) => v >= 60 && v <= 100 },
  { key: "systolicBP", label: "Systolic BP", unit: "mmHg", ref: "<140", isOk: (v) => v < 140 },
  { key: "oxygenSaturation", label: "SpO2", unit: "%", ref: "95–100", isOk: (v) => v >= 95 },
  { key: "respiratoryRate", label: "Resp. Rate", unit: "/min", ref: "12–20", isOk: (v) => v >= 12 && v <= 20 },
  { key: "temperature", label: "Temp", unit: "°C", ref: "36.1–37.8", isOk: (v) => v >= 36.1 && v <= 37.8 },
];

export function PatientView({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("summary");
  const latest = [...patient.vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return (
    <div className="rounded bg-white shadow-sm">
      <div className="border-b p-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
          &larr; Back
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
            {patient.firstName[0]}{patient.lastName[0]}
          </span>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-800">{patient.firstName} {patient.lastName}</div>
            <div className="text-xs text-gray-400">
              {patient.age}{patient.sex[0]} &middot; DOB {patient.dob} &middot; IHI {patient.ihi} &middot; {patient.ward}/{patient.bedNumber} &middot; LOS {daysSince(patient.admissionDate)}d
            </div>
          </div>
          {patient.allergies.length > 0 && (
            <div className="flex gap-1">
              {patient.allergies.map((a) => (
                <span key={a.allergen} className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  &#9888; {a.allergen}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 border-b px-4 text-sm">
        {(["summary", "medications", "conditions", "observations", "webex"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-1 py-3 capitalize ${
              tab === t ? "border-[#0a1e4a] font-medium text-[#0a1e4a]" : "border-transparent text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="grid grid-cols-[1fr_320px] gap-6 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {VITAL_REFS.map((v) => {
                const value = latest ? (latest[v.key] as number) : undefined;
                const ok = value !== undefined ? v.isOk(value) : true;
                return (
                  <div key={v.label} className={`rounded border p-3 ${ok ? "border-gray-200" : "border-amber-300 bg-amber-50"}`}>
                    <div className="text-xs text-gray-400">{v.label}</div>
                    <div className="font-mono text-lg text-gray-800">{value ?? "—"} <span className="text-xs text-gray-400">{v.unit}</span></div>
                    <div className="text-xs text-gray-400">ref {v.ref}</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Active Conditions</div>
              {patient.diagnoses.filter((d) => d.status === "Active" || d.status === "Chronic").map((d) => (
                <div key={d.icdCode} className="flex items-center justify-between border-b py-1 text-sm last:border-0">
                  <span className="text-gray-700">{d.shortName}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{d.status}</span>
                </div>
              ))}
              {hasSevereAllergy(patient) && (
                <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                  Severe/life-threatening allergy on file — see header.
                </div>
              )}
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Medications ({patient.medications.length})</div>
              {patient.medications.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b py-1 text-sm last:border-0">
                  <span className="text-gray-700">{m.name} {m.dose}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${m.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
              {patient.medications.length > 4 && (
                <button onClick={() => setTab("medications")} className="mt-2 text-xs text-[#0a1e4a] underline">View all</button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Care Team</div>
              <div className="flex items-center gap-2 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {patient.treatingClinician} &middot; {patient.department}
              </div>
              <div className="flex items-center gap-2 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {patient.gp.name} &middot; {patient.gp.practice}
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recent Activity</div>
              {patient.encounters.slice(0, 3).map((e) => (
                <div key={e.id} className="border-b py-1 text-xs last:border-0">
                  <div className="font-medium text-gray-700">{e.type} &middot; {e.date}</div>
                  <div className="text-gray-400">{e.clinician}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab !== "summary" && <TabPlaceholder patient={patient} tab={tab} />}
    </div>
  );
}

function TabPlaceholder({ patient, tab }: { patient: Patient; tab: Tab }) {
  return <div className="p-4 text-sm text-gray-400">{tab} tab for {patient.firstName} {patient.lastName} — implemented in Task 7.</div>;
}
```

- [ ] **Step 2: Wire selection state into `App.tsx`**

```tsx
import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer } from "./components/Shell";
import { Worklist } from "./components/Worklist";
import { PatientView } from "./components/PatientView";
import { PATIENTS } from "@/lib/data";

type View = "overview" | "worklist";

export default function App() {
  const [view, setView] = useState<View>("worklist");
  const [patients] = useState(PATIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={view} onSelect={(v) => { setView(v); setSelectedId(null); }} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && !selected && <Worklist patients={patients} onOpen={setSelectedId} />}
          {view === "worklist" && selected && <PatientView patient={selected} onBack={() => setSelectedId(null)} />}
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: opening a patient from the worklist shows the header (name/DOB/IHI/ward/LOS, allergy tags if any), tab bar, and a populated Summary tab (vitals strip, active conditions, medications preview, care team, recent activity). Other tabs show the Task-7 placeholder text. Back button returns to the worklist.

- [ ] **Step 4: Commit**

```bash
git add archihealth/src/components/PatientView.tsx archihealth/src/App.tsx
git commit -m "feat(archihealth): add PatientView header and Summary tab"
```

---

### Task 7: Build remaining PatientView tabs

**Files:**
- Modify: `archihealth/src/components/PatientView.tsx`

**Interfaces:**
- Consumes: same `Patient` type; no new exports — replaces the `TabPlaceholder` fallback with real tab content.

- [ ] **Step 1: Replace `TabPlaceholder`/tab-switch block with real tabs**

Remove the `{tab !== "summary" && <TabPlaceholder ... />}` line and the `TabPlaceholder` function, and add these branches directly after the `{tab === "summary" && ...}` block in the returned JSX:

```tsx
      {tab === "medications" && (
        <div className="p-4">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr><th className="p-2">Medication</th><th className="p-2">Status</th><th className="p-2">Route</th></tr>
            </thead>
            <tbody>
              {patient.medications.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="p-2 text-gray-700">{m.name}{m.brandName ? ` (${m.brandName})` : ""} {m.dose} {m.frequency}</td>
                  <td className="p-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${m.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.status}{m.isHighAlert ? " ⚠" : ""}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{m.route}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "conditions" && (
        <div className="space-y-2 p-4">
          {patient.diagnoses.map((d) => (
            <div key={d.icdCode} className="flex items-center justify-between rounded border p-3 text-sm">
              <div>
                <div className="font-medium text-gray-700">{d.shortName}</div>
                <div className="text-xs text-gray-400">{d.icdCode} &middot; {d.description}</div>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{d.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "observations" && (
        <div className="p-4">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="p-2">Date</th><th className="p-2">HR</th><th className="p-2">BP</th>
                <th className="p-2">SpO2</th><th className="p-2">RR</th><th className="p-2">Temp</th><th className="p-2">EWS</th>
              </tr>
            </thead>
            <tbody>
              {[...patient.vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((v) => (
                <tr key={v.timestamp} className="border-b font-mono last:border-0">
                  <td className="p-2 text-gray-600">{v.timestamp.replace("T", " ")}</td>
                  <td className="p-2 text-gray-600">{v.heartRate}</td>
                  <td className="p-2 text-gray-600">{v.systolicBP}/{v.diastolicBP}</td>
                  <td className="p-2 text-gray-600">{v.oxygenSaturation}%</td>
                  <td className="p-2 text-gray-600">{v.respiratoryRate}</td>
                  <td className="p-2 text-gray-600">{v.temperature}&deg;C</td>
                  <td className="p-2 text-gray-600">
                    <span className={v.ewsScore >= 5 ? "text-red-600" : v.ewsScore >= 3 ? "text-amber-600" : "text-green-600"}>
                      {v.ewsScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "webex" && (
        <div className="p-4">
          <div className="rounded border bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-700">Connect with {patient.firstName} {patient.lastName}</div>
            <div className="mb-3 font-mono text-sm text-gray-600">Patient: {patient.phone} &middot; Clinician: {patient.gp.phone}</div>
            <button
              onClick={() => alert(`Instant Connect initiated to ${patient.firstName} ${patient.lastName} (demo only — no real call placed).`)}
              className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white hover:bg-[#0a1e4a]/90"
            >
              Initiate connection
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 2: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: Medications tab shows a full table; Conditions shows every diagnosis with status tag; Observations shows a reverse-chronological vitals table with color-coded EWS; Webex tab shows the two phone numbers and an "Initiate connection" button that pops a demo-only `alert()`.

- [ ] **Step 3: Commit**

```bash
git add archihealth/src/components/PatientView.tsx
git commit -m "feat(archihealth): add Medications/Conditions/Observations/Webex tabs"
```

---

### Task 8: Build the Admit Patient modal

**Files:**
- Create: `archihealth/src/components/AdmitPatientModal.tsx`
- Modify: `archihealth/src/components/Shell.tsx` (add an "Admit patient" trigger button, see Step 2)
- Modify: `archihealth/src/App.tsx`

**Interfaces:**
- Produces: `AdmitPatientModal` component with props `{ onSubmit: (patient: Patient) => void; onClose: () => void }`.
- Consumes: `Patient`, `AdmissionStatus` types from `@/types`.

- [ ] **Step 1: Create `components/AdmitPatientModal.tsx`**

```tsx
import { useState, type ReactNode } from "react";
import type { Patient } from "@/types";

const WARDS = ["4B", "5A", "5B", "6A", "6B", "7A", "7B", "ICU"];
const ATTENDINGS = ["Dr James Chen", "Dr Rachel Kim", "Dr Alan Brock", "Dr Sarah Whitfield"];

function toArray(input: string): string[] {
  return input.split(",").map((s) => s.trim()).filter((s) => s.length > 0 && s.toLowerCase() !== "none");
}

export function AdmitPatientModal({ onSubmit, onClose }: { onSubmit: (patient: Patient) => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", allergies: "", language: "",
    ward: WARDS[0], room: "", bed: "A", attending: ATTENDINGS[0], reason: "",
    conditions: "", medications: "",
    bp: "", hr: "", spo2: "", rr: "", temp: "", height: "", weight: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.name || !form.dob || !form.gender) {
      setError("Please fill in name, date of birth, and gender.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const [firstName, ...rest] = form.name.trim().split(" ");
    const lastName = rest.join(" ") || "—";
    const id = `${firstName}-${lastName}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const [systolicBP, diastolicBP] = form.bp.split("/").map((n) => Number(n.trim()) || 0);

    setTimeout(() => {
      const patient: Patient = {
        id,
        mrn: `NEW-${Date.now()}`,
        medicareNumber: "—",
        ihi: "—",
        firstName,
        lastName,
        dob: form.dob,
        age: Math.max(0, new Date().getFullYear() - new Date(form.dob).getFullYear()),
        sex: (form.gender as Patient["sex"]) || "Other",
        bloodType: "—",
        address: "—",
        phone: "—",
        nextOfKin: { name: "—", relationship: "—", phone: "—" },
        gp: { name: "—", practice: "—", phone: "—" },
        allergies: toArray(form.allergies).map((allergen) => ({
          allergen, type: "Drug", reaction: "Unspecified", severity: "Mild", verified: false,
        })),
        diagnoses: toArray(form.conditions).map((shortName, i) => ({
          icdCode: `NEW-${i}`, description: shortName, shortName, status: "Active",
        })),
        medications: toArray(form.medications).map((name, i) => ({
          id: `${id}-med-${i}`, name, dose: "—", frequency: "—", route: "Oral", status: "Active",
          isHighAlert: false, prescriber: form.attending, startDate: new Date().toISOString().slice(0, 10),
        })),
        vitals: [{
          timestamp: new Date().toISOString(),
          systolicBP: systolicBP || 120,
          diastolicBP: diastolicBP || 80,
          heartRate: Number(form.hr) || 70,
          respiratoryRate: Number(form.rr) || 16,
          temperature: Number(form.temp) || 36.8,
          oxygenSaturation: Number(form.spo2) || 98,
          ewsScore: 0,
          painScore: 0,
        }],
        encounters: [],
        ward: form.ward,
        bedNumber: `${form.room}${form.bed !== "-" ? form.bed : ""}`,
        admissionStatus: "Admitted",
        admissionDate: new Date().toISOString().slice(0, 10),
        treatingClinician: form.attending,
        department: "—",
        fallsRisk: "Low",
        ewsScore: 0,
        alerts: [],
      };
      setSubmitting(false);
      onSubmit(patient);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[85vh] w-[560px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Admit Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <Section title="Demographics">
          <Field label="Full name"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select&hellip;</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date of birth"><input type="date" className="input" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
          <Field label="Allergies"><input className="input" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="comma separated, or none" /></Field>
          <Field label="Preferred language"><input className="input" value={form.language} onChange={(e) => set("language", e.target.value)} /></Field>
        </Section>

        <Section title="Admission details">
          <Field label="Ward">
            <select className="input" value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Room"><input className="input" value={form.room} onChange={(e) => set("room", e.target.value)} /></Field>
          <Field label="Bed">
            <select className="input" value={form.bed} onChange={(e) => set("bed", e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="-">-</option>
            </select>
          </Field>
          <Field label="Attending">
            <select className="input" value={form.attending} onChange={(e) => set("attending", e.target.value)}>
              {ATTENDINGS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Reason for admission"><input className="input" value={form.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
        </Section>

        <Section title="Clinical">
          <Field label="Conditions"><input className="input" value={form.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="comma separated" /></Field>
          <Field label="Medications"><input className="input" value={form.medications} onChange={(e) => set("medications", e.target.value)} placeholder="comma separated" /></Field>
        </Section>

        <Section title="Vitals">
          <Field label="Blood pressure"><input className="input" value={form.bp} onChange={(e) => set("bp", e.target.value)} placeholder="120/80" /></Field>
          <Field label="Heart rate"><input className="input" value={form.hr} onChange={(e) => set("hr", e.target.value)} /></Field>
          <Field label="SpO2"><input className="input" value={form.spo2} onChange={(e) => set("spo2", e.target.value)} /></Field>
          <Field label="Respiratory rate"><input className="input" value={form.rr} onChange={(e) => set("rr", e.target.value)} /></Field>
          <Field label="Temperature"><input className="input" value={form.temp} onChange={(e) => set("temp", e.target.value)} /></Field>
          <Field label="Height"><input className="input" value={form.height} onChange={(e) => set("height", e.target.value)} /></Field>
          <Field label="Weight"><input className="input" value={form.weight} onChange={(e) => set("weight", e.target.value)} /></Field>
        </Section>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-sm text-gray-600">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Admitting…" : "Admit patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-gray-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
```

- [ ] **Step 2: Add a Tailwind utility class for inputs in `src/index.css`**

Append to `archihealth/src/index.css`:

```css
.input {
  @apply w-full rounded border px-2 py-1 text-sm text-gray-700;
}
```

- [ ] **Step 3: Add an "Admit patient" button to the Sidebar in `Shell.tsx`**

In `Sidebar`, after the `CLINICAL_ITEMS` block's closing `</div>`, add:

```tsx
      <button
        onClick={onAdmit}
        className="rounded bg-[#0a1e4a] px-2 py-1.5 text-left text-white hover:bg-[#0a1e4a]/90"
      >
        + Admit patient
      </button>
```

Update the `Sidebar` signature to accept the new prop:

```tsx
export function Sidebar({
  active,
  onSelect,
  onAdmit,
}: {
  active: SidebarView;
  onSelect: (view: SidebarView) => void;
  onAdmit: () => void;
}) {
```

- [ ] **Step 4: Wire modal open/close/submit state into `App.tsx`**

```tsx
import { useState } from "react";
import { SystemSwitcher } from "./components/SystemSwitcher";
import { Header, Sidebar, Footer } from "./components/Shell";
import { Worklist } from "./components/Worklist";
import { PatientView } from "./components/PatientView";
import { AdmitPatientModal } from "./components/AdmitPatientModal";
import { PATIENTS } from "@/lib/data";
import type { Patient } from "@/types";

type View = "overview" | "worklist";

export default function App() {
  const [view, setView] = useState<View>("worklist");
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [admitting, setAdmitting] = useState(false);

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  function handleAdmit(patient: Patient) {
    setPatients((prev) => [patient, ...prev]);
    setAdmitting(false);
  }

  return (
    <div className="flex h-screen flex-col">
      <SystemSwitcher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={view}
          onSelect={(v) => { setView(v); setSelectedId(null); }}
          onAdmit={() => setAdmitting(true)}
        />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {view === "overview" && <div className="text-gray-500">Overview isn&apos;t modeled in this demo.</div>}
          {view === "worklist" && !selected && <Worklist patients={patients} onOpen={setSelectedId} />}
          {view === "worklist" && selected && <PatientView patient={selected} onBack={() => setSelectedId(null)} />}
        </main>
      </div>
      <Footer />
      {admitting && <AdmitPatientModal onSubmit={handleAdmit} onClose={() => setAdmitting(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Verify in the dev server**

Run: `cd archihealth && npm run dev`
Expected: "+ Admit patient" button in the sidebar opens the modal; submitting with name/DOB/gender filled in closes the modal after ~600ms and the new patient appears at the top of the worklist; submitting without those three fields shows the red validation message and the modal stays open.

- [ ] **Step 6: Commit**

```bash
git add archihealth/src/components/AdmitPatientModal.tsx archihealth/src/components/Shell.tsx archihealth/src/App.tsx archihealth/src/index.css
git commit -m "feat(archihealth): add Admit Patient modal"
```

---

### Task 9: Build and commit the static export

**Files:**
- Create: `archihealth/dist/**` (build output)

**Interfaces:**
- Consumes: the complete `archihealth/src` tree from Tasks 1–8.
- Produces: static files servable at `/archihealth/dist/`.

- [ ] **Step 1: Build**

Run: `cd archihealth && npm run build`
Expected: Vite reports a successful build, `archihealth/dist/index.html` and `archihealth/dist/assets/*` exist.

- [ ] **Step 2: Smoke-test the build output**

Run: `cd archihealth && npm run preview -- --port 4174`
Expected: opening the printed URL shows the same working app (worklist, patient view, admit modal) as `npm run dev` did. Stop the preview server once confirmed.

- [ ] **Step 3: Force-add `dist/` despite `.gitignore` and commit**

```bash
git add -f archihealth/dist
git commit -m "build(archihealth): commit static export"
```

---

### Task 10: Point the TOC at the new app

**Files:**
- Modify: `index.html:184-189` (the "ArchiTech Health (Epic)" entry added in the prior session)

**Interfaces:**
- Consumes: nothing new — this is a one-line href swap.

- [ ] **Step 1: Update the href**

In `index.html`, find:
```html
          <a href="/emrdemo/dist/" class="entry">
            <span class="entry-num">03</span>
            <span class="entry-label">ArchiTech Health (Epic)</span>
```
Change the `href` to:
```html
          <a href="/archihealth/dist/" class="entry">
            <span class="entry-num">03</span>
            <span class="entry-label">ArchiTech Health (Epic)</span>
```

- [ ] **Step 2: Verify**

Run: open `index.html` in a browser (or `python3 -m http.server` from repo root and visit `/`) and confirm the "ArchiTech Health (Epic)" link points at `/archihealth/dist/` and loads the new app.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(toc): point ArchiTech Health (Epic) at the new archihealth build"
```

---

### Task 11: Add ArchiTech Health to decoy's SystemSwitcher

**Files:**
- Modify: `decoy-src/components/SystemSwitcher.tsx`
- Modify: `decoy/**` (rebuilt static export)

**Interfaces:**
- Consumes: existing `SYSTEMS` array structure in `decoy-src/components/SystemSwitcher.tsx`.

- [ ] **Step 1: Add the third entry**

In `decoy-src/components/SystemSwitcher.tsx`, change:
```tsx
const SYSTEMS = [
  { label: 'Dynamics 365', href: '/dynamics/dashboard', prefix: '/dynamics' },
  { label: 'ArchiTech Care', href: '/alayacare/dashboard', prefix: '/alayacare' },
];
```
to:
```tsx
const SYSTEMS = [
  { label: 'Dynamics 365', href: '/dynamics/dashboard', prefix: '/dynamics' },
  { label: 'ArchiTech Care', href: '/alayacare/dashboard', prefix: '/alayacare' },
  { label: 'ArchiTech Health', href: '/archihealth/dist/', prefix: '/archihealth' },
];
```

Check how this component renders each entry's `href` (it likely prefixes with the Next.js basePath `/decoy` via `Link`). Since `/archihealth/dist/` is a separate app outside the `/decoy` basePath, replace the `<Link href={system.href} ...>` for this one entry with a plain `<a href={system.href} ...>` (same visual classes), OR — if all entries already render as plain anchors — no further change is needed. Inspect the component's render method to confirm which case applies before editing.

- [ ] **Step 2: Rebuild decoy-src and sync into decoy/**

```bash
cd decoy-src && npm run build
cd ..
rm -rf decoy && cp -r decoy-src/out decoy
```

- [ ] **Step 3: Verify**

Run: `grep -o "ArchiTech Health" decoy/alayacare/dashboard/index.html decoy/dynamics/dashboard/index.html`
Expected: both files contain "ArchiTech Health" (confirms the switcher entry is present on both decoy apps).

- [ ] **Step 4: Commit**

```bash
git add decoy-src/components/SystemSwitcher.tsx decoy/
git commit -m "feat(decoy): add ArchiTech Health to the SystemSwitcher"
```

---

### Task 12: Delete emrdemo

**Files:**
- Delete: `emrdemo/` (entire directory)

**Interfaces:**
- Consumes: nothing — by this point Tasks 2 and 6–8 have already ported everything needed (data, types, assets) out of `emrdemo/`.

- [ ] **Step 1: Confirm nothing outside `emrdemo/` still references it**

Run: `grep -rl "emrdemo" --include="*.html" --include="*.tsx" --include="*.ts" --include="*.js" . | grep -v "^./emrdemo/"`
Expected: no output (Task 10 already repointed the only reference, the TOC href).

- [ ] **Step 2: Delete and commit**

```bash
git rm -r emrdemo
git commit -m "chore(emrdemo): remove, replaced by archihealth"
```

---

### Task 13: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Full click-through**

Run: `cd archihealth && npm run preview -- --port 4174` (or serve `index.html` at repo root some other way that resolves `/archihealth/dist/`, `/decoy/...` sibling paths)

Walk through:
1. Worklist loads with 11 patients, correct status counts.
2. Filter by Critical/Watch/Stable each show the right subset.
3. Search by a known patient's last name and by their IHI both find them.
4. Open a patient, check all 5 tabs render without console errors.
5. Use the Webex tab's "Initiate connection" button — demo alert appears.
6. Open Admit Patient, submit with only name/DOB/gender filled, confirm the new patient appears at the top of the worklist with a "Stable" status and today's date as LOS 0d.
7. Click each of the three SystemSwitcher links from `archihealth` and confirm they resolve to the Decoy apps (or 404 only because of local static-serving limitations, not because the link/basePath is wrong — check the `href` values directly if a local server can't route the sibling paths).
8. From the TOC (`index.html`), click "ArchiTech Health (Epic)" and confirm it opens the new app, not the old `emrdemo`.

- [ ] **Step 2: Report result**

If everything above passes, the feature is complete — no further commit needed for this task. If anything fails, fix it in a follow-up commit referencing which verification step caught it.
