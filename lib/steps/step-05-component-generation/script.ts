import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CLI_ROOT_DIR = resolve(__dirname, '..', '..', '..')

interface TokenVariantData {
  atom: {
    id: string
    name: string
    type: string
    skipImplementation?: boolean
  }
  designTokens?: Record<string, any>
  variantAnalysis: {
    atomicType: string
  }
}

interface ComponentGenerationResult {
  skipImplementation: boolean
  reason?: string
  componentCode?: string
  updatedCSS?: string
  colorMapping?: Record<string, string>
  usageExample?: string
  notes?: string
  variantsMapped?: Array<any>
}

export async function generateAtomicComponent(
  tokenVariantData: TokenVariantData,
  claudeApiKey: string,
  outputDir: string = './src'
): Promise<void> {
  if (!tokenVariantData) {
    console.log(`      ❌ No token/variant data provided`)
    return
  }

  const { atom, variantAnalysis } = tokenVariantData
  console.log(`      🛠️  Generating component for ${atom.name}...`)

  try {
    const componentName = convertToPascalCase(atom.name)

    // Check if implementation should be skipped (text, icons, vectors)
    if (atom.skipImplementation) {
      console.log(`      ⏭️  Skipping implementation for ${atom.name} (${atom.type})`)
      await saveSkippedComponentSummary(atom, componentName, `${atom.type} component - implementation skipped`)
      return
    }

    // Generate component using AI
    const generationResult = await generateComponentWithClaude(
      componentName,
      atom.type,
      atom.skipImplementation || false,
      tokenVariantData.designTokens || {},
      variantAnalysis,
      claudeApiKey
    )

    if (generationResult.skipImplementation) {
      console.log(`      ⏭️  Skipping implementation for ${atom.name} (${generationResult.reason || 'icon/vector'})`)
      await saveSkippedComponentSummary(atom, componentName, generationResult.reason)
      return
    }

    // Save the generated component files
    await saveComponentToFiles(componentName, generationResult.componentCode!)

    if (generationResult.updatedCSS) {
      await updateProjectCSS(generationResult.updatedCSS)
    }

    await saveComponentMetadata(componentName, tokenVariantData, generationResult)

    console.log(`      ✅ Generated ${componentName} component using AI`)

  } catch (error: any) {
    console.log(`      ❌ Failed to generate component: ${error.message}`)
  }
}

function convertToPascalCase(name: string): string {
  return name
    .split(/\s+|[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

async function generateComponentWithClaude(
  componentName: string,
  atomicType: string,
  skipImplementation: boolean,
  extractedTokens: Record<string, any>,
  variantAnalysis: any,
  claudeApiKey: string
): Promise<ComponentGenerationResult> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const currentCSS = await readCurrentCSS()

  const prompt = loadPrompt('step-05-component-generation', {
    COMPONENT_NAME: componentName,
    ATOMIC_TYPE: atomicType,
    SKIP_IMPLEMENTATION: skipImplementation ? 'true' : 'false',
    EXTRACTED_TOKENS: JSON.stringify(extractedTokens, null, 2),
    VARIANT_ANALYSIS: JSON.stringify(variantAnalysis, null, 2),
    CURRENT_CSS_VARIABLES: currentCSS
  })

  try {
    const claudeResponse = await callClaudeAPI(prompt, claudeApiKey)
    console.log(`      🤖 Claude response length: ${claudeResponse.length} chars`)

    const parsedResult = parseClaudeResponse(claudeResponse)

    if (parsedResult) {
      console.log(`      ✅ AI component generation completed`)
      if (parsedResult.variantsMapped?.length) {
        console.log(`      🎨 Mapped ${parsedResult.variantsMapped.length} variants to Tailwind classes`)
      }
      return parsedResult
    }

    console.log(`      📄 Full Claude response: ${claudeResponse.substring(0, 1000)}${claudeResponse.length > 1000 ? '...' : ''}`)
    throw new Error('No valid response format found in Claude response')

  } catch (error: any) {
    console.log(`      ⚠️ AI component generation failed: ${error.message}`)

    return {
      skipImplementation: true,
      reason: `AI generation failed: ${error.message}`
    }
  }
}

async function readCurrentCSS(): Promise<string> {
  try {
    const cssPath = resolve(CLI_ROOT_DIR, 'test-project/src/index.css')
    return readFileSync(cssPath, 'utf8')
  } catch (error: any) {
    console.log(`      ⚠️ Could not read current CSS: ${error.message}`)
    return ''
  }
}

async function callClaudeAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
  return result.content[0]?.text || ''
}

function parseClaudeResponse(content: string): ComponentGenerationResult | null {
  console.log(`      🔍 Parsing Claude response...`)

  // Check for delimiter-based format
  if (content.includes('---SKIP---') || content.includes('---COMPONENT---')) {
    console.log(`      🔍 Found delimiter-based format`)
    return parseDelimiterFormat(content)
  }

  console.log(`      ⚠️ No delimiter-based format found, trying JSON fallback...`)
  return parseJSONFormat(content)
}

function parseDelimiterFormat(content: string): ComponentGenerationResult {
  // Extract skip implementation flag
  const skipMatch = content.match(/---SKIP---\s*\n([^\n-]+)/)
  const shouldSkip = skipMatch ? skipMatch[1].trim().toLowerCase() === 'true' : false

  if (shouldSkip) {
    return {
      skipImplementation: true,
      reason: 'Skipped as requested in response'
    }
  }

  // Extract component sections
  const componentCode = extractSection(content, 'COMPONENT', ['CSS', 'MAPPING'])
  const updatedCSS = extractSection(content, 'CSS', ['MAPPING', 'EXAMPLE'])
  const colorMapping = parseColorMapping(content)
  const usageExample = extractSimpleSection(content, 'EXAMPLE')
  const notes = extractSimpleSection(content, 'NOTES')

  return {
    skipImplementation: false,
    componentCode: componentCode,
    updatedCSS: updatedCSS || undefined,
    colorMapping: colorMapping,
    usageExample: usageExample,
    notes: notes
  }
}

function parseJSONFormat(content: string): ComponentGenerationResult | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
  if (!jsonMatch) return null

  try {
    const result = JSON.parse(jsonMatch[1].trim())
    console.log(`      ✅ Parsed JSON fallback`)
    return result
  } catch (error: any) {
    console.log(`      ⚠️ JSON fallback failed: ${error.message}`)
    return null
  }
}

function extractSection(content: string, sectionName: string, endMarkers: string[]): string {
  const pattern = new RegExp(`---${sectionName}---\\s*\\n([\\s\\S]*?)(?=---(?:${endMarkers.join('|')})---|$)`)
  const match = content.match(pattern)
  return match ? match[1].trim() : ''
}

function extractSimpleSection(content: string, sectionName: string): string {
  const match = content.match(new RegExp(`---${sectionName}---\\s*\\n([^\\n-]+)`))
  return match ? match[1].trim() : ''
}

function parseColorMapping(content: string): Record<string, string> {
  const mappingMatch = content.match(/---MAPPING---\s*\n([\s\S]*?)(?=---EXAMPLE---|---NOTES---|$)/)
  if (!mappingMatch) return {}

  const mappingText = mappingMatch[1].trim()
  const figmaColorMatch = mappingText.match(/figmaColor:\s*([^\n]+)/)
  const themeVarMatch = mappingText.match(/themeVariable:\s*([^\n]+)/)
  const usageMatch = mappingText.match(/usageReason:\s*([^\n]+)/)

  return {
    figmaColor: figmaColorMatch ? figmaColorMatch[1].trim() : '',
    themeVariable: themeVarMatch ? themeVarMatch[1].trim() : '',
    usageReason: usageMatch ? usageMatch[1].trim() : ''
  }
}

async function saveComponentToFiles(componentName: string, componentCode: string): Promise<void> {
  const outputsPath = resolve(CLI_ROOT_DIR, `outputs/components/atoms/${componentName}/${componentName}.tsx`)
  const targetPath = resolve(CLI_ROOT_DIR, `test-project/src/components/atoms/${componentName}/${componentName}.tsx`)

  // Save to outputs directory
  mkdirSync(dirname(outputsPath), { recursive: true })
  writeFileSync(outputsPath, componentCode)

  // Copy to test project
  try {
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, componentCode)
    console.log(`      📁 Saved to outputs: ${outputsPath}`)
    console.log(`      📋 Copied to test project: ${targetPath}`)
  } catch (error: any) {
    console.log(`      📁 Saved to outputs: ${outputsPath}`)
    console.log(`      ⚠️ Could not copy to test project: ${error.message}`)
  }
}

async function updateProjectCSS(updatedCSS: string): Promise<void> {
  try {
    const cssPath = resolve(CLI_ROOT_DIR, 'test-project/src/index.css')
    const tailwindV4Import = '@import "tailwindcss";\n\n'

    // Ensure Tailwind v4 import is present
    const finalCSS = updatedCSS.includes('@import "tailwindcss"')
      ? updatedCSS
      : tailwindV4Import + updatedCSS

    writeFileSync(cssPath, finalCSS)
    console.log(`      🎨 Updated CSS variables with Tailwind v4 import`)
  } catch (error: any) {
    console.log(`      ⚠️ Could not update CSS: ${error.message}`)
  }
}

async function saveComponentMetadata(
  componentName: string,
  tokenVariantData: TokenVariantData,
  generationResult: ComponentGenerationResult
): Promise<void> {
  const metadata = {
    name: componentName,
    figmaId: tokenVariantData.atom.id,
    atomicType: tokenVariantData.variantAnalysis.atomicType,
    generatedAt: new Date().toISOString(),
    usageExample: generationResult.usageExample,
    variantCount: generationResult.variantsMapped?.length || 0
  }

  const metadataPath = resolve(CLI_ROOT_DIR, `outputs/components/atoms/${componentName}/summary.json`)
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
}

async function saveSkippedComponentSummary(
  atom: TokenVariantData['atom'],
  componentName: string,
  reason?: string
): Promise<void> {
  const summary = {
    name: componentName,
    figmaId: atom.id,
    type: atom.type,
    skipped: true,
    reason: reason || 'Icon/Vector component - implementation skipped',
    skippedAt: new Date().toISOString()
  }

  const summaryPath = resolve(CLI_ROOT_DIR, `outputs/components/atoms/${componentName}/summary.json`)
  mkdirSync(dirname(summaryPath), { recursive: true })
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

  console.log(`      📝 Saved skip summary: ${summaryPath}`)
}