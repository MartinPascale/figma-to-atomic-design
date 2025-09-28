# Shadcn/UI Available Components

This file contains all available shadcn/ui components that can be installed via CLI.

## Complete Component List

The following components are available for installation using `npx shadcn@latest add [component-name]`:

### Layout & Navigation
- `accordion`
- `breadcrumb`
- `navigation-menu`
- `menubar`
- `sidebar`
- `tabs`

### Form Controls
- `button`
- `checkbox`
- `combobox`
- `form` (React Hook Form integration)
- `input`
- `input-otp`
- `label`
- `radio-group`
- `select`
- `slider`
- `switch`
- `textarea`
- `toggle`
- `toggle-group`

### Display & Feedback
- `alert`
- `avatar`
- `badge`
- `card`
- `progress`
- `separator`
- `skeleton`
- `table`
- `toast`
- `sonner` (toast notifications)

### Overlays & Modals
- `alert-dialog`
- `dialog`
- `drawer`
- `dropdown-menu`
- `hover-card`
- `popover`
- `sheet`
- `tooltip`
- `context-menu`

### Data & Visualization
- `calendar`
- `carousel`
- `chart`
- `command`
- `data-table`
- `date-picker`
- `pagination`

### Utilities
- `aspect-ratio`
- `collapsible`
- `resizable`
- `scroll-area`
- `typography`

## Usage Notes

- Use exact component names as listed above
- All components support TypeScript
- Components follow the design system patterns
- Icons should use Lucide React (already installed) or custom SVG components
- For custom designs not matching these components, create custom components

## Component Categories for Mapping

### Atomic Components (suitable for atoms)
- `button`, `input`, `label`, `badge`, `avatar`, `separator`, `checkbox`, `switch`, `toggle`

### Molecular Components (not suitable for atoms)
- `form`, `data-table`, `navigation-menu`, `dropdown-menu`, `dialog`, `card` (when complex)

### Custom Handling Required
- **Icons/Vectors**: Extract SVG from Figma, don't install shadcn component
- **Logos**: Create custom component with Figma SVG
- **Complex layouts**: May need custom implementation

---
*Reference for Independent Figma Agent - Updated 2025-09-26*