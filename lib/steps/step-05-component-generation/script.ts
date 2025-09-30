import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..', '..')

export async function generateAtomicComponent(
  tokenVariantData: any,
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
    const componentName = sanitizeComponentName(atom.name)

    // Check if implementation should be skipped (text, icons, vectors)
    if (atom.skipImplementation) {
      console.log(`      ⏭️  Skipping implementation for ${atom.name} (${atom.type})`)
      await saveComponentSkipNote(atom, componentName, `${atom.type} component - implementation skipped`)
      return
    }

    // Use AI to generate the component based on extracted tokens and variants
    const generationResult = await generateComponentWithAI(
      componentName,
      atom.type,
      atom.skipImplementation || false,
      tokenVariantData.designTokens || {},
      variantAnalysis,
      claudeApiKey
    )

    if (generationResult.skipImplementation) {
      console.log(`      ⏭️  Skipping implementation for ${atom.name} (${generationResult.reason || 'icon/vector'})`)
      await saveComponentSkipNote(atom, componentName, generationResult.reason)
      return
    }

    // No shadcn installation needed - generating standalone atomic components

    // Save the generated component
    await saveComponent(componentName, generationResult.componentCode, outputDir)

    // Save updated CSS if provided
    if (generationResult.updatedCSS) {
      await saveUpdatedCSS(generationResult.updatedCSS)
    }

    // Save only ONE additional file with minimal metadata
    await saveComponentSummary(componentName, tokenVariantData, generationResult, outputDir)

    console.log(`      ✅ Generated ${componentName} component using AI`)

  } catch (error) {
    console.log(`      ❌ Failed to generate component: ${error.message}`)
  }
}

function sanitizeComponentName(name: string): string {
  // Convert to PascalCase and remove special characters
  return name
    .split(/\s+|[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

async function generateComponentWithAI(
  componentName: string,
  atomicType: string,
  skipImplementation: boolean,
  extractedTokens: any,
  variantAnalysis: any,
  claudeApiKey: string
): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  // Read current CSS for context
  const { readFileSync } = await import('fs')
  const { resolve } = await import('path')
  const rootDir = resolve(__dirname, '..', '..', '..')
  let currentCSS = ''

  try {
    const cssPath = resolve(rootDir, 'test-project/src/index.css')
    currentCSS = readFileSync(cssPath, 'utf8')
  } catch (error) {
    console.log(`      ⚠️ Could not read current CSS: ${error.message}`)
  }

  const prompt = loadPrompt('step-05-component-generation', {
    COMPONENT_NAME: componentName,
    ATOMIC_TYPE: atomicType,
    SKIP_IMPLEMENTATION: skipImplementation ? 'true' : 'false',
    EXTRACTED_TOKENS: JSON.stringify(extractedTokens, null, 2),
    VARIANT_ANALYSIS: JSON.stringify(variantAnalysis, null, 2),
    CURRENT_CSS_VARIABLES: currentCSS
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
    const content = result.content[0]?.text || ''

    console.log(`      🤖 Claude response length: ${content.length} chars`)

    // Parse delimiter-based format instead of JSON to avoid escaping issues
    let generationResult

    console.log(`      🔍 Looking for delimiter-based response format...`)
    console.log(`      🔍 Content starts with: ${content.substring(0, 100)}...`)

    // Check if response uses the new delimiter format
    if (content.includes('---SKIP---') || content.includes('---COMPONENT---')) {
      console.log(`      🔍 Found delimiter-based format`)

      // Extract skip implementation flag
      const skipMatch = content.match(/---SKIP---\s*\n([^\n-]+)/);
      const skipImplementation = skipMatch ? skipMatch[1].trim().toLowerCase() === 'true' : false;

      if (skipImplementation) {
        generationResult = {
          skipImplementation: true,
          reason: 'Skipped as requested in response'
        };
      } else {
        // Extract component code
        const componentMatch = content.match(/---COMPONENT---\s*\n([\s\S]*?)(?=---CSS---|---MAPPING---|$)/);
        const componentCode = componentMatch ? componentMatch[1].trim() : '';

        // Extract CSS
        const cssMatch = content.match(/---CSS---\s*\n([\s\S]*?)(?=---MAPPING---|---EXAMPLE---|$)/);
        const updatedCSS = cssMatch ? cssMatch[1].trim() : '';

        // Extract mapping info
        const mappingMatch = content.match(/---MAPPING---\s*\n([\s\S]*?)(?=---EXAMPLE---|---NOTES---|$)/);
        let colorMapping = {};
        if (mappingMatch) {
          const mappingText = mappingMatch[1].trim();
          const figmaColorMatch = mappingText.match(/figmaColor:\s*([^\n]+)/);
          const themeVarMatch = mappingText.match(/themeVariable:\s*([^\n]+)/);
          const usageMatch = mappingText.match(/usageReason:\s*([^\n]+)/);

          colorMapping = {
            figmaColor: figmaColorMatch ? figmaColorMatch[1].trim() : '',
            themeVariable: themeVarMatch ? themeVarMatch[1].trim() : '',
            usageReason: usageMatch ? usageMatch[1].trim() : ''
          };
        }

        // Extract usage example
        const exampleMatch = content.match(/---EXAMPLE---\s*\n([^\n-]+)/);
        const usageExample = exampleMatch ? exampleMatch[1].trim() : '';

        // Extract notes
        const notesMatch = content.match(/---NOTES---\s*\n([\s\S]*?)$/);
        const notes = notesMatch ? notesMatch[1].trim() : '';

        generationResult = {
          skipImplementation: false,
          componentCode: componentCode,
          updatedCSS: updatedCSS || null,
          colorMapping: colorMapping,
          usageExample: usageExample,
          notes: notes
        };
      }

      console.log(`      ✅ Parsed delimiter-based format successfully`)
    } else {
      console.log(`      ⚠️ No delimiter-based format found, trying JSON fallback...`)

      // Fallback to JSON parsing for backward compatibility
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        try {
          generationResult = JSON.parse(jsonMatch[1].trim())
          console.log(`      ✅ Parsed JSON fallback`)
        } catch (error) {
          console.log(`      ⚠️ JSON fallback failed: ${error.message}`)
          generationResult = null
        }
      }
    }

    if (generationResult) {

      console.log(`      ✅ AI component generation completed`)
      if (generationResult.variantsMapped) {
        console.log(`      🎨 Mapped ${generationResult.variantsMapped.length} variants to Tailwind classes`)
      }
      return generationResult
    }

    // If all parsing attempts failed, log the Claude response and fallback
    console.log(`      📄 Full Claude response: ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`)
    throw new Error('No valid JSON found in Claude response')
  } catch (error) {
    console.log(`      ⚠️ AI component generation failed: ${error.message}`)

    // Fallback: skip implementation
    return {
      skipImplementation: true,
      reason: `AI generation failed: ${error.message}`,
      componentCode: null
    }
  }
}

// Removed installShadcnComponent - generating standalone atomic components

async function saveComponent(
  componentName: string,
  componentCode: string,
  outputDir: string
): Promise<void> {
  // Save to outputs directory
  const outputsPath = resolve(rootDir, `outputs/components/atoms/${componentName}/${componentName}.tsx`)
  mkdirSync(dirname(outputsPath), { recursive: true })
  writeFileSync(outputsPath, componentCode)

  // Also copy to target project if it exists
  const targetPath = resolve(rootDir, `test-project/src/components/atoms/${componentName}/${componentName}.tsx`)
  try {
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, componentCode)
    console.log(`      📁 Saved to outputs: ${outputsPath}`)
    console.log(`      📋 Copied to test project: ${targetPath}`)
  } catch (error) {
    console.log(`      📁 Saved to outputs: ${outputsPath}`)
    console.log(`      ⚠️ Could not copy to test project: ${error.message}`)
  }
}

async function saveUpdatedCSS(updatedCSS: string): Promise<void> {
  try {
    const cssPath = resolve(rootDir, 'test-project/src/index.css')

    // Ensure CSS has proper Tailwind v4 import at the top
    const tailwindImport = `@import "tailwindcss";

`

    // If the updated CSS doesn't have Tailwind v4 import, add it
    let finalCSS = updatedCSS
    if (!updatedCSS.includes('@import "tailwindcss"')) {
      finalCSS = tailwindImport + updatedCSS
    }

    writeFileSync(cssPath, finalCSS)
    console.log(`      🎨 Updated CSS variables with Tailwind v4 import`)
  } catch (error) {
    console.log(`      ⚠️ Could not update CSS: ${error.message}`)
  }
}

async function saveComponentSummary(
  componentName: string,
  tokenVariantData: any,
  generationResult: any,
  outputDir: string
): Promise<void> {
  // Save only ONE additional file with essential info
  const summary = {
    name: componentName,
    figmaId: tokenVariantData.atom.id,
    atomicType: tokenVariantData.variantAnalysis.atomicType,
    generatedAt: new Date().toISOString(),
    usageExample: generationResult.usageExample,
    variantCount: generationResult.variantsMapped?.length || 0
  }

  const summaryPath = resolve(rootDir, `outputs/components/atoms/${componentName}/summary.json`)
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
}

async function saveComponentSkipNote(atom: any, componentName: string, reason?: string): Promise<void> {
  // Save only ONE file for skipped components
  const skipSummary = {
    name: componentName,
    figmaId: atom.id,
    type: atom.type,
    skipped: true,
    reason: reason || 'Icon/Vector component - implementation skipped',
    skippedAt: new Date().toISOString()
  }

  const skipPath = resolve(rootDir, `outputs/components/atoms/${componentName}/summary.json`)
  mkdirSync(dirname(skipPath), { recursive: true })
  writeFileSync(skipPath, JSON.stringify(skipSummary, null, 2))

  console.log(`      📝 Saved skip summary: ${skipPath}`)
}

// Removed generateComponentREADME - using summary.json instead