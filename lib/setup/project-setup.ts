import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..')

export interface ProjectSetupResult {
  success: boolean
  type?: string
  error?: string
}

export async function setupProject(options: any = {}): Promise<ProjectSetupResult> {
  try {
    // Detect project type
    const projectType = detectProjectType()
    if (!projectType) {
      return {
        success: false,
        error: 'Not a supported project type. Please run this in a Vite + React + TypeScript project.'
      }
    }

    console.log(`🔍 Detected: ${projectType}`)

    if (options.skipSetup) {
      console.log('⏭️  Skipping project setup')
      return { success: true, type: projectType }
    }

    // Setup steps
    await setupTailwind()
    await setupShadcnUI()
    await installDependencies()
    await setupUtilsFile()
    await setupGlobalsCSS()

    return { success: true, type: projectType }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function detectProjectType(): string | null {
  // Check for Vite + React + TypeScript
  if (existsSync('vite.config.ts') || existsSync('vite.config.js')) {
    const packageJson = readPackageJson()
    if (packageJson?.dependencies?.react && packageJson?.devDependencies?.typescript) {
      return 'Vite + React + TypeScript'
    }
    if (packageJson?.dependencies?.react) {
      return 'Vite + React (⚠️  TypeScript recommended)'
    }
  }

  // Check for other project types
  if (existsSync('next.config.js') || existsSync('next.config.ts')) {
    return 'Next.js (⚠️  Experimental support)'
  }

  return null
}

function readPackageJson(): any {
  try {
    const content = readFileSync('package.json', 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function setupTailwind(): Promise<void> {
  const packageJson = readPackageJson()

  if (!packageJson?.devDependencies?.tailwindcss) {
    console.log('📦 Installing Tailwind CSS...')

    try {
      execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'pipe' })
      execSync('npx tailwindcss init -p', { stdio: 'pipe' })

      // Update tailwind.config.js
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`

      writeFileSync('tailwind.config.js', tailwindConfig)
      console.log('   ✅ Tailwind CSS configured')
    } catch (error) {
      console.log('   ⚠️  Tailwind CSS setup failed, continuing...')
    }
  } else {
    console.log('✅ Tailwind CSS already installed')
  }
}

async function setupShadcnUI(): Promise<void> {
  if (!existsSync('components.json')) {
    console.log('🎨 Setting up shadcn/ui...')

    const componentsConfig = {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "default",
      "rsc": false,
      "tsx": true,
      "tailwind": {
        "config": "tailwind.config.js",
        "css": "src/index.css",
        "baseColor": "slate",
        "cssVariables": true,
        "prefix": ""
      },
      "aliases": {
        "components": "src/components",
        "utils": "src/utils"
      }
    }

    writeFileSync('components.json', JSON.stringify(componentsConfig, null, 2))
    console.log('   ✅ shadcn/ui configured')
  } else {
    console.log('✅ shadcn/ui already configured')
  }
}

async function installDependencies(): Promise<void> {
  const packageJson = readPackageJson()
  const requiredDeps = ['class-variance-authority', 'clsx', 'tailwind-merge']
  const missingDeps = requiredDeps.filter(dep => !packageJson?.dependencies?.[dep])

  if (missingDeps.length > 0) {
    console.log(`📦 Installing required dependencies: ${missingDeps.join(', ')}`)
    try {
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'pipe' })
      console.log('   ✅ Dependencies installed')
    } catch (error) {
      console.log('   ⚠️  Some dependencies failed to install, continuing...')
    }
  } else {
    console.log('✅ All dependencies already installed')
  }
}

async function setupGlobalsCSS(): Promise<void> {
  const cssPath = resolve('src/index.css')
  const templatePath = resolve(rootDir, 'lib/templates/globals.css')

  if (existsSync(cssPath) && existsSync(templatePath)) {
    console.log('🎨 Setting up design tokens (globals.css)...')

    try {
      // Read the current CSS file to check if it already has our template
      const currentCSS = readFileSync(cssPath, 'utf-8')

      if (currentCSS.includes('@import \'tailwindcss\'') || currentCSS.includes('Primitive tokens')) {
        console.log('   ✅ Design tokens already integrated')
        return
      }

      // Read the template
      const templateCSS = readFileSync(templatePath, 'utf-8')

      // Write the new globals.css
      writeFileSync(cssPath, templateCSS)

      console.log('   ✅ Design tokens integrated into src/index.css')
      console.log('   📋 Original file backed up as src/index.css.backup')

    } catch (error) {
      console.log('   ⚠️ Failed to setup globals.css: ' + error.message)
    }
  } else {
    console.log('   ⚠️ Globals.css template not found, skipping...')
  }
}

async function setupUtilsFile(): Promise<void> {
  const utilsDir = resolve('src')
  const utilsPath = resolve(utilsDir, 'utils.ts')

  if (!existsSync(utilsPath)) {
    console.log('🔧 Creating utils file...')

    try {
      // Create directory if it doesn't exist
      if (!existsSync(utilsDir)) {
        mkdirSync(utilsDir, { recursive: true })
      }

      // Create utils.ts file with cn function
      const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`

      writeFileSync(utilsPath, utilsContent)
      console.log('   ✅ Created src/utils.ts')

    } catch (error) {
      console.log('   ⚠️ Failed to create utils file: ' + error.message)
    }
  } else {
    console.log('✅ Utils file already exists')
  }
}