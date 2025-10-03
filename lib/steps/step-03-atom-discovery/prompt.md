You are an expert UI/UX designer. Analyze this Figma section and identify ONLY UI components that match valid shadcn/ui components.

Section: "{{SECTION_NAME}}"
Total elements: {{ELEMENT_COUNT}}

COMPLETE ELEMENT LIST:
{{ELEMENT_LIST}}

## VALID SHADCN COMPONENTS
Only identify components that match these available shadcn/ui components:
{{VALID_COMPONENTS}}

## FILTERING RULES

**IMPLEMENT THESE (if they match available shadcn components):**
- Any UI component that has a direct shadcn/ui equivalent from the valid list
- Interactive elements: buttons, inputs, form controls, toggles, switches
- Display components: badges, avatars, cards, alerts, progress bars
- Layout components: separators, accordions, tabs, breadcrumbs
- Overlay components: dialogs, tooltips, popovers, sheets, drawers
- Navigation components: navigation-menu, menubar, sidebar
- Form components: form, select, combobox, radio-group, textarea
- Data components: table, data-table, calendar, date-picker
- Any other component that exists in the shadcn library

**IGNORE COMPLETELY:**
- Any TEXT elements (text, headings, paragraphs)
- Any ICON/VECTOR elements (icons, logos, vectors, illustrations)
- Pure container frames with generic names like "Frame", "Group", "Container"
- Any component that doesn't have a shadcn equivalent from the valid list

## NAMING RULES
For each valid component found:
- Use the **EXACT SHADCN COMPONENT NAME** from the valid list above
- Must match one of the available shadcn components exactly
- Use lowercase names that match shadcn naming conventions

## COMPONENT IDENTIFICATION APPROACH
Identify any component that matches the shadcn library, regardless of complexity:
- **Basic elements**: button, input, label, badge, avatar, separator, checkbox, switch, toggle
- **Display components**: alert, card, progress, skeleton, table, accordion, tabs
- **Interactive components**: dropdown-menu, popover, tooltip, dialog, sheet, drawer
- **Navigation components**: navigation-menu, menubar, sidebar, breadcrumb
- **Form components**: form, select, combobox, radio-group, textarea, slider
- **Data components**: calendar, date-picker, data-table, pagination, chart
- **Layout components**: collapsible, resizable, scroll-area

The key criteria: **Does it exist in shadcn? If yes, identify it.**

Return your response using delimiters to avoid JSON parsing issues:

---COMPONENTS---
For each valid shadcn component found, list on separate lines:
id:actual_element_id|name:shadcn_component_name|type:shadcn_component_name

Example:
id:2606:6342|name:input|type:input
id:2606:6344|name:checkbox|type:checkbox
id:325:2830|name:select|type:select

---SUMMARY---
Brief explanation of components found and why others were excluded.