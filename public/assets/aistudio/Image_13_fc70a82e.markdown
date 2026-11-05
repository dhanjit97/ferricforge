---
name: FerricForge Ultimate
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#e5beb2'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#ac897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59c'
  primary: '#ffb59c'
  on-primary: '#5c1900'
  primary-container: '#ff570b'
  on-primary-container: '#511500'
  inverse-primary: '#ab3600'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#ffb868'
  on-tertiary: '#482900'
  tertiary-container: '#ce7f00'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832700'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#ffb868'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies the disciplined precision, zero-cost abstractions, and mechanical sympathy of low-level systems engineering. It is engineered for systems developers, compiler engineers, and performance-critical architects who demand terminal-grade density combined with hyper-modern visual ergonomics. 

The aesthetic synthesizes:
- **Dark Systems Telemetry**: Deep void obsidian foundations that reduce eye fatigue during multi-hour debugging and compiler sessions.
- **Micro-Etched Glassmorphism**: Sub-pixel structural outlines, low-opacity vitreous surfaces, and localized back-panel blurs that organize complex multi-pane information hierarchies without visual noise.
- **Molten & Cyber Chromatics**: Controlled thermal accents—molten ferric orange signaling compiler operations, lifetime borrow checking, and execution vitality; juxtaposed against laser-calibrated cyber cyan representing memory safety guarantees, concurrency threads, and deterministic telemetry.

The interface evokes uncompromising technical competence, surgical accuracy, and refined industrial instrumentation.

## Colors

The palette establishes an obsidian layered workspace illuminated by purposeful, high-energy luminescence.

### Base Canvas & Surfaces
- **Canvas Base (`#0a0d14`)**: The deepest foundational layer for code execution planes and global viewport boundaries.
- **Surface Elevation 1 (`#101520`)**: Primary workbench cards, sidebars, and inactive code panels.
- **Surface Elevation 2 (`#161d2d`)**: Active tab panels, popovers, tooltips, and floating diagnostic consoles.
- **Surface Vitreous Border (`rgba(255, 255, 255, 0.08)`)**: Fine frosted outline defining components against deep dark bases.

### Accents & Semantic Signals
- **Primary — Molten Ferric Orange (`#ff5400` / `#ff6d00`)**: Core actions, active compiler milestones, lifetime/borrow-check markers, and high-impact calls to action.
- **Secondary — Electric Cyber Cyan (`#00f0ff`)**: Memory safety indicators, zero-copy telemetry metrics, active debugger threads, and syntax tokens.
- **Tertiary — Thermal Amber (`#ff9e00`)**: Warnings, compiler notices, unoptimized runtime heuristics.
- **Diagnostics Green (`#10b981`)**: Verified compilation target, test harness pass rate, and zero-leak confirmation.
- **Diagnostics Crimson (`#f43f5e`)**: Panic states, borrow checker violations, and compile errors.

## Typography

The typographic hierarchy pairs the high-density mechanical clarity of **Geist** for structural layout and instructional narrative with **JetBrains Mono** for compiler telemetry, code editor buffers, registers, and memory addresses.

- **Prose & Structural Heads**: Geist delivers crisp legibility even when rendered at condensed viewport scales. Headlines employ negative tracking to feel solid, deliberate, and tightly aligned with architectural grid boundaries.
- **Code & Telemetry Labels**: JetBrains Mono enforces monospace rigor. Uppercase metadata tags and diagnostic indicators utilize `label-sm` with deliberate tracking (`0.08em`) to mimic aerospace instrumentation.
- **Code Contexts**: All code blocks utilize ligatures purposefully, rendering Rust-specific operators (`->`, `=>`, `::`, `!=`, `..=`) with pinpoint optical balance.

## Layout & Spacing

The layout operates on a 4px/8px incremental grid designed to optimize complex multi-column developer environments (e.g., interactive curriculum tree, code editor workspace, and live memory diagramming).

### Screen Breakpoints & Adaptive Layout
- **Desktop (>= 1280px)**: Fluid 12-column or 3-pane workbench (Sidebar: 280px fixed, Editor/Curriculum: fluid, Telemetry/Inspector: 360px fixed). Gutters lock to `1.5rem` (`gutter-desktop`), outer margins to `3rem` (`margin-desktop`).
- **Tablet (768px - 1279px)**: Dual-pane layout with collapsible side panels. 8-column system with `1rem` gutters and `2rem` margins.
- **Mobile (< 768px)**: Single-column stack with persistent bottom-pinned terminal action bar. Code blocks enforce horizontal scroll with fixed line-height metrics. Canvas margin reduces to `1rem`.

### Density & Rhythms
Spacing between related elements within containers (e.g., AST node blocks, crate dependencies) strictly stays at `space-xs` (4px) or `space-sm` (8px). Macro spacing separating major conceptual chapters uses `space-xl` (40px).

## Elevation & Depth

Visual depth is achieved through structural layering and back-panel optical dissipation rather than heavy opaque drop-shadows.

### Layering Philosophy
- **Level 0 (Substratum)**: `#0a0d14` solid background with faint 40px linear grid guide lines at 3% opacity.
- **Level 1 (Dock & Editors)**: `#101520` background with `1px solid rgba(255, 255, 255, 0.05)`.
- **Level 2 (Active Cards & Overlays)**: Translucent `#161d2d` at 85% opacity with `backdrop-filter: blur(12px)` and a micro-rim top highlight: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`.
- **Level 3 (Modal Tooltips & Active Diagnostics)**: High-sheer obsidian glass (`rgba(16, 21, 32, 0.92)`) bounded by dual-colored rim lighting: `0 0 0 1px rgba(255, 84, 0, 0.3), 0 8px 32px -4px rgba(0, 0, 0, 0.7)`.

### Chromatic Aura
Hovering interactive modules or targeting memory locations creates a subtle, diffuse radial backlight:
- Primary elements project a 24px blur aura tinted with `rgba(255, 84, 0, 0.15)`.
- Thread and telemetry metrics emit `rgba(0, 240, 255, 0.15)`.

## Shapes

The design system enforces a precision-tooled, soft-geometric shape language. Rather than bubbly or pill-dominated forms, curvature is deliberately restrained to convey an industrial instrument aesthetic.

- **Base Radius (`0.25rem` / 4px)**: Applied to code token badges, inline chips, status pills, inputs, and nested terminal tabs.
- **Container Radius (`0.5rem` / 8px)**: Applied to code snippet containers, lesson modules, compiler output panes, and modal dialogs.
- **Inner-to-Outer Curvature Harmony**: When nested inside containers with 8px radius, child elements use 4px radius with 4px or 8px padding to preserve geometric concentricity.

## Components

### Buttons
- **Primary (Molten Engine)**: Background `#ff5400`, text `#ffffff` (Geist 600). Top edge micro-bevel highlight, subtle orange glow on hover (`box-shadow: 0 0 16px rgba(255, 84, 0, 0.35)`). Active state scales slightly to `0.98`.
- **Secondary (Cyber Telemetry)**: Ghost surface with translucent cyan border (`1px solid rgba(0, 240, 255, 0.3)`), text `#00f0ff`. Hover fills to `rgba(0, 240, 255, 0.08)` with a vibrant cyan border.
- **Tertiary / Ghost**: Transparent base with text `#94a3b8`. Hover transitions to background `#161d2d` with white text.

### Chips & Badges
- Constructed with `JetBrains Mono` at `label-sm` (10px).
- **Borrow Checker Clean**: Background `rgba(16, 185, 129, 0.1)`, text `#10b981`, border `1px solid rgba(16, 185, 129, 0.25)`.
- **Unsafe Block Warning**: Background `rgba(255, 84, 0, 0.12)`, text `#ff6d00`, border `1px solid rgba(255, 84, 0, 0.35)`.
- **Thread Metric**: Background `rgba(0, 240, 255, 0.1)`, text `#00f0ff`, border `1px solid rgba(0, 240, 255, 0.25)`.

### Lists & Tree Views (Module & AST Explorers)
- Row height fixed at 32px with 4px horizontal padding.
- Guide lines rendered as `1px dashed rgba(255, 255, 255, 0.08)`.
- Active row receives a left accent border (`2px solid #ff5400`) and a gradient background fade (`linear-gradient(90deg, rgba(255, 84, 0, 0.12) 0%, transparent 100%)`).

### Input Fields & Monospace Editors
- Input surfaces use `#0a0d14` with a `1px solid rgba(255, 255, 255, 0.1)` border and 4px radius.
- Caret is rendered in electric cyan (`#00f0ff`) with a 1s pulse rhythm.
- Focus state triggers a dual-ring glow: border shifts to `#ff5400`, accompanied by an outer shadow `0 0 0 2px rgba(255, 84, 0, 0.2)`.

### Checkboxes & Radios
- Square 16px boxes with 3px corner radius.
- Unchecked: `#101520` fill with `1px solid rgba(255, 255, 255, 0.18)`.
- Checked: `#ff5400` fill with sharp white vector checkmark; radios use a centered `#00f0ff` glowing pip.

### Interactive Cards & Memory Visualizers
- Surface: Glassmorphic `#101520` background with `backdrop-filter: blur(16px)` and frosted `1px solid rgba(255, 255, 255, 0.07)` rim.
- Top header includes an integrated status bar with monospaced execution telemetry: target architecture, compilation duration, and memory allocation stats.
- Hovering elevates the card via a subtle -1px Y-axis translate and border transition to `rgba(255, 255, 255, 0.16)`.