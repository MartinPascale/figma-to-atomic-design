# Figma → React (Atomic, Pixel-Perfect) Pipeline

**Goal:** Convert a specific Figma section into **exact** React components using **atomic design** (atoms → molecules → organisms), **shadcn/ui** as a base, **CVA** for variants, and **Tailwind v5** with **CSS variables** for tokens.  
**Principle:** 100% design fidelity. No made-up content. Exact measurements only.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Flow Summary](#flow-summary)
- [Inputs & Outputs (per phase)](#inputs--outputs-per-phase)
- [Detailed Phases](#detailed-phases)
  - [Phase 1 – Design Analysis](#phase-1--design-analysis)
  - [Phase 2 – Design Token Extraction](#phase-2--design-token-extraction)
  - [Phase 3 – Atomic Component Identification](#phase-3--atomic-component-identification)
  - [Phase 4 – Implementation Strategy & Build](#phase-4--implementation-strategy--build)
  - [Phase 5 – Validation](#phase-5--validation)
- [Artifacts & Conventions](#artifacts--conventions)
- [Repo Structure](#repo-structure)
- [Acceptance Criteria / Definition of Done](#acceptance-criteria--definition-of-done)
- [How to Add a New Section](#how-to-add-a-new-section)
- [Non-Goals](#non-goals)

---

## Overview

This flow ingests a **Figma URL + node id** and produces:

- Atomic design scaffolding for the project (if not existing already)
- shadcn components, styled and extended.
- Design tokens
- Tailwind themed by globals.css
- Analysis folder containing all things found / missing (Design tokens, atoms, molecules, organism, template, pages)
- Exact page design, via composition of all the components created, matching at least 90% of fidelity to the Figna design.

---

## Prerequisites

- Figma: Access to file + **Dev Mode** for computed styles.
- Node.js 18+ and package manager (pnpm/yarn/npm).
- Tailwind v5 configured.
- shadcn/ui installed (or ready to scaffold).
- **Prompts/Templates** available in this repo:
  - `prompts/claude-design-token-extractor.md` (token extraction prompt)
  - `templates/tokens.findings.md` (findings template)
  - `src/styles/globals.css` (CSS variables template)

---

## Flow Summary

```mermaid
flowchart LR
  A[Intake\n(Figma URL + nodeId)] --> B[Phase 1\nDesign Analysis]
  B --> C[Phase 2\nToken Extraction (Claude)]
  C --> D[Phase 3\nAtomic Identification]
  D --> E[Phase 4\nBuild (shadcn + CVA)]
  E --> F[Phase 5\nValidation]
  F -->|Artifacts| G[Ship\n(Components + Tokens)]
```

## Inputs & Outputs (per phase)

| Phase                    | Inputs                           | Tools/Actions                                 | Outputs / Artifacts                                                                                      |
| ------------------------ | -------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1. Design Analysis       | Figma URL, node-id               | Dev Mode inspection, screenshots, spec doc    | `analysis/<section>/screenshots/*.png`, `analysis/<section>/spec.md`                                     |
| 2. Token Extraction      | Figma URL + node-id, screenshots | Run Claude with Design Token Extractor prompt | `design/tokens/<section>.tokens.json`, `design/tokens/<section>.tokens.md`                               |
| 3. Atomic Identification | Spec + tokens                    | Decompose into atoms/molecules/organisms      | `design/maps/<section>.components.yml`                                                                   |
| 4. Build                 | Tokens + component map           | shadcn/ui + CVA variants + exact spacing      | `src/components/ui/*`, `src/components/molecules/*`, `src/components/organisms/*`, updated `globals.css` |
| 5. Validation            | Built components + Figma         | Checklist + overlays/visual diff              | `validation/<section>/report.md`, optional diff images                                                   |

## Detailed Phases

### Phase 1 – Design Analysis

Purpose: Capture visual and structural truth from Figma.

Steps

Open Figma file at the provided node-id.

Screenshots: export full section and key zooms (logo, nav, buttons, inputs).

Spec capture (Dev Mode values only):

Element order (left→right / top→bottom)

Positions (x,y), dimensions (w,h)

Text content (exact), nav items (verbatim)

Spacing: gaps, paddings, margins

Grids/constraints, alignment

Colors, typography, radii, borders, shadows

Outputs

analysis/<section>/screenshots/\*.png

analysis/<section>/spec.md (short, factual: order, coords, sizes, text)

### Phase 2 – Design Token Extraction

Purpose: Produce the exact tokens actually used by the section.

Steps

Copy prompts/claude-design-token-extractor.md.

Fill <FIGMA_FILE_URL_OR_KEY> and <NODE_ID>.

Run with section scope only (no global guesses).

Save both outputs:

JSON tokens (primitives + roles, typography, spacing evidence)

Human summary in Markdown (where tokens are used)

Outputs

design/tokens/<section>.tokens.json

design/tokens/<section>.tokens.md (based on templates/tokens.findings.md)

After this step, update role mappings in src/styles/globals.css to reflect this section if needed.

### Phase 3 – Atomic Component Identification

Purpose: Map UI into atoms/molecules/organisms.

Steps

From spec.md + tokens, identify:

Atoms: buttons, inputs, labels, badges, icons, typography snippets.

Molecules: search bar (input + icon), nav list, cart button (button + badge).

Organism: the full section (e.g., Header/ProductGrid/Footer).

Define component boundaries, props, and CVA variants needed to match Figma variants (size, tone, state).

Outputs

design/maps/<section>.components.yml
(lists atoms/molecules/organisms, props, variants, and references to tokens)

### Phase 4 – Implementation Strategy & Build

Purpose: Create production-ready components with exact styles.

Steps

Atoms first (under src/components/ui/) using shadcn/ui as the base.

Add CVA variants for Figma sizes/tones/states from tokens.

Compose molecules and then organisms with exact spacing/order.

Use Tailwind v5 utilities with CSS vars from globals.css:

e.g., bg-[var(--bg-surface)], .text-primary bridge classes, etc.

No extra features beyond what's visible.

Outputs

src/components/ui/\* (atoms with CVA)

src/components/molecules/\*

src/components/organisms/\*

Updated src/styles/globals.css role mappings (if the section defines roles)

### Phase 5 – Validation

Purpose: Prove 1:1 fidelity.

Checklist

Element order matches Figma (L→R / T→B).

Text content and nav items are verbatim.

Dimensions and spacing match exact px values.

Colors/typography/radii/borders/shadows match tokens.

Container size/padding is exact.

Optional Visuals

Overlay screenshot on rendered component (manual or tooling).

Store results and notes in:

validation/<section>/report.md

validation/<section>/overlays/\*.png (optional)

Outputs

Validation report documenting pass/fail per rule and any deviations.

## Artifacts & Conventions

-
- Tokens JSON: single source of truth per section (`design/tokens/<section>.tokens.json`).
- Findings MD: human summary aligned with JSON (`design/tokens/<section>.tokens.md`).
- Spec MD: low-level coordinates/sizes/text (`analysis/<section>/spec.md`).
- Component Map: `design/maps/<section>.components.yml` defines boundaries and CVA variants.
- `globals.css`: primitives + role mappings (CSS variables). Only adjust role variables per section.
- Naming: kebab-case for files, PascalCase for components, token names in kebab-case or group/name.

## Repo Structure

```
.
├─ analysis/
│  └─ <section>/
│     ├─ screenshots/
│     └─ spec.md
├─ design/
│  ├─ tokens/
│  │  ├─ <section>.tokens.json
│  │  └─ <section>.tokens.md
│  └─ maps/
│     └─ <section>.components.yml
├─ prompts/
│  └─ claude-design-token-extractor.md
├─ templates/
│  └─ tokens.findings.md
├─ src/
│  ├─ components/
│  │  ├─ ui/           # atoms with CVA
│  │  ├─ molecules/
│  │  └─ organisms/
│  └─ styles/
│     └─ globals.css
└─ validation/
   └─ <section>/
      ├─ report.md
      └─ overlays/
```

## How to Add a New Section

- Identify the Figma section (file URL/key and node-id).
- Run Phase 1 to capture screenshots and create `analysis/<section>/spec.md`.
- Run Phase 2 to extract tokens into `design/tokens/<section>.tokens.json` and findings MD.
- Map components in `design/maps/<section>.components.yml` (Phase 3).
- Implement atoms/molecules/organisms under `src/components/*` with CVA and Tailwind (Phase 4).
- Validate against Figma and record results in `validation/<section>/report.md` (Phase 5).

## Non-Goals

- Introducing features not present in the Figma section.
- Global design re-theming beyond role token mapping needed for the section.
- Adding variants not represented in Figma.

## Acceptance Criteria / Definition of Done

✅ Content accuracy: All text/nav items are verbatim from Figma; no placeholders.

✅ Layout precision: All positions, dimensions, spacing match Figma px values.

✅ Styling accuracy: Colors, fonts, sizes, radii, borders, shadows identical to tokens.

✅ Atomic composition: Atoms → molecules → organisms; reusability preserved.

✅ CVA variants: Match Figma variants exactly (no extras).

✅ globals.css: Role tokens mapped and used; no hard-coded colors when a token exists.

✅ Validation: Report shows pass on all checks or documented, justified exceptions.
