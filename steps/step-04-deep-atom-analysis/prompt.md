Analyze this Figma component for implementation{{IMPLEMENTATION_TYPE}}.

Component: {{ATOM_NAME}} ({{ATOM_TYPE}})
Component Data: {{ATOM_DATA}}
{{SVG_STATUS}}

Design Tokens Available: {{DESIGN_TOKENS}}

INSTRUCTIONS:
{{ANALYSIS_INSTRUCTIONS}}

2. **Variant Analysis**: Look for different states in the data:
   - Visual differences (colors, sizes, borders)
   - Interactive states (hover, active, disabled, focus)
   - Style variations (filled, outline, ghost, link)
   - Size variations (sm, md, lg, xl)

3. **Design Token Mapping**: Use the extracted design tokens when available:
   - Reference colors from design tokens (e.g., "var(--brand-500)" instead of "#3B82F6")
   - Map component values to design token names where possible
   - Include both token references AND fallback values
   - If tokens aren't available, extract actual values from fills, strokes, effects:
     - Background colors from fills array
     - Text colors from fills in nested TEXT nodes
     - Border radius from cornerRadius
     - Padding/spacing from layoutMode and itemSpacing
     - Typography from fontSize, fontWeight, fontFamily

4. **Smart Props Generation**: Based on component type and variants found:
   - Buttons: variant (default|destructive|outline|secondary|ghost|link), size (default|sm|lg|icon)
   - Inputs: type, placeholder, disabled, required
   - Text: size, weight, color, align
   - Icons: size, color, strokeWidth

Return JSON with CVA-ready variant structure:
{
  "shadcnComponent": "exact_component_name",
  "componentDescription": "Brief description of what this component does",
  "baseClasses": "inline-flex items-center justify-center rounded-md text-sm font-medium",
  "variants": [
    {
      "name": "default",
      "description": "Primary variant for main actions",
      "designValues": {
        "backgroundColor": "var(--brand-500, #3B82F6)",
        "textColor": "var(--neutral-0, #ffffff)",
        "borderRadius": "6px",
        "padding": "8px 16px"
      },
      "shadcnProps": {
        "variant": "bg-primary text-primary-foreground hover:bg-primary/90",
        "size": "h-10 px-4 py-2"
      }
    }
  ],
  "cvaVariants": {
    "variant": {
      "default": "bg-primary text-primary-foreground hover:bg-primary/90",
      "destructive": "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      "outline": "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    },
    "size": {
      "default": "h-10 px-4 py-2",
      "sm": "h-9 rounded-md px-3",
      "lg": "h-11 rounded-md px-8"
    }
  },
  "designTokens": {
    "colors": ["var(--brand-500)", "var(--neutral-0)"],
    "spacing": ["8px", "16px"],
    "typography": "14px/20px Inter"
  },
  "implementationProps": ["variant", "size", "disabled"],
  "usageExamples": [
    "<ComponentName variant='default' size='md'>Primary Action</ComponentName>",
    "<ComponentName variant='outline' size='sm'>Secondary</ComponentName>"
  ]
}