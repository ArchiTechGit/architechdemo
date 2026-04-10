# WxCC Public ROI Calculator — Design Spec
**Date:** 2026-04-10  
**Status:** Approved for implementation  
**Author:** Brainstorming session — Grant Hansen + Claude

---

## Context

ArchiTech has an existing internal ROI calculator (`wxccroidemo`) used during live sales opportunities. It is detailed and accurate but complex — too many inputs for a conference or festival setting.

This project creates a **customer-facing, conference-ready equivalent**: a simplified, visually impactful ROI calculator that can be run by a prospect independently (via QR code on their phone) or guided by an ArchiTech SE/AE at a booth. The goal is to answer the question *"but how much will that cost me?"* in under 3 minutes with a memorable, shareable result.

The calculator is scoped to healthcare and framed around the **digital front door** — the automated, omnichannel patient journey that surrounds a hospital separation.

---

## Approach

Three-screen wizard with a reveal moment. Screens are shown/hidden via vanilla JS — no page loads, instant transitions. A prospect picks their workflows, enters 3 numbers, and lands on a full-screen results reveal with a hero saving figure and supporting stats.

---

## Tech Stack

- **Plain HTML + vanilla JS + CSS** — no framework, no build step
- **Same ArchiTech dark brand** — CSS variables copied from existing site
- **Standalone file** — `/wxccroi-public/index.html` in the repo
- **Deployable anywhere** — GitHub Pages, Netlify, any static host
- **No dependencies** — opens in a browser, works offline

---

## Screen Flow

```
[Screen 1 — Scenarios]  →  [Screen 2 — Your Numbers]  →  [Screen 3 — Results]
   Pick workflows              3 inputs                     Hero ROI reveal
   (tap to select)             (agents, separations,        + assumptions panel
                                staff cost)                 + share / recalculate
```

---

## Screen 1 — Scenario Picker

**Headline:** *"What does your patient journey include?"*  
**Subhead:** *"Select the workflows you want to automate as part of a separation."*

Six scenario cards in a 2×3 grid (mobile: 1 column). Cards are large tap targets. Selected cards show a cyan border and checkmark. Multiple selection allowed. "Calculate my ROI →" button activates once at least one card is selected.

### Scenario Cards

| # | Name | One-liner | Proof-point stat |
|---|---|---|---|
| 1 | Appointment Management | Book, reschedule and cancel 24/7 — no staff involved | 60% reduction in no-shows |
| 2 | Pre-Visit Preparation | Intake forms, consent and instructions — replaces manual outbound calls | 80% of manual effort removed |
| 3 | Care Navigation & Triage | Symptom check, service routing, wait time management — deflects tier-1 volume | 70% cost reduction via self-service |
| 4 | Proactive Outreach | Screening reminders, medication refills, care-plan check-ins — replaces manual campaigns | 20× more cost-effective than manual outbound |
| 5 | Post-Visit Follow-Up | Discharge instructions, medication adherence, outcome surveys — currently manual or not happening | 50–80% reduction in staff time |
| 6 | Other Workflows | Have workflows outside healthcare? Add a general estimate to see how automation compounds. | — |

Stats sourced from ArchiTech website (https://www.architech.net.au/digital-front-door-healthcare).

---

## Screen 2 — Your Numbers

**Headline:** *"Tell us about your organisation"*  
**Subline:** Shows selected workflows (e.g. "Calculating across 3 workflows →")

### Three Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| Number of agents | Slider + number field | **30** | Scales platform cost |
| Annual separations | Slider + number field | **15,000** | Mid-size regional hospital benchmark |
| Average staff hourly cost | Number field | **$60/hr** | Pre-filled; small "edit" affordance; most users leave it |

All other costs (SMS rates, WX Connect runs, platform base cost) are locked to defaults from the existing tool and never shown.

**CTA:** "Show my ROI →"

---

## Calculation Model

### Key Concept
One separation = one instance of each selected workflow firing. The user decides which workflows are part of their separation journey by selecting them in Screen 1.

### Fixed Assumptions (hidden from user, shown in transparency panel)

#### Channel mix per workflow (per separation)

| Workflow | SMS ($0.04) | WX Connect ($0.08) | Email ($0.00) | Total interactions |
|---|---|---|---|---|
| Appointment Management | 2 | 2 | 1 | **5** |
| Pre-Visit Preparation | 1 | 1 | 1 | **3** |
| Care Navigation & Triage | 1 | 2 | 1 | **4** |
| Proactive Outreach | 1 | 1 | 1 | **3** |
| Post-Visit Follow-Up | 3 | 4 | 3 | **10** |
| Other Workflows | 2 | 2 | 2 | **6** |

#### Labour saved per workflow (per separation)

| Workflow | Minutes saved | What's replaced |
|---|---|---|
| Appointment Management | 25 min | Booking, reminder, reschedule/cancel calls |
| Pre-Visit Preparation | 20 min | Structured intake call with staff member |
| Care Navigation & Triage | 12 min | Routing and triage calls |
| Proactive Outreach | 22 min | Manual outbound campaign calls |
| Post-Visit Follow-Up | 18 min | Discharge calls, follow-ups, outcome surveys |
| Other Workflows | 15 min | Conservative average |

#### Unit costs (from existing wxccroidemo defaults)

| Item | Cost |
|---|---|
| SMS per segment | $0.04 |
| WX Connect remote run | $0.08 |
| Email send | $0.00 |
| Staff hourly rate (default) | $60.00 |
| Platform base cost | $1,238.15/month |

### Formulas

```
digital_cost_per_separation(workflow) =
  (sms × 0.04) + (wx_runs × 0.08) + (emails × 0.00)

labour_saved_per_separation(workflow) =
  (minutes_saved / 60) × staff_hourly_rate

net_saving_per_separation(workflow) =
  labour_saved - digital_cost

annual_saving(workflow) =
  net_saving_per_separation × annual_separations

total_annual_saving =
  SUM(annual_saving for all selected workflows)

annual_platform_cost =
  platform_base_monthly × 12
  (future: scale with agent count if per-agent pricing added)

net_annual_saving =
  total_annual_saving - annual_platform_cost

annual_hours_saved =
  SUM((minutes_saved / 60) × annual_separations for all selected workflows)

fte_equivalent =
  annual_hours_saved / 1920

roi_multiple =
  total_annual_saving / annual_platform_cost
```

---

## Screen 3 — Results Reveal

**Transition:** 1–2 second animated fade/slide in. Numbers count up on arrival.

### Layout (top to bottom)

1. **Label** — "Your estimated annual saving"
2. **Hero number** — Large, cyan, counting animation. e.g. `$1,240,000`
3. **Three supporting stats** (row of cards beneath hero):
   - Annual hours returned to clinical staff (e.g. `12,500 hrs`)
   - FTE equivalent (e.g. `6.5 FTE`)
   - ROI multiple (e.g. `6.2× return on investment`)
4. **Per-workflow breakdown** — Card list showing each selected workflow's individual annual saving and minutes saved. Collapsed by default on mobile, expanded on desktop.
5. **"How this is calculated"** — Collapsible section (collapsed by default) showing:
   - Channel mix assumption table
   - Labour minutes table
   - Unit costs table
   - Note: *"Figures based on ArchiTech implementation benchmarks. Contact us for a detailed analysis."*
6. **Two CTAs:**
   - `← Recalculate` — Returns to Screen 2, inputs preserved
   - `Share this result` — Encodes inputs + selected scenarios into URL query string, copies to clipboard
7. **Footer** — ArchiTech logo, website link, *"This calculator uses industry benchmark assumptions. Actual results will vary."*

### Shareable URL format
```
/wxccroi-public/?scenarios=1,2,4&agents=30&separations=15000&rate=60
```
On load, if query params are present, the calculator pre-fills Screen 2 inputs and jumps directly to Screen 3.

---

## File Location

```
wxcc-build/
└── wxccroi-public/
    └── index.html        ← single self-contained file
```

---

## Out of Scope

- Per-agent platform pricing (flat base cost used for simplicity)
- AI unit costs (Agent + Assistant) — excluded for simplicity
- Third-party service costs — excluded
- SMS service / phone line monthly costs — excluded
- Custom workflow names or volumes — users select pre-defined scenarios only
- Authentication or saved sessions
- PDF export (future enhancement)
