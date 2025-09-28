#!/usr/bin/env node
// Independent Figma Agent - Uses Figma API + Claude AI Model

import 'dotenv/config'

class IndependentFigmaAgent {
  private figmaToken: string
  private claudeApiKey: string

  private validShadcnComponents: Set<string> = new Set()

  constructor() {
    this.figmaToken = process.env.FIGMA_ACCESS_TOKEN || ''
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || ''
    this.loadShadcnComponents()
  }

  private async loadShadcnComponents(): Promise<void> {
    try {
      const fs = await import('fs')
      const path = await import('path')
      const componentFile = path.resolve('shadcn-components.md')

      if (fs.existsSync(componentFile)) {
        const content = fs.readFileSync(componentFile, 'utf-8')
        // Extract component names from markdown (lines starting with - `)
        const matches = content.match(/- `([^`]+)`/g)
        if (matches) {
          matches.forEach(match => {
            const component = match.match(/- `([^`]+)`/)?.[1]
            if (component) {
              this.validShadcnComponents.add(component)
            }
          })
        }
        console.log(`📋 Loaded ${this.validShadcnComponents.size} valid shadcn components`)
      }
    } catch (error) {
      console.log(`⚠️ Could not load shadcn components list: ${error.message}`)
    }
  }

  async run() {
    const args = process.argv.slice(2)

    if (args.length === 0 || args.includes('--help')) {
      this.showHelp()
      return
    }

    const figmaUrl = args[0]
    console.log('🤖 Independent Figma Agent')
    console.log(`📄 URL: ${figmaUrl}`)

    try {
      // Validate API keys
      if (!this.figmaToken) {
        throw new Error('FIGMA_ACCESS_TOKEN required in .env file')
      }

      if (!this.claudeApiKey) {
        throw new Error('ANTHROPIC_API_KEY required in .env file')
      }

      // Extract node ID and file key
      const { nodeId, fileKey } = this.parseUrl(figmaUrl)
      console.log(`🔍 File: ${fileKey}, Node: ${nodeId}`)

      // Get page data from Figma API
      console.log('📡 Fetching from Figma API...')
      const pageData = await this.getFigmaData(fileKey, nodeId)

      // Analyze sections with Claude AI
      console.log('🧠 Analyzing with Claude AI...')
      const sections = await this.analyzeWithClaude(pageData)

      // Show results
      console.log(`\\n✅ Analysis Complete!`)
      console.log(`📊 Found ${sections.length} sections:`)

      sections.forEach((section, i) => {
        console.log(`   ${i + 1}. ${section.name} (${section.type}) [${section.id}]`)
      })

      // Analyze atoms in the first section only
      if (sections.length > 0) {
        console.log(`\\n🔬 Analyzing atoms in first section: ${sections[0].name}`)
        await this.analyzeAtomsInSection(fileKey, sections[0])
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`)

      if (error.message.includes('FIGMA_ACCESS_TOKEN')) {
        console.log(`\\n💡 Get token: https://figma.com/developers/api#access-tokens`)
        console.log(`   Add to .env: FIGMA_ACCESS_TOKEN=your_token`)
      }

      if (error.message.includes('ANTHROPIC_API_KEY')) {
        console.log(`\\n💡 Get API key: https://console.anthropic.com/`)
        console.log(`   Add to .env: ANTHROPIC_API_KEY=your_key`)
      }
    }
  }

  private parseUrl(url: string): { nodeId: string, fileKey: string } {
    try {
      const urlObj = new URL(url)
      const nodeId = urlObj.searchParams.get('node-id')?.replace('-', ':')
      const pathParts = urlObj.pathname.split('/')
      const fileKey = pathParts[2] // /design/FILE_KEY/...

      if (!nodeId || !fileKey) {
        throw new Error('Invalid Figma URL')
      }

      return { nodeId, fileKey }
    } catch {
      throw new Error('Could not parse Figma URL - ensure format: https://figma.com/design/FILE_KEY/NAME?node-id=X-Y')
    }
  }

  private async getFigmaData(fileKey: string, nodeId: string): Promise<any> {
    const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`

    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.figmaToken
      }
    })

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const nodeData = data.nodes[nodeId]?.document

    if (!nodeData) {
      throw new Error(`Node ${nodeId} not found`)
    }

    return nodeData
  }

  private async analyzeWithClaude(pageData: any): Promise<Array<{id: string, name: string, type: string}>> {
    const prompt = `Analyze this Figma page structure and identify sections:

Page Data:
- Name: ${pageData.name}
- Children: ${pageData.children?.length || 0} items

Children:
${pageData.children?.map((child: any, i: number) =>
  `${i + 1}. "${child.name}" (id: ${child.id}, y: ${child.y || 0}, height: ${child.height || 0})`
).join('\\n') || 'No children'}

Task: For each child, determine:
1. Clean readable name (remove underscores, technical suffixes)
2. Section type: header, hero, navigation, content, footer, or section

Return JSON array with format:
[{"id": "child.id", "name": "Clean Name", "type": "section_type"}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
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
      const errorText = await response.text()
      console.log(`Claude API Response: ${response.status} - ${errorText}`)
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const content = result.content[0]?.text || ''

    try {
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\\[.*\\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback: basic analysis without Claude
      console.log('⚠️ Claude analysis failed, using basic analysis')
    }

    // Fallback analysis
    return this.basicAnalysis(pageData)
  }

  private basicAnalysis(pageData: any): Array<{id: string, name: string, type: string}> {
    if (!pageData?.children) return []

    return pageData.children.map((child: any, index: number) => {
      const name = child.name?.replace(/[_-]/g, ' ').trim() || `Section ${index + 1}`
      const lowerName = name.toLowerCase()
      const isFirst = index === 0
      const isLast = index === pageData.children.length - 1

      let type = 'section'
      if (isFirst && lowerName.includes('header')) type = 'header'
      else if (isLast && lowerName.includes('footer')) type = 'footer'
      else if (lowerName.includes('hero') || lowerName.includes('banner')) type = 'hero'
      else if (lowerName.includes('nav')) type = 'navigation'
      else if (lowerName.includes('content') || lowerName.includes('product')) type = 'content'

      return { id: child.id, name, type }
    })
  }

  private async analyzeAtomsInSection(fileKey: string, section: {id: string, name: string, type: string}): Promise<void> {
    console.log(`\\n   🔍 Section: ${section.name}`)

    try {
      // Get detailed section data from Figma API
      const sectionData = await this.getFigmaData(fileKey, section.id)

      // Identify atoms using Claude AI
      const atoms = await this.identifyAtoms(sectionData, section.name)

      // Show atoms found
      if (atoms.length > 0) {
        console.log(`      ⚛️  Found ${atoms.length} atoms:`)
        atoms.forEach((atom, i) => {
          console.log(`         ${i + 1}. ${atom.name} (${atom.type})`)
        })

        // Analyze ONLY the first atom in detail for variants and implementation
        console.log(`\\n🔧 Analyzing first atom for deep implementation...`)
        console.log(`\\n   🧩 Deep Analysis - Atom 1: ${atoms[0].name}`)
        console.log(`   📝 Note: Focusing on single atom for comprehensive analysis`)
        await this.analyzeAtomForImplementation(fileKey, atoms[0], section.name)

        console.log(`\\n   ⏭️  Remaining atoms (${atoms.length - 1}) available for future analysis:`)
        atoms.slice(1).forEach((atom, i) => {
          console.log(`      ${i + 2}. ${atom.name} (${atom.type}) - ID: ${atom.id}`)
        })
      } else {
        console.log(`      ⚛️  No atoms detected`)
      }

    } catch (error) {
      console.log(`      ❌ Failed to analyze section: ${error.message}`)
    }
  }

  private async identifyAtoms(sectionData: any, sectionName: string): Promise<Array<{name: string, type: string, id: string}>> {
    // Get all nested elements with complete information
    const allElements = this.flattenElements(sectionData)

    console.log(`      📊 Found ${allElements.length} total elements in section`)

    // Debug: show first few elements
    if (allElements.length > 0) {
      console.log(`      🔍 Sample elements:`)
      allElements.slice(0, 3).forEach(el => {
        console.log(`         - "${el.name}" (${el.type})`)
      })
    }

    const prompt = `You are an expert UI/UX designer. Analyze this Figma section and identify ALL atomic UI components.

Section: "${sectionName}"
Total elements: ${allElements.length}

COMPLETE ELEMENT LIST:
${allElements.map((element: any, i: number) =>
  `${i + 1}. Name: "${element.name}" | Type: ${element.type || 'FRAME'} | ID: ${element.id}`
).join('\\n')}

TASK: Identify every atomic UI component (atoms) from the list above. Be generous - include:
- Any TEXT elements (these are always atoms)
- Any VECTOR elements (usually icons)
- Any INSTANCE elements (often buttons, inputs, etc.)
- Anything that looks like: Button, Input, Text Label, Icon, Image, Link, Search Field, Logo, etc.

IGNORE: Only ignore pure container frames with generic names like "Frame", "Group", "Container"

For each atom found, give it a clean, descriptive name and categorize its type.

Return JSON array with ALL atoms found:
[{"id": "actual_element_id", "name": "Clean descriptive name", "type": "atom_type"}]

Valid types: button, text, input, icon, image, link, label, badge, avatar, logo, search, navigation`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
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

      console.log(`      🤖 Claude response length: ${content.length} chars`)
      console.log(`      🤖 Full response: ${content}`)

      // Extract JSON from Claude's response (handle code blocks)
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (!jsonMatch) {
        // Try without code blocks
        jsonMatch = content.match(/\[[\s\S]*?\]/)
      }
      if (!jsonMatch) {
        // Try with different code block patterns
        jsonMatch = content.match(/```\s*\[([\s\S]*?)\]\s*```/)
      }

      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        // Clean up the JSON string
        jsonStr = jsonStr.trim()

        try {
          const atoms = JSON.parse(jsonStr)
          console.log(`      ✅ Claude found ${atoms.length} atoms`)

          // Save to markdown file
          await this.saveAtomsToMarkdown(sectionName, atoms, content)

          return atoms
        } catch (parseError) {
          console.log(`      ❌ JSON parse error: ${parseError.message}`)
          console.log(`      🔍 Attempted to parse: ${jsonStr.substring(0, 100)}...`)
        }
      }

      console.log(`      ❌ No valid JSON found in Claude response`)
      return []
    } catch (error) {
      console.log(`      ⚠️ Claude analysis failed: ${error.message}`)
      // Just return all elements as potential atoms - let's be generous
      return allElements.filter(el =>
        el.type === 'TEXT' ||
        el.type === 'VECTOR' ||
        el.type === 'INSTANCE' ||
        el.name.toLowerCase().includes('button') ||
        el.name.toLowerCase().includes('icon') ||
        el.name.toLowerCase().includes('text')
      ).map(el => ({
        id: el.id,
        name: el.name,
        type: el.type === 'TEXT' ? 'text' : el.type === 'VECTOR' ? 'icon' : 'button'
      }))
    }
  }

  private async analyzeAtomForImplementation(fileKey: string, atom: any, sectionName: string): Promise<void> {
    try {
      console.log(`      📡 Getting detailed data for ${atom.name}...`)

      // Get detailed component data from Figma API
      const atomData = await this.getFigmaData(fileKey, atom.id)

      // Handle vector elements differently - extract SVG
      let svgCode = null
      if (atom.type === 'icon' || atom.type === 'logo' || atomData.type === 'VECTOR') {
        console.log(`      🎨 Extracting SVG code for vector element...`)
        svgCode = await this.extractSVGFromFigma(atom.id)
      }

      // Analyze variants and properties with Claude
      const analysis = await this.analyzeAtomVariants(atomData, atom, svgCode)

      console.log(`      📊 Found ${analysis.variants?.length || 0} variants`)
      analysis.variants?.forEach((variant, i) => {
        console.log(`         ${i + 1}. ${variant.name} - ${variant.description}`)
      })

      // Install shadcn component only if it's valid and not a vector
      if (analysis.shadcnComponent && !svgCode) {
        if (this.validShadcnComponents.has(analysis.shadcnComponent)) {
          console.log(`      📦 Installing shadcn component: ${analysis.shadcnComponent}`)
          await this.installShadcnComponent(analysis.shadcnComponent)
        } else {
          console.log(`      ⚠️ Invalid shadcn component: ${analysis.shadcnComponent} - skipping installation`)
        }
      } else if (svgCode) {
        console.log(`      🎨 Creating custom SVG component instead of installing shadcn component`)
        await this.createSVGComponent(atom, svgCode, sectionName)
      }

      // Save implementation details
      await this.saveAtomImplementation(atom, analysis, sectionName, svgCode)

    } catch (error) {
      console.log(`      ❌ Failed to analyze ${atom.name}: ${error.message}`)
    }
  }

  private async extractSVGFromFigma(nodeId: string): Promise<string | null> {
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

  private async createSVGComponent(atom: any, svgCode: string, sectionName: string): Promise<void> {
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

      const fs = await import('fs')
      const path = await import('path')

      // Ensure directory exists
      const dir = path.dirname(filename)
      fs.mkdirSync(dir, { recursive: true })

      fs.writeFileSync(filename, componentCode)
      console.log(`      📝 Created SVG component: ${filename}`)
    } catch (error) {
      console.log(`      ❌ Failed to create SVG component: ${error.message}`)
    }
  }

  private async analyzeAtomVariants(atomData: any, atom: any, svgCode?: string | null): Promise<any> {
    const isVector = svgCode || atom.type === 'icon' || atom.type === 'logo' || atomData.type === 'VECTOR'

    const prompt = `Analyze this Figma component for implementation${isVector ? ' as a custom icon/vector component' : ' with shadcn/ui'}.

Component: ${atom.name} (${atom.type})
Component Data: ${JSON.stringify(atomData, null, 2)}
${svgCode ? `SVG Code Available: Yes` : 'SVG Code: None'}

INSTRUCTIONS:
${isVector ? `
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
}

2. **Variant Analysis**: Look for different states in the data:
   - Visual differences (colors, sizes, borders)
   - Interactive states (hover, active, disabled, focus)
   - Style variations (filled, outline, ghost, link)
   - Size variations (sm, md, lg, xl)

3. **Design Token Extraction**: Extract actual values from fills, strokes, effects:
   - Background colors from fills array
   - Text colors from fills in nested TEXT nodes
   - Border radius from cornerRadius
   - Padding/spacing from layoutMode and itemSpacing
   - Typography from fontSize, fontWeight, fontFamily

4. **Smart Props Generation**: Based on component type and variants found:
   - Buttons: variant (default|destructive|outline|secondary|ghost|link), size (default|sm|lg|icon)
   - Inputs: type, placeholder, disabled, required
   - Text: size, weight, color, align
   - Icons: size, color, strokeWidth

Return JSON with ACTUAL extracted values:
{
  "shadcnComponent": "exact_component_name",
  "componentDescription": "Brief description of what this component does",
  "variants": [
    {
      "name": "variant_name",
      "description": "When/how to use this variant",
      "designValues": {
        "backgroundColor": "actual_hex_value",
        "textColor": "actual_hex_value",
        "borderRadius": "actual_number_px",
        "padding": "actual_spacing_values"
      },
      "shadcnProps": {"variant": "default", "size": "md"}
    }
  ],
  "designTokens": {
    "extracted_from_fills_and_strokes": "actual_values_only"
  },
  "implementationProps": ["prop1", "prop2"],
  "usageExamples": [
    "<Button variant='default' size='md'>Primary Action</Button>",
    "<Button variant='outline' size='sm'>Secondary</Button>"
  ]
}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
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

  private async installShadcnComponent(componentName: string): Promise<void> {
    try {
      const { execSync } = await import('child_process')
      console.log(`      ⚡ Running: npx shadcn@latest add ${componentName}`)
      execSync(`npx shadcn@latest add ${componentName}`, { stdio: 'pipe' })
      console.log(`      ✅ Installed ${componentName}`)
    } catch (error) {
      console.log(`      ❌ Failed to install ${componentName}: ${error.message}`)
    }
  }

  private async saveAtomImplementation(atom: any, analysis: any, sectionName: string, svgCode?: string | null): Promise<void> {
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
${variant.designValues ? Object.entries(variant.designValues).map(([key, value]) => `- ${key}: \`${value}\``).join('\\n') : 'No design values extracted'}

**Shadcn Props:**
\`\`\`tsx
${JSON.stringify(variant.shadcnProps, null, 2)}
\`\`\`
`).join('\\n') || 'No variants identified'}

## Extracted Design Tokens
\`\`\`json
${JSON.stringify(analysis.designTokens, null, 2)}
\`\`\`

## Implementation Props
${analysis.implementationProps?.map(prop => `- \`${prop}\``).join('\\n') || 'No props identified'}

## Usage Examples
${analysis.usageExamples?.map((example, i) => `### Example ${i + 1}
\`\`\`tsx
${example}
\`\`\`
`).join('\\n') || `\`\`\`tsx
import { ${analysis.shadcnComponent || 'Component'} } from "@/components/ui/${analysis.shadcnComponent || 'component'}"

<${analysis.shadcnComponent || 'Component'}
  ${analysis.implementationProps?.map(prop => `${prop}="..."`).join('\\n  ') || ''}
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
      const fs = await import('fs')
      fs.writeFileSync(filename, markdown)
      console.log(`      📝 Saved implementation to: ${filename}`)
    } catch (error) {
      console.log(`      ❌ Failed to save implementation: ${error.message}`)
    }
  }

  private async saveAtomsToMarkdown(sectionName: string, atoms: any[], fullAnalysis: string): Promise<void> {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `atomic-analysis-${sectionName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`

    const markdown = `# Atomic Analysis: ${sectionName}

**Generated:** ${new Date().toLocaleString()}
**Section:** ${sectionName}
**Total Atoms Found:** ${atoms.length}

## Identified Atoms

${atoms.map((atom, i) => `### ${i + 1}. ${atom.name}
- **Type:** ${atom.type}
- **ID:** ${atom.id}
- **Category:** Atomic Component
`).join('\\n')}

## Full AI Analysis

${fullAnalysis}

---
*Generated by Independent Figma Agent*`

    try {
      const fs = await import('fs')
      fs.writeFileSync(filename, markdown)
      console.log(`      📝 Saved analysis to: ${filename}`)
    } catch (error) {
      console.log(`      ❌ Failed to save markdown: ${error.message}`)
    }
  }

  private flattenElements(node: any, elements: any[] = []): any[] {
    if (!node) return elements

    // Add current node if it has meaningful content
    if (node.id && node.name) {
      elements.push({
        id: node.id,
        name: node.name,
        type: node.type || 'UNKNOWN'
      })
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        this.flattenElements(child, elements)
      })
    }

    return elements
  }


  private showHelp(): void {
    console.log(`
🤖 Independent Figma Agent

Uses Figma API + Claude AI to analyze ANY design.
Runs completely independently in your terminal.

SETUP:
1. Get Figma token: https://figma.com/developers/api#access-tokens
2. Get Claude API key: https://console.anthropic.com/
3. Create .env file:
   FIGMA_ACCESS_TOKEN=your_figma_token
   ANTHROPIC_API_KEY=your_claude_key

USAGE:
  npm run agent "FIGMA_URL"

EXAMPLES:
  npm run agent "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"

FEATURES:
  ✅ Direct Figma API integration
  ✅ Claude AI-powered analysis
  ✅ Works with ANY design
  ✅ Completely independent
  ✅ No external services required
`)
  }
}

// Run the agent
new IndependentFigmaAgent().run().catch(console.error)