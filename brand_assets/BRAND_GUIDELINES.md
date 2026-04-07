# ArchiTech — Brand Guidelines
*Last updated: 2026-04-08*
*Source: Official ArchiTech Style Guide + architech.net.au + Webex CC Demo App (live)*

---

## 1. Brand Identity

**ArchiTech** is an Australian enterprise technology solutions company serving essential services and critical infrastructure organisations. They hold a deliberate positioning as a trusted partner in complex, high-stakes environments.

**Tagline:** *technology solved | business evolved*

**Positioning statements:**
> *De-risking critical technology decisions*
> *Simplifying complexity*
> *Designing for resilience and care*

**Service Pillars:**
> Simplify · De-risk · Care · Evolve

**Mission:** Driven by a genuine passion for creating positive community impact through innovative digital infrastructure for essential services.

---

## 2. Logo

The ArchiTech mark is a geometric triangular "A" icon paired with a clean wordmark.

### Logo Variants

| Variant | Use Case |
|---|---|
| Icon + Wordmark (horizontal) | Primary use — headers, hero, email |
| Icon + Wordmark (stacked) | Square contexts, print collateral |
| Icon only | App icons, favicons, social avatars |
| Reversed (white) | Dark and photographic backgrounds |

### Tagline Treatment

The tagline *"technology solved \| business evolved"* appears beneath the wordmark in the preferred logo application. Use the tagline version for all external marketing, communications, and digital contexts. Suppress only when space is genuinely constrained.

### Usage Rules

**Do:**
- Use the reversed (white) variant on dark backgrounds
- Use the standard (colour) variant on white/light backgrounds
- Give the logo generous clear space — do not crowd it
- Use the triangular background pattern with the reversed logo for hero treatments

**Don't:**
- Stretch, squeeze, rotate, outline, or apply effects to the logo
- Place on busy photographic backgrounds without a dark overlay
- Use the icon-only variant where the full wordmark fits

---

## 3. Color System

ArchiTech uses a modern, minimalist palette built on a cyan-to-navy range. All digital/web contexts use the **dark theme** exclusively. Light backgrounds are never used in the demo app.

### Primary Colour Palette

| Name | Hex | RGB | Pantone | Role |
|---|---|---|---|---|
| ArchiTech Cyan | `#05C3DD` | R5, G195, B221 | Pantone 311 C | Primary accent, CTAs, highlights |
| ArchiTech Blue | `#0055B8` | R0, G85, B184 | Pantone 2935 C | Secondary accent, links, interactive |
| ArchiTech Navy | `#13294B` | R19, G41, B75 | Pantone 2767 C | Deep background, dark surfaces |
| ArchiTech Gray | `#54565B` | R84, G86, B90 | Pantone Cool Gray 11 | Icons and UI elements on light backgrounds |

### Secondary Colour Palette

For use in multi-stage UI, charts, diagrams, and data visualisation. Use HEX values for all screen/digital contexts.

| Hex | RGB | Character | Status |
|---|---|---|---|
| `#55CAFD` | R85, G218, B253 | Light cyan — highlights, tag backgrounds | ✅ Active |
| `#7F8FA9` | R127, G143, B169 | Blue-gray — stage accents, muted UI | ✅ Active |
| `#16CECC` | R22, G206, B204 | Teal — gradients, button highlights | ✅ Active |
| `#517FE3` | R81, G127, B227 | Periwinkle blue — stage accents, charts | ✅ Active |
| `#1980BD` | R25, G128, B189 | Mid blue — supporting elements | ✅ Active |
| `#494B83` | R73, G75, B131 | Dark indigo — depth, chart series | ✅ Available |
| `#00A991` | R0, G169, B145 | Teal-green — success, positive states | ✅ Active |
| `#9594D2` | R149, G148, B210 | Lavender — charts only | ⚠️ Charts/data only — do not use as UI accent |

> **Rule:** `#9594D2` lavender reads as off-brand in UI contexts. Reserve it for chart series only. Never use it as a card accent, button, or badge color.

### CSS Token System

```css
:root {
  /* Backgrounds — dark/digital context only */
  --bg:           #0D1825;  /* Page background — deepest layer */
  --surface:      #13294B;  /* ArchiTech Navy — cards, panels */
  --surface-2:    #1A3460;  /* Elevated surfaces */
  --surface-3:    #1F3D72;  /* Highest elevation */

  /* Borders */
  --border:       rgba(5, 195, 221, 0.12);   /* Cyan-tinted, subtle */
  --border-hi:    rgba(5, 195, 221, 0.30);   /* Active/hover */

  /* Text */
  --text-1:       #FFFFFF;   /* Primary — white on dark */
  --text-2:       #7F8FA9;   /* Secondary/muted — ArchiTech blue-gray */
  --text-3:       #3D4F65;   /* Ghost/disabled */

  /* Brand Accents */
  --cyan:         #05C3DD;
  --cyan-dim:     rgba(5, 195, 221, 0.07);
  --cyan-glow:    rgba(5, 195, 221, 0.18);
  --blue:         #0055B8;
  --blue-dim:     rgba(0, 85, 184, 0.07);

  /* Semantic */
  --success:      #00A991;   /* Teal-green — confirmed/delivered */
  --warning:      #1980BD;   /* Mid blue */
  --error:        #C62828;   /* Error/alert */
}
```

### Color Application Rules

- Primary CTA buttons: `#05C3DD` with `rgba(5,195,221,0.08)` background
- Secondary/ghost buttons: `#0055B8` border with white text
- Success states: `#00A991`
- Error/validation: `#C62828`
- **Never use white or light backgrounds** in the demo app
- **Never use generic Tailwind palette colors** — no `slate-700`, `indigo-500`, `blue-600`, etc.
- **Never use off-brand grays** (`#2e2e30`, `#1a1a1c`, `#374151`, etc.) — use navy surfaces instead
- Card backgrounds must use dark navy gradients derived from `#0D1825` / `#13294B`

### Stage Accent Color System

When building multi-stage or journey interfaces, assign one brand color per stage. The order below is the established sequence used in the Webex CC demo — replicate it for consistency across pages.

| Stage | Accent | Hex | accentBg | accentBorder |
|---|---|---|---|---|
| 01 | ArchiTech Cyan | `#05C3DD` | `rgba(5,195,221,0.12)` | `rgba(5,195,221,0.38)` |
| 02 | Periwinkle | `#517FE3` | `rgba(81,127,227,0.12)` | `rgba(81,127,227,0.38)` |
| 03 | Light Cyan | `#55CAFD` | `rgba(85,202,253,0.12)` | `rgba(85,202,253,0.38)` |
| 04 | Mid Blue | `#1980BD` | `rgba(25,128,189,0.12)` | `rgba(25,128,189,0.38)` |
| 05 | Blue-Gray | `#7F8FA9` | `rgba(127,143,169,0.14)` | `rgba(127,143,169,0.42)` |
| 06 | ArchiTech Blue | `#0055B8` | `rgba(0,85,184,0.14)` | `rgba(0,85,184,0.42)` |

**Card background gradients** (dark navy tinted with stage accent):
```
Stage 01: linear-gradient(145deg, #091e2e 0%, #0e2e46 55%, #081a28 100%)
Stage 02: linear-gradient(145deg, #0c1630 0%, #111e48 55%, #0a1228 100%)
Stage 03: linear-gradient(145deg, #081c2e 0%, #0c2842 55%, #071820 100%)
Stage 04: linear-gradient(145deg, #081428 0%, #0c1e3e 55%, #061020 100%)
Stage 05: linear-gradient(145deg, #0d1828 0%, #131e30 55%, #0b1422 100%)
Stage 06: linear-gradient(145deg, #081030 0%, #0c1848 55%, #061028 100%)
```

---

## 4. Typography

### Font Stack

| Role | Family | Weights | Source |
|---|---|---|---|
| **Primary / Body / UI** | Roboto | Thin (100) → Black (900) | Google Fonts |
| **System fallback** | Arial | — | System |
| **Technical / Mono** | JetBrains Mono | 400, 700 | Google Fonts |

Roboto is used for all print and web applications. Arial is the system fallback only — never specify it as primary. JetBrains Mono is used for webhook URLs, technical data, JSON, status codes, and chapter/stage badges.

### Type Scale

| Level | Size | Weight | Case | Use |
|---|---|---|---|---|
| Hero | `3rem–4.5rem` | 700–900 | Title case | Page hero headings |
| Section heading | `2rem–2.5rem` | 700 | Title case | Section titles |
| Card title | `1.25rem–1.5rem` (large card) / `0.875rem` (compact) | 700–900 | Title case | Card and panel headings |
| Body | `1rem` | 400 | Sentence case | Body copy |
| Label | `0.875rem` | 500–700 | All-caps or title | UI labels, tags, section group headers |
| Mono / technical | `0.8125rem` | 400–700 | As-is | URLs, codes, JSON, chapter badges |
| Micro | `0.75rem` | 400 | Sentence case | Timestamps, metadata |

### Hierarchy Rules

- Headings: title case, Roboto Bold/Black
- Body: sentence case, Roboto Regular
- Never use the same weight for two adjacent levels
- Mono data always uses JetBrains Mono — never Roboto for technical strings
- Tracking: `-0.01em` on large headings; `0.06em` on all-caps labels; `0.15–0.2em` on section group headers

---

## 5. Spacing & Layout

| Context | Value |
|---|---|
| Content max-width | `1300px` |
| Desktop grid | 24-column |
| Mobile grid | 8-column |
| Column/row gap | `11px` |
| Desktop gutter | `4vw` |
| Mobile gutter | `6vw` |
| Responsive breakpoint | `768px` |
| Header backdrop blur | `blur(12px)` |
| Text-on-photo blur | `blur(15px)` |

### Layout Principles

- Full-bleed hero with triangular gradient pattern or dark photographic background
- Cards and grids stack single column at `768px`
- Nav collapses to hamburger at mobile
- Asymmetric two-column patterns for content sections (60/40 or 65/35)
- Collapsible sections default to **closed** — expand on interaction

---

## 6. Motion & Animation

ArchiTech's brand does not use motion as a feature — interaction should be immediate and purposeful.

**For the demo app:**
- **Entry:** `opacity 0 → 1` at `0.25s ease` — no translate, no bounce
- **Hover:** border color transition + subtle box-shadow lift at `0.2s ease`
- **Button press:** `scale(0.97)` at `100ms ease-out`
- **Status pulse:** `2s` continuous opacity animation for live/active states
- **Loading:** spinner with `opacity: 0.4` overlay — never block full UI
- **Toast/notification:** `0.3s ease` fade-in + `4px` slide-up
- **Stepper progress:** `0.7s` width transition on filled track line

**Rules:**
- Prefer animating `opacity` and `transform` only
- Every interactive element needs hover, focus-visible, and active states
- No parallax, no canvas effects, no scroll-triggered theatrics
- Button active state: `translateY(1px)` + `scale(0.98)`

---

## 7. Voice & Tone

- **Outcome-focused.** Lead with what gets solved, not what is offered.
- **Professional but accessible.** Trusted partner language, not vendor speak.
- **Concise.** Short sentences. No fluff.
- **Confident.** Declarative statements, not hedged invitations.

**Examples of correct voice:**
> *Technology solved. Business evolved.*
> *De-risking critical technology decisions.*
> *Built on decades of experience supporting unique IT needs.*

**Avoid:**
- "Passionate about technology"
- "Leveraging solutions to drive synergies"
- Exclamation marks
- Overly casual or overly corporate tone

---

## 8. Demo App Context

This brand is applied to a **Webex Contact Center pre-sales demonstration dashboard** built by ArchiTech. It must look like an ArchiTech-built enterprise product — something they would confidently demo to a C-suite buyer in a critical infrastructure organisation.

**Requirements:**
- ArchiTech branding visible but not intrusive (logo in nav, cyan on primary CTAs)
- Dark digital theme — navy surface layering system, cyan accent
- Technical credibility — webhook URLs, status pulses, flow steps rendered in mono
- No toy aesthetics — this serves critical infrastructure customers

**Section accent mapping:**

| Section | Accent | Treatment |
|---|---|---|
| Journey Overview | Stage color sequence (01–06) | Timeline nodes + cinematic cards |
| Journey Demonstration | Stage color sequence (01–06) | Stepper + spotlight detail panel |
| Phone SMS mockup | `#05C3DD` | Cyan send button; navy phone body |
| Impact stats | `#05C3DD` | Cycling stat cards |
| Success / Sent states | `#00A991` | Confirmation badges, check marks |
| Error / Alert | `#C62828` | Validation, failures |
| All-stages-complete | `#00A991` gradient to `#16CECC` | "View Summary" CTA |

---

## 9. UI Component Patterns

These are the established component patterns used in the Webex CC demo app. Replicate these patterns on other pages for consistency.

### 9.1 Section Header

A collapsible section header with a left accent bar, title, and collapse toggle.

```
[3px cyan gradient bar] SECTION TITLE ─────────────── 6 stages · subtitle  [Expand ˅]
```

- Left bar: `linear-gradient(180deg, #05C3DD, rgba(5,195,221,0.4))` with `box-shadow: 0 0 8px rgba(5,195,221,0.5)`
- Title: `15px`, `font-black`, `uppercase`, `tracking-widest`
- Divider line: `linear-gradient(90deg, rgba(5,195,221,0.25), transparent)`
- Toggle pill: `rounded-full`, `border: rgba(255,255,255,0.1)`, hover to `rgba(5,195,221,0.4)`
- **Default state: collapsed** (`max-h-0`, `opacity-0`)

### 9.2 Horizontal Timeline / Stepper

Used for multi-stage journey navigation. 6 nodes on a single track line with section group labels above.

**Structure:**
1. Group labels row — 3 labels (each spanning 2 stages), text only, no divider lines, `font-mono uppercase tracking-[0.2em]`
2. Track line — `rgba(5,195,221,0.12)` — quiet guide, not a feature
3. Node row — circular buttons with stage icon; active node glows with stage accent color
4. Filled progress track — `linear-gradient(90deg, #00A991, #05C3DD)` — advances as stages are triggered
5. Stage labels — small mono text below each node

**Node states:**
- Default: `rgba(255,255,255,0.04)` background, `rgba(255,255,255,0.1)` border
- Active (selected): stage `accentBg` background, stage `accent` border + glow
- Triggered (sent): `rgba(0,169,145,0.15)` background, `#00A991` border + check icon

**Behaviour:** clicking a node selects it and shows its detail panel below. After triggering a stage, auto-advance to the next node after 600ms.

### 9.3 Cinematic Banner Card

Used in the Journey Overview (expanded overview section). Each stage is a fixed-height card with a full-bleed gradient background.

**Structure:**
```
┌─────────────────────────────────────┐
│ [chapter badge]          [sent ✓]   │  ← dark gradient bg (stage color)
│                                     │
│ [large faded icon — bottom right]   │
│                                     │
│ Stage Title                         │
│ [Send → button]         [Details ˅] │  ← bottom fade overlay
└─────────────────────────────────────┘
[Expanded details panel below — dark bg with stage accent border]
```

- Height: `162px` fixed
- Background: stage gradient (see Section 3 — Stage Accent Color System)
- Large background icon: `120×120px`, `iconTint` opacity (`rgba(..., 0.06)`) — positioned bottom-right
- Bottom overlay: `linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.7))`
- Chapter badge: `font-mono`, stage `accentBg` + `accentBorder`
- Send button: stage `accent` color, `accentBg` background, `accentBorder` border
- Triggered wash: `linear-gradient(145deg, accentBg 0%, transparent 65%)`
- Expanded details panel: `rgba(8,14,24,0.97)` background, `accentBorder` top border

### 9.4 Stepper Detail Panel (Spotlight Card)

The large card shown below the stepper when a stage is selected. Combines the cinematic banner with a full content body.

**Structure:**
```
┌─────────────────────────────────────────────┐
│ [chapter] [section label]     [Sent ✓ pill] │  ← stage gradient bg, 140px
│                                             │
│ [large faded icon — bottom right, 160px]    │
│                                             │
│ Stage Title                  [Send → btn]   │
└─────────────────────────────────────────────┘
│ Automation opportunity text                 │  ← rgba(8,14,24,0.97)
│ Current State (always visible)              │
│ [Flow steps — appear after trigger]         │
│ [View Workflow ˅ button — full width cyan]  │
│   └─ [Workflow diagram image]               │
└─────────────────────────────────────────────┘
```

- Banner height: `140px`
- "View Workflow" button: full-width, `rounded-lg`, `#05C3DD` border + background tint, bold text
- Flow steps: appear sequentially after webhook confirms (450ms, 950ms, 1500ms delays)
- Current State text is always visible — not hidden behind a toggle

### 9.5 Phone SMS Mockup

A portrait phone device used to preview the SMS content of each triggered stage.

**Device:**
- Body: `linear-gradient(160deg, #1A3460, #13294B, #0D1825)` — ArchiTech navy, not generic gray
- Side buttons: `linear-gradient(180deg, #1F3D72, #13294B)`
- Border radius: `50px`
- Screen inset: `10px` all sides, `borderRadius: 42px`, white background

**Status bar (on white screen):**
- Clock text: `#13294B`
- Signal bars, WiFi, battery: `#54565B` (ArchiTech Gray)

**SMS bubble:**
- Sender avatar: `#05C3DD` background, "AT" initials
- Message bubble: `bg-slate-100` rounded, `text-slate-800`, `white-space: pre-line` (supports multi-line)
- CTA pill: `#05C3DD` background, white bold text

**Pulse effect on trigger:** `radial-gradient` cyan glow animation, `box-shadow` intensifies for 2s

### 9.6 Impact Stat Card

Cycling statistic display used in the demo summary section.

- Background: `rgba(5,195,221,0.03)` with cyan border
- Hero number: large, `font-black`, white
- Highlight text: `#05C3DD`
- Cycles every 12 seconds, fade transition `0.35s`

---

## 10. What This Brand Is Not

- Not generic SaaS — no `indigo-600`, no white card grids on light gray
- Not a telco consumer brand — no bright blue-on-white consumer aesthetics
- Not startup-flashy — no gradient-everywhere, no excessive glow effects
- Not decorative — every element serves enterprise credibility or functional clarity
- Not print-only — dark/digital treatment is primary for all web and app contexts
- Not gray — never use generic system grays (`#374151`, `slate-700`, `#2e2e30`, etc.) — replace with navy surfaces
