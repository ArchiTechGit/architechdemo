# HealthCore EMR/EHR Demo — Implementation Plan

## Context
ArchiTech needs a convincing fake EMR/EHR system to use as a source-system demo when showing healthcare workflow automations (e.g. Webex Contact Center). The system must look and feel like a real clinical platform (Epic, Cerner, Rhapsody) without being genuinely complex. It will be a standalone static Vite + React demo deployed at `/emrdemo/`, matching the structure of the existing `wxccworkflowdemo` and `wxccroidemo` demos in this repo.

**System name:** HealthCore (tagline: "Clinical Information System", version badge: v14.2)  
**Visual theme:** Clinical light — white cards, off-white background, Epic-like green/blue/grey palette  
**Screens:** Patient List/Search · Patient Detail/Chart · Appointment Scheduling  

---

## Tech Stack (mirrors existing demos)
- React 19 + TypeScript + Vite 7
- Tailwind CSS v4
- shadcn/ui (New York) — copy components from `wxccworkflowdemo/client/src/components/ui/`
- Lucide React (icons)
- Recharts (vitals trend charts)
- Wouter (routing)
- Framer Motion (page transitions)

---

## File Structure

```
emrdemo/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── components.json
└── client/src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                        # Clinical light theme CSS variables
    ├── types/
    │   └── index.ts                     # All TypeScript interfaces
    ├── lib/
    │   ├── utils.ts                     # cn() utility
    │   └── data.ts                      # All 12 patients + 20 appointments (hardcoded)
    ├── components/
    │   ├── ui/                          # Copied shadcn/ui components
    │   ├── layout/
    │   │   ├── AppShell.tsx             # TopNav + Sidebar + <main>
    │   │   ├── TopNav.tsx               # HealthCore header, user, live clock
    │   │   └── Sidebar.tsx              # Left nav: Patients, Appointments
    │   └── clinical/
    │       ├── AllergyBanner.tsx        # Full-width allergy alert strip (critical)
    │       ├── PatientHeader.tsx        # MRN/DOB/Medicare demographics bar
    │       ├── PatientSearchBar.tsx     # Search + ward/status/clinician filters
    │       ├── PatientListTable.tsx     # Dense sortable ward patient table
    │       ├── StatusBadge.tsx          # Clinical status badge variants
    │       ├── VitalsSummary.tsx        # 6-up latest vitals cards with trend arrows
    │       ├── VitalsChart.tsx          # Recharts multi-series line chart
    │       ├── DiagnosisList.tsx        # Problem list with ICD codes
    │       ├── MedicationsList.tsx      # Medications table with high-alert indicators
    │       ├── ClinicalNote.tsx         # SOAP note quad display
    │       └── EncounterHistory.tsx     # Chronological encounter list
    └── pages/
        ├── PatientList.tsx              # Screen 1
        ├── PatientChart.tsx             # Screen 2 (tabbed: Summary, Meds, Vitals, Encounters, Details)
        └── Appointments.tsx            # Screen 3 (list view; day-grid is stretch goal)
```

---

## Routing (Wouter)

```
/              → redirect to /patients
/patients      → PatientList
/patients/:id  → PatientChart
/appointments  → Appointments
```

Wouter `base` must exactly match Vite's `base` config (trailing slash included). Pattern from `wxccroidemo`:

```ts
// vite.config.ts
base: "/emrdemo/dist/"

// App.tsx
<Router base="/emrdemo/dist">   ← Wouter strips trailing slash internally, this is correct
```

**vite.config.ts** (minimal, no server needed):
```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "client", "src") } },
  root: path.resolve(import.meta.dirname, "client"),
  base: "/emrdemo/dist/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
```

---

## Clinical Theme (index.css)

Tailwind v4 requires `@theme inline { }` to map CSS variables to utility classes — same pattern as `wxccworkflowdemo`. The `:root` block must declare **all** shadcn/ui tokens (not just a subset — missing ones cause invisible text or broken components).

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: 'Inter', 'Segoe UI', Arial, sans-serif;
  --font-mono: ui-monospace, 'JetBrains Mono', monospace;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background:              var(--background);
  --color-foreground:              var(--foreground);
  --color-card:                    var(--card);
  --color-card-foreground:         var(--card-foreground);
  --color-popover:                 var(--popover);
  --color-popover-foreground:      var(--popover-foreground);
  --color-primary:                 var(--primary);
  --color-primary-foreground:      var(--primary-foreground);
  --color-secondary:               var(--secondary);
  --color-secondary-foreground:    var(--secondary-foreground);
  --color-muted:                   var(--muted);
  --color-muted-foreground:        var(--muted-foreground);
  --color-accent:                  var(--accent);
  --color-accent-foreground:       var(--accent-foreground);
  --color-destructive:             var(--destructive);
  --color-destructive-foreground:  var(--destructive-foreground);
  --color-border:                  var(--border);
  --color-input:                   var(--input);
  --color-ring:                    var(--ring);
  --color-chart-1:                 var(--chart-1);
  --color-chart-2:                 var(--chart-2);
  --color-chart-3:                 var(--chart-3);
  --color-chart-4:                 var(--chart-4);
  --color-chart-5:                 var(--chart-5);
  --color-sidebar:                 var(--sidebar);
  --color-sidebar-foreground:      var(--sidebar-foreground);
  --color-sidebar-primary:         var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent:          var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border:          var(--sidebar-border);
  --color-sidebar-ring:            var(--sidebar-ring);
}

/* ─── HEALTHCORE CLINICAL THEME ─── */
:root {
  --radius: 0.25rem;
  --background:              #F5F6F8;
  --foreground:              #1A1D23;
  --card:                    #FFFFFF;
  --card-foreground:         #1A1D23;
  --popover:                 #FFFFFF;
  --popover-foreground:      #1A1D23;
  --primary:                 #1A6B3C;   /* Epic-like clinical green */
  --primary-foreground:      #FFFFFF;
  --secondary:               #EEF2F7;
  --secondary-foreground:    #3D4A5C;
  --muted:                   #EEF2F7;
  --muted-foreground:        #6B7A90;
  --accent:                  #1C5FA8;   /* Cerner blue */
  --accent-foreground:       #FFFFFF;
  --destructive:             #C0392B;   /* clinical red */
  --destructive-foreground:  #FFFFFF;
  --border:                  #D1D9E4;
  --input:                   #FFFFFF;
  --ring:                    #1A6B3C;
  --chart-1:                 #1C5FA8;   /* BP — blue */
  --chart-2:                 #C0392B;   /* HR — red */
  --chart-3:                 #1A6B3C;   /* SpO2 — green */
  --chart-4:                 #E67E22;   /* Temp — orange */
  --chart-5:                 #8E44AD;   /* RR — purple */
  --sidebar:                 #1E2D40;
  --sidebar-foreground:      #F0F4F8;
  --sidebar-primary:         #1A6B3C;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent:          #2A3F58;
  --sidebar-accent-foreground: #F0F4F8;
  --sidebar-border:          #2E4060;
  --sidebar-ring:            #1A6B3C;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  code, kbd, pre, .font-mono { font-family: ui-monospace, monospace !important; }
}
```

Typography: Inter/Segoe UI. IDs always monospace. Section labels in `text-xs uppercase tracking-widest`.

---

## Data Model (types/index.ts)

Key interfaces:
- `Patient` — id, mrn, medicareNumber, ihi, demographics, address, nextOfKin, gp, allergies[], diagnoses[], medications[], vitals[], encounters[], ward, bedNumber, admissionStatus, treatingClinician, fallsRisk, ewsScore, alerts[]
- `Allergy` — allergen, type, reaction, severity, verified
- `Diagnosis` — icdCode, description, shortName, status
- `Medication` — name, brandName, dose, frequency, route, status, isHighAlert
- `VitalReading` — systolicBP, diastolicBP, heartRate, respiratoryRate, temperature, oxygenSaturation, ewsScore, painScore, glucoseBSL
- `Encounter` — type, date, facility, department, clinician, note (SOAP)
- `Appointment` — patientId, type, department, clinician, scheduledDate, scheduledTime, status, priority, room, reminderSent

---

## Fake Data (lib/data.ts)

Australian hospital context — Royal Melbourne Hospital + others.

**12 patients (varied clinical complexity):**

| Patient | Age | Condition | Ward | Status |
|---------|-----|-----------|------|--------|
| Margaret Thompson | 74 | Anterior STEMI post-PPCI | 4B | Inpatient |
| Robert Adeyemi | 61 | T2DM, hypertension, CKD | 4A | Inpatient |
| Isabelle Dupont | 45 | Pulmonary embolism | 5B | Inpatient |
| Daniel Kowalczyk | 38 | L4/L5 discectomy recovery | 5A | Inpatient |
| Evelyn Nakamura | 82 | Community-acquired pneumonia | 4A | Inpatient |
| Thomas Sullivan | 55 | Chest pain — query ACS | ED | ED |
| Priya Krishnamurthy | 29 | Appendicectomy post-op | 5A | Inpatient |
| William Grant | 68 | COPD exacerbation | 5B | Inpatient |
| Sandra Okonkwo | 51 | Sepsis (MRSA — contact precautions) | ICU | Inpatient |
| James Moretti | 77 | Hip replacement day 2 | 5A | Inpatient |
| Aisha Al-Hassan | 34 | Hyperemesis gravidarum 16wks | 4A | Inpatient |
| Bruce Macfarlane | 63 | Elective colonoscopy | DAY | Day Surgery |

**Australian clinical format standards:**
- Medicare: `2847 63910 1` (10 digits + IRN, spaced)
- IHI: `8003 XXXX XXXX XXXX` (Australian national patient ID)
- Drug frequency: `BD`, `TDS`, `Mane`, `Nocte` (not "twice daily")
- Routes: `SC`, `IV`, `IM`, `Oral`
- Vitals: °C, mmHg, kg, cm, bpm, breaths/min
- EWS: 0-1 green, 2-3 amber, 4+ red — shown in patient list and vitals

**20 appointments** across the next 7 days for various patients/clinicians.

---

## Critical Clinical UI Conventions

1. **Allergy Banner** — Full-width red border-left strip below patient header. Always visible. Shows `⚠ ASPIRIN — Bronchospasm (Severe)` pills. NKDA shows green. This is the #1 thing clinicians check.
2. **Patient Header** — Persistent across all chart tabs: name, MRN (monospace), DOB, age, sex, blood type, ward/bed, Medicare, treating clinician, GP.
3. **EWS Badge** — Coloured number (0–10+) on patient list rows and vitals. Immediately signals patient acuity.
4. **High Alert Medications** — Amber left-border stripe + `⚠ HIGH ALERT` pill on warfarin, opioids, insulin, anticoagulants.
5. **Dense tables** — Row height h-9, zebra striping, small font — matches clinical systems.
6. **SOAP note display** — 4-quadrant grid labelled S / O / A / P.
7. **Contact Precautions** — Orange/yellow banner for ICU patient (Sandra Okonkwo — MRSA).
8. **Demo Mode pill** — Fixed corner badge: `● DEMO DATA — NOT REAL PATIENT INFORMATION`.

---

## Standalone Project — Dependencies (package.json)

This is a **fully independent project** with no imports from any other demo. All dependencies must be declared in `emrdemo/package.json`. The shadcn/ui component TSX files are copied as source (that's how shadcn works — you own them), but all their `@radix-ui` runtime packages must be explicitly installed.

```json
{
  "name": "healthcore-emr-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.22",
    "lucide-react": "^0.453.0",
    "recharts": "^2.15.2",
    "tailwind-merge": "^3.3.1",
    "wouter": "^3.3.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.3",
    "@types/node": "^24.7.0",
    "@types/react": "^19.2.1",
    "@types/react-dom": "^19.2.1",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.14",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.6.3",
    "vite": "^7.1.7"
  }
}
```

No `dialog` component needed — no modals in any of the three screens.

## shadcn/ui Components to Copy (source files only)

Copy these TSX files from `wxccworkflowdemo/client/src/components/ui/` into `emrdemo/client/src/components/ui/`. They are standalone source files with no cross-project imports — the only external deps they use are the `@radix-ui` packages declared above.

Required: `badge`, `button`, `card`, `input`, `select`, `separator`, `tabs`, `table`, `scroll-area`, `tooltip`, `avatar`

---

## Implementation Order

**Phase 1 — Scaffold** (get it running)
1. `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
2. `index.css` with full clinical theme
3. `lib/utils.ts`, `types/index.ts`
4. Copy shadcn/ui components

**Phase 2 — Data**
5. `lib/data.ts` — all 12 patients + 20 appointments (most critical step for demo credibility)

**Phase 3 — Shell**
6. `TopNav.tsx`, `Sidebar.tsx`, `AppShell.tsx`
7. `App.tsx` with Wouter routes — verify shell renders

**Phase 4 — Shared Clinical Components**
8. `StatusBadge`, `AllergyBanner`, `PatientHeader`, `VitalsSummary`, `VitalsChart`

**Phase 5 — Patient List (Screen 1)**
9. `PatientSearchBar`, `PatientListTable`, `PatientList` page

**Phase 6 — Patient Chart (Screen 2)**
10. `DiagnosisList`, `MedicationsList`, `ClinicalNote`, `EncounterHistory`
11. `PatientChart` page with 5 tabs

**Phase 7 — Appointments (Screen 3)**
12. `AppointmentCard`, `Appointments` page — **list view only** for initial build
13. Day-grid view (7am–6pm CSS grid with positioned appointment blocks) — **stretch goal after list view is working**

**Phase 8 — Polish**
14. Framer Motion page transitions
15. Responsive check (1920×1080 demo monitor)
16. TypeScript compile clean
17. Add to root `index.html` TOC

---

## Layout Note — Patient Chart Scroll

The patient chart has four stacked sticky elements: TopNav → PatientHeader → AllergyBanner → Tab bar. Without explicit height management this will consume the full viewport and leave no room for content.

Structure:
```
<div class="flex flex-col h-screen overflow-hidden">     ← AppShell
  <TopNav />                                              ← fixed height
  <div class="flex flex-1 overflow-hidden">
    <Sidebar />                                           ← fixed width, full height
    <main class="flex-1 overflow-hidden flex flex-col">
      <PatientHeader />                                   ← sticky, fixed height
      <AllergyBanner />                                   ← sticky, fixed height
      <Tabs>
        <TabsList />                                      ← sticky
        <TabsContent class="flex-1 overflow-y-auto" />   ← only this scrolls
      </Tabs>
    </main>
  </div>
</div>
```

---

## Verification

1. `npm run dev` inside `emrdemo/` — check all 3 screens render
2. Patient list: search "Thompson" → filters to Margaret Thompson
3. Click patient → chart loads with allergy banner, EWS, medications
4. Appointment list: filter by clinician "Dr Sarah Nguyen" → shows her appointments
5. Vitals tab → Recharts chart renders with multi-series toggle
6. `npm run build` → static files output to `emrdemo/dist/`
7. Verify `index.html` at repo root links to `/emrdemo/dist/`
