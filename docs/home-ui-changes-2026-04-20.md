# Home.tsx UI Changes — 2026-04-20

## Changes Made

### 1. Journey Stage Text — 50% Larger
**File:** `wxccworkflowdemo/client/src/pages/Home.tsx`

- `automationOpportunity` body text: `text-xs` (12px) → `text-[18px]`
- `currentState` body text: `text-xs` (12px) → `text-[18px]`
- "Current State" label: `text-[10px]` → `text-[15px]`

---

### 2. "Click Here to Learn About the Journey" Button
**File:** `wxccworkflowdemo/client/src/pages/Home.tsx` — ~line 693

- Text changed from `"Learn about the journey"` → `"Click here to learn about the journey"`
- Font size increased from `text-[11px]` → `text-[16.5px]` (50% increase)

---

### 3. Footer — What's Next?
**File:** `wxccworkflowdemo/client/src/pages/Home.tsx` — added before the Voice AI Demo Modal

Two prominent cards linking to the next steps in the demo sequence:

| Card | Label | URL |
|------|-------|-----|
| Step 2 | ROI Calculator | `/wxccroi-public/` |
| Step 3 | Discovery Assessment | `/discovery/` |

Styled with cyan (Step 2) and teal (Step 3) accents, hover effects, and a "What's next?" heading.

---

### 4. Screensaver — Stats Stay Twice as Long
**File:** `wxccworkflowdemo/client/src/pages/Home.tsx` — ~line 286

- Stat cycling interval: `5000`ms → `10000`ms (10 seconds per stat banner)

---

### 5. Screensaver — Journey Visualization
**File:** `wxccworkflowdemo/client/src/pages/Home.tsx` — screensaver inline section

Added between the ArchiTech logo and the cycling stat:

1. **Persistent identity heading:**
   - "Digital Front Door" (large, white, uppercase)
   - "Patient Experience Demonstration" (cyan, uppercase, slightly smaller)

2. **6-stage journey visual:**
   - All 6 journey stage icons (ClipboardList, CalendarDays, MapPin, Users, FileText, Activity) displayed in a connected row
   - Each icon has a circle container with cyan border and glow
   - Stage label displayed below each icon
   - Connector lines between stages

Intent: someone walking past sees the demo identity and all 6 stages immediately — no waiting for the stat cycle.

---

## Build
After all changes, ran `npm run build` in `wxccworkflowdemo/` — built successfully.

Output: `wxccworkflowdemo/dist/assets/index-CVn0TX31.js`
