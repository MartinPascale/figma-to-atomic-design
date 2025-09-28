# Section Identification Prompt

**Purpose**: Analyze Figma page structure and categorize sections
**Used by**: `step-02-section-identification.ts`
**Claude Model**: claude-sonnet-4-20250514
**Variables**: PAGE_NAME, CHILDREN_COUNT, CHILDREN_LIST

## Process
Takes page children data and identifies semantic sections (header, hero, content, footer).

## Variables
- `{{PAGE_NAME}}`: Name of the Figma page
- `{{CHILDREN_COUNT}}`: Number of child elements
- `{{CHILDREN_LIST}}`: Formatted list of children with names, IDs, positions

## Output
JSON array of sections with id, name, and type fields.

---

## AI Prompt

Analyze this Figma page structure and identify sections:

Page Data:
- Name: {{PAGE_NAME}}
- Children: {{CHILDREN_COUNT}} items

Children:
{{CHILDREN_LIST}}

Task: For each child, determine:
1. Clean readable name (remove underscores, technical suffixes)
2. Section type: header, hero, navigation, content, footer, or section

Return JSON array with format:
[{"id": "child.id", "name": "Clean Name", "type": "section_type"}]