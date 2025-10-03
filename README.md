# figma-to-atomic-design

> Transform Figma designs into production-ready React components with atomic design, shadcn/ui, and comprehensive component showcases.

A comprehensive CLI tool that uses AI (Claude) to analyze Figma designs and automatically generate TypeScript React components with proper atomic design structure, shadcn/ui integration, design token extraction, and interactive component showcases.

## 📋 Repository Overview

**This repository contains two things:**

1. **The CLI tool source code** - For development and contribution to the tool itself
2. **A test environment** - For testing the tool during development

**For external projects**, this tool would eventually be published as an NPM package that you run in your own Vite + React + TypeScript projects.

## ⚙️ Setup & Configuration

### API Keys Required

1. **Figma Token**: https://figma.com/developers/api#access-tokens
2. **Claude API Key**: https://console.anthropic.com/

```bash
# .env file
FIGMA_ACCESS_TOKEN=figd_your_figma_token
ANTHROPIC_API_KEY=sk-ant-your_claude_key
```


## 🚀 Quick Start

### 🛠️ Developing This Repository

```bash
# Clone and setup the development environment
git clone <this-repo>
cd figma-to-atomic-design
npm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env: add your FIGMA_ACCESS_TOKEN and ANTHROPIC_API_KEY

# Test the tool using the included test-project
cd test-project
npm run figma "FIGMA_URL"

# View the generated showcase
npm run dev
# Open http://localhost:5173 to see component showcase
```

### 🔧 Using This Tool in External Projects (Future NPM Package)

```bash
# In your Vite + React + TypeScript project:

# Set up API keys first
echo "FIGMA_ACCESS_TOKEN=your_token" >> .env
echo "ANTHROPIC_API_KEY=your_key" >> .env

# Run the tool (when published)
npx figma-to-atomic "https://figma.com/design/YOUR_FILE_KEY/Design?node-id=X-Y"

# Generated components will appear in:
# src/components/atoms/ComponentName/ComponentName.tsx
# src/App.tsx - Interactive component showcase
```

## 🏗️ Architecture

This project uses a clean, modular architecture with a **6-step processing pipeline**:

```
figma-to-atomic-design/
├── cli.ts                    # Main CLI entry point
├── index.ts                  # Library entry point
├── lib/                      # All implementation code
│   ├── steps/                # 6-step processing pipeline
│   │   ├── step-01-url-processing/         # URL parsing & API validation
│   │   ├── step-02-section-identification/ # Figma data fetching
│   │   ├── step-03-atom-discovery/         # AI component identification
│   │   ├── step-04-deep-atom-analysis/     # Token & variant analysis
│   │   ├── step-05-component-generation/   # React component generation
│   │   └── step-06-component-showcase/     # Interactive App.tsx showcase
│   ├── setup/                # Project setup utilities
│   ├── utils/                # Helper functions
│   ├── resources/            # Reference data (shadcn components)
│   └── templates/            # Code generation templates
├── outputs/                  # Generated analysis & components
├── test-project/             # Test Vite + React + TS project
└── Documentation...
```

### 6-Step Processing Pipeline

1. **URL Processing** - Parse Figma URLs and validate API keys
2. **Section Identification** - Fetch Figma data and identify UI sections
3. **Atom Discovery** - Use AI to identify atomic components
4. **Deep Analysis** - Extract design tokens and analyze variants
5. **Component Generation** - Generate React components with shadcn/ui + CVA
6. **Component Showcase** - Create interactive App.tsx demonstrating all components

## 📁 Generated Output Structure

### Analysis Files (outputs/)
```
outputs/
├── section-analysis-*.md              # AI analysis of sections
├── component-showcase-*.md            # Showcase implementation details
└── components/
    └── atoms/
        └── ComponentName/
            ├── ComponentName.tsx      # React component
            └── summary.json           # Component metadata
```

### Target Project Integration
```
your-project/src/
├── App.tsx                            # Interactive component showcase
├── index.css                         # Design tokens + Tailwind v4
└── components/
    └── atoms/
        └── ComponentName/
            └── ComponentName.tsx      # Generated component
```

## 🧩 Generated Component Example

```tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "Loading..." : children}
      </button>
    )
  }
)

Button.displayName = "Button"
export { Button, buttonVariants }
```

## 🎨 Design Token System

### Tailwind CSS v4 Integration

The tool generates modern **Tailwind CSS v4** compatible styles:

```css
@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 0 0% 0%;
  --color-primary: 222.2 84% 4.9%;
  --color-secondary: 210 40% 96%;
  --color-border: 214.3 31.8% 91.4%;
}

:root {
  /* Figma-extracted design tokens */
  --brand-50: #eff6ff;
  --brand-500: #3b82f6;
  --brand-900: #1e3a8a;

  /* Typography */
  --font-inter: 'Inter', system-ui, sans-serif;

  /* Spacing scale */
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Component-specific tokens */
  --button-height: 40px;
  --button-border-radius: 6px;
  --input-background: #ffffff;
  --input-border: #9e9e9e;
}
```

### Project Requirements

- **Vite + React + TypeScript** project (for full integration)
- **Node.js 18+**
- **Tailwind CSS v4** (automatically configured)
- Valid Figma design URL

**Note**: When this tool is published as an NPM package, external users would simply run `npx figma-to-atomic "FIGMA_URL"` in their own projects.

## 🛠️ Development

### Project Structure

- **`/lib`** - All implementation code organized by function
- **`/test-project`** - Test Vite project for development
- **`/outputs`** - Generated analysis and components
- **Root level** - CLI entry points and configuration

### Key Files

- **`cli.ts`** - Main CLI interface
- **`index.ts`** - Library interface for programmatic use
- **`lib/steps/`** - Core 6-step processing pipeline
- **`lib/setup/`** - Project configuration utilities
- **`lib/utils/shadcn-loader.ts`** - Dynamic shadcn component loading

## 📊 Component Analysis Data

Each generated component includes comprehensive metadata:

```json
{
  "name": "Button",
  "figmaId": "123:456",
  "atomicType": "button",
  "generatedAt": "2025-09-29T00:00:00.000Z",
  "usageExample": "<Button variant='primary' size='lg'>Click me</Button>",
  "variantCount": 12
}
```

## 🚀 Workflow

### For This Repository (Development)
1. **Design in Figma** - Create your UI designs
2. **Test CLI** - `cd test-project && npm run figma "FIGMA_URL"`
3. **View Showcase** - `npm run dev` to see interactive component demo
4. **Review Output** - Check generated components and analysis files
5. **Iterate** - Modify the tool and retest

### For External Projects (Future)
1. **Design in Figma** - Create your UI designs
2. **Run CLI** - `npx figma-to-atomic "FIGMA_URL"` in your Vite + React + TS project
3. **Get Components** - Production-ready React components generated in `src/components/atoms/`
4. **View Showcase** - Interactive demo automatically created in `src/App.tsx`
5. **Use Immediately** - Import and use in your React app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate `/lib` subdirectory
4. Test with the test-project
5. Submit a pull request

---

**Transform your Figma designs into production code with interactive showcases in minutes, not hours.** 🎉