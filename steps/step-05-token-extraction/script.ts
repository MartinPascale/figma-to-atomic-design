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

    // Generate updated primitive color tokens from Figma
    const extractedColors = tokens.colors?.primitives || []
    const updatedColorVariables = extractedColors.map((color: any) =>
      `  --${color.name}: ${color.value};`
    ).join('\n')

    // Generate updated spacing tokens from Figma
    const extractedSpacing = tokens.spacing?.scalePx || []
    const updatedSpacingVariables = extractedSpacing.map((space: number) =>
      `  --space-${space / 4}: ${space}px;`  // Convert to Tailwind scale (4px base)
    ).join('\n')

    // Generate updated radius tokens from Figma
    const extractedRadii = tokens.radii || []
    const updatedRadiusVariables = extractedRadii.map((radius: any) =>
      `  --${radius.name.replace(/[^a-zA-Z0-9]/g, '-')}: ${radius.valuePx}px;`
    ).join('\n')

    // Generate updated shadow tokens from Figma
    const extractedShadows = tokens.shadows || []
    const updatedShadowVariables = extractedShadows.map((shadow: any) =>
      `  --${shadow.name}: ${shadow.value};`
    ).join('\n')

    // Create a comment block with the extracted tokens
    const figmaTokenComment = `
/*
   EXTRACTED FIGMA TOKENS - UPDATE PRIMITIVES ABOVE
   ================================================

   Colors found in this design:
${extractedColors.map((c: any) => `   --${c.name}: ${c.value}; /* Used in: ${c.usages?.join(', ') || 'Unknown'} */`).join('\n')}

   Spacing found in this design:
${extractedSpacing.map((s: number) => `   --space-${s / 4}: ${s}px;`).join('\n')}

   Radii found in this design:
${extractedRadii.map((r: any) => `   --${r.name}: ${r.valuePx}px; /* Used in: ${r.usages?.join(', ') || 'Unknown'} */`).join('\n')}

   Typography found in this design:
${(tokens.typography || []).map((t: any) => `   Font: ${t.family} ${t.style} ${t.sizePx}px/${t.lineHeightPx || 'auto'}px`).join('\n')}
*/`

    // Insert the Figma tokens comment before the role tokens section
    let content = templateContent.replace(
      '/* ---------------------------------------\n   2) Role tokens (map primitives to usage)',
      figmaTokenComment + '\n\n/* ---------------------------------------\n   2) Role tokens (map primitives to usage)'
    )

    // Update role tokens to reference the extracted primitives
    if (extractedColors.length > 0) {
      // Find common colors and update role tokens
      const neutralColors = extractedColors.filter((c: any) => c.name.includes('neutral'))
      const brandColors = extractedColors.filter((c: any) => c.name.includes('brand') || c.name.includes('primary'))

      if (neutralColors.length > 0) {
        const lightestNeutral = neutralColors.find((c: any) => c.name.includes('0') || c.name.includes('50'))
        const darkestNeutral = neutralColors.find((c: any) => c.name.includes('900') || c.name.includes('800'))

        if (lightestNeutral) {
          content = content.replace('--bg-surface: var(--neutral-0);', `--bg-surface: var(--${lightestNeutral.name});`)
        }
        if (darkestNeutral) {
          content = content.replace('--fg-primary: var(--neutral-900);', `--fg-primary: var(--${darkestNeutral.name});`)
        }
      }

      if (brandColors.length > 0) {
        const primaryBrand = brandColors[0]
        content = content.replace('--accent: var(--brand-500);', `--accent: var(--${primaryBrand.name});`)
      }
    }

    // Save the globals.css file to outputs directory
    const globalsFile = resolve('outputs', 'globals.css')
    await import('fs').then(fs => {
      import('fs').then(fsModule => fsModule.mkdirSync(resolve('outputs'), { recursive: true }))
      fs.writeFileSync(globalsFile, content)
    })

    console.log(`   🎨 Updated globals.css with Figma design tokens: ${globalsFile}`)
    console.log(`   📝 Check the comment block in globals.css for extracted tokens`)
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