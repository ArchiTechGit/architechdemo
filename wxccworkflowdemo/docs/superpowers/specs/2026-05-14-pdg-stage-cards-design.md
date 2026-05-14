# Pain → Difference → Gain: Stage Card Redesign

**Date:** 2026-05-14  
**Status:** Approved for implementation

---

## Context

The wxccworkflowdemo presents a 6-stage patient journey (Pre-Admission through Post-Discharge) to healthcare buyers evaluating Webex Contact Center. Each stage card already contains all three elements of the Pain → Difference → Gain (PDG) messaging framework — but they're assembled in the wrong order.

**Current order (card body):**
1. `automationOpportunity` — what WxCC does (Difference) — unlabelled, shown first
2. `keyStat` block — quantified outcome (Gain) — labelled "Why this matters"
3. `currentState` — the manual process today (Pain) — labelled "How It's Done Today", shown last

**Problem:** Buyers see the solution before they've felt the problem. The emotional arc is broken. PDG requires Pain first to make the Difference and Gain land with impact.

---

## What Changes

### 1. Reorder card body sections

New order for all 6 stage cards:

| Position | Content | New label | Accent colour |
|----------|---------|-----------|---------------|
| 1 (top) | `stage.currentState` | **Today** | Red (`rgba(239,68,68,0.6)`) |
| 2 (middle) | `stage.automationOpportunity` | **How** | Cyan (`rgba(6,182,212,0.6)`) |
| 3 (bottom) | `stage.keyStat` block | **Outcome** | Green (`rgba(34,197,94,0.6)`) |

### 2. Add section labels

Each section gets a small uppercase label above it — same weight and style as the existing "How It's Done Today" label, but colour-coded:

```
TODAY       — red tint
HOW         — cyan tint  
OUTCOME     — green tint
```

### 3. Stat block colour update

The keyStat block currently uses the stage's `stageColor.accent` (cyan) for its left border and stat number. Under the new scheme, this block always renders in **green** (`#22c55e`) to visually reinforce that it represents a gain/outcome — decoupled from the per-stage accent colour.

### 4. Remove "Why this matters" chip

The `WHY THIS MATTERS` badge inside the keyStat block is redundant once the block is labelled "Outcome". Remove the chip; the `whyItMatters` text remains below the stat value.

---

## Files to Modify

- **`client/src/pages/Home.tsx`** — lines ~1338–1358 (card body render section)
  - Reorder the three JSX blocks
  - Replace "How It's Done Today" label with colour-coded "Today" label
  - Add "How" label above `automationOpportunity`
  - Add "Outcome" label above keyStat block
  - Change keyStat border and stat value colour from `stageColor.accent` to green (`#22c55e`)
  - Remove the "Why this matters" chip span

No data changes required — `JOURNEY_STAGES` array is untouched.

---

## Verification

1. Run `npm run dev` in `wxccworkflowdemo/`
2. Open the demo — check Stage 1 card reads Today → How → Outcome top to bottom
3. Verify section labels appear in red / cyan / green tints
4. Verify keyStat block renders green (not cyan) across all 6 stages
5. Trigger a workflow (Send →) — confirm post-trigger flow steps and EMR events still render correctly below the Outcome block
6. Check all 6 stages follow the same structure
