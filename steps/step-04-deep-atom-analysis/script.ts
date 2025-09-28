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

    // Handle vector elements differently - extract SVG
    let svgCode = null
    if (atom.type === 'icon' || atom.type === 'logo' || atomData.type === 'VECTOR') {
      console.log(`      🎨 Extracting SVG code for vector element...`)
      svgCode = await extractSVGFromFigma(atom.id)
    }

    // Analyze variants and properties with Claude
    const analysis = await analyzeAtomVariants(atomData, atom, svgCode, claudeApiKey)

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

    // Save implementation details
    await saveAtomImplementation(atom, analysis, sectionName, svgCode)

  } catch (error) {
    console.log(`      ❌ Failed to analyze ${atom.name}: ${error.message}`)
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

async function analyzeAtomVariants(atomData: any, atom: any, svgCode: string | null, claudeApiKey: string): Promise<any> {
  const { loadPrompt } = await import('../../src/utils/prompt-loader')
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
    ANALYSIS_INSTRUCTIONS: analysisInstructions
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

async function saveAtomImplementation(atom: any, analysis: any, sectionName: string, svgCode?: string | null): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `atom-implementation-${atom.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`

  const isVector = svgCode || atom.type === 'icon' || atom.type === 'logo'

  const markdown = `# Implementation: ${atom.name}

**Generated:** ${new Date().toLocaleString()}
**Section:** ${sectionName}
**Type:** ${atom.type}
**Figma ID:** ${atom.id}
**Component:** ${analysis.componentDescription || 'Component for user interface'}
**Implementation:** ${isVector ? 'Custom SVG Component' : 'Shadcn Component'}

${isVector ? `## Custom SVG Component
This component uses a custom SVG extracted from Figma design.

### Component Location
\`src/components/icons/${atom.name.replace(/\s+/g, '') + 'Icon'}.tsx\`

### SVG Code
${svgCode ? `\`\`\`svg
${svgCode}
\`\`\`` : 'SVG extraction pending - will be implemented when MCP integration is complete'}
` : `## Shadcn Component Installation`}
\`\`\`bash
npx shadcn@latest add ${analysis.shadcnComponent || 'N/A'}
\`\`\`

## Component Variants
${analysis.variants?.map((variant, i) => `### ${i + 1}. ${variant.name}
**Description:** ${variant.description}

**Design Values:**
${variant.designValues ? Object.entries(variant.designValues).map(([key, value]) => `- ${key}: \`${value}\``).join('\n') : 'No design values extracted'}

**Shadcn Props:**
\`\`\`tsx
${JSON.stringify(variant.shadcnProps, null, 2)}
\`\`\`
`).join('\n') || 'No variants identified'}

## Extracted Design Tokens
\`\`\`json
${JSON.stringify(analysis.designTokens, null, 2)}
\`\`\`

## Implementation Props
${analysis.implementationProps?.map(prop => `- \`${prop}\``).join('\n') || 'No props identified'}

## Usage Examples
${analysis.usageExamples?.map((example, i) => `### Example ${i + 1}
\`\`\`tsx
${example}
\`\`\`
`).join('\n') || `\`\`\`tsx
import { ${analysis.shadcnComponent || 'Component'} } from "@/components/ui/${analysis.shadcnComponent || 'component'}"

<${analysis.shadcnComponent || 'Component'}
  ${analysis.implementationProps?.map(prop => `${prop}="..."`).join('\n  ') || ''}
>
  ${atom.name}
</${analysis.shadcnComponent || 'Component'}>
\`\`\`
`}

## Implementation Notes
- Component mapped to: **${analysis.shadcnComponent}**
- Total variants identified: **${analysis.variants?.length || 0}**
- Props to implement: **${analysis.implementationProps?.length || 0}**

---
*Generated by Independent Figma Agent*`

  try {
    writeFileSync(filename, markdown)
    console.log(`      📝 Saved implementation to: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to save implementation: ${error.message}`)
  }
}