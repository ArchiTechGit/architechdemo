# ArchiTech — Brand Guidelines
*Last updated: 2026-03-26*
*Source: Official ArchiTech Style Guide + architech.net.au*

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

The ArchiTech mark is a geometric triangular "A" icon paired with a clean wordmark. Three variations are in use.

### Logo Variants

| Variant | Use Case |
|---|---|
| Icon + Wordmark (horizontal) | Primary use — headers, hero, email |
| Icon + Wordmark (stacked) | Square contexts, print collateral |
| Icon only | App icons, favicons, social avatars |
| Reversed (white) | Dark and photographic backgrounds |

### Tagline Treatment

The tagline *"technology solved \| business evolved"* appears beneath the wordmark in the preferred logo application. Use the tagline version for all external marketing, communications, and digital contexts. Suppress it only when space is genuinely constrained.

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

ArchiTech uses a modern, fresh, minimalist colour palette built on a cyan-to-navy range. The brand works in both light (print/document) and dark (web/digital) contexts. For the demo application, the dark/digital context applies.

### Primary Colour Palette

| Name | Hex | RGB | Pantone | Role |
|---|---|---|---|---|
| ArchiTech Cyan | `#05C3DD` | R5, G195, B221 | Pantone 311 C | Primary accent, CTAs, highlights |
| ArchiTech Blue | `#0055B8` | R0, G85, B184 | Pantone 2935 C | Secondary accent, links, interactive |
| ArchiTech Navy | `#13294B` | R19, G41, B75 | Pantone 2767 C | Deep background, dark surfaces |
| ArchiTech Gray | `#54565B` | R84, G86, B90 | Pantone Cool Gray 11 | Body text (light mode), muted elements |

### Secondary Colour Palette

For use in tables, diagrams, charts, and subheadings. Use HEX values for all screen/digital contexts.

| Hex | RGB | Character |
|---|---|---|
| `#55CAFD` | R85, G218, B253 | Light cyan — highlights, tag backgrounds |
| `#7F8FA9` | R127, G143, B169 | Blue-gray — secondary muted text |
| `#16CECC` | R22, G206, B204 | Teal — data, status indicators |
| `#517FE3` | R81, G127, B227 | Periwinkle blue — charts, secondary data |
| `#1980BD` | R25, G128, B189 | Mid blue — supporting elements |
| `#494B83` | R73, G75, B131 | Dark indigo — depth, chart series |
| `#00A991` | R0, G169, B145 | Teal-green — success, positive states |
| `#9594D2` | R149, G148, B210 | Lavender — accent variation, charts |

### CSS Token System (Demo App)

```css
:root {
  /* Backgrounds — dark/digital context */
  --bg:           #0D1825;  /* Deep navy, slightly deeper than #13294B */
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
  --cyan:         #05C3DD;   /* Primary accent */
  --cyan-dim:     rgba(5, 195, 221, 0.07);
  --cyan-glow:    rgba(5, 195, 221, 0.18);
  --blue:         #0055B8;   /* Secondary accent */
  --blue-dim:     rgba(0, 85, 184, 0.07);

  /* Semantic */
  --success:      #00A991;   /* Teal-green */
  --warning:      #1980BD;   /* Mid blue */
  --error:        #C62828;   /* Error/alert — confirmed */
}
```

### Rules

- Primary CTA buttons: `--cyan` `#05C3DD`
- Secondary/ghost buttons: `--blue` `#0055B8` border with white text
- Success states: `--success` `#00A991`
- Error/validation: `--error` `#C62828`
- Never use white or light backgrounds in the demo app
- Do not substitute generic Tailwind palette colors (indigo-500, blue-600, etc.)

### Background Pattern

A signature ArchiTech brand element is a **triangular geometric pattern** derived from the "A" icon, applied as a hero background. It uses a gradient from Navy (`#13294B`) to Cyan (`#05C3DD`). The reversed (white) logo sits over this pattern.

Use for: hero sections, section dividers, loading screens, and feature headers.

---

## 4. Typography

### Font Stack

| Role | Family | Weights | Source |
|---|---|---|---|
| **Primary / Body / UI** | Roboto | Thin (100) → Black (900) | Google Fonts |
| **System fallback** | Arial | — | System |
| **Technical / Mono** | JetBrains Mono | 400, 700 | Google Fonts |

Roboto is used for all print and web applications. Arial is the system fallback only — never specify Arial as primary. JetBrains Mono is used for webhook URLs, technical data, JSON, and status codes.

### Type Scale

| Level | Size | Weight | Case | Use |
|---|---|---|---|---|
| Hero | `3rem–4.5rem` | 700–900 | Title case | Page hero headings |
| Section heading | `2rem–2.5rem` | 700 | Title case | Section titles |
| Card title | `1.25rem–1.5rem` | 600 | Title case | Card and panel headings |
| Body | `1rem` | 400 | Sentence case | Body copy |
| Label | `0.875rem` | 500 | All-caps or title | UI labels, tags |
| Mono / technical | `0.8125rem` | 400 | As-is | URLs, codes, JSON |
| Micro | `0.75rem` | 400 | Sentence case | Timestamps, metadata |

### Hierarchy Rules

- Headings: title case, Roboto Bold/Black
- Body: sentence case, Roboto Regular
- Never use the same weight for two adjacent levels
- Mono data always uses JetBrains Mono — never Roboto for technical strings
- Tracking: `-0.01em` on large headings; `0.06em` on all-caps labels

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
| Header backdrop blur | `blur(12px)` |
| Text-on-photo blur | `blur(15px)` |

### Layout Principles

- Full-bleed hero with triangular gradient pattern or dark photographic background
- Cards and grids stack single column at `768px`
- Nav collapses to hamburger at mobile
- Image-text balanced layouts — photography differentiates, color signals function
- Asymmetric two-column patterns for content sections (60/40 or 65/35)

---

## 6. Motion & Animation

ArchiTech's site has global animations disabled. The brand does not use motion as a feature — interaction should be immediate and purposeful.

**For the demo app:**
- **Entry:** `opacity 0 → 1` at `0.25s ease` — no translate, no bounce
- **Hover:** border color transition + subtle box-shadow lift at `0.2s ease`
- **Button press:** `scale(0.97)` at `100ms ease-out`
- **Status pulse:** `2s` continuous opacity animation for live/active states
- **Loading:** spinner with `opacity: 0.4` overlay — never block full UI
- **Toast/notification:** `0.3s ease` fade-in + `4px` slide-up

**Rules:**
- Only animate `transform` and `opacity` — never `transition-all`
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
> *The best outcomes are achieved when we reach trusted partner status.*

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
- Technical credibility — webhook URLs, status pulses, JSON payloads rendered in mono
- No toy aesthetics — this serves critical infrastructure customers
- The triangular brand pattern may be used as a hero or section background element

**Section accent mapping:**

| Section | Accent | Treatment |
|---|---|---|
| Dashboard / Overview | `--cyan` | Status at a glance |
| Workflow Triggers | `--cyan` | Primary CTA — solid cyan button |
| Activity Log | `--text-2` muted | Mono typography, recessed surface |
| Settings / Config | `--surface-2` | Technical, recessed |
| Success states | `--success` `#00A991` | Confirmation, webhook delivered |
| Error / Alert | `--error` `#C62828` | Validation, failures |

---

## 9. What This Brand Is Not

- Not The Senate — no grain overlays, no death metal aesthetics, no navy-black darkness
- Not generic SaaS — no indigo-600, no white card grids on light gray
- Not a telco consumer brand — no bright blue-on-white consumer aesthetics
- Not startup-flashy — no gradient-everywhere, no neon glow effects
- Not decorative — every element serves enterprise credibility or functional clarity
- Not print-only — dark/digital treatment is primary for web and app contexts
