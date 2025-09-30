import { parseUrl, validateApiKeys } from './lib/steps/step-01-url-processing/script.js'
import { getFigmaData, identifySections } from './lib/steps/step-02-section-identification/script.js'
import { discoverAtoms } from './lib/steps/step-03-atom-discovery/script.js'
import { extractAtomTokensAndVariants } from './lib/steps/step-04-deep-atom-analysis/script.js'
import { generateAtomicComponent } from './lib/steps/step-05-component-generation/script.js'
import { generateComponentShowcase } from './lib/steps/step-06-component-showcase/script.js'
import { loadShadcnComponents } from './lib/utils/shadcn-loader.js'
import { setupOutputDirectories } from './lib/setup/directories.js'

export interface FigmaToAtomicOptions {
  figmaToken: string
  claudeApiKey: string
  outputDir?: string
  skipSetup?: boolean
}

export class FigmaToAtomic {
  private figmaToken: string
  private claudeApiKey: string
  private outputDir: string
  private validShadcnComponents: Set<string> = new Set()

  constructor(options: FigmaToAtomicOptions) {
    this.figmaToken = options.figmaToken
    this.claudeApiKey = options.claudeApiKey
    this.outputDir = options.outputDir || './src'

    this.loadShadcnComponents()
    this.setupOutputDirectories()
  }

  private loadShadcnComponents(): void {
    this.validShadcnComponents = loadShadcnComponents()
    console.log(`📋 Loaded ${this.validShadcnComponents.size} valid shadcn components`)
  }

  private setupOutputDirectories(): void {
    setupOutputDirectories(this.outputDir)
  }

  async analyze(figmaUrl: string): Promise<void> {
    console.log(`📄 Analyzing: ${figmaUrl}`)

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
        const firstSection = sections[0]
        console.log(`🔬 Step 3: Discovering atoms in first section: ${firstSection.name}`)
        const atoms = await discoverAtoms(fileKey, firstSection, this.figmaToken, this.claudeApiKey)

        // Group atoms by type to avoid processing duplicates
        const uniqueComponents = this.groupAtomsByType(atoms)
        console.log(`🧩 Processing ${uniqueComponents.length} unique component types (from ${atoms.length} instances)...`)

        const processedComponents = []

        for (let i = 0; i < uniqueComponents.length; i++) {
          const componentGroup = uniqueComponents[i]
          const atom = componentGroup.representative // Use one instance as representative
          console.log(`\n🔬 [${i + 1}/${uniqueComponents.length}] Processing ${componentGroup.type}: ${atom.name} (${componentGroup.instances.length} instances)`)

          // Step 4: Extract Tokens and Variants
          console.log(`   📊 Extracting tokens and variants...`)
          const tokenVariantData = await extractAtomTokensAndVariants(
            fileKey,
            atom,
            firstSection.name,
            this.figmaToken,
            this.claudeApiKey
          )

          if (tokenVariantData) {
            console.log(`   ✅ Token/variant extraction completed`)

            // Step 5: Generate Atomic Component + Update CSS Theme
            console.log(`   🔧 Generating component and updating CSS theme...`)
            await generateAtomicComponent(tokenVariantData, this.claudeApiKey, this.outputDir)

            processedComponents.push({
              name: componentGroup.type, // Use component type as name
              type: atom.type,
              componentName: componentGroup.type.charAt(0).toUpperCase() + componentGroup.type.slice(1), // Capitalize component type
              variants: tokenVariantData.variantAnalysis?.variants || [],
              instanceCount: componentGroup.instances.length
            })

            console.log(`   ✅ Component ${atom.name} added to atomic system`)
          } else {
            console.log(`   ⚠️ Token/variant extraction failed for ${atom.name}`)
          }
        }

        // Step 6: Generate Component Showcase in App.tsx
        if (processedComponents.length > 0) {
          console.log(`\n🎨 Step 6: Generating component showcase in App.tsx...`)
          await generateComponentShowcase(this.claudeApiKey, 'test-project')
        }
      }

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`)
    }
  }


  private groupAtomsByType(atoms: any[]): any[] {
    const groups = new Map()

    for (const atom of atoms) {
      const key = atom.type // Group by component type (input, button, checkbox, etc.)

      if (!groups.has(key)) {
        groups.set(key, {
          type: key,
          representative: atom, // First instance as representative
          instances: []
        })
      }

      groups.get(key).instances.push(atom)
    }

    const uniqueComponents = Array.from(groups.values())

    // Log grouped components for visibility
    console.log(`   📊 Grouped into unique types:`)
    uniqueComponents.forEach(group => {
      console.log(`      • ${group.type}: ${group.instances.length} instances`)
    })

    return uniqueComponents
  }
}