# HealthCore EMR Demo — Design Spec
_Date: 2026-04-24_

## Purpose

A convincing fake EMR/EHR system used as a source-system demo when showing healthcare workflow automations via Webex Contact Center. The audience watches the automation respond to clinical data — not the scheduling UI — so the system needs to look credible, not be genuinely complex.

**System name:** HealthCore — Clinical Information System v14.2

---

## Confirmed Decisions

| Decision | Choice | Reason |
|---|---|---|
| Appointments view | List view only | Demo is automation-focused; day-grid adds no value |
| Visual companion | Text-based | User preference |
| Routing | Wouter with `base="/emrdemo/dist/"` | Mirrors wxccroidemo pattern |
| Styling | Clinical light (white/green/blue/grey) | Epic-like credibility |
| Hospital context | Australian (Royal Melbourne Hospital) | Target audience |

---

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 with `@theme inline` mapping
- shadcn/ui (New York) — source files copied from `wxccworkflowdemo/client/src/components/ui/`
- Lucide React (icons)
- Recharts (vitals trend charts)
- Wouter (routing)
- Framer Motion (page transitions)

---

## Screens

### Screen 1 — Patient List (`/patients`)
- Search bar with ward/status/clinician filters
- Dense sortable table: Name, MRN, DOB, Ward/Bed, Diagnosis, EWS badge, Status, Clinician
- Clicking a row navigates to the patient chart

### Screen 2 — Patient Chart (`/patients/:id`)
Four sticky elements stack at top: TopNav → PatientHeader → AllergyBanner → Tab bar. Only the tab content scrolls.

Tabs:
- **Summary** — VitalsSummary (6-up cards), DiagnosisList, active medications snapshot
- **Medications** — Full MedicationsList with high-alert indicators
- **Vitals** — VitalsChart (Recharts multi-series line) + latest readings
- **Encounters** — EncounterHistory + ClinicalNote (SOAP quad display)
- **Details** — Full demographics, next of kin, GP, insurance, alerts

### Screen 3 — Appointments (`/appointments`)
- List view only (no day-grid)
- Filterable by clinician, date, status, priority
- Shows: patient name, appointment type, department, clinician, date/time, status badge, room

---

## Layout Structure

```
AppShell: flex flex-col h-screen overflow-hidden
├── TopNav (fixed height)
└── flex flex-1 overflow-hidden
    ├── Sidebar (fixed width, full height, dark navy)
    └── main: flex-1 overflow-hidden flex flex-col
        ├── PatientHeader (sticky)       ← chart only
        ├── AllergyBanner (sticky)       ← chart only
        ├── TabsList (sticky)            ← chart only
        └── TabsContent: flex-1 overflow-y-auto  ← only this scrolls
```

---

## Data

**12 patients** — varied acuity, Australian clinical format:
Margaret Thompson, Robert Adeyemi, Isabelle Dupont, Daniel Kowalczyk, Evelyn Nakamura, Thomas Sullivan, Priya Krishnamurthy, William Grant, Sandra Okonkwo, James Moretti, Aisha Al-Hassan, **Astrid Nygaard** (replaces Bruce Macfarlane).

**Hero patient: Astrid Nygaard** — 38yo, Right total knee replacement (TKR), elective. Day Surgery Unit. Her chart is the demo stage — all other patients exist to make the list look real.

**20 appointments** across 7 days.

Australian standards: Medicare `2847 63910 1`, IHI `8003 XXXX XXXX XXXX`, drug frequency `BD/TDS/Mane/Nocte`, routes `SC/IV/IM/Oral`, vitals in °C/mmHg/kg/cm/bpm.

---

## Demo Journey — Astrid Nygaard

Astrid's chart advances through 6 pre-staged states, one per WXCC workflow stage. A subtle floating pill (bottom-right corner, ~36px, low contrast) shows the presenter the current stage number and a single `›` advance button. On click it briefly shows `✓` for 1.5s then returns to normal — confirming the stage fired. Not readable from the audience's seats.

| Stage | WXCC Demo Stage | EMR Status | What Changes in Astrid's Chart |
|---|---|---|---|
| 1 | Pre Admission Enrolment | Registered / Pre-Admission | Patient in list. Status: Pre-Admission. Triage note entered. Allergies and medical history logged. No procedure date yet. |
| 2 | Appointment Scheduling & Reminders | Procedure Scheduled | Status: Scheduled. TKR appointment in Appointments screen, `reminderSent: false` → `true`. Date/room populated. |
| 3 | Arrival Coordination | Admitted | Status: Admitted. Admission note in Encounters. Initial vitals appear. Ward and bed assigned (Day Surgery). |
| 4 | Family Updates During Surgery | In Procedure | Status: In Procedure. OR note in Encounters. Vitals updated (anaesthesia-appropriate). Sedation medications shown. Family contact flagged. |
| 5 | Take-Home Instruction Delivery | Ready for Discharge | Status: Ready for Discharge. Discharge summary in Encounters. Discharge medications listed. Follow-up appointment created. EWS = 0. |
| 6 | Post Discharge Check-Up | Discharged | Status: Discharged. Final encounter note. Post-discharge follow-up appointment confirmed. `reminderSent` flips to `true`. |

---

## Critical Clinical UI Rules

1. **Allergy Banner** — always visible below patient header, red left-border, allergen pills. NKDA = green.
2. **EWS Badge** — 0–1 green, 2–3 amber, 4+ red. Visible on patient list rows and vitals tab.
3. **High Alert Medications** — amber left-border + `⚠ HIGH ALERT` pill on warfarin, opioids, insulin, anticoagulants.
4. **Dense tables** — row height h-9, zebra striping, small font.
5. **Contact Precautions** — orange banner for Sandra Okonkwo (MRSA, ICU).
6. **Demo Mode pill** — fixed corner badge: `● DEMO DATA — NOT REAL PATIENT INFORMATION`.
7. **SOAP notes** — 4-quadrant grid labelled S / O / A / P.
8. **IDs always monospace** — MRN, Medicare, IHI.

---

## shadcn/ui Components to Copy

From `wxccworkflowdemo/client/src/components/ui/`:
`badge`, `button`, `card`, `input`, `select`, `separator`, `tabs`, `table`, `scroll-area`, `tooltip`, `avatar`

No `dialog` component needed.

---

## Routing

```
/              → redirect to /patients
/patients      → PatientList
/patients/:id  → PatientChart
/appointments  → Appointments
```

Vite base: `/emrdemo/dist/`
Wouter base: `/emrdemo/dist`

---

## Build Output

- `npm run dev` inside `emrdemo/` for development
- `npm run build` → static files to `emrdemo/dist/`
- Add link to root `index.html` TOC under WxCC Demos

---

## Implementation Phases

1. **Scaffold** — package.json, vite.config.ts, tsconfig.json, index.html, index.css
2. **Data** — types/index.ts, lib/utils.ts, lib/data.ts (12 patients + 20 appointments)
3. **Shell** — TopNav, Sidebar, AppShell, App.tsx with routes
4. **Shared clinical components** — StatusBadge, AllergyBanner, PatientHeader, VitalsSummary, VitalsChart
5. **Patient List** — PatientSearchBar, PatientListTable, PatientList page
6. **Patient Chart** — DiagnosisList, MedicationsList, ClinicalNote, EncounterHistory, PatientChart page (5 tabs)
7. **Appointments** — list view only, Appointments page
8. **Polish** — Framer Motion transitions, TypeScript clean compile, root index.html link

---

## Verification Checklist

- [ ] `npm run dev` — all 3 screens render
- [ ] Search "Thompson" → filters to Margaret Thompson
- [ ] Click patient → chart loads with allergy banner, EWS, medications
- [ ] Appointment list: filter by "Dr Sarah Nguyen" → her appointments only
- [ ] Vitals tab → Recharts chart renders with multi-series data
- [ ] `npm run build` → dist output clean
- [ ] Root `index.html` links to `/emrdemo/dist/`
