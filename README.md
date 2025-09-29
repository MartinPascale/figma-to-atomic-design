# figma-to-atomic-design

> Transform Figma designs into production-ready React components with atomic design, shadcn/ui, and design tokens.

A comprehensive CLI tool that uses AI (Claude) to analyze Figma designs and automatically generate TypeScript React components with proper atomic design structure, shadcn/ui integration, and design token extraction.

## 📋 Repository Overview

**This repository contains two things:**

1. **The CLI tool source code** - For development and contribution to the tool itself
2. **A test environment** - For testing the tool during development

**For external projects**, this tool would eventually be published as an NPM package that you run in your own Vite + React + TypeScript projects.

## 🚀 Quick Start

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
```

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

# Or test from root (analysis only, no project integration)
cd ..
npm run dev "FIGMA_URL" --skip-setup --output ./outputs
```

## ✨ What It Does

1. **🔍 Analyzes Figma designs** using AI to identify atomic components
2. **📦 Detects your project** (Vite + React + TypeScript)
3. **⚙️ Configures everything** automatically (Tailwind, shadcn/ui, CVA)
4. **🎨 Extracts design tokens** (colors, typography, spacing, shadows)
5. **🧩 Generates React components** with CVA variants and TypeScript
6. **🎭 Creates design system** with CSS variables and atomic structure

## 🏗️ Architecture

This project uses a clean, modular architecture with a 5-step processing pipeline:

```
figma-to-atomic-design/
├── cli.ts                    # Main CLI entry point
├── index.ts                  # Library entry point
├── lib/                      # All implementation code
│   ├── steps/                # 5-step processing pipeline
│   │   ├── step-01-url-processing/      # URL parsing & API validation
│   │   ├── step-02-section-identification/ # Figma data fetching
│   │   ├── step-03-atom-discovery/      # AI component identification
│   │   ├── step-04-deep-atom-analysis/  # Component implementation
│   │   └── step-05-token-extraction/    # Design token extraction
│   ├── setup/                # Project setup utilities
│   ├── utils/                # Helper functions
│   ├── resources/            # Reference data (shadcn components)
│   └── templates/            # Code generation templates
├── outputs/                  # Generated analysis & components
├── test-project/             # Test Vite + React + TS project
└── Documentation...
```

### 5-Step Processing Pipeline

1. **URL Processing** - Parse Figma URLs and validate API keys
2. **Section Identification** - Fetch Figma data and identify UI sections
3. **Atom Discovery** - Use AI to identify atomic components
4. **Deep Analysis** - Generate implementation with shadcn/ui + CVA
5. **Token Extraction** - Extract design tokens as CSS variables

## 📁 Generated Output Structure

### Analysis Files (outputs/)
```
outputs/
├── section-analysis-*.md              # AI analysis of sections
└── components/
    └── atoms/
        └── ComponentName/
            ├── ComponentName.tsx      # React component
            ├── analysis.json          # Component data
            └── README.md              # Human-readable analysis
```

### Target Project Integration
```
your-project/src/
└── components/
    └── atoms/
        └── ComponentName/
            └── ComponentName.tsx      # Auto-copied for development
```

## 🧩 Generated Component Example

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

## ⚙️ Setup & Configuration

### API Keys Required

1. **Figma Token**: https://figma.com/developers/api#access-tokens
2. **Claude API Key**: https://console.anthropic.com/

```bash
# .env file
FIGMA_ACCESS_TOKEN=figd_your_figma_token
ANTHROPIC_API_KEY=sk-ant-your_claude_key
```

### CLI Options

```bash
figma-atomic "FIGMA_URL" [options]

Options:
  -o, --output DIR        Output directory (default: ./src)
  --figma-token TOKEN     Figma access token
  --claude-key KEY        Claude API key
  --skip-setup           Skip project setup (Tailwind, shadcn)
  --help                 Show help
```

### Project Requirements

- **Vite + React + TypeScript** project (for full integration)
- **Node.js 18+**
- Valid Figma design URL

## 🧪 Testing This Repository

**This repository provides multiple ways to test the tool during development:**

```bash
# 1. Test package structure (no API keys needed)
npm run test:demo

# 2. Test with real Figma design in the test-project (API keys required)
cd test-project
npm run figma "FIGMA_URL"

# 3. Test from root (analysis only, generates in ./outputs)
npm run dev "FIGMA_URL" --skip-setup --output ./outputs
```

For detailed testing instructions, see [TESTING.md](./TESTING.md).

**Note**: When this tool is published as an NPM package, external users would simply run `npx figma-to-atomic "FIGMA_URL"` in their own projects.

## 🎨 Design Token System

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

## 🛠️ Development

### Project Structure

- **`/lib`** - All implementation code organized by function
- **`/test-project`** - Test Vite project for development
- **`/outputs`** - Generated analysis and components
- **Root level** - CLI entry points and configuration

### Key Files

- **`cli.ts`** - Main CLI interface
- **`index.ts`** - Library interface for programmatic use
- **`lib/steps/`** - Core processing pipeline
- **`lib/setup/`** - Project configuration utilities

### Development Commands

```bash
# Build TypeScript (for NPM distribution)
npm run build

# Test the CLI with a Figma URL
npm run dev "FIGMA_URL"

# Test package structure without API calls
npm run test:demo

# Run the test Vite project
npm run test:vite
```

### Current State

- ✅ **Fully functional CLI** - Works for analyzing Figma designs
- ✅ **Complete component generation** - TypeScript + CVA + shadcn/ui
- ✅ **Design token extraction** - CSS variables generated
- 🚧 **NPM package** - Ready for publishing when needed
- ✅ **Test environment** - Complete test-project for development

## 📊 Component Analysis Data

Each generated component includes comprehensive analysis:

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

## 🚀 Workflow

### For External Projects (Future)
1. **Design in Figma** - Create your UI designs
2. **Run CLI** - `npx figma-to-atomic "FIGMA_URL"` in your Vite + React + TS project
3. **Get Components** - Production-ready React components generated in `src/components/atoms/`
4. **Use Immediately** - Import and use in your React app

### For This Repository (Development)
1. **Design in Figma** - Create your UI designs
2. **Test CLI** - `cd test-project && npm run figma "FIGMA_URL"`
3. **Review Output** - Check generated components and analysis files
4. **Iterate** - Modify the tool and retest

## 📚 Documentation

- **[NPM-PACKAGE.md](./NPM-PACKAGE.md)** - Detailed usage as NPM package
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate `/lib` subdirectory
4. Test with the test-project
5. Submit a pull request

## ⚡ Features

- ✅ **Modular architecture** - Clean separation of concerns
- ✅ **AI-powered analysis** - Intelligent component identification
- ✅ **Production-ready code** - TypeScript, CVA, shadcn/ui
- ✅ **Design token extraction** - Automated CSS variable generation
- ✅ **Atomic design** - Proper component organization
- ✅ **Project integration** - Automatic setup and configuration
- ✅ **Comprehensive testing** - Multiple testing approaches

---

**Transform your Figma designs into production code in minutes, not hours.** 🎉