# ArchiTech / WxCC Demo — Brand Guidelines

Reference for building new demo pages with consistent visual identity.
Import `brand.css` for tokens; read this doc to understand patterns and intent.

---

## 1. Design Principles

| Principle | Application |
|-----------|-------------|
| **Clarity first** | No decorative noise. Every element serves a purpose. |
| **Confidence through simplicity** | Generous spacing and clean type build trust with enterprise buyers. |
| **Visual hierarchy** | Cyan draws the eye to primary actions. Blue is secondary. White text on navy for content. |
| **Responsive interactivity** | Subtle motion confirms actions; never distracts. |

---

## 2. Color Palette

### Brand Colors

| Token | Hex | CSS Variable | Role |
|-------|-----|-------------|------|
| Cyan | `#05C3DD` | `--primary` | CTAs, active states, highlights, icons |
| Blue | `#0055B8` | `--accent` | Secondary actions, links, decorative accents |
| Navy Deep | `#0D1825` | `--background` | Page background |
| Navy Mid | `#13294B` | `--card` | Cards, panels, sidebars |
| Navy Light | `#1A3460` | `--popover` | Elevated surfaces, tooltips, modals |
| Surface-3 | `#1F3D72` | `--secondary` / `--muted` | Muted backgrounds, disabled areas |

### Text Colors

| Token | Hex | CSS Variable | Use |
|-------|-----|-------------|-----|
| Near-white | `#F0F6FC` | `--foreground` | Body text, headings |
| Blue-gray | `#7F8FA9` | `--muted-foreground` | Labels, captions, de-emphasised |

### Semantic Colors

| Token | Hex | CSS Variable | Use |
|-------|-----|-------------|-----|
| Success | `#00A991` | `--success` | Confirmations, active status, positive outcomes |
| Destructive | `#C62828` | `--destructive` | Errors, warnings, critical alerts |
| Border | `rgba(5,195,221,0.12)` | `--border` | Subtle dividers; preserves dark feel |

### Glow Values (for box-shadow)

```css
--glow-cyan-sm: 0 0 24px rgba(5, 195, 221, 0.35);   /* cards on hover */
--glow-cyan-md: 0 0 48px rgba(5, 195, 221, 0.50);   /* featured elements */
--glow-cyan-lg: 0 0 70px rgba(5, 195, 221, 0.85);   /* logo pulse, hero */
```

### Do Not Use
- White backgrounds or light mode surfaces
- Pure black (`#000`) — use `--background` instead
- Bright colors outside the palette (no orange, yellow, pink)
- High-opacity cyan fills — use `rgba(5,195,221,0.08–0.15)` for fills

---

## 3. Typography

### Fonts

| Font | Weight | Use |
|------|--------|-----|
| **IBM Plex Sans** | 400, 500, 600, 700 | All UI text — headings, body, labels, buttons |
| **JetBrains Mono** | 400, 500 | Code snippets, webhook URLs, technical strings, event logs |

Google Fonts import (already in `brand.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Type Scale

| Role | Size | Weight | Letter-spacing | Tag |
|------|------|--------|----------------|-----|
| Display | 36–48px | 700 | -0.03em | Hero headlines |
| H1 | 32px | 700 | -0.02em | Page titles |
| H2 | 24px | 700 | -0.02em | Section headers |
| H3 | 20px | 700 | -0.02em | Card titles |
| H4–H6 | 16px | 600 | -0.01em | Sub-headers, labels |
| Body | 16px | 400 | 0 | Paragraphs, descriptions |
| Small | 14px | 400 | 0 | Secondary copy |
| Caption | 12px | 400 | 0.02em | Helper text, timestamps |
| Mono | 13px | 400–500 | 0 | Technical content |

### Rules
- Never use italic for UI labels
- Uppercase only for: badge labels, tracking stats (add 0.05em tracking)
- Line-height: 1.5 for body, 1.2 for display/headings

---

## 4. Spacing & Shape

### Border Radius

```css
--radius:    0.25rem;   /* default — sharp, enterprise feel */
--radius-sm: 0.125rem;  /* inputs, small elements */
--radius-md: 0.1875rem; /* buttons */
--radius-lg: 0.25rem;   /* cards */
--radius-xl: 0.5rem;    /* modals, larger panels */
```

Pill shape (badges, chips): `border-radius: 999px`

### Spacing Rhythm
Base unit: **4px (0.25rem)**. Prefer multiples: 4, 8, 12, 16, 24, 32, 48, 64.

| Context | Value |
|---------|-------|
| Within a component (icon-to-text) | 8px |
| Between related elements | 12–16px |
| Between sections | 32–48px |
| Page section padding | 64–96px |
| Card padding | 16–24px |

### Container
Max width: `1300px`, centered, responsive padding (`1rem` → `1.5rem` → `2rem`).

---

## 5. Component Patterns

### Cards

```jsx
// Standard panel
<div className="bg-card border border-border rounded-lg p-6">

// Elevated / featured
<div className="bg-popover border border-border/40 rounded-lg p-6 shadow-[0_0_24px_rgba(5,195,221,0.15)]">

// Stat/highlight card
<div className="bg-card border border-primary/20 rounded-lg p-6 shadow-[0_0_16px_rgba(5,195,221,0.12)]">
```

### Buttons

```jsx
// Primary CTA — cyan fill
<button className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-md
                   hover:brightness-110 active:scale-95 transition-all duration-150">

// Secondary — outline
<button className="border border-primary/40 text-primary font-medium px-6 py-2.5 rounded-md
                   hover:bg-primary/10 transition-all duration-150">

// Ghost — minimal
<button className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-md
                   hover:bg-secondary transition-colors duration-150">
```

### Status Chips / Badges

Use `.chip-success` and `.chip-primary` utility classes from `brand.css`, or:

```jsx
// Cyan pill
<span className="bg-primary/10 border border-primary/30 text-primary
                 text-xs font-semibold px-2.5 py-0.5 rounded-full">

// Success pill
<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>

// Muted label
<span className="bg-secondary text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">
```

### Partner / Integration Badges

```jsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold"
     style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
  <img src={logoUrl} className="h-4 w-auto" />
  <span>Partner Name</span>
</div>
```

### Gradient Header Bar

```jsx
<header className="brand-gradient-header border-b border-border px-6 py-4">
  {/* Logo + nav */}
</header>
```

### Key Stat Block

```jsx
<div className="bg-card border border-primary/20 rounded-lg p-5">
  <div className="text-4xl font-bold text-primary">{value}</div>
  <div className="text-sm text-foreground font-medium mt-1">{label}</div>
  <div className="text-xs text-muted-foreground mt-2">{detail}</div>
</div>
```

### System Event Log

```jsx
<div className="bg-background rounded border border-border p-4 font-mono text-xs text-muted-foreground space-y-1">
  {events.map(e => (
    <div key={e} className="flex items-start gap-2">
      <span className="text-primary mt-0.5">›</span>
      <span>{e}</span>
    </div>
  ))}
</div>
```

### Two-Column Layout (standard demo page)

```jsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
  <div>{/* Main content — left */}</div>
  <div>{/* Phone/device mockup — right */}</div>
</div>
```

### Inline Divider

```jsx
<div className="border-t border-border my-8" />
```

---

## 6. Animation Library

All keyframes defined in `brand.css`. Apply via utility classes:

| Class | Effect | Duration | Use case |
|-------|--------|----------|----------|
| `.animate-pulse-subtle` | Opacity 1→0.6→1 | 2s loop | Status indicators, live badges |
| `.animate-button-press` | Scale 1→0.95→1 | 100ms one-shot | Button click feedback |
| `.animate-ping-slow` | Scale + fade out | 2s loop | Notification rings |
| `.animate-logo-pulse` | Brightness + glow | 3s loop | Logo/hero elements |
| `.animate-cta-pulse` | Opacity + letter-spacing | 2.8s loop | Idle CTAs on screensaver |
| `.animate-stat-enter` | Scale + translateY in | 0.4s one-shot | Stats appearing on scroll |
| `.animate-fade-up` | Opacity + translateY | 0.3s one-shot | Toast, modal, panel entry |
| `.animate-circle-pulse` | Scale + glow ring | 2s loop | Active call/status indicator |
| `.animate-demo-badge` | Box-shadow pulse | 2s loop | Demo mode badge |

### Transition Conventions

```css
/* Button hover */
transition: all 150ms ease;

/* Focus ring */
transition: border-color 150ms ease, box-shadow 150ms ease;

/* Panel / modal entry */
transition: opacity 200ms ease, transform 200ms ease;

/* Color changes */
transition: color 150ms ease, background-color 150ms ease;
```

---

## 7. Layout Patterns

### Full-Bleed Hero Section

```jsx
<section className="relative min-h-[60vh] flex items-center border-b border-border"
         style={{ background: 'linear-gradient(135deg, #0D1825 0%, #13294B 50%, rgba(5,195,221,0.04) 100%)' }}>
  {/* Content */}
</section>
```

### Screensaver / Idle State

Dark background (`--background`), logo centered with `.animate-logo-pulse`, minimal CTA with `.animate-cta-pulse`. Stats enter with `.animate-stat-enter`. No navigation visible.

### Sidebar Layout

```jsx
<div className="flex h-screen bg-background">
  <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
    {/* nav */}
  </aside>
  <main className="flex-1 overflow-auto p-8">
    {/* content */}
  </main>
</div>
```

---

## 8. Imagery & Icons

- **Icons:** Lucide React. Size: 16px (small), 20px (standard), 24px (feature icons)
- **Icon color:** `text-primary` for active/cyan, `text-muted-foreground` for inactive
- **Logo:** Always use `logo_darkbackground.png` — never a light variant on dark bg
- **Workflow images:** Full-bleed cards with `object-cover`, 16:9 or 4:3 ratio
- **Partner logos:** White/light variants on dark panels; apply `filter: brightness(0) invert(1)` to make dark logos white

---

## 9. Voice & Tone (UI Copy)

- Sentence case for all UI labels (not Title Case)
- Action verbs for buttons: "Send update →", "Open wayfinder →", "Confirm →"
- SMS/notification copy: conversational, first-person from "ArchiTech Hospital", no jargon
- Stat labels: precise, source-cited, present tense
- Avoid: "leverage", "seamless", "robust", "cutting-edge"

---

## 10. What to Import in a New Project

```css
/* main.css or index.css */
@import "tailwindcss";
@import "../brand/brand.css";  /* adjust path as needed */
```

Or for non-Tailwind projects, `brand.css` is standalone and includes all tokens and utilities.

### Checklist for new demo pages

- [ ] Import `brand.css` (or copy `:root` variables block)
- [ ] Set `body { background: var(--background); color: var(--foreground); }`
- [ ] Use IBM Plex Sans for all text, JetBrains Mono for technical strings
- [ ] Use `--primary` (cyan) for primary CTAs only — not for decoration
- [ ] Apply `.page-container` for max-width centring
- [ ] Test with `prefers-reduced-motion` — animations must degrade gracefully
