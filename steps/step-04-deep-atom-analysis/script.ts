import { getFigmaData } from '../step-02-section-identification/script'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { execSync } from 'child_process'

export async function analyzeAtomForImplementation(
  fileKey: string,
  atom: any,
  sectionName: string,
  figmaToken: string,
  claudeApiKey: string,
  validShadcnComponents: Set<string>
): Promise<void> {
  try {
    console.log(`      📡 Getting detailed data for ${atom.name}...`)

    // Get detailed component data from Figma API
    const atomData = await getFigmaData(fileKey, atom.id, figmaToken)

    // Extract design tokens for this specific atom
    console.log(`      🎨 Extracting design tokens for ${atom.name}...`)
    const designTokens = await extractAtomTokens(atomData, atom, claudeApiKey)

    // Handle vector elements differently - extract SVG
    let svgCode = null
    if (atom.type === 'icon' || atom.type === 'logo' || atomData.type === 'VECTOR') {
      console.log(`      🖼️ Extracting SVG code for vector element...`)
      svgCode = await extractSVGFromFigma(atom.id)
    }

    // Analyze variants and properties with Claude
    const analysis = await analyzeAtomVariants(atomData, atom, svgCode, claudeApiKey, designTokens)

    console.log(`      📊 Found ${analysis.variants?.length || 0} variants`)
    analysis.variants?.forEach((variant, i) => {
      console.log(`         ${i + 1}. ${variant.name} - ${variant.description}`)
    })

    // Install shadcn component only if it's valid and not a vector
    if (analysis.shadcnComponent && !svgCode) {
      if (validShadcnComponents.has(analysis.shadcnComponent)) {
        console.log(`      📦 Installing shadcn component: ${analysis.shadcnComponent}`)
        await installShadcnComponent(analysis.shadcnComponent)
      } else {
        console.log(`      ⚠️ Invalid shadcn component: ${analysis.shadcnComponent} - skipping installation`)
      }
    } else if (svgCode) {
      console.log(`      🎨 Creating custom SVG component instead of installing shadcn component`)
      await createSVGComponent(atom, svgCode, sectionName)
    }

    // Generate React component
    await generateReactComponent(atom, analysis, sectionName, svgCode, designTokens)

    // Update component index
    await updateComponentIndex(atom, analysis)

    // Update main component index
    await updateMainComponentIndex()

    // Save comprehensive component data
    await saveComponentData(atom, analysis, designTokens, svgCode)

  } catch (error) {
    console.log(`      ❌ Failed to analyze ${atom.name}: ${error.message}`)
  }
}

async function extractAtomTokens(atomData: any, atom: any, claudeApiKey: string): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const prompt = loadPrompt('step-05-token-extraction', {
    FIGMA_FILE_KEY: 'atom-specific',
    NODE_ID: atom.id,
    SECTION_DATA: JSON.stringify(atomData, null, 2)
  })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0]?.text || ''

    // Extract JSON from Claude's response
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      jsonMatch = content.match(/\{[\s\S]*?\}/)
    }

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const tokens = JSON.parse(jsonStr.trim())

      // Add metadata
      tokens.meta = {
        ...tokens.meta,
        atomId: atom.id,
        atomName: atom.name,
        analyzedAt: new Date().toISOString()
      }

      return tokens
    }

    throw new Error('No valid JSON found in Claude response')
  } catch (error) {
    console.log(`      ⚠️ Token extraction failed: ${error.message}`)
    return {
      meta: { atomId: atom.id, atomName: atom.name, analyzedAt: new Date().toISOString() },
      colors: { primitives: [] },
      typography: [],
      spacing: { scalePx: [], evidence: [] }
    }
  }
}

async function extractSVGFromFigma(nodeId: string): Promise<string | null> {
  try {
    // Note: This is a placeholder for MCP integration
    // In a real implementation, this would use the Figma MCP get_code tool
    // For now, we'll return null and handle it gracefully
    console.log(`      🔧 MCP SVG extraction not yet implemented for node ${nodeId}`)
    return null
  } catch (error) {
    console.log(`      ❌ Failed to extract SVG: ${error.message}`)
    return null
  }
}

async function createSVGComponent(atom: any, svgCode: string, sectionName: string): Promise<void> {
  try {
    const componentName = atom.name.replace(/\s+/g, '') + 'Icon'
    const filename = `src/components/icons/${componentName}.tsx`

    const componentCode = `import React from 'react'

interface ${componentName}Props {
  className?: string
  size?: number
  color?: string
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  className,
  size = 24,
  color = 'currentColor'
}) => {
  return (
    ${svgCode}
  )
}

export default ${componentName}
`

    // Ensure directory exists
    const dir = dirname(filename)
    mkdirSync(dir, { recursive: true })

    writeFileSync(filename, componentCode)
    console.log(`      📝 Created SVG component: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to create SVG component: ${error.message}`)
  }
}

async function analyzeAtomVariants(atomData: any, atom: any, svgCode: string | null, claudeApiKey: string, designTokens?: any): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')
  const isVector = svgCode || atom.type === 'icon' || atom.type === 'logo' || atomData.type === 'VECTOR'

  const analysisInstructions = isVector ? `
**VECTOR/ICON COMPONENT ANALYSIS:**
1. **Component Type**: This is a vector/icon element - DO NOT map to shadcn components
2. **Analysis Focus**:
   - Extract visual properties (colors, stroke width, size)
   - Identify use cases and variants
   - Design custom component props (size, color, className)
3. **Implementation**: Custom React component with SVG
` : `
**SHADCN COMPONENT ANALYSIS:**
1. **Component Mapping**: Map to the closest shadcn/ui component from this EXACT list:
   - button, input, badge, avatar, separator, checkbox, switch, select, textarea, label
   - accordion, alert, alert-dialog, breadcrumb, calendar, card, carousel, chart
   - collapsible, combobox, command, context-menu, data-table, date-picker
   - dialog, drawer, dropdown-menu, form, hover-card, navigation-menu, pagination
   - popover, progress, radio-group, scroll-area, sheet, sidebar, skeleton
   - slider, sonner, table, tabs, toast, toggle, toggle-group, tooltip
   - ONLY use these exact names - if no match, return "custom"`

  const prompt = loadPrompt('step-04-deep-atom-analysis', {
    IMPLEMENTATION_TYPE: isVector ? ' as a custom icon/vector component' : ' with shadcn/ui',
    ATOM_NAME: atom.name,
    ATOM_TYPE: atom.type,
    ATOM_DATA: JSON.stringify(atomData, null, 2),
    SVG_STATUS: svgCode ? 'SVG Code Available: Yes' : 'SVG Code: None',
    ANALYSIS_INSTRUCTIONS: analysisInstructions,
    DESIGN_TOKENS: designTokens ? JSON.stringify(designTokens, null, 2) : 'No design tokens available'
  })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0]?.text || ''

    // Extract JSON from Claude's response
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      jsonMatch = content.match(/\{[\s\S]*?\}/)
    }

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      return JSON.parse(jsonStr.trim())
    }

    return { variants: [], designTokens: {}, implementationProps: [] }
  } catch (error) {
    console.log(`      ⚠️ Variant analysis failed: ${error.message}`)
    return { variants: [], designTokens: {}, implementationProps: [] }
  }
}

async function installShadcnComponent(componentName: string): Promise<void> {
  try {
    console.log(`      ⚡ Running: npx shadcn@latest add ${componentName}`)
    execSync(`npx shadcn@latest add ${componentName}`, { stdio: 'pipe' })
    console.log(`      ✅ Installed ${componentName}`)
  } catch (error) {
    console.log(`      ❌ Failed to install ${componentName}: ${error.message}`)
  }
}

async function generateReactComponent(atom: any, analysis: any, sectionName: string, svgCode?: string | null, designTokens?: any): Promise<void> {
  try {
    const isVector = svgCode || atom.type === 'icon' || atom.type === 'logo'
    const componentName = atom.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')

    if (isVector) {
      // Custom SVG component already handled in createSVGComponent
      console.log(`      🎨 Custom SVG component handled separately`)
      return
    }

    // Generate React component with CVA variants
    const componentCode = generateShadcnComponent(componentName, analysis, designTokens)

    // Validate component code
    const validation = validateComponentCode(componentCode, componentName)
    if (!validation.isValid) {
      console.log(`      ⚠️ Component validation warnings: ${validation.warnings.join(', ')}`)
    }

    // Save to src/components/atoms directory
    const filename = `src/components/atoms/${componentName}.tsx`
    mkdirSync(dirname(filename), { recursive: true })
    writeFileSync(filename, componentCode)

    console.log(`      📝 Generated React component: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to generate React component: ${error.message}`)
  }
}

function generateShadcnComponent(componentName: string, analysis: any, designTokens?: any): string {
  const shadcnComponent = analysis.shadcnComponent || 'Button'
  const baseClasses = analysis.baseClasses || 'inline-flex items-center justify-center'
  const cvaVariants = analysis.cvaVariants || {}

  // Use CVA variants from analysis, or fallback to generated ones
  const variantConfig = Object.keys(cvaVariants).length > 0
    ? cvaVariants
    : generateFallbackVariants(analysis.variants || [])

  // Get default variant values
  const defaultVariants = getDefaultVariants(variantConfig)

  return `import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ${shadcnComponent} } from '@/components/ui/${analysis.shadcnComponent?.toLowerCase() || 'button'}'

const ${componentName.toLowerCase()}Variants = cva(
  "${baseClasses}",
  {
    variants: ${JSON.stringify(variantConfig, null, 6)},
    defaultVariants: ${JSON.stringify(defaultVariants, null, 6)}
  }
)

export interface ${componentName}Props
  extends React.ComponentProps<typeof ${shadcnComponent}>,
    VariantProps<typeof ${componentName.toLowerCase()}Variants> {
  children?: React.ReactNode
}

const ${componentName} = React.forwardRef<
  React.ElementRef<typeof ${shadcnComponent}>,
  ${componentName}Props
>(({ className, variant, children, ...props }, ref) => {
  return (
    <${shadcnComponent}
      className={cn(${componentName.toLowerCase()}Variants({ variant, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </${shadcnComponent}>
  )
})

${componentName}.displayName = "${componentName}"

export { ${componentName}, ${componentName.toLowerCase()}Variants }
export default ${componentName}
`
}

function generateFallbackVariants(variants: any[]): any {
  const fallback: any = {}

  variants.forEach((variant: any) => {
    if (variant.shadcnProps) {
      Object.entries(variant.shadcnProps).forEach(([key, value]) => {
        if (!fallback[key]) fallback[key] = {}
        fallback[key][variant.name.toLowerCase().replace(/\s+/g, '-')] = value
      })
    }
  })

  // Ensure we have at least variant and size
  if (!fallback.variant) {
    fallback.variant = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90"
    }
  }
  if (!fallback.size) {
    fallback.size = {
      default: "h-10 px-4 py-2"
    }
  }

  return fallback
}

function getDefaultVariants(variantConfig: any): any {
  const defaults: any = {}

  Object.keys(variantConfig).forEach(key => {
    const variants = Object.keys(variantConfig[key])
    defaults[key] = variants.includes('default') ? 'default' : variants[0]
  })

  return defaults
}

function validateComponentCode(code: string, componentName: string): { isValid: boolean, warnings: string[] } {
  const warnings: string[] = []
  let isValid = true

  // Check for required imports
  if (!code.includes("import React from 'react'")) {
    warnings.push('Missing React import')
    isValid = false
  }

  if (!code.includes('class-variance-authority')) {
    warnings.push('Missing CVA import')
  }

  // Check for proper component structure
  if (!code.includes(`const ${componentName} = React.forwardRef`)) {
    warnings.push('Component not using forwardRef pattern')
  }

  if (!code.includes('displayName')) {
    warnings.push('Missing displayName')
  }

  // Check for proper exports
  if (!code.includes(`export { ${componentName}`)) {
    warnings.push('Missing named export')
  }

  if (!code.includes(`export default ${componentName}`)) {
    warnings.push('Missing default export')
  }

  // Check for TypeScript interfaces
  if (!code.includes(`interface ${componentName}Props`)) {
    warnings.push('Missing props interface')
  }

  return { isValid, warnings }
}

async function updateComponentIndex(atom: any, analysis: any): Promise<void> {
  try {
    const isVector = atom.type === 'icon' || atom.type === 'logo'
    const componentName = atom.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')

    if (isVector) {
      // Update icons index
      await updateIndexFile('src/components/icons/index.ts', `${componentName}Icon`, `./${componentName}Icon`)
    } else {
      // Update atoms index
      await updateIndexFile('src/components/atoms/index.ts', componentName, `./${componentName}`)
    }

    // Create lib/utils.ts if it doesn't exist
    await ensureUtilsFile()

    console.log(`      📋 Updated component index for ${componentName}`)
  } catch (error) {
    console.log(`      ⚠️ Failed to update component index: ${error.message}`)
  }
}

async function updateIndexFile(indexPath: string, componentName: string, importPath: string): Promise<void> {
  const { readFileSync, writeFileSync, existsSync } = await import('fs')
  const { dirname } = await import('path')

  // Ensure directory exists
  mkdirSync(dirname(indexPath), { recursive: true })

  let content = ''
  if (existsSync(indexPath)) {
    content = readFileSync(indexPath, 'utf-8')
  }

  const exportLine = `export { default as ${componentName} } from '${importPath}'`

  // Add export if not already present
  if (!content.includes(exportLine)) {
    content += (content ? '\n' : '') + exportLine + '\n'
    writeFileSync(indexPath, content)
  }
}

async function ensureUtilsFile(): Promise<void> {
  const { writeFileSync, existsSync } = await import('fs')
  const utilsPath = 'src/lib/utils.ts'

  if (!existsSync(utilsPath)) {
    mkdirSync(dirname(utilsPath), { recursive: true })

    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
    writeFileSync(utilsPath, utilsContent)
    console.log(`      🔧 Created lib/utils.ts`)
  }
}

async function updateMainComponentIndex(): Promise<void> {
  try {
    const { readFileSync, writeFileSync, existsSync } = await import('fs')
    const mainIndexPath = 'src/components/index.ts'

    let content = `// Auto-generated component index
// This file is automatically updated when components are generated

`

    // Add atoms export if directory exists
    if (existsSync('src/components/atoms/index.ts')) {
      content += `export * from './atoms'\n`
    }

    // Add icons export if directory exists
    if (existsSync('src/components/icons/index.ts')) {
      content += `export * from './icons'\n`
    }

    mkdirSync(dirname(mainIndexPath), { recursive: true })
    writeFileSync(mainIndexPath, content)

    console.log(`      📋 Updated main component index`)
  } catch (error) {
    console.log(`      ⚠️ Failed to update main component index: ${error.message}`)
  }
}

async function saveComponentData(atom: any, analysis: any, designTokens: any, svgCode?: string | null): Promise<void> {
  const componentName = atom.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
  const isVector = svgCode || atom.type === 'icon' || atom.type === 'logo'

  // Create comprehensive component data
  const componentData = {
    meta: {
      name: atom.name,
      cleanName: componentName,
      type: atom.type,
      figmaId: atom.id,
      isVector,
      generatedAt: new Date().toISOString()
    },
    designTokens,
    implementation: {
      shadcnComponent: analysis.shadcnComponent,
      baseClasses: analysis.baseClasses,
      variants: analysis.variants || [],
      cvaVariants: analysis.cvaVariants || {},
      props: analysis.implementationProps || [],
      usageExamples: analysis.usageExamples || []
    },
    files: {
      component: isVector ? `src/components/icons/${componentName}Icon.tsx` : `src/components/atoms/${componentName}.tsx`,
      svgCode: svgCode || null
    }
  }

  // Save JSON data file
  const jsonFile = `components/${componentName}.component.json`
  mkdirSync(dirname(jsonFile), { recursive: true })
  writeFileSync(jsonFile, JSON.stringify(componentData, null, 2))

  // Save human-readable markdown (optional but helpful)
  const markdown = generateComponentMarkdown(componentData)
  const mdFile = `components/${componentName}.component.md`
  writeFileSync(mdFile, markdown)

  console.log(`      📝 Saved component data:`)
  console.log(`         JSON: ${jsonFile}`)
  console.log(`         MD:   ${mdFile}`)
}

function generateComponentMarkdown(data: any): string {
  const { meta, designTokens, implementation, files } = data

  return `# ${meta.name}

**Type:** ${meta.type}
**Generated:** ${new Date(meta.generatedAt).toLocaleString()}
**Figma ID:** ${meta.figmaId}
**Implementation:** ${meta.isVector ? 'Custom SVG' : 'shadcn/ui'}

## Component Files
- **Component:** \`${files.component}\`
${files.svgCode ? `- **SVG Code:** Available` : ''}

## Design Tokens
\`\`\`json
${JSON.stringify(designTokens, null, 2)}
\`\`\`

## Implementation
- **Base Component:** ${implementation.shadcnComponent || 'Custom'}
- **Base Classes:** \`${implementation.baseClasses || 'N/A'}\`
- **Variants:** ${implementation.variants.length}
- **Props:** ${implementation.props.join(', ') || 'None'}

## Variants
${implementation.variants.map((variant: any, i: number) => `### ${i + 1}. ${variant.name}
${variant.description}

**Design Values:**
${variant.designValues ? Object.entries(variant.designValues).map(([key, value]) => `- ${key}: \`${value}\``).join('\n') : 'None'}
`).join('\n') || 'No variants defined'}

## Usage
\`\`\`tsx
import { ${meta.cleanName} } from '@/components'

<${meta.cleanName} ${implementation.props.map((prop: string) => `${prop}="..."`).join(' ')} />
\`\`\`

---
*Generated by Figma Agent*`
}