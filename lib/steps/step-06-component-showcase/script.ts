import { writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { loadShadcnComponents } from '../../utils/shadcn-loader.js'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CLI_ROOT_DIR = resolve(__dirname, '..', '..', '..')

interface ComponentInfo {
  name: string
  type: string
  path: string
}

export async function generateComponentShowcase(
  claudeApiKey: string,
  projectDir: string = 'test-project'
): Promise<void> {
  console.log(`\n   🎨 Generating component showcase in App.tsx...`)

  try {
    const discoveredComponents = discoverAtomicComponents(projectDir)

    if (discoveredComponents.length === 0) {
      console.log(`      ❌ No atomic components found in ${projectDir}/src/components/atoms/`)
      return
    }

    console.log(`      📦 Found ${discoveredComponents.length} atomic components:`)
    discoveredComponents.forEach(component => {
      console.log(`         - ${component.name} (${component.type})`)
    })

    const appFilePath = resolve(CLI_ROOT_DIR, projectDir, 'src', 'App.tsx')

    if (!existsSync(appFilePath)) {
      console.log(`      ❌ App.tsx not found at: ${appFilePath}`)
      return
    }

    const showcaseContent = await generateShowcaseWithClaude(
      discoveredComponents,
      appFilePath,
      claudeApiKey
    )

    if (showcaseContent) {
      writeFileSync(appFilePath, showcaseContent)

      console.log(`      ✅ Component showcase generated successfully`)
      console.log(`      📝 Updated: ${appFilePath}`)
      console.log(`      🎨 Using Tailwind CSS for styling`)
    } else {
      console.log(`      ❌ Failed to generate showcase content`)
    }

  } catch (error: any) {
    console.log(`      ❌ Showcase generation failed: ${error.message}`)
  }
}

function discoverAtomicComponents(projectDir: string): ComponentInfo[] {
  const atomsDirectory = resolve(CLI_ROOT_DIR, projectDir, 'src', 'components', 'atoms')

  if (!existsSync(atomsDirectory)) {
    return []
  }

  const components: ComponentInfo[] = []
  const shadcnComponents = loadShadcnComponents()

  try {
    const directoryEntries = readdirSync(atomsDirectory)

    for (const entry of directoryEntries) {
      const entryPath = resolve(atomsDirectory, entry)
      const entryStats = statSync(entryPath)

      if (entryStats.isDirectory()) {
        const componentName = entry
        const componentFile = resolve(entryPath, `${componentName}.tsx`)

        if (existsSync(componentFile)) {
          const componentType = determineComponentType(componentName, shadcnComponents)

          components.push({
            name: componentName,
            type: componentType,
            path: componentFile
          })
        }
      }
    }
  } catch (error: any) {
    console.log(`      ⚠️ Error reading atoms directory: ${error.message}`)
  }

  return components.sort((a, b) => a.name.localeCompare(b.name))
}

function determineComponentType(componentName: string, shadcnComponents: Set<string>): string {
  const lowercaseName = componentName.toLowerCase()

  // Check if the component name matches any shadcn component
  for (const shadcnComponent of shadcnComponents) {
    if (lowercaseName.includes(shadcnComponent.toLowerCase())) {
      return shadcnComponent
    }
  }

  return 'component'
}

async function generateShowcaseWithClaude(
  components: ComponentInfo[],
  appFilePath: string,
  claudeApiKey: string
): Promise<string | null> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const componentList = formatComponentListForPrompt(components)

  const prompt = loadPrompt('step-06-component-showcase', {
    COMPONENT_LIST: componentList,
    APP_FILE_PATH: appFilePath
  })

  try {
    const claudeResponse = await callClaudeAPI(prompt, claudeApiKey)
    console.log(`      🤖 Claude response length: ${claudeResponse.length} chars`)

    const showcaseContent = extractShowcaseContent(claudeResponse)

    if (showcaseContent) {
      console.log(`      ✅ Extracted App.tsx content (${showcaseContent.length} chars)`)
      return showcaseContent
    } else {
      console.log(`      ⚠️ No ---APP_CONTENT--- section found in response`)
      console.log(`      🔍 Response preview: ${claudeResponse.substring(0, 200)}...`)
      return null
    }

  } catch (error: any) {
    console.log(`      ⚠️ AI showcase generation failed: ${error.message}`)
    return null
  }
}

function formatComponentListForPrompt(components: ComponentInfo[]): string {
  return components
    .map(comp => `- ${comp.name} (${comp.type}) - ./components/atoms/${comp.name}/${comp.name}`)
    .join('\n')
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

function extractShowcaseContent(claudeResponse: string): string | null {
  const contentMatch = claudeResponse.match(/---APP_CONTENT---\s*\n([\s\S]*?)(?:\n---NOTES---|$)/)

  if (!contentMatch) {
    return null
  }

  let content = contentMatch[1].trim()
  content = cleanupGeneratedCode(content)

  // Extract and log notes if available
  const notesMatch = claudeResponse.match(/---NOTES---\s*\n([\s\S]*?)$/)
  if (notesMatch) {
    const notes = notesMatch[1].trim()
    console.log(`      📝 Implementation notes: ${notes.substring(0, 100)}...`)
  }

  return content
}

function cleanupGeneratedCode(code: string): string {
  return code
    // Remove leading/trailing backticks
    .replace(/^```[\w]*\n?/, '')
    .replace(/\n?```$/, '')
    // Remove markdown language specifiers
    .replace(/^(tsx|typescript|javascript)\n/, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove extra whitespace
    .trim()
}

export async function saveShowcaseAnalysis(
  components: Array<{ name: string, type: string }>,
  showcaseImplementation: string
): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const outputPath = resolve(CLI_ROOT_DIR, `outputs/component-showcase-${timestamp}.md`)

  const analysisMarkdown = generateAnalysisMarkdown(components, showcaseImplementation)

  try {
    writeFileSync(outputPath, analysisMarkdown)
    console.log(`      📝 Saved showcase analysis to: ${outputPath}`)
  } catch (error: any) {
    console.log(`      ❌ Failed to save showcase analysis: ${error.message}`)
  }
}

function generateAnalysisMarkdown(
  components: Array<{ name: string, type: string }>,
  implementation: string
): string {
  const componentSections = components
    .map((comp, i) =>
      `### ${i + 1}. ${comp.name}\n- **Type:** ${comp.type}\n- **Category:** Atomic Component`
    )
    .join('\n\n')

  return `# Component Showcase Implementation

**Generated:** ${new Date().toLocaleString()}
**Components Showcased:** ${components.length}

## Components Included

${componentSections}

## Implementation Details

${implementation}

---
*Generated by Figma-to-Atomic-Design CLI*`
}