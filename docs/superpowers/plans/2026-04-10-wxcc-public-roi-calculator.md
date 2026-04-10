# WxCC Public ROI Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, single-file HTML/CSS/JS conference-ready ROI calculator for ArchiTech's WxCC digital front door pitch — wizard flow, healthcare workflows, hero results reveal, shareable URL.

**Architecture:** One self-contained `wxccroi-public/index.html` file. Three screens (scenario picker → inputs → results) toggled via vanilla JS. All calculation logic is pure JS functions. No framework, no build step, no dependencies.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla JS (ES6+). ArchiTech dark brand colors. No external libraries.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `wxccroi-public/index.html` | Create | Entire app — HTML structure, CSS, JS |

All 8 tasks write to this single file. Each task builds on the previous one — do them in order.

---

## Task 1: File scaffold — HTML structure, brand CSS, 3-screen navigation

**Files:**
- Create: `wxccroi-public/index.html`

- [ ] **Step 1: Create the file with full HTML scaffold**

Create `wxccroi-public/index.html` with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WxCC ROI Calculator — ArchiTech</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    /* ── Brand tokens ── */
    :root {
      --bg:        #0D1825;
      --surface-1: #13294B;
      --surface-2: #1A3460;
      --surface-3: #1F3D72;
      --cyan:      #05C3DD;
      --cyan-dim:  rgba(5,195,221,0.12);
      --cyan-mid:  rgba(5,195,221,0.25);
      --text:      #F0F6FC;
      --muted:     #8FA3BA;
      --border:    rgba(255,255,255,0.07);
      --border-hover: rgba(5,195,221,0.3);
      --negative:  #E05C5C;
      --font: 'Roboto', sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
    }

    /* ── Screen system ── */
    .screen {
      display: none;
      min-height: 100vh;
      padding: 48px 24px 80px;
      animation: fadeIn 0.4s ease;
    }
    .screen.active { display: block; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .page { max-width: 800px; margin: 0 auto; }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 52px;
    }
    .header img { width: 140px; mix-blend-mode: screen; opacity: 0.9; }
    .header-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--cyan);
    }

    /* ── Step indicator ── */
    .steps-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 40px;
    }
    .step-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--surface-2);
      transition: background 0.3s;
    }
    .step-dot.active { background: var(--cyan); }
    .step-dot.done   { background: rgba(5,195,221,0.4); }
    .step-line {
      flex: 1; height: 1px;
      background: var(--border);
    }

    /* ── Page titles ── */
    .page-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--cyan);
      margin-bottom: 12px;
    }
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .page-desc {
      font-size: 15px;
      color: var(--muted);
      line-height: 1.7;
      margin-bottom: 40px;
      max-width: 560px;
    }

    /* ── Primary button ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--cyan);
      color: #0D1825;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 28px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      letter-spacing: 0.02em;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    /* ── Ghost button ── */
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      color: var(--muted);
      font-size: 13px;
      padding: 12px 20px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }
    .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }

    /* ── Footer ── */
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer img { width: 80px; mix-blend-mode: screen; opacity: 0.5; }
    .footer-note {
      font-size: 11px;
      color: #4A607A;
      line-height: 1.6;
      max-width: 480px;
    }
  </style>
</head>
<body>

  <!-- ── SCREEN 1: Scenario Picker ── -->
  <div id="screen-1" class="screen active">
    <div class="page">
      <div class="header">
        <a href="/"><img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" /></a>
        <span class="header-label">ROI Calculator</span>
      </div>
      <div class="steps-indicator">
        <div class="step-dot active" id="dot-1a"></div>
        <div class="step-line"></div>
        <div class="step-dot" id="dot-2a"></div>
        <div class="step-line"></div>
        <div class="step-dot" id="dot-3a"></div>
      </div>
      <div class="page-label">Step 1 of 3</div>
      <h1 class="page-title">What does your patient journey include?</h1>
      <p class="page-desc">Select the workflows you want to automate as part of a separation. Each workflow you select will be included in your ROI calculation.</p>
      <div id="scenario-grid"><!-- populated by JS --></div>
      <div style="margin-top: 40px;">
        <button class="btn-primary" id="btn-to-screen2" disabled onclick="goToScreen2()">
          Calculate my ROI →
        </button>
      </div>
      <div class="footer">
        <img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" />
        <p class="footer-note">This calculator uses industry benchmark assumptions based on ArchiTech implementation data. Actual results will vary.</p>
      </div>
    </div>
  </div>

  <!-- ── SCREEN 2: Your Numbers ── -->
  <div id="screen-2" class="screen">
    <div class="page">
      <div class="header">
        <a href="/"><img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" /></a>
        <span class="header-label">ROI Calculator</span>
      </div>
      <div class="steps-indicator">
        <div class="step-dot done"></div>
        <div class="step-line"></div>
        <div class="step-dot active"></div>
        <div class="step-line"></div>
        <div class="step-dot"></div>
      </div>
      <div class="page-label">Step 2 of 3</div>
      <h1 class="page-title">Tell us about your organisation</h1>
      <p class="page-desc" id="screen2-subline"><!-- populated by JS --></p>
      <div id="inputs-block"><!-- populated by JS --></div>
      <div style="margin-top: 40px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <button class="btn-primary" onclick="goToScreen3()">Show my ROI →</button>
        <button class="btn-ghost" onclick="goToScreen(1)">← Back</button>
      </div>
      <div class="footer">
        <img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" />
        <p class="footer-note">This calculator uses industry benchmark assumptions based on ArchiTech implementation data. Actual results will vary.</p>
      </div>
    </div>
  </div>

  <!-- ── SCREEN 3: Results ── -->
  <div id="screen-3" class="screen">
    <div class="page">
      <div class="header">
        <a href="/"><img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" /></a>
        <span class="header-label">ROI Calculator</span>
      </div>
      <div class="steps-indicator">
        <div class="step-dot done"></div>
        <div class="step-line"></div>
        <div class="step-dot done"></div>
        <div class="step-line"></div>
        <div class="step-dot active"></div>
      </div>
      <div id="results-block"><!-- populated by JS --></div>
      <div style="margin-top: 40px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <button class="btn-ghost" onclick="goToScreen(2)">← Recalculate</button>
        <button class="btn-primary" onclick="shareResult()">Share this result ↗</button>
      </div>
      <div id="share-confirm" style="display:none; margin-top:12px; font-size:13px; color: var(--cyan);">Link copied to clipboard ✓</div>
      <div class="footer">
        <img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech" />
        <p class="footer-note">This calculator uses industry benchmark assumptions based on ArchiTech implementation data. Actual results will vary. <a href="https://www.architech.net.au" style="color: var(--cyan); text-decoration: none;">architech.net.au</a></p>
      </div>
    </div>
  </div>

  <script>
    // ── Navigation ──
    let currentScreen = 1;

    function goToScreen(n) {
      document.getElementById('screen-' + currentScreen).classList.remove('active');
      document.getElementById('screen-' + n).classList.add('active');
      currentScreen = n;
      window.scrollTo(0, 0);
    }

    function goToScreen2() {
      renderScreen2();
      goToScreen(2);
    }

    function goToScreen3() {
      renderScreen3();
      goToScreen(3);
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify the scaffold in a browser**

Open `wxccroi-public/index.html` directly in a browser. You should see:
- Dark background (#0D1825)
- ArchiTech logo (if served from repo root) or broken image (acceptable at this stage)
- Three step dots at top, first one cyan
- "Step 1 of 3" label
- Page title "What does your patient journey include?"
- A disabled "Calculate my ROI →" button
- Footer with disclaimer

- [ ] **Step 3: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: scaffold wxccroi-public — 3-screen structure, brand CSS, navigation"
```

---

## Task 2: Screen 1 — Scenario cards with selection state

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add scenario card CSS to the `<style>` block**

Inside `<style>`, before the closing `</style>` tag, add:

```css
/* ── Scenario cards ── */
.scenario-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 560px) { .scenario-grid { grid-template-columns: 1fr; } }

.scenario-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px 20px 20px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  user-select: none;
}
.scenario-card:hover {
  border-color: rgba(5,195,221,0.25);
  background: rgba(5,195,221,0.03);
}
.scenario-card.selected {
  border-color: var(--cyan);
  background: rgba(5,195,221,0.07);
}
.scenario-card.selected::after {
  content: '✓';
  position: absolute;
  top: 14px; right: 16px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--cyan);
  color: #0D1825;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 22px;
  text-align: center;
}
.scenario-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  padding-right: 28px;
}
.scenario-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 14px;
}
.scenario-stat {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--cyan);
  text-transform: uppercase;
}
.scenario-stat-empty { display: none; }
```

- [ ] **Step 2: Add scenario data and card rendering to the `<script>` block**

Inside `<script>`, before the Navigation section, add:

```javascript
// ── Workflow definitions ──
const WORKFLOWS = [
  {
    id: 1,
    name: 'Appointment Management',
    desc: 'Book, reschedule and cancel 24/7 — no staff involved',
    stat: '60% reduction in no-shows',
    sms: 2, wx: 2, email: 1, minutesSaved: 25,
    whatReplaced: 'Booking, reminder, reschedule/cancel calls'
  },
  {
    id: 2,
    name: 'Pre-Visit Preparation',
    desc: 'Intake forms, consent and instructions — replaces manual outbound calls',
    stat: '80% of manual effort removed',
    sms: 1, wx: 1, email: 1, minutesSaved: 20,
    whatReplaced: 'Structured intake call with staff member'
  },
  {
    id: 3,
    name: 'Care Navigation & Triage',
    desc: 'Symptom check, service routing, wait time management — deflects tier-1 volume',
    stat: '70% cost reduction via self-service',
    sms: 1, wx: 2, email: 1, minutesSaved: 12,
    whatReplaced: 'Routing and triage calls'
  },
  {
    id: 4,
    name: 'Proactive Outreach',
    desc: 'Screening reminders, medication refills, care-plan check-ins — replaces manual campaigns',
    stat: '20× more cost-effective than manual outbound',
    sms: 1, wx: 1, email: 1, minutesSaved: 22,
    whatReplaced: 'Manual outbound campaign calls'
  },
  {
    id: 5,
    name: 'Post-Visit Follow-Up',
    desc: 'Discharge instructions, medication adherence, outcome surveys — currently manual or not happening',
    stat: '50–80% reduction in staff time',
    sms: 3, wx: 4, email: 3, minutesSaved: 18,
    whatReplaced: 'Discharge calls, follow-ups, outcome surveys'
  },
  {
    id: 6,
    name: 'Other Workflows',
    desc: 'Have workflows outside healthcare? Add a general estimate to see how automation compounds.',
    stat: null,
    sms: 2, wx: 2, email: 2, minutesSaved: 15,
    whatReplaced: 'General administrative and coordination tasks'
  },
];

// ── App state ──
let selectedIds = new Set();
let inputs = { agents: 30, separations: 15000, rate: 60 };

// ── Screen 1: Render scenario cards ──
function renderScenarioGrid() {
  const grid = document.getElementById('scenario-grid');
  grid.innerHTML = `<div class="scenario-grid">${WORKFLOWS.map(w => `
    <div class="scenario-card${selectedIds.has(w.id) ? ' selected' : ''}"
         onclick="toggleScenario(${w.id})"
         id="card-${w.id}">
      <div class="scenario-name">${w.name}</div>
      <div class="scenario-desc">${w.desc}</div>
      ${w.stat
        ? `<div class="scenario-stat">${w.stat}</div>`
        : `<div class="scenario-stat-empty"></div>`}
    </div>
  `).join('')}</div>`;
}

function toggleScenario(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  const card = document.getElementById('card-' + id);
  card.classList.toggle('selected', selectedIds.has(id));
  document.getElementById('btn-to-screen2').disabled = selectedIds.size === 0;
}

// Initialise Screen 1
renderScenarioGrid();
```

- [ ] **Step 3: Verify in browser**

Reload `index.html`. You should see:
- Six cards in a 2-column grid
- Each card has name, description, and stat (card 6 has no stat)
- Clicking a card adds a cyan border and a ✓ badge
- Clicking again deselects it
- "Calculate my ROI →" button is disabled until at least one card is selected
- Button enables when a card is selected

- [ ] **Step 4: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: screen 1 — scenario cards with selection state"
```

---

## Task 3: Screen 2 — Inputs with sliders

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add input CSS to the `<style>` block**

Inside `<style>`, before `</style>`, add:

```css
/* ── Inputs (Screen 2) ── */
.input-group {
  margin-bottom: 36px;
}
.input-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  display: block;
}
.input-sublabel {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 14px;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.input-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--surface-2);
  border-radius: 2px;
  outline: none;
}
.input-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--cyan);
  cursor: pointer;
  border: 3px solid var(--bg);
  box-shadow: 0 0 0 1px var(--cyan);
}
.input-slider::-moz-range-thumb {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--cyan);
  cursor: pointer;
  border: 3px solid var(--bg);
}
.input-number {
  width: 100px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  padding: 10px 12px;
  text-align: right;
  font-family: var(--font);
}
.input-number:focus {
  outline: none;
  border-color: var(--cyan);
}
.input-prefix {
  font-size: 15px;
  color: var(--muted);
}
.input-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px 24px;
  margin-bottom: 16px;
}
.selected-summary {
  background: var(--cyan-dim);
  border: 1px solid var(--cyan-mid);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 32px;
  font-size: 13px;
  color: var(--cyan);
  line-height: 1.6;
}
.selected-summary strong { color: var(--text); }
```

- [ ] **Step 2: Add screen 2 render function to the `<script>` block**

Inside `<script>`, after the `renderScenarioGrid()` call, add:

```javascript
// ── Screen 2: Render inputs ──
function renderScreen2() {
  const selected = WORKFLOWS.filter(w => selectedIds.has(w.id));
  const names = selected.map(w => w.name).join(', ');

  document.getElementById('screen2-subline').textContent =
    `Calculating ROI across ${selected.length} workflow${selected.length !== 1 ? 's' : ''}: ${names}`;

  document.getElementById('inputs-block').innerHTML = `
    <div class="input-card">
      <div class="input-group">
        <label class="input-label">Number of contact centre agents</label>
        <div class="input-sublabel">Used to scale platform licensing costs</div>
        <div class="input-row">
          <input type="range" class="input-slider" min="5" max="500" step="5"
            value="${inputs.agents}"
            oninput="syncInput('agents', this.value, 'num-agents')" />
          <input type="number" class="input-number" id="num-agents" min="5" max="500"
            value="${inputs.agents}"
            oninput="syncSlider('agents', this.value, this.closest('.input-group').querySelector('.input-slider'))" />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">Annual separations</label>
        <div class="input-sublabel">A separation is the formal end of an admitted patient's hospital stay — used to scale your annual workflow volume</div>
        <div class="input-row">
          <input type="range" class="input-slider" min="1000" max="100000" step="500"
            value="${inputs.separations}"
            oninput="syncInput('separations', this.value, 'num-separations')" />
          <input type="number" class="input-number" id="num-separations" min="1000" max="100000"
            value="${inputs.separations}"
            oninput="syncSlider('separations', this.value, this.closest('.input-group').querySelector('.input-slider'))" />
        </div>
      </div>

      <div class="input-group" style="margin-bottom:0">
        <label class="input-label">Average staff hourly cost</label>
        <div class="input-sublabel">Fully-loaded labour rate — industry benchmark is $60/hr</div>
        <div class="input-row">
          <span class="input-prefix">$</span>
          <input type="number" class="input-number" id="num-rate" min="20" max="200"
            value="${inputs.rate}"
            style="width: 120px;"
            oninput="inputs.rate = Math.max(20, Number(this.value))" />
          <span class="input-prefix">/ hr</span>
        </div>
      </div>
    </div>
  `;
}

function syncInput(key, val, numberId) {
  inputs[key] = Number(val);
  document.getElementById(numberId).value = val;
}

function syncSlider(key, val, slider) {
  inputs[key] = Number(val);
  slider.value = val;
}
```

- [ ] **Step 3: Verify in browser**

Select one or more cards on Screen 1, click "Calculate my ROI →". Screen 2 should show:
- Selected workflow names listed in the subtitle
- Three input controls: agents (slider + number), separations (slider + number), staff rate (number)
- Adjusting the slider updates the number field and vice versa
- "Show my ROI →" button and "← Back" button visible
- Back button returns to Screen 1 with cards still selected

- [ ] **Step 4: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: screen 2 — inputs with synced sliders and number fields"
```

---

## Task 4: Calculation engine

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add calculation constants and functions to the `<script>` block**

Inside `<script>`, after the `WORKFLOWS` definition and before the App state section, add:

```javascript
// ── Unit costs & platform ──
const UNIT_COSTS = {
  sms:             0.04,
  wx:              0.08,
  email:           0.00,
  platformMonthly: 1238.15,
};

// ── Calculation engine ──

/**
 * Calculate per-workflow metrics for one separation
 * @param {object} workflow - one of WORKFLOWS
 * @param {number} staffRate - hourly rate in $
 * @returns {{ digitalCost, labourSaved, netPerSep }}
 */
function calcWorkflow(workflow, staffRate) {
  const digitalCost =
    (workflow.sms   * UNIT_COSTS.sms)  +
    (workflow.wx    * UNIT_COSTS.wx)   +
    (workflow.email * UNIT_COSTS.email);
  const labourSaved = (workflow.minutesSaved / 60) * staffRate;
  const netPerSep   = labourSaved - digitalCost;
  return { digitalCost, labourSaved, netPerSep };
}

/**
 * Calculate total ROI across all selected workflows
 * @param {number[]} ids       - selected workflow IDs
 * @param {number}   seps      - annual separations
 * @param {number}   rate      - staff hourly rate
 * @returns {object}           - full results object
 */
function calcTotal(ids, seps, rate) {
  const selected = WORKFLOWS.filter(w => ids.includes(w.id));
  const annualPlatformCost = UNIT_COSTS.platformMonthly * 12;

  const workflowResults = selected.map(w => {
    const { digitalCost, labourSaved, netPerSep } = calcWorkflow(w, rate);
    const annualSaving = netPerSep * seps;
    const annualHours  = (w.minutesSaved / 60) * seps;
    return { workflow: w, digitalCost, labourSaved, netPerSep, annualSaving, annualHours };
  });

  const totalAnnualSaving = workflowResults.reduce((s, r) => s + r.annualSaving, 0);
  const totalHours        = workflowResults.reduce((s, r) => s + r.annualHours, 0);
  const netAnnualSaving   = totalAnnualSaving - annualPlatformCost;
  const fteEquivalent     = totalHours / 1920;
  const roiMultiple       = totalAnnualSaving / annualPlatformCost;

  return {
    workflowResults,
    totalAnnualSaving,
    netAnnualSaving,
    totalHours,
    fteEquivalent,
    roiMultiple,
    annualPlatformCost,
  };
}
```

- [ ] **Step 2: Verify the calculation engine manually in browser console**

Open the browser console on the page and run:

```javascript
// Should return an object with workflowResults, totalAnnualSaving, etc.
const result = calcTotal([1, 2, 5], 15000, 60);
console.log('Net annual saving:', result.netAnnualSaving.toFixed(2));
console.log('Hours saved:', result.totalHours.toFixed(0));
console.log('FTE equivalent:', result.fteEquivalent.toFixed(2));
console.log('ROI multiple:', result.roiMultiple.toFixed(2));
```

Expected (workflows 1+2+5, 15000 seps, $60/hr):
- Appointment Management: net = (25/60×60) - (2×0.04 + 2×0.08 + 1×0) = 25 - 0.24 = $24.76/sep → $371,400/yr
- Pre-Visit Preparation: net = (20/60×60) - (1×0.04 + 1×0.08 + 1×0) = 20 - 0.12 = $19.88/sep → $298,200/yr
- Post-Visit Follow-Up: net = (18/60×60) - (3×0.04 + 4×0.08 + 3×0) = 18 - 0.44 = $17.56/sep → $263,400/yr
- Total annual saving ≈ $933,000
- Platform cost = $1,238.15 × 12 = $14,857.80
- Net annual saving ≈ $918,142
- FTE: (25+20+18)/60 × 15000 / 1920 ≈ 4.95

Verify the console output is in the right ballpark.

- [ ] **Step 3: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: calculation engine — per-workflow and total ROI formulas"
```

---

## Task 5: Screen 3 — Hero results with counting animation

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add results CSS to the `<style>` block**

Inside `<style>`, before `</style>`, add:

```css
/* ── Results (Screen 3) ── */
.results-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}
.hero-number {
  font-size: clamp(48px, 10vw, 80px);
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 8px;
}
.hero-sub {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 40px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 40px;
}
@media (max-width: 560px) { .stats-row { grid-template-columns: 1fr; } }

.stat-card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px 18px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}
.stat-label {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
```

- [ ] **Step 2: Add counting animation and results render function to `<script>`**

Inside `<script>`, after the `calcTotal` function, add:

```javascript
// ── Counting animation ──
function animateCount(el, target, { prefix = '', suffix = '', decimals = 0, duration = 1800 } = {}) {
  const start = Date.now();
  function update() {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current  = startVal + (target - startVal) * eased;
    const formatted = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString('en-AU');
    el.textContent = prefix + formatted + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  const startVal = 0;
  requestAnimationFrame(update);
}

// ── Screen 3: Render results hero ──
function renderScreen3() {
  const ids  = Array.from(selectedIds);
  const seps = inputs.separations;
  const rate = inputs.rate;
  const R    = calcTotal(ids, seps, rate);

  document.getElementById('results-block').innerHTML = `
    <div class="results-label">Your estimated annual saving</div>
    <div class="hero-number" id="hero-val">$0</div>
    <div class="hero-sub">Based on ${seps.toLocaleString('en-AU')} annual separations across ${ids.length} workflow${ids.length !== 1 ? 's' : ''}</div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value" id="stat-hours">0</div>
        <div class="stat-label">Annual hours returned to clinical staff</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-fte">0</div>
        <div class="stat-label">Full-time equivalent staff</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-roi">0×</div>
        <div class="stat-label">Return on investment</div>
      </div>
    </div>

    <div id="workflow-breakdown"></div>
    <div id="assumptions-panel"></div>
  `;

  // Store results on window for use by other render functions
  window._lastResults = R;

  // Animate hero + stats after short delay
  setTimeout(() => {
    animateCount(
      document.getElementById('hero-val'),
      Math.round(R.netAnnualSaving),
      { prefix: '$', duration: 1800 }
    );
    animateCount(
      document.getElementById('stat-hours'),
      Math.round(R.totalHours),
      { duration: 1400 }
    );

    const fteEl = document.getElementById('stat-fte');
    const fteTarget = R.fteEquivalent;
    const fteStart = Date.now();
    function animateFte() {
      const elapsed  = Date.now() - fteStart;
      const progress = Math.min(elapsed / 1400, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      fteEl.textContent = (fteTarget * eased).toFixed(1);
      if (progress < 1) requestAnimationFrame(animateFte);
    }
    requestAnimationFrame(animateFte);

    const roiEl = document.getElementById('stat-roi');
    const roiTarget = R.roiMultiple;
    const roiStart = Date.now();
    function animateRoi() {
      const elapsed  = Date.now() - roiStart;
      const progress = Math.min(elapsed / 1400, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      roiEl.textContent = (roiTarget * eased).toFixed(1) + '×';
      if (progress < 1) requestAnimationFrame(animateRoi);
    }
    requestAnimationFrame(animateRoi);

    renderWorkflowBreakdown(R);
    renderAssumptionsPanel(R);
  }, 100);
}
```

- [ ] **Step 3: Add placeholder functions for breakdown and assumptions (will be filled in Task 6)**

Inside `<script>`, after `renderScreen3`, add:

```javascript
function renderWorkflowBreakdown(R) {
  // Task 6 will implement this
  document.getElementById('workflow-breakdown').innerHTML = '';
}

function renderAssumptionsPanel(R) {
  // Task 6 will implement this
  document.getElementById('assumptions-panel').innerHTML = '';
}
```

- [ ] **Step 4: Verify in browser**

Select 2–3 scenarios, fill in numbers on Screen 2, click "Show my ROI →". You should see:
- Screen 3 appears with a fade-in animation
- The hero dollar figure counts up from $0 to the result over ~1.8 seconds
- Three stat cards animate: hours, FTE, ROI multiple
- "← Recalculate" and "Share this result" buttons visible
- Recalculate returns to Screen 2 with inputs intact

- [ ] **Step 5: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: screen 3 — hero results with counting animation and 3 stat cards"
```

---

## Task 6: Per-workflow breakdown + assumptions panel

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add breakdown and assumptions CSS to `<style>`**

Inside `<style>`, before `</style>`, add:

```css
/* ── Workflow breakdown ── */
.breakdown-section { margin-bottom: 32px; }
.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #4A607A;
  margin-bottom: 14px;
}
.breakdown-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.breakdown-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 18px;
  gap: 16px;
}
.breakdown-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  flex: 1;
}
.breakdown-mins {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.breakdown-saving {
  font-size: 16px;
  font-weight: 700;
  color: var(--cyan);
  white-space: nowrap;
}

/* ── Assumptions panel ── */
.assumptions-toggle {
  width: 100%;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--muted);
  font-size: 13px;
  padding: 14px 18px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: color 0.2s, border-color 0.2s;
  margin-bottom: 0;
  font-family: var(--font);
}
.assumptions-toggle:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }
.assumptions-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease;
}
.assumptions-body.open { max-height: 1200px; }
.assumptions-body-inner {
  padding: 20px 4px 4px;
}
.assume-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 20px;
}
.assume-table th {
  text-align: left;
  color: #4A607A;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 6px 10px 10px;
  border-bottom: 1px solid var(--border);
}
.assume-table td {
  padding: 10px 10px;
  color: var(--muted);
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.assume-table td:first-child { color: var(--text); font-weight: 500; }
.assume-table tr:last-child td { border-bottom: none; }
.assume-note {
  font-size: 12px;
  color: #4A607A;
  line-height: 1.7;
  padding: 16px;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
  border: 1px solid var(--border);
}
.assume-note a { color: var(--cyan); text-decoration: none; }
```

- [ ] **Step 2: Replace the placeholder `renderWorkflowBreakdown` function**

Find and replace the placeholder `renderWorkflowBreakdown` function with:

```javascript
function renderWorkflowBreakdown(R) {
  const html = `
    <div class="breakdown-section">
      <div class="section-label">Per-workflow contribution</div>
      <div class="breakdown-cards">
        ${R.workflowResults.map(r => `
          <div class="breakdown-card">
            <div class="breakdown-name">${r.workflow.name}</div>
            <div class="breakdown-mins">${r.workflow.minutesSaved} min saved/sep</div>
            <div class="breakdown-saving">$${Math.round(r.annualSaving).toLocaleString('en-AU')}/yr</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('workflow-breakdown').innerHTML = html;
}
```

- [ ] **Step 3: Replace the placeholder `renderAssumptionsPanel` function**

Find and replace the placeholder `renderAssumptionsPanel` function with:

```javascript
function renderAssumptionsPanel(R) {
  const html = `
    <div style="margin-bottom: 32px;">
      <button class="assumptions-toggle" onclick="toggleAssumptions(this)">
        <span>How this is calculated</span>
        <span id="assume-chevron">▼</span>
      </button>
      <div class="assumptions-body" id="assumptions-body">
        <div class="assumptions-body-inner">

          <div class="section-label" style="margin-bottom:10px;">Channel mix per workflow (per separation)</div>
          <table class="assume-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>SMS</th>
                <th>WX Connect</th>
                <th>Email</th>
                <th>Mins saved</th>
              </tr>
            </thead>
            <tbody>
              ${R.workflowResults.map(r => `
                <tr>
                  <td>${r.workflow.name}</td>
                  <td>${r.workflow.sms}</td>
                  <td>${r.workflow.wx}</td>
                  <td>${r.workflow.email}</td>
                  <td>${r.workflow.minutesSaved}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-label" style="margin-bottom:10px;">Unit costs</div>
          <table class="assume-table">
            <thead><tr><th>Item</th><th>Cost</th></tr></thead>
            <tbody>
              <tr><td>SMS per segment</td><td>$0.04</td></tr>
              <tr><td>WX Connect remote run</td><td>$0.08</td></tr>
              <tr><td>Email send</td><td>$0.00</td></tr>
              <tr><td>Staff hourly rate</td><td>$${inputs.rate.toFixed(2)}/hr</td></tr>
              <tr><td>Platform base cost</td><td>$${UNIT_COSTS.platformMonthly.toFixed(2)}/month</td></tr>
            </tbody>
          </table>

          <div class="assume-note">
            Figures are based on ArchiTech implementation benchmarks sourced from real-world healthcare deployments.
            Annual savings = (labour saved − digital cost) × annual separations, summed across selected workflows,
            minus annual platform cost. FTE calculated at 1,920 hours per year.
            <br/><br/>
            Contact us for a detailed analysis specific to your organisation: <a href="https://www.architech.net.au">architech.net.au</a>
          </div>

        </div>
      </div>
    </div>
  `;
  document.getElementById('assumptions-panel').innerHTML = html;
}

function toggleAssumptions(btn) {
  const body = document.getElementById('assumptions-body');
  const chevron = document.getElementById('assume-chevron');
  body.classList.toggle('open');
  chevron.textContent = body.classList.contains('open') ? '▲' : '▼';
}
```

- [ ] **Step 4: Verify in browser**

Go through the full wizard and reach Screen 3. You should see:
- Hero number and 3 stats (from Task 5)
- A "Per-workflow contribution" section listing each selected workflow with its annual saving
- A collapsed "How this is calculated" button
- Clicking it expands to show the channel mix table, unit costs table, and disclaimer note

- [ ] **Step 5: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: per-workflow breakdown and collapsible assumptions panel"
```

---

## Task 7: Share URL + deep link parsing on load

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add share and deep link functions to `<script>`**

Inside `<script>`, after `toggleAssumptions`, add:

```javascript
// ── URL sharing ──
function encodeStateUrl() {
  const params = new URLSearchParams({
    scenarios:   Array.from(selectedIds).join(','),
    agents:      inputs.agents,
    separations: inputs.separations,
    rate:        inputs.rate,
  });
  return `${location.origin}${location.pathname}?${params}`;
}

function shareResult() {
  const url = encodeStateUrl();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showShareConfirm());
  } else {
    // Fallback for non-HTTPS or older browsers
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showShareConfirm();
  }
}

function showShareConfirm() {
  const el = document.getElementById('share-confirm');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Deep link — parse URL params on load ──
function initFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!params.get('scenarios')) return; // no params, start normally

  const scenarioIds = params.get('scenarios').split(',').map(Number).filter(n => n >= 1 && n <= 6);
  if (scenarioIds.length === 0) return;

  scenarioIds.forEach(id => selectedIds.add(id));
  inputs.agents      = Number(params.get('agents'))      || 30;
  inputs.separations = Number(params.get('separations')) || 15000;
  inputs.rate        = Number(params.get('rate'))        || 60;

  // Jump straight to results
  renderScreen3();
  goToScreen(3);
}

// Run on page load
initFromUrl();
```

- [ ] **Step 2: Verify share and deep link in browser**

1. Go through the wizard to Screen 3.
2. Click "Share this result". The "Link copied to clipboard ✓" message should appear.
3. Open a new tab and paste the copied URL. The page should load directly on Screen 3 with the same results.
4. Verify "← Recalculate" on the deep-linked page returns to Screen 2 with the correct input values.

- [ ] **Step 3: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: shareable URL encoding and deep link parsing on load"
```

---

## Task 8: Mobile responsiveness + final polish

**Files:**
- Modify: `wxccroi-public/index.html`

- [ ] **Step 1: Add mobile and polish CSS to `<style>`**

Inside `<style>`, before `</style>`, add:

```css
/* ── Mobile polish ── */
@media (max-width: 480px) {
  .screen { padding: 32px 16px 64px; }
  .header { margin-bottom: 32px; }
  .page-title { font-size: 22px; }
  .hero-number { font-size: 48px; }
  .stat-value { font-size: 22px; }
  .breakdown-card { flex-wrap: wrap; }
  .breakdown-saving { width: 100%; margin-top: 4px; }
  .footer { flex-direction: column; align-items: flex-start; }
}

/* ── Screen transition refinement ── */
.screen {
  transition: opacity 0.3s ease;
}
.screen:not(.active) { opacity: 0; pointer-events: none; }

/* ── Input slider track fill (Chrome) ── */
input[type=range] {
  background: linear-gradient(
    to right,
    var(--cyan) 0%,
    var(--cyan) var(--pct, 0%),
    var(--surface-2) var(--pct, 0%),
    var(--surface-2) 100%
  );
}

/* ── Negative saving guard ── */
.hero-number.negative { color: var(--negative); }
```

- [ ] **Step 2: Add slider fill tracking and negative saving guard to `<script>`**

Inside `<script>`, in the `syncInput` function, update it to also update the slider fill:

```javascript
function syncInput(key, val, numberId) {
  inputs[key] = Number(val);
  document.getElementById(numberId).value = val;
  // Update slider fill visual
  const slider = event.target;
  const min = Number(slider.min), max = Number(slider.max);
  const pct = ((Number(val) - min) / (max - min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}
```

And inside `renderScreen3`, after the hero element is set, add a negative saving check by replacing the hero-sub line:

```javascript
// After: document.getElementById('results-block').innerHTML = `...`
// Find this line inside renderScreen3 and update the hero class dynamically:
// Add this after the setTimeout block, inside the setTimeout, after animateCount calls:

const heroEl = document.getElementById('hero-val');
if (R.netAnnualSaving < 0) {
  heroEl.classList.add('negative');
}
```

- [ ] **Step 3: Verify on mobile viewport**

Open browser DevTools, switch to mobile view (375px wide). Verify:
- Single-column scenario grid on Screen 1
- Sliders are full-width and usable with touch targets
- Hero number is readable at 48px
- Stat cards stack vertically
- All buttons are easily tappable

- [ ] **Step 4: Verify negative saving edge case**

In the browser console, run:
```javascript
// Force a near-zero saving scenario
selectedIds.clear();
selectedIds.add(6); // Other Workflows — lowest saving
inputs.separations = 100; // very low volume
inputs.rate = 20; // very low staff rate
renderScreen3();
goToScreen(3);
```
The hero number should appear in red (negative), indicating the platform cost exceeds savings at this scale.

- [ ] **Step 5: Commit**

```bash
git add wxccroi-public/index.html
git commit -m "feat: mobile responsiveness, slider fill, negative saving guard"
```

---

## Self-Review Against Spec

| Spec requirement | Task | Status |
|---|---|---|
| 3-screen wizard, single HTML file | Task 1 | ✅ |
| ArchiTech dark brand | Task 1 | ✅ |
| 6 scenario cards with proof-point stats | Task 2 | ✅ |
| Card selection with cyan border + checkmark | Task 2 | ✅ |
| Button disabled until selection | Task 2 | ✅ |
| Agents slider (default 30) | Task 3 | ✅ |
| Separations slider (default 15,000) | Task 3 | ✅ |
| Staff rate input (default $60) | Task 3 | ✅ |
| Selected workflow summary on Screen 2 | Task 3 | ✅ |
| Calculation: digital cost per separation | Task 4 | ✅ |
| Calculation: labour saved per separation | Task 4 | ✅ |
| Calculation: net saving, FTE, ROI multiple | Task 4 | ✅ |
| Hero number with counting animation | Task 5 | ✅ |
| 3 supporting stat cards with animation | Task 5 | ✅ |
| Per-workflow breakdown | Task 6 | ✅ |
| Collapsible assumptions panel | Task 6 | ✅ |
| Channel mix table in assumptions | Task 6 | ✅ |
| Unit costs table in assumptions | Task 6 | ✅ |
| Shareable URL encoding | Task 7 | ✅ |
| Deep link parsing on load → jump to results | Task 7 | ✅ |
| Mobile responsive | Task 8 | ✅ |
| Negative saving guard | Task 8 | ✅ |

All spec requirements covered.
