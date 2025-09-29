# figma-to-atomic

Transform Figma designs into production-ready React components with atomic design, shadcn/ui, and design tokens.

## 🚀 **Quick Start**

### **In any Vite + React + TypeScript project:**

```bash
# Run directly with npx
npx figma-to-atomic "https://figma.com/design/YOUR_FILE_KEY/Design?node-id=X-Y"

# Or install globally
npm install -g figma-to-atomic
figma-atomic "https://figma.com/design/YOUR_FILE_KEY/Design?node-id=X-Y"
```

## ✨ **What it does automatically:**

1. **🔍 Detects your project** - Vite + React + TypeScript
2. **📦 Installs dependencies** - Tailwind CSS, shadcn/ui, CVA, etc.
3. **⚙️ Configures everything** - components.json, tailwind.config.js, utils
4. **🎨 Analyzes Figma design** - Extracts atoms, tokens, variants
5. **🧩 Generates React components** - CVA variants, TypeScript, shadcn/ui
6. **🎭 Creates design system** - CSS variables, globals.css, atomic structure

## 📁 **Output Structure**

```
your-project/
├── src/
│   ├── components/
│   │   ├── index.ts              # All component exports
│   │   ├── atoms/
│   │   │   ├── index.ts          # Atom exports
│   │   │   └── PrimaryButton.tsx # Generated component
│   │   └── icons/
│   │       ├── index.ts          # Icon exports
│   │       └── LogoIcon.tsx      # Generated icon
│   ├── lib/
│   │   └── utils.ts              # cn() utility
│   └── globals.css               # Design tokens
├── components/
│   ├── PrimaryButton.component.json  # Component data
│   └── PrimaryButton.component.md    # Human analysis
├── components.json               # shadcn/ui config
└── tailwind.config.js           # Tailwind config
```

## 🧩 **Generated Component Example**

```tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const primaryButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)

export interface PrimaryButtonProps
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof primaryButtonVariants> {}

const PrimaryButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  PrimaryButtonProps
>(({ className, variant, size, ...props }, ref) => {
  return (
    <Button
      className={cn(primaryButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

PrimaryButton.displayName = "PrimaryButton"
export { PrimaryButton, primaryButtonVariants }
```

## 🎯 **Usage in your app**

```tsx
import { PrimaryButton, LogoIcon } from '@/components'

function App() {
  return (
    <div>
      <LogoIcon size={32} className="mb-4" />
      <PrimaryButton variant="default" size="lg">
        Get Started
      </PrimaryButton>
      <PrimaryButton variant="destructive" size="sm">
        Delete
      </PrimaryButton>
    </div>
  )
}
```

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Required
FIGMA_ACCESS_TOKEN=your_figma_token
ANTHROPIC_API_KEY=your_claude_key
```

### **CLI Options**
```bash
figma-atomic "FIGMA_URL" [options]

Options:
  -o, --output DIR        Output directory (default: ./src)
  --figma-token TOKEN     Figma access token
  --claude-key KEY        Claude API key
  --skip-setup           Skip project setup
  --help                 Show help
```

## 🔧 **Setup Requirements**

### **Get API Keys:**
1. **Figma Token**: https://figma.com/developers/api#access-tokens
2. **Claude API Key**: https://console.anthropic.com/

### **Project Requirements:**
- Vite + React + TypeScript project
- Node.js 18+

## 🎨 **Design Token System**

Extracted tokens become CSS variables:

```css
:root {
  /* Figma-extracted colors */
  --brand-primary: #3B82F6;
  --neutral-0: #ffffff;
  --neutral-900: #000000;

  /* Typography */
  --text-sm: 0.875rem;
  --text-base: 1rem;

  /* Spacing */
  --space-4: 1rem;
  --space-8: 2rem;
}
```

## 📊 **Component Analysis Data**

Each component gets a `.component.json` file with:

```json
{
  "meta": {
    "name": "Primary Button",
    "type": "button",
    "figmaId": "123:456"
  },
  "designTokens": {
    "colors": { "primitives": [...] },
    "typography": [...],
    "spacing": {...}
  },
  "implementation": {
    "shadcnComponent": "Button",
    "variants": [...],
    "cvaVariants": {...}
  }
}
```

## 🚀 **Workflow**

1. Design in Figma
2. Run `figma-atomic "FIGMA_URL"`
3. Get production-ready components
4. Use in your React app immediately

**That's it!** 🎉