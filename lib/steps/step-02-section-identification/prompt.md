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

## Section Type Identification

For each child element, analyze the name, position, and context to determine the most appropriate section type:

**Available Types:**
- `header` - Top navigation, site header, page header
- `hero` - Main banner, hero section, primary call-to-action area
- `navigation` - Main navigation menu, breadcrumbs, menu bars
- `content` - Main content area, product sections, body content
- `footer` - Bottom section, site footer, contact info
- `section` - Generic section, misc content, sidebar

**Classification Guidelines:**
- Consider position: First elements often headers, last often footers
- Analyze names: Look for keywords like "header", "nav", "hero", "banner", "footer", "content"
- Consider common UI patterns: Headers at top, footers at bottom, heroes after headers
- Use context: Multiple content sections can exist, use specific names when possible

**Name Cleaning:**
- Remove underscores, hyphens, technical suffixes
- Convert to readable format
- Keep meaningful descriptive terms

Return JSON array with format:
[{"id": "child.id", "name": "Clean Name", "type": "section_type"}]

Example:
[
  {"id": "123", "name": "Site Header", "type": "header"},
  {"id": "456", "name": "Hero Banner", "type": "hero"},
  {"id": "789", "name": "Product Grid", "type": "content"}
]