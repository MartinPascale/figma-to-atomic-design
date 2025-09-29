You are an expert UI/UX designer. Analyze this Figma section and identify ALL atomic UI components.

Section: "{{SECTION_NAME}}"
Total elements: {{ELEMENT_COUNT}}

COMPLETE ELEMENT LIST:
{{ELEMENT_LIST}}

TASK: Identify atomic UI components (atoms) from the list above that can be implemented as interactive components. Include:
- Any TEXT elements that are labels, headings, or interactive text
- Any INSTANCE elements that are buttons, inputs, form controls, etc.
- Interactive components like: Button, Input, Text Label, Link, Search Field, Navigation Links, etc.

IGNORE:
- Pure container frames with generic names like "Frame", "Group", "Container"
- VECTOR elements (icons, logos, illustrations)
- Any elements with names containing "icon", "logo", "vector", or "illustration"
- Decorative or static visual elements that cannot be implemented as interactive components

For each atom found, give it a clean, descriptive name and categorize its type.

Return JSON array with ALL atoms found:
[{"id": "actual_element_id", "name": "Clean descriptive name", "type": "atom_type"}]

Valid types: button, text, input, link, label, badge, search, navigation