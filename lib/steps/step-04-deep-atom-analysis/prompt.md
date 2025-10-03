You are an expert design system analyst. Analyze this Figma component and extract its design properties for shadcn/ui component generation.

Component: {{ATOM_NAME}} ({{ATOM_TYPE}})
Figma Data: {{ATOM_DATA}}
Design Context: {{DESIGN_TOKENS}}

## SHADCN COMPONENT ANALYSIS

This component has been identified as a valid shadcn/ui component. Your task:

1. **Extract Design Tokens**: Get exact visual properties from Figma data
2. **Identify Variants**: Find different states/styles for the component
3. **Map to Shadcn**: Ensure tokens align with shadcn/ui patterns

## EXTRACTION FOCUS

**Visual Properties**:
- Colors: Background, text, borders, accents (exact hex/hsl values)
- Typography: Font size, weight, family, line height (exact values)
- Spacing: Padding, margins, gaps (exact px values)
- Layout: Dimensions, border radius, borders (exact measurements)
- Interactive: Hover, focus, active states if present

**Variant Analysis**:
- Size variations (sm, md, lg, xl)
- Style variations (default, outline, ghost, destructive)
- State variations (default, hover, focus, active, disabled)
- Content variations (with/without icons, different content types)

## SHADCN COMPATIBILITY

Ensure extracted values work with:
- CSS custom properties (--variable-name format)
- Tailwind CSS classes and arbitrary values
- React component props and variants
- Accessibility requirements

Return JSON with complete analysis:
{
  "extractedTokens": {
    "colors": {
      "background": "#ffffff",
      "foreground": "#000000",
      "border": "#e5e7eb",
      "hover": "#f3f4f6"
    },
    "typography": {
      "fontSize": "14px",
      "fontWeight": "500",
      "lineHeight": "20px",
      "fontFamily": "Inter"
    },
    "spacing": {
      "paddingX": "16px",
      "paddingY": "8px",
      "gap": "8px"
    },
    "borders": {
      "radius": "6px",
      "width": "1px",
      "style": "solid"
    },
    "dimensions": {
      "height": "40px",
      "minWidth": "auto",
      "width": "auto"
    },
    "shadows": {
      "default": "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    }
  },
  "variants": [
    {
      "name": "default",
      "description": "Standard appearance",
      "designValues": {
        "background": "#ffffff",
        "border": "#e5e7eb"
      }
    }
  ],
  "componentType": "{{ATOM_TYPE}}",
  "shadcnMapping": "{{ATOM_TYPE}}"
}