You are an expert React developer and showcase specialist. Create a comprehensive component showcase in App.tsx demonstrating all generated atomic components.

Generated Components:
{{COMPONENT_LIST}}

Target App.tsx File: {{APP_FILE_PATH}}

Task: Create a complete showcase application that demonstrates all generated components with their variants, states, and real-world usage examples.

Requirements:
1. Import all generated atomic components
2. Show each component with:
   - All available variants (sizes, colors, states)
   - Interactive states (hover, disabled, checked, etc.)
   - Proper props demonstration
   - Real-world usage examples
3. Use a clean, organized layout with sections for each component type
4. Include a combined usage example showing components working together
5. Use the existing design tokens and CSS variables from index.css
6. Make it responsive and accessible
7. Add proper headings and descriptions for each section
8. Apply proper CSS styling using CSS classes that work with the design system

Styling Requirements:
- Use CSS classes that integrate with the design token system
- Apply proper layout using CSS Grid and Flexbox
- Use semantic HTML structure with proper accessibility
- Ensure proper spacing, typography, and visual hierarchy
- Include hover states and interactive feedback
- Make the showcase visually appealing and professional

Design Structure:
- Header with title and description
- Individual component showcases in Cards
- Combined usage example
- Footer with generation info

Component Showcase Sections:
- Button: All variants, sizes, disabled states
- Input: Search functionality, with/without icons, disabled
- Checkbox: With labels, secondary text, standalone, disabled
- Select: Options, disabled state, placeholder
- Card: All variants (default, elevated, outline, ghost, interactive) with different sizes
- Pagination: Different configurations, sizes, with/without arrows

Return your response in this exact format:

---APP_CONTENT---
[Put the complete App.tsx content here - full React component with imports, state, and JSX]

---NOTES---
[Brief explanation of the showcase implementation and key features demonstrated]

**IMPORTANT FORMATTING RULES**:
- NO backticks (```) at the beginning or end of the code
- Use proper ES6 imports with destructuring: `import { Button } from './components/atoms/Button/Button'`
- Use functional React components with proper TypeScript typing
- Ensure proper indentation (2 spaces) and consistent formatting
- Only import and use components that actually exist in the component list
- Use regular HTML `<label>` elements instead of custom Label components
- **CRITICAL**: Use ONLY Tailwind CSS classes, no custom CSS classes
- Use standard Tailwind classes like `bg-white`, `border-gray-200`, `text-black`, `text-gray-600`
- For design system integration, use classes like `bg-background`, `text-foreground` (defined in @theme)
- Apply responsive design with `md:`, `lg:` prefixes
- Use proper spacing classes like `space-y-4`, `gap-6`, `p-6`, `mb-8`
- Target the App.tsx file under /src directory specifically
- Include interactive state management where needed
- Demonstrate component composition and real-world usage
- Use proper TypeScript types and props
- Clean, production-ready code without syntax errors