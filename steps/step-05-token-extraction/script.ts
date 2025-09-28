import { getFigmaData } from '../step-02-section-identification/script'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export async function extractTokens(
  fileKey: string,
  section: {id: string, name: string, type: string},
  figmaToken: string,
  claudeApiKey: string
): Promise<any> {
  console.log(`\n🎨 Step 5: Extracting design tokens from section: ${section.name}`)

  try {
    // Get detailed section data from Figma API
    const sectionData = await getFigmaData(fileKey, section.id, figmaToken)

    // Extract tokens using Claude AI with dedicated prompt
    const tokens = await extractDesignTokens(sectionData, section, fileKey, claudeApiKey)

    // Create output directories
    const outputDir = resolve('design', 'tokens')
    mkdirSync(outputDir, { recursive: true })

    // Save tokens as JSON
    const tokensFile = resolve(outputDir, `${section.name.toLowerCase().replace(/\s+/g, '-')}.tokens.json`)
    writeFileSync(tokensFile, JSON.stringify(tokens, null, 2))

    // Save human-readable summary using template
    await saveTokenFindings(tokens, section, outputDir)

    // Generate globals.css with extracted tokens
    await generateGlobalCSS(tokens, outputDir)

    console.log(`   ✅ Tokens extracted and saved to: ${outputDir}`)
    return tokens

  } catch (error) {
    console.log(`   ❌ Failed to extract tokens: ${error.message}`)
    return null
  }
}

async function extractDesignTokens(sectionData: any, section: any, fileKey: string, claudeApiKey: string): Promise<any> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const prompt = loadPrompt('step-05-token-extraction', {
    FIGMA_FILE_KEY: fileKey,
    NODE_ID: section.id,
    SECTION_DATA: JSON.stringify(sectionData, null, 2)
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
        file: fileKey,
        nodeId: section.id,
        analyzedAt: new Date().toISOString()
      }

      return tokens
    }

    throw new Error('No valid JSON found in Claude response')
  } catch (error) {
    console.log(`   ⚠️ Token extraction failed: ${error.message}`)
    return {
      meta: { file: fileKey, nodeId: section.id, analyzedAt: new Date().toISOString() },
      colors: { primitives: [], roles: [] },
      typography: [],
      spacing: { scalePx: [], evidence: [] },
      radii: [],
      borders: [],
      shadows: []
    }
  }
}

async function generateGlobalCSS(tokens: any, outputDir: string): Promise<void> {
  try {
    // Load the globals.css template
    const templateContent = await import('fs').then(fs =>
      fs.readFileSync(resolve('templates', 'globals.css'), 'utf-8')
    )

    // Generate CSS variables from tokens
    const colorVariables = tokens.colors?.primitives?.map((color: any) =>
      `    --${color.name}: ${color.value};`
    ).join('\n') || ''

    const typographyVariables = tokens.typography?.map((typo: any) =>
      `    --font-${typo.name.replace(/[^a-zA-Z0-9]/g, '-')}: ${typo.sizePx}px/${typo.lineHeightPx || typo.sizePx * 1.2}px ${typo.family};`
    ).join('\n') || ''

    const spacingVariables = tokens.spacing?.scalePx?.map((space: number) =>
      `    --space-${space}: ${space}px;`
    ).join('\n') || ''

    const radiusVariables = tokens.radii?.map((radius: any) =>
      `    --${radius.name}: ${radius.valuePx}px;`
    ).join('\n') || ''

    const shadowVariables = tokens.shadows?.map((shadow: any) =>
      `    --${shadow.name}: ${shadow.value};`
    ).join('\n') || ''

    // Replace template variables
    let content = templateContent
      .replace('/* Generated from Figma analysis:\n     * Colors: {{FIGMA_COLORS}}\n     * Typography: {{FIGMA_TYPOGRAPHY}}\n     * Spacing: {{FIGMA_SPACING}}\n     * Borders: {{FIGMA_BORDERS}}\n     * Shadows: {{FIGMA_SHADOWS}}\n     */',
        `/* Generated from Figma design tokens */
${colorVariables}

    /* Typography tokens */
${typographyVariables}

    /* Spacing tokens */
${spacingVariables}

    /* Border radius tokens */
${radiusVariables}

    /* Shadow tokens */
${shadowVariables}`)

    // Save the globals.css file
    const globalsFile = resolve('src', 'globals.css')
    await import('fs').then(fs => {
      import('fs').then(fsModule => fsModule.mkdirSync(resolve('src'), { recursive: true }))
      fs.writeFileSync(globalsFile, content)
    })

    console.log(`   🎨 Generated globals.css with design tokens: ${globalsFile}`)
  } catch (error) {
    console.log(`   ⚠️ Failed to generate globals.css: ${error.message}`)
  }
}

async function saveTokenFindings(tokens: any, section: any, outputDir: string): Promise<void> {
  try {
    // Load the token findings template
    const templateContent = await import('fs').then(fs =>
      fs.readFileSync(resolve('templates', 'token-findings.md'), 'utf-8')
    )

    // Replace template variables
    let content = templateContent
      .replace(/<Section Name>/g, section.name)
      .replace(/<Node ID>/g, section.id)
      .replace(/<Figma File or Key>/g, tokens.meta?.file || 'Unknown')
      .replace(/<ISO8601>/g, tokens.meta?.analyzedAt || new Date().toISOString())

    // Generate color primitives table
    if (tokens.colors?.primitives?.length > 0) {
      const colorRows = tokens.colors.primitives.map(color =>
        `| ${color.name} | ${color.value} | ${color.alpha || 1} | ${color.sourceStyle || '—'} | ${color.usages?.join('; ') || '—'} |`
      ).join('\n')

      content = content.replace(
        /\| brand-500.*?\| Nav\/Item\/Secondary.*?\|/s,
        colorRows
      )
    }

    // Generate typography table
    if (tokens.typography?.length > 0) {
      const typoRows = tokens.typography.map(typo =>
        `| ${typo.name} | ${typo.family} | ${typo.style} | ${typo.sizePx} | ${typo.lineHeightPx || '—'} | ${typo.letterSpacingPx || 0} | ${typo.case || 'none'} | ${typo.decoration || 'none'} | ${typo.sourceStyle || '—'} | ${typo.usages?.join('; ') || '—'} |`
      ).join('\n')

      content = content.replace(
        /\| heading\/24.*?\| Nav\/Item; Badge\/Text \|/s,
        typoRows
      )
    }

    // Save the findings file
    const findingsFile = resolve(outputDir, `${section.name.toLowerCase().replace(/\s+/g, '-')}.tokens.md`)
    await import('fs').then(fs => fs.writeFileSync(findingsFile, content))

    console.log(`   📝 Token findings saved to: ${findingsFile}`)
  } catch (error) {
    console.log(`   ⚠️ Failed to save token findings: ${error.message}`)
  }
}