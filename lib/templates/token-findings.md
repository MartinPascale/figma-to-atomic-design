# Design Tokens — <Section Name> (<Node ID>)

**File:** <Figma File or Key>  
**Node:** <Node ID>  
**Analyzed:** <ISO8601>

---

## Colors

### Primitives

| Name       | Value           | Alpha | Source Style      | Usages                             |
| ---------- | --------------- | ----- | ----------------- | ---------------------------------- |
| brand-500  | #3B82F6         | 1     | Brand/Primary 500 | Header/Logo; CTA/Button Background |
| text-muted | rgba(0,0,0,0.6) | 0.6   | —                 | Nav/Item/Secondary                 |

### Roles

| Role           | Primitive Reference             |
| -------------- | ------------------------------- |
| bg/surface     | {colors.primitives.neutral-0}   |
| fg/primary     | {colors.primitives.neutral-900} |
| accent/default | {colors.primitives.brand-500}   |
| accent/hover   | {colors.primitives.brand-600}   |

---

## Typography

| Name       | Family | Style    | Size (px) | Line Height (px) | Letter Spacing (px) | Case | Decoration | Source     | Usages               |
| ---------- | ------ | -------- | --------- | ---------------- | ------------------- | ---- | ---------- | ---------- | -------------------- |
| heading/24 | Inter  | Semibold | 24        | 28               | 0                   | none | none       | Heading/H4 | Header/BrandName     |
| body/14    | Inter  | Regular  | 14        | 20               | 0                   | none | none       | Body/Sm    | Nav/Item; Badge/Text |

---

## Spacing

**Scale (px):** 4, 6, 8, 12, 16, 20, 24, 32

**Evidence**

- 16 — Header container padding
- 24 — Gap between logo and nav

---

## Radii

| Name      | Value (px) | Usages       |
| --------- | ---------- | ------------ |
| radius/sm | 4          | Badge; Input |
| radius/md | 8          | Button       |

---

## Borders

| Name     | Width (px) | Style | Color                           | Usages |
| -------- | ---------- | ----- | ------------------------------- | ------ |
| border/1 | 1          | solid | {colors.primitives.neutral-200} | Input  |

---

## Shadows

| Name      | CSS Value                    | Usages |
| --------- | ---------------------------- | ------ |
| shadow-sm | 0 1px 2px 0 rgba(0,0,0,0.08) | Card   |

---

## Opacity

| Name          | Value | Usages         |
| ------------- | ----- | -------------- |
| opacity/muted | 0.6   | Icon/Secondary |

---

## Grid

| Name           | Columns | Gutter (px) | Margin (px) | Type    | Usages      |
| -------------- | ------- | ----------- | ----------- | ------- | ----------- |
| container/grid | 12      | 24          | 120         | stretch | Header root |

---

## Icon Sizes (px)

16, 20, 24

---

## Breakpoints (px)

| Name | Min Width | Evidence                |
| ---- | --------- | ----------------------- |
| sm   | 640       | Auto-layout constraints |
| md   | 768       | —                       |

---

## Notes / Conflicts

- <List any duplicate or conflicting tokens found>
