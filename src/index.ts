import { parseUrl, validateApiKeys } from '../steps/step-01-url-processing/script.js'
import { getFigmaData, identifySections } from '../steps/step-02-section-identification/script.js'
import { discoverAtoms } from '../steps/step-03-atom-discovery/script.js'
import { analyzeAtomForImplementation } from '../steps/step-04-deep-atom-analysis/script.js'
import { loadShadcnComponents } from './utils/shadcn-loader.js'
import { setupOutputDirectories } from './setup/directories.js'

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

        // Step 4 & 5: Comprehensive Atom Analysis (First Atom Only)
        if (atoms.length > 0) {
          console.log(`🧩 Step 4: Comprehensive analysis of first atom: ${atoms[0].name}`)

          // Set the output directory for the analysis
          process.env.FIGMA_ATOMIC_OUTPUT_DIR = this.outputDir

          await analyzeAtomForImplementation(
            fileKey,
            atoms[0],
            firstSection.name,
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

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`)
    }
  }
}