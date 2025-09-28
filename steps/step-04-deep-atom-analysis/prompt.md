Analyze this Figma component for implementation{{IMPLEMENTATION_TYPE}}.

Component: {{ATOM_NAME}} ({{ATOM_TYPE}})
Component Data: {{ATOM_DATA}}
{{SVG_STATUS}}

INSTRUCTIONS:
{{ANALYSIS_INSTRUCTIONS}}

2. **Variant Analysis**: Look for different states in the data:
   - Visual differences (colors, sizes, borders)
   - Interactive states (hover, active, disabled, focus)
   - Style variations (filled, outline, ghost, link)
   - Size variations (sm, md, lg, xl)

3. **Design Token Extraction**: Extract actual values from fills, strokes, effects:
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

Return JSON with ACTUAL extracted values:
{
  "shadcnComponent": "exact_component_name",
  "componentDescription": "Brief description of what this component does",
  "variants": [
    {
      "name": "variant_name",
      "description": "When/how to use this variant",
      "designValues": {
        "backgroundColor": "actual_hex_value",
        "textColor": "actual_hex_value",
        "borderRadius": "actual_number_px",
        "padding": "actual_spacing_values"
      },
      "shadcnProps": {"variant": "default", "size": "md"}
    }
  ],
  "designTokens": {
    "extracted_from_fills_and_strokes": "actual_values_only"
  },
  "implementationProps": ["prop1", "prop2"],
  "usageExamples": [
    "<Button variant='default' size='md'>Primary Action</Button>",
    "<Button variant='outline' size='sm'>Secondary</Button>"
  ]
}