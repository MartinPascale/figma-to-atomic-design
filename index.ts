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

interface AtomInstance {
  id: string
  name: string
  type: string
  skipImplementation?: boolean
}

interface ComponentGroup {
  type: string
  representative: AtomInstance
  instances: AtomInstance[]
}

interface ProcessedComponent {
  name: string
  type: string
  componentName: string
  variants: any[]
  instanceCount: number
}

interface Section {
  id: string
  name: string
  type: string
}

export class FigmaToAtomic {
  private readonly figmaToken: string
  private readonly claudeApiKey: string
  private readonly outputDir: string
  private validShadcnComponents: Set<string> = new Set()

  constructor(options: FigmaToAtomicOptions) {
    this.figmaToken = options.figmaToken
    this.claudeApiKey = options.claudeApiKey
    this.outputDir = options.outputDir || './src'

    this.initializeShadcnComponents()
    this.initializeOutputDirectories()
  }

  private initializeShadcnComponents(): void {
    this.validShadcnComponents = loadShadcnComponents()
    console.log(`📋 Loaded ${this.validShadcnComponents.size} valid shadcn components`)
  }

  private initializeOutputDirectories(): void {
    setupOutputDirectories(this.outputDir)
  }

  async analyze(figmaUrl: string): Promise<void> {
    console.log(`📄 Analyzing: ${figmaUrl}`)

    try {
      const { nodeId, fileKey } = await this.processUrlAndValidateAPIs(figmaUrl)
      const sections = await this.identifyFigmaSections(fileKey, nodeId)

      if (sections.length > 0) {
        await this.processAtomicComponents(fileKey, sections[0])
      }

    } catch (error: any) {
      throw new Error(`Analysis failed: ${error.message}`)
    }
  }

  private async processUrlAndValidateAPIs(figmaUrl: string): Promise<{ nodeId: string; fileKey: string }> {
    console.log('🔍 Step 1: Processing URL and validating APIs...')

    validateApiKeys(this.figmaToken, this.claudeApiKey)
    const { nodeId, fileKey } = parseUrl(figmaUrl)

    console.log(`   File: ${fileKey}, Node: ${nodeId}`)
    return { nodeId, fileKey }
  }

  private async identifyFigmaSections(fileKey: string, nodeId: string): Promise<Section[]> {
    console.log('📡 Step 2: Fetching page data and identifying sections...')

    const pageData = await getFigmaData(fileKey, nodeId, this.figmaToken)
    const sections = await identifySections(pageData, this.claudeApiKey)

    console.log(`✅ Found ${sections.length} sections:`)
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.name} (${section.type}) [${section.id}]`)
    })

    return sections
  }

  private async processAtomicComponents(fileKey: string, firstSection: Section): Promise<void> {
    console.log(`🔬 Step 3: Discovering atoms in first section: ${firstSection.name}`)

    const discoveredAtoms = await discoverAtoms(fileKey, firstSection, this.figmaToken, this.claudeApiKey)
    const componentGroups = this.groupAtomsByType(discoveredAtoms)

    console.log(`🧩 Processing ${componentGroups.length} unique component types (from ${discoveredAtoms.length} instances)...`)

    const processedComponents = await this.generateComponents(fileKey, firstSection, componentGroups)

    if (processedComponents.length > 0) {
      await this.generateShowcase()
    }
  }

  private async generateComponents(
    fileKey: string,
    section: Section,
    componentGroups: ComponentGroup[]
  ): Promise<ProcessedComponent[]> {
    const processedComponents: ProcessedComponent[] = []

    for (let i = 0; i < componentGroups.length; i++) {
      const componentGroup = componentGroups[i]
      const representativeAtom = componentGroup.representative

      console.log(`\n🔬 [${i + 1}/${componentGroups.length}] Processing ${componentGroup.type}: ${representativeAtom.name} (${componentGroup.instances.length} instances)`)

      const tokenVariantData = await this.extractTokensAndVariants(
        fileKey,
        representativeAtom,
        section.name
      )

      if (tokenVariantData) {
        console.log(`   ✅ Token/variant extraction completed`)

        await this.generateComponentFiles(tokenVariantData)

        const processedComponent = this.createProcessedComponent(componentGroup, representativeAtom, tokenVariantData)
        processedComponents.push(processedComponent)

        console.log(`   ✅ Component ${representativeAtom.name} added to atomic system`)
      } else {
        console.log(`   ⚠️ Token/variant extraction failed for ${representativeAtom.name}`)
      }
    }

    return processedComponents
  }

  private async extractTokensAndVariants(
    fileKey: string,
    atom: AtomInstance,
    sectionName: string
  ): Promise<any> {
    console.log(`   📊 Extracting tokens and variants...`)

    return await extractAtomTokensAndVariants(
      fileKey,
      atom,
      sectionName,
      this.figmaToken,
      this.claudeApiKey
    )
  }

  private async generateComponentFiles(tokenVariantData: any): Promise<void> {
    console.log(`   🔧 Generating component and updating CSS theme...`)
    await generateAtomicComponent(tokenVariantData, this.claudeApiKey, this.outputDir)
  }

  private createProcessedComponent(
    componentGroup: ComponentGroup,
    atom: AtomInstance,
    tokenVariantData: any
  ): ProcessedComponent {
    return {
      name: componentGroup.type,
      type: atom.type,
      componentName: this.capitalizeComponentType(componentGroup.type),
      variants: tokenVariantData.variantAnalysis?.variants || [],
      instanceCount: componentGroup.instances.length
    }
  }

  private capitalizeComponentType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  private async generateShowcase(): Promise<void> {
    console.log(`\n🎨 Step 6: Generating component showcase in App.tsx...`)
    await generateComponentShowcase(this.claudeApiKey, 'test-project')
  }

  private groupAtomsByType(atoms: AtomInstance[]): ComponentGroup[] {
    const componentGroups = new Map<string, ComponentGroup>()

    for (const atom of atoms) {
      const componentType = atom.type

      if (!componentGroups.has(componentType)) {
        componentGroups.set(componentType, {
          type: componentType,
          representative: atom,
          instances: []
        })
      }

      componentGroups.get(componentType)!.instances.push(atom)
    }

    const uniqueComponentGroups = Array.from(componentGroups.values())

    this.logComponentGroups(uniqueComponentGroups)
    return uniqueComponentGroups
  }

  private logComponentGroups(groups: ComponentGroup[]): void {
    console.log(`   📊 Grouped into unique types:`)
    groups.forEach(group => {
      console.log(`      • ${group.type}: ${group.instances.length} instances`)
    })
  }
}