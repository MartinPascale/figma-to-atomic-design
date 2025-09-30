import { getFigmaData } from '../step-02-section-identification/script'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..', '..')
import { execSync } from 'child_process'

export async function extractAtomTokensAndVariants(
  fileKey: string,
  atom: any,
  sectionName: string,
  figmaToken: string,
  claudeApiKey: string
): Promise<any> {
  try {
    // Skip only if explicitly marked by step 3 (text/icon components filtered out there)
    if (atom.skipImplementation) {
      console.log(`      ⏭️  Skipping component marked for skip: ${atom.name}`)
      return null
    }

    console.log(`      📡 Getting detailed data for ${atom.name}...`)

    // Get detailed component data from Figma API
    const atomData = await getFigmaData(fileKey, atom.id, figmaToken)

    // Extract design tokens for this specific atom
    console.log(`      🎨 Extracting design tokens for ${atom.name}...`)
    const designTokens = await extractAtomTokens(atomData, atom, claudeApiKey)

    // Analyze variants and properties with Claude
    console.log(`      🔍 Analyzing variants and properties for ${atom.name}...`)
    const variantAnalysis = await analyzeAtomVariants(atomData, atom, claudeApiKey, designTokens)

    console.log(`      📊 Found ${variantAnalysis.variants?.length || 0} variants`)
    variantAnalysis.variants?.forEach((variant, i) => {
      console.log(`         ${i + 1}. ${variant.name} - ${variant.description}`)
    })

    // Combine all analysis data
    const analysisData = {
      atom: {
        id: atom.id,
        name: atom.name,
        type: atom.type,
        skipImplementation: atom.skipImplementation || false
      },
      designTokens,
      variantAnalysis,
      analyzedAt: new Date().toISOString()
    }

    // Save only one analysis file (will be used by step-05)
    await saveTokenVariantAnalysis(atom, analysisData)

    return analysisData

  } catch (error) {
    console.log(`      ❌ Failed to analyze ${atom.name}: ${error.message}`)
    return null
  }
}

async function extractAtomTokens(atomData: any, atom: any, claudeApiKey: string): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const prompt = loadPrompt('step-04-deep-atom-analysis', {
    ATOM_NAME: atom.name,
    ATOM_TYPE: atom.type,
    ATOM_DATA: JSON.stringify(atomData, null, 2),
    DESIGN_TOKENS: 'Extracted from Figma API data'
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

// Removed extractSVGFromFigma - SVG extraction will be handled in step-05 if needed

// Removed generateSVGComponent - this will be handled in step-05

async function analyzeAtomVariants(atomData: any, atom: any, claudeApiKey: string, designTokens?: any): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const prompt = loadPrompt('step-04-deep-atom-analysis', {
    ATOM_NAME: atom.name,
    ATOM_TYPE: atom.type,
    ATOM_DATA: JSON.stringify(atomData, null, 2),
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

// Removed installShadcnComponent - this will be handled in step-05

// Removed generateReactComponent - this will be handled in step-05

// Removed generateShadcnComponent - this will be handled in step-05

// Removed generateFallbackVariants - this will be handled in step-05

// Removed getDefaultVariants - this will be handled in step-05

// Removed validateComponentCode - this will be handled in step-05

// Component generation removed - this will be handled in step-05

async function saveTokenVariantAnalysis(atom: any, analysisData: any): Promise<void> {
  const componentName = atom.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')

  // Save only ONE analysis file in JSON format (will be used by step-05)
  const analysisFile = resolve(rootDir, `outputs/components/atoms/${componentName}/analysis.json`)
  mkdirSync(dirname(analysisFile), { recursive: true })
  writeFileSync(analysisFile, JSON.stringify(analysisData, null, 2))

  console.log(`      📝 Saved analysis: ${analysisFile}`)
}

function generateTokenVariantMarkdown(data: any): string {
  const { atom, designTokens, variantAnalysis, analyzedAt } = data

  return `# ${atom.name} - Token & Variant Analysis

**Type:** ${atom.type}
**Generated:** ${new Date(analyzedAt).toLocaleString()}
**Figma ID:** ${atom.id}
**Skip Implementation:** ${atom.skipImplementation ? 'Yes' : 'No'}

## Design Tokens
\`\`\`json
${JSON.stringify(designTokens, null, 2)}
\`\`\`

## Variant Analysis
\`\`\`json
${JSON.stringify(variantAnalysis, null, 2)}
\`\`\`

## Variants Found
${variantAnalysis.variants?.map((variant: any, i: number) => `### ${i + 1}. ${variant.name}
${variant.description}

**Design Values:**
${variant.designValues ? Object.entries(variant.designValues).map(([key, value]) => `- ${key}: \`${value}\``).join('\n') : 'None'}
`).join('\n') || 'No variants defined'}

## Next Steps
- Step 05: Generate shadcn/ui component based on these tokens and variants
- Implementation type: ${atom.skipImplementation ? 'Skipped' : 'Shadcn UI Component'}

---
*Generated by Figma Agent - Step 04*`
}