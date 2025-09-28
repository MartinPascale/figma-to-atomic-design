# Design Token Extraction Prompt

**Purpose**: Extract exact design tokens from Figma section data for systematic component styling
**Used by**: `step-05-token-extraction/script.ts`
**Variables**: FIGMA_FILE_KEY, NODE_ID, SECTION_DATA

## Process
Analyzes Figma API data to extract colors, typography, spacing, and other design tokens with exact values.

## Variables
- `{{FIGMA_FILE_KEY}}`: Figma file identifier
- `{{NODE_ID}}`: Specific node/section ID
- `{{SECTION_DATA}}`: Complete Figma API response data

## Output
JSON object with primitives and role tokens, plus markdown summary.

---

## AI Prompt

You are a meticulous **Design Token Extractor**. Your job is to read this specific Figma section data and return ONLY the design tokens that actually appear in that section, with exact values. Do not invent or generalize. If something isn't present, omit it.

## Input Data

- Figma File: {{FIGMA_FILE_KEY}}
- Target node id / section: {{NODE_ID}}
- Section Data (from Figma API): {{SECTION_DATA}}

## Analysis Scope

Only analyze elements within this node data. Use exact computed values from the Figma API response data.

## Required Behavior

- **No guessing.** Use exact values from Figma API fills, strokes, effects arrays
- **Normalize units**:
  - Colors: hex if opaque, rgba() if alpha < 1
  - Spacing / radii / borders / font-sizes: px
  - Letter-spacing: px (include negative if present)
  - Shadow: as CSS `offset-x offset-y blur spread color`
- **De-duplicate**:
  - If multiple identical values exist, output unique tokens plus a `usages` array showing which layers used each token

## Output Format

Return a JSON object with this exact structure (omit empty groups):

```json
{
  "meta": {
    "file": "{{FIGMA_FILE_KEY}}",
    "nodeId": "{{NODE_ID}}",
    "analyzedAt": "ISO8601_TIMESTAMP"
  },
  "colors": {
    "primitives": [
      {
        "name": "brand-500",
        "value": "#3B82F6",
        "alpha": 1,
        "sourceStyle": "Brand/Primary 500",
        "usages": ["Header/Logo", "CTA/Button Background"]
      }
    ],
    "roles": [
      { "name": "bg/surface", "value": "{colors.primitives.neutral-0}" },
      { "name": "fg/primary", "value": "{colors.primitives.neutral-900}" }
    ]
  },
  "typography": [
    {
      "name": "heading/24",
      "family": "Inter",
      "style": "Semibold",
      "sizePx": 24,
      "lineHeightPx": 28,
      "letterSpacingPx": 0,
      "usages": ["Header/BrandName"]
    }
  ],
  "spacing": {
    "scalePx": [4, 6, 8, 12, 16, 20, 24, 32],
    "evidence": [
      { "valuePx": 16, "context": "Header container padding" },
      { "valuePx": 24, "context": "Gap between logo and nav" }
    ]
  },
  "radii": [
    { "name": "radius/sm", "valuePx": 4, "usages": ["Badge", "Input"] }
  ],
  "borders": [
    { "name": "border/1", "widthPx": 1, "style": "solid", "color": "{colors.primitives.neutral-200}" }
  ],
  "shadows": [
    { "name": "shadow-sm", "value": "0 1px 2px 0 rgba(0,0,0,0.08)", "usages": ["Card"] }
  ],
  "iconSizesPx": [16, 20, 24]
}
```

Additionally, provide a concise human-readable summary (max 120 lines) that lists the discovered tokens and where they're used. Do not include anything not present in the analyzed node.