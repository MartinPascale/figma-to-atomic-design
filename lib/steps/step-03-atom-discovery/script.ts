import { getFigmaData } from '../step-02-section-identification/script'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..', '..')

function getValidShadcnComponents(): string[] {
  try {
    const shadcnComponentsPath = resolve(rootDir, 'lib/resources/shadcn-components.md')
    const content = readFileSync(shadcnComponentsPath, 'utf-8')

    // Extract all component names from markdown (lines starting with -)
    const componentMatches = content.match(/^- `([^`]+)`/gm)
    if (!componentMatches) return []

    const components = componentMatches.map(match => {
      const componentName = match.match(/`([^`]+)`/)?.[1]
      return componentName
    }).filter(Boolean)

    // Remove duplicates and sort
    const uniqueComponents = [...new Set(components)].sort()

    console.log(`      📋 Loaded ${uniqueComponents.length} valid shadcn components from resources`)
    return uniqueComponents
  } catch (error) {
    console.log(`      ⚠️ Failed to load shadcn components: ${error.message}`)
    // Fallback to basic atomic components
    return ['button', 'input', 'label', 'badge', 'avatar', 'separator', 'checkbox', 'switch', 'toggle']
  }
}

export async function discoverAtoms(
  fileKey: string,
  section: {id: string, name: string, type: string},
  figmaToken: string,
  claudeApiKey: string
): Promise<Array<{name: string, type: string, id: string}>> {
  console.log(`\n   🔍 Section: ${section.name}`)

  try {
    // Get detailed section data from Figma API
    const sectionData = await getFigmaData(fileKey, section.id, figmaToken)

    // Identify atoms using Claude AI
    const atoms = await identifyAtoms(sectionData, section.name, claudeApiKey)

    // Show atoms found
    if (atoms.length > 0) {
      console.log(`      ⚛️  Found ${atoms.length} atoms:`)
      atoms.forEach((atom, i) => {
        console.log(`         ${i + 1}. ${atom.name} (${atom.type})`)
      })
    } else {
      console.log(`      ⚛️  No atoms detected`)
    }

    return atoms

  } catch (error) {
    console.log(`      ❌ Failed to analyze section: ${error.message}`)
    return []
  }
}

async function identifyAtoms(sectionData: any, sectionName: string, claudeApiKey: string): Promise<Array<{name: string, type: string, id: string}>> {
  // Get all nested elements with complete information
  const allElements = flattenElements(sectionData)

  console.log(`      📊 Found ${allElements.length} total elements in section`)

  // Send all elements to Claude for intelligent filtering based on shadcn atomic components
  console.log(`      🎯 Sending ${allElements.length} elements to Claude for shadcn-based filtering`)

  if (allElements.length > 0) {
    console.log(`      🔍 Sample elements for processing:`)
    allElements.slice(0, 3).forEach(el => console.log(`         - "${el.name}" (${el.type})`))
  }

  const { loadPrompt } = await import('../../utils/prompt-loader')

  const elementList = allElements.map((element: any, i: number) =>
    `${i + 1}. Name: "${element.name}" | Type: ${element.type || 'FRAME'} | ID: ${element.id}`
  ).join('\n')

  const validShadcnComponents = getValidShadcnComponents()

  const prompt = loadPrompt('step-03-atom-discovery', {
    SECTION_NAME: sectionName,
    ELEMENT_COUNT: String(allElements.length),
    ELEMENT_LIST: elementList,
    VALID_COMPONENTS: validShadcnComponents.join(', ')
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
        max_tokens: 2000,
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

    // Parse delimiter-based response (no more JSON!)
    let atoms = []

    // Look for components section
    const componentsMatch = content.match(/---COMPONENTS---([\s\S]*?)---SUMMARY---/)
    if (componentsMatch) {
      const componentsSection = componentsMatch[1].trim()
      const lines = componentsSection.split('\n').filter(line => line.trim())

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && trimmed.includes('|')) {
          try {
            // Parse format: id:value|name:value|type:value
            // Note: ID values can contain colons (e.g., "2606:6342")
            const parts = trimmed.split('|')
            const component: any = {}

            for (const part of parts) {
              const colonIndex = part.indexOf(':')
              if (colonIndex > 0) {
                const key = part.substring(0, colonIndex).trim()
                const value = part.substring(colonIndex + 1).trim()
                if (key && value) {
                  component[key] = value
                }
              }
            }

            // Validate required fields
            if (component.id && component.name && component.type) {
              atoms.push(component)
            }
          } catch (error) {
            console.log(`      ⚠️ Skipping malformed line: ${trimmed}`)
          }
        }
      }

      console.log(`      ✅ Claude found ${atoms.length} atoms using delimiter format`)
    } else {
      console.log(`      ⚠️ No ---COMPONENTS--- section found in response`)
    }

    if (atoms.length > 0) {
      // Save to markdown file
      await saveAtomsToMarkdown(sectionName, atoms, content)
      return atoms
    }

    console.log(`      ❌ No valid components found in Claude response`)
    return []
  } catch (error) {
    console.log(`      ⚠️ Claude analysis failed: ${error.message}`)
    // If Claude fails, return empty array - we only want AI-identified components
    return []
  }
}

function flattenElements(node: any, elements: any[] = []): any[] {
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
      flattenElements(child, elements)
    })
  }

  return elements
}


async function saveAtomsToMarkdown(sectionName: string, atoms: any[], fullAnalysis: string): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = resolve(rootDir, `outputs/section-analysis-${sectionName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`)

  const markdown = `# Atomic Analysis: ${sectionName}

**Generated:** ${new Date().toLocaleString()}
**Section:** ${sectionName}
**Total Atoms Found:** ${atoms.length}

## Identified Atoms

${atoms.map((atom, i) => `### ${i + 1}. ${atom.name}
- **Type:** ${atom.type}
- **ID:** ${atom.id}
- **Category:** Atomic Component
`).join('\n')}

## Full AI Analysis

${fullAnalysis}

---
*Generated by Independent Figma Agent*`

  try {
    mkdirSync(dirname(filename), { recursive: true })
    writeFileSync(filename, markdown)
    console.log(`      📝 Saved analysis to: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to save markdown: ${error.message}`)
  }
}