You are an expert UI/UX designer. Analyze this Figma section and identify ALL atomic UI components.

Section: "{{SECTION_NAME}}"
Total elements: {{ELEMENT_COUNT}}

COMPLETE ELEMENT LIST:
{{ELEMENT_LIST}}

TASK: Identify every atomic UI component (atoms) from the list above. Be generous - include:
- Any TEXT elements (these are always atoms)
- Any VECTOR elements (usually icons)
- Any INSTANCE elements (often buttons, inputs, etc.)
- Anything that looks like: Button, Input, Text Label, Icon, Image, Link, Search Field, Logo, etc.

IGNORE: Only ignore pure container frames with generic names like "Frame", "Group", "Container"

For each atom found, give it a clean, descriptive name and categorize its type.

Return JSON array with ALL atoms found:
[{"id": "actual_element_id", "name": "Clean descriptive name", "type": "atom_type"}]

Valid types: button, text, input, icon, image, link, label, badge, avatar, logo, search, navigation