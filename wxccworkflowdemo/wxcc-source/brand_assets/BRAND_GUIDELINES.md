# ArchiTech — Brand Guidelines
*Last updated: 2026-03-26*
*Source: https://architech.net.au — values marked ⚠️ are inferred and should be confirmed with the ArchiTech team*

---

## 1. Brand Identity

**ArchiTech** is an Australian enterprise technology solutions company serving essential services and critical infrastructure organisations. They are not a generalist IT shop — they hold a deliberate positioning as a trusted partner in complex, high-stakes environments.

The brand operates on a single, clear premise: technology decisions are risky and complex, and ArchiTech removes that burden.

**Primary tagline:** *Your technology solved. Your business evolved.*

**Supporting positioning statements:**
> *De-risking critical technology decisions*
> *Simplifying complexity*
> *Designing for resilience and care*

**Identity fragments / Service Pillars** (the four brand pillars, used together):
> Simplify · De-risk · Care · Evolve

**Core mission:** Driven by a genuine passion for creating positive community impact through innovative digital infrastructure for essential services.

**CARE Framework** (values):
- **C — Community** · Positive community outcomes drive every decision
- **A — Agility** · Move quickly without compromise
- **R — Relationships** · Trust is built at every interaction
- **E — Excellence** · Success measured by client outcomes

---

## 2. Logo

The ArchiTech wordmark is a clean, professional logotype with integrated tagline. Two primary variants are in use.

### Logo Files

| File | Use Case |
|---|---|
| `ArchiTech Logo_Tagline_Reversed - WEB.png` | Dark backgrounds — **primary use** |
| `ArchiTech Logo_NO_Tagline_Reversed-Website.png` | Dark backgrounds, space-constrained contexts (nav, favicon strip) |
| `ArchiTech Social Logo.png` | Social media profiles and square-format placements |

### Usage Rules

**Do:**
- Use the reversed (white) variant on all dark page backgrounds
- Maintain logo height at `101px` desktop / `90px` mobile
- Give the logo clear space — at minimum equal to the cap-height of the wordmark on all sides
- Use the tagline variant as the default; only suppress it when space is genuinely constrained

**Don't:**
- Place the logo on light or white backgrounds (brand is dark-first)
- Stretch, recolour, or apply effects to the logo
- Use the social logo in web hero or header contexts
- Stack the tagline version and the no-tagline version on the same page

---

## 3. Color System

ArchiTech uses a dark professional palette. The brand is built on deep backgrounds with light text — never the reverse. The accent palette is deliberately restrained: color earns its place by signalling meaning, not decoration.

### Global Base ⚠️

*Exact values not exposed in public CSS — these are matched to observed brand aesthetic and should be confirmed.*

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0D1117` | Page background (deep charcoal-navy) |
| `--surface` | `#161B22` | Cards, elevated panels |
| `--surface-2` | `#1C2330` | Nested surfaces |
| `--border` | `rgba(255,255,255,0.08)` | Subtle dividers |
| `--border-hi` | `rgba(255,255,255,0.18)` | Active/hover borders |
| `--text-1` | `#F0F6FC` | Primary text |
| `--text-2` | `#7D8590` | Secondary/muted text |
| `--text-3` | `#3D444D` | Disabled/ghost text |

### Brand Accent Colors ⚠️

ArchiTech's service pillar gradients are image-based assets, not CSS gradients. For the demo application, these functional accent colors are derived to align with each pillar's intent:

| Pillar | Token | Hex | Character |
|---|---|---|---|
| Simplify | `--accent-simplify` | `#2EA8E0` | Technology clarity, trusted blue |
| De-risk | `--accent-derisk` | `#1DB887` | Confidence, resolution, green |
| Care / Resilience | `--accent-care` | `#8B5CF6` | Depth, considered, service |
| Health 2025 | `--accent-health` | `#0EA5B0` | Clinical precision, teal |
| Error / Alert | `--error` | `#C62828` | Validation, alerts — **confirmed** |

**Primary interactive accent** (buttons, links, focus states): `--accent-simplify` `#2EA8E0`

### Rules

- Never use white or light backgrounds in any application context
- Red (`#C62828`) is reserved for error/validation states only — not used decoratively
- Service pillar accents are used in context of that pillar's content — not interchangeably
- Avoid saturated neon colours; enterprise credibility requires restraint

### Atmospheric Treatment

- No grain overlay or canvas effects — ArchiTech is clean and precise, not textural
- Header: `backdrop-filter: blur(12px)` on scroll
- Text blocks on photography: `blur(15px)` backdrop treatment
- No ambient orbs or atmospheric gradients — use subtle surface layering instead

---

## 4. Typography

### Font Stack

| Role | Family | Source |
|---|---|---|
| **Display / Headings** | Roboto | Google Fonts (Bold 700–900) |
| **Body / UI** | Roboto | Google Fonts (Regular 400–500) |
| **Labels / Mono / Technical** | JetBrains Mono | Google Fonts |

### Heading Style
- Weight: 700–800
- Case: Title case (not all-caps — ArchiTech is professional, not heavy metal)
- Tracking: `0` to `-0.02em` on large headings
- Size scale: `4.5rem` (hero) → `2.5rem` (section) → `1.5rem` (card title) → `1rem` (label)

### Body Style
- Weight: 400 (body) / 500 (UI labels)
- Line height: `1.6–1.7` on paragraph text
- Case: Sentence case

### Mono / Technical
- Used for: webhook URLs, technical data, status codes, JSON previews
- Weight: 400
- Size: `0.8125rem` (13px) for inline technical strings; `0.75rem` (12px) for metadata

### Hierarchy Rules
- Headings: title case, tight but not compressed
- Never use system fonts, Arial, or generic fallbacks as the primary face
- Pair a large bold heading with a muted small-caps or mono label beneath it for section eyebrows

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
| Nav logo height (desktop) | `101px` |
| Nav logo height (mobile) | `90px` |
| Nav vertical padding (desktop) | `0.6vw` |
| Nav vertical padding (mobile) | `6vw` |

### Layout Principles
- Full-bleed hero sections with photographic backgrounds + dark overlay
- Cards and grids stack to single column at `768px`
- Nav collapses to hamburger at mobile breakpoint
- Image-text balanced layouts (photography is the primary differentiator, not color)
- Asymmetric two-column patterns for content-heavy sections

---

## 6. Motion & Animation

ArchiTech's site has global animations **disabled** (`tweak-global-animations-enabled: false`). The brand does not use motion as a feature — interaction should be clear and immediate, not theatrical.

**For the demo app context:**
- **Entry:** Fade only (`opacity 0 → 1`) — no translate, no bounce
- **Duration:** `0.2s ease` for hover/focus; `0.3s ease` for panel reveal
- **Hover:** Subtle border colour transition + box-shadow elevation lift
- **Button press:** `scale(0.97)` at `100ms ease-out` — tactile, not dramatic
- **Status indicators:** `2s` continuous subtle opacity pulse for live states
- **Loading:** Spinner with transparency overlay — never block the full UI

**Rules:**
- Only animate `transform` and `opacity`
- Never use `transition-all`
- No parallax, no scroll effects, no canvas animations
- Every interactive element needs hover, focus-visible, and active states

---

## 7. Page / Section Character

For the demo application, sections map to functional purposes rather than aesthetic themes:

| Section | Purpose | Accent |
|---|---|---|
| Dashboard / Overview | Status at a glance | `--accent-simplify` (blue) |
| Workflow Triggers | Action panel | `--accent-simplify` (blue) primary CTA |
| Activity Log / History | Webhook event stream | `--text-2` muted, mono typography |
| Settings / Configuration | Technical setup | `--surface-2` recessed treatment |
| Error / Alert States | Validation, failures | `--error` `#C62828` |

---

## 8. Voice & Tone

- **Outcome-focused.** Lead with what gets solved, not what is offered.
- **Professional but human.** Not corporate jargon — earned, direct language.
- **Partner-level confidence.** Speak as a trusted advisor, not a vendor.
- **Concise.** Short sentences. No fluff.

**Examples of correct voice:**
> *De-risking critical technology decisions.*
> *Your technology solved. Your business evolved.*
> *Built on decades of experience supporting unique IT needs.*
> *The best outcomes are achieved when we reach trusted partner status.*

**Avoid:**
- "Passionate about technology" — trite
- "Leveraging solutions to drive synergies" — corporate emptiness
- Exclamation marks
- First-person plural overuse ("We, we, we") — lead with outcomes, not ArchiTech

---

## 9. Demo App Context

This brand is being applied to a **Webex Contact Center pre-sales demonstration dashboard** — a tool built by ArchiTech or for ArchiTech presentations. It must feel like an ArchiTech-built enterprise product.

**Key requirements:**
- Looks like something ArchiTech would proudly demo to a C-suite buyer
- Professional, clean, opinionated dark UI — not a generic React admin panel
- ArchiTech branding visible but not intrusive (logo in nav, accent colors in CTAs)
- Technical credibility: webhook URLs, status pulses, JSON payloads look real and legible
- No toy aesthetics — this is for critical infrastructure customers

**Navigation context:** Single-page demo tool — standard app shell with:
- Top nav: ArchiTech logo (left), demo context label (right)
- Main content: trigger panel + status/activity log
- Dark surface throughout, consistent with ArchiTech's reversed-logo design system

---

## 10. What This Brand Is Not

- Not a startup — no gradients-everywhere, no bright color explosions
- Not a government agency — clear, modern, not bureaucratic
- Not a telco — no blue-on-white consumer telecom aesthetic
- Not The Senate — no death metal aesthetics, no grain overlays, no horn-logo weight
- Not generic SaaS — no indigo-600, no white card grids on light gray, no "sign up free" energy
- Not decorative — every visual element serves enterprise credibility or functional clarity
