#!/usr/bin/env node
import 'dotenv/config'
import { parseUrl, validateApiKeys } from '../steps/step-01-url-processing/script'
import { getFigmaData, identifySections } from '../steps/step-02-section-identification/script'
import { discoverAtoms } from '../steps/step-03-atom-discovery/script'
import { analyzeAtomForImplementation } from '../steps/step-04-deep-atom-analysis/script'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

class ModularFigmaAgent {
  private figmaToken: string
  private claudeApiKey: string
  private validShadcnComponents: Set<string> = new Set()

  constructor() {
    this.figmaToken = process.env.FIGMA_ACCESS_TOKEN || ''
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || ''
    this.loadShadcnComponents()
  }

  private loadShadcnComponents(): void {
    try {
      const componentFile = resolve('resources/shadcn-components.md')

      if (existsSync(componentFile)) {
        const content = readFileSync(componentFile, 'utf-8')
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
    console.log('🤖 Modular Figma Agent')
    console.log(`📄 URL: ${figmaUrl}`)

    try {
      // Step 1: URL Processing & API Validation
      console.log('🔍 Step 1: Processing URL and validating APIs...')
      validateApiKeys(this.figmaToken, this.claudeApiKey)
      const { nodeId, fileKey } = parseUrl(figmaUrl)
      console.log(`   File: ${fileKey}, Node: ${nodeId}`)

      // Step 2: Section Identification
      console.log('📡 Step 2: Fetching page data and identifying sections...')
      const pageData = await getFigmaData(fileKey, nodeId, this.figmaToken)
      const sections = await identifySections(pageData, this.claudeApiKey)

      console.log(`✅ Found ${sections.length} sections:`)
      sections.forEach((section, i) => {
        console.log(`   ${i + 1}. ${section.name} (${section.type}) [${section.id}]`)
      })

      // Step 3: Atom Discovery (First Section Only)
      if (sections.length > 0) {
        console.log(`🔬 Step 3: Discovering atoms in first section: ${sections[0].name}`)
        const atoms = await discoverAtoms(fileKey, sections[0], this.figmaToken, this.claudeApiKey)

        // Step 4: Deep Analysis (First Atom Only)
        if (atoms.length > 0) {
          console.log(`🧩 Step 4: Deep analysis of first atom: ${atoms[0].name}`)
          console.log(`   📝 Note: Focusing on single atom for comprehensive analysis`)

          await analyzeAtomForImplementation(
            fileKey,
            atoms[0],
            sections[0].name,
            this.figmaToken,
            this.claudeApiKey,
            this.validShadcnComponents
          )

          console.log(`\n   ⏭️  Remaining atoms (${atoms.length - 1}) available for future analysis:`)
          atoms.slice(1).forEach((atom, i) => {
            console.log(`      ${i + 2}. ${atom.name} (${atom.type}) - ID: ${atom.id}`)
          })
        }
      }

      console.log(`\n✅ Analysis Complete!`)

    } catch (error) {
      console.error(`❌ Error: ${error.message}`)

      if (error.message.includes('FIGMA_ACCESS_TOKEN')) {
        console.log(`\n💡 Get token: https://figma.com/developers/api#access-tokens`)
        console.log(`   Add to .env: FIGMA_ACCESS_TOKEN=your_token`)
      }

      if (error.message.includes('ANTHROPIC_API_KEY')) {
        console.log(`\n💡 Get API key: https://console.anthropic.com/`)
        console.log(`   Add to .env: ANTHROPIC_API_KEY=your_key`)
      }
    }
  }

  private showHelp(): void {
    console.log(`
🤖 Modular Figma Agent

Uses Figma API + Claude AI to analyze ANY design.
Runs with modular, step-by-step architecture.

SETUP:
1. Get Figma token: https://figma.com/developers/api#access-tokens
2. Get Claude API key: https://console.anthropic.com/
3. Create .env file:
   FIGMA_ACCESS_TOKEN=your_figma_token
   ANTHROPIC_API_KEY=your_claude_key

USAGE:
  npm run agent:new "FIGMA_URL"

EXAMPLES:
  npm run agent:new "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"

FEATURES:
  ✅ Modular step-by-step architecture
  ✅ Markdown-based prompts
  ✅ Direct Figma API integration
  ✅ Claude AI-powered analysis
  ✅ Works with ANY design
  ✅ Completely independent

STEPS:
  1. URL Processing & API Validation
  2. Section Identification
  3. Atom Discovery
  4. Deep Implementation Analysis
`)
  }
}

// Run the agent
new ModularFigmaAgent().run().catch(console.error)