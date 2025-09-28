import { getFigmaData } from '../step-02-section-identification/script'
import { writeFileSync } from 'fs'

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

  // Debug: show first few elements
  if (allElements.length > 0) {
    console.log(`      🔍 Sample elements:`)
    allElements.slice(0, 3).forEach(el => {
      console.log(`         - "${el.name}" (${el.type})`)
    })
  }

  const { loadPrompt } = await import('../../utils/prompt-loader')

  const elementList = allElements.map((element: any, i: number) =>
    `${i + 1}. Name: "${element.name}" | Type: ${element.type || 'FRAME'} | ID: ${element.id}`
  ).join('\n')

  const prompt = loadPrompt('step-03-atom-discovery', {
    SECTION_NAME: sectionName,
    ELEMENT_COUNT: String(allElements.length),
    ELEMENT_LIST: elementList
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
        await saveAtomsToMarkdown(sectionName, atoms, content)

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
`).join('\n')}

## Full AI Analysis

${fullAnalysis}

---
*Generated by Independent Figma Agent*`

  try {
    writeFileSync(filename, markdown)
    console.log(`      📝 Saved analysis to: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to save markdown: ${error.message}`)
  }
}