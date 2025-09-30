import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..', '..')

export async function generateComponentShowcase(
  claudeApiKey: string,
  projectDir: string = 'test-project'
): Promise<void> {
  console.log(`\n   🎨 Generating component showcase in App.tsx...`)

  try {
    // Find all generated atomic components
    const componentFiles = findGeneratedComponents(projectDir)

    if (componentFiles.length === 0) {
      console.log(`      ❌ No atomic components found in ${projectDir}/src/components/atoms/`)
      return
    }

    console.log(`      📦 Found ${componentFiles.length} atomic components:`)
    componentFiles.forEach(comp => {
      console.log(`         - ${comp.name} (${comp.type})`)
    })

    // Target App.tsx file
    const appFilePath = resolve(rootDir, projectDir, 'src', 'App.tsx')

    if (!existsSync(appFilePath)) {
      console.log(`      ❌ App.tsx not found at: ${appFilePath}`)
      return
    }

    // Generate showcase using AI
    const showcaseContent = await generateShowcaseWithAI(
      componentFiles,
      appFilePath,
      claudeApiKey
    )

    if (showcaseContent) {
      // Write the showcase to App.tsx
      writeFileSync(appFilePath, showcaseContent)

      console.log(`      ✅ Component showcase generated successfully`)
      console.log(`      📝 Updated: ${appFilePath}`)
      console.log(`      🎨 Using Tailwind CSS for styling`)
    } else {
      console.log(`      ❌ Failed to generate showcase content`)
    }

  } catch (error) {
    console.log(`      ❌ Showcase generation failed: ${error.message}`)
  }
}

function findGeneratedComponents(projectDir: string): Array<{name: string, type: string, path: string}> {
  const atomsDir = resolve(rootDir, projectDir, 'src', 'components', 'atoms')

  if (!existsSync(atomsDir)) {
    return []
  }

  const components = []

  try {
    // Find all component directories
    const entries = readdirSync(atomsDir)

    for (const entry of entries) {
      const entryPath = resolve(atomsDir, entry)
      const stat = statSync(entryPath)

      if (stat.isDirectory()) {
        const componentName = entry
        const componentPath = resolve(entryPath, `${componentName}.tsx`)

        if (existsSync(componentPath)) {
          // Determine component type based on common patterns
          let type = 'component'
          if (componentName.toLowerCase().includes('button')) type = 'button'
          else if (componentName.toLowerCase().includes('input')) type = 'input'
          else if (componentName.toLowerCase().includes('card')) type = 'card'
          else if (componentName.toLowerCase().includes('checkbox')) type = 'checkbox'
          else if (componentName.toLowerCase().includes('select')) type = 'select'
          else if (componentName.toLowerCase().includes('pagination')) type = 'pagination'

          components.push({
            name: componentName,
            type: type,
            path: componentPath
          })
        }
      }
    }
  } catch (error) {
    console.log(`      ⚠️ Error reading atoms directory: ${(error as Error).message}`)
  }

  return components.sort((a, b) => a.name.localeCompare(b.name))
}

async function generateShowcaseWithAI(
  components: Array<{name: string, type: string, path: string}>,
  appFilePath: string,
  claudeApiKey: string
): Promise<string | null> {

  const { loadPrompt } = await import('../../utils/prompt-loader')

  // Create component list for the prompt
  const componentList = components.map(comp =>
    `- ${comp.name} (${comp.type}) - ./components/atoms/${comp.name}/${comp.name}`
  ).join('\n')

  const prompt = loadPrompt('step-06-component-showcase', {
    COMPONENT_LIST: componentList,
    APP_FILE_PATH: appFilePath
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

    // Parse delimiter-based response
    const appContentMatch = content.match(/---APP_CONTENT---\s*\n([\s\S]*?)(?:\n---NOTES---|$)/)

    if (appContentMatch) {
      let appContent = appContentMatch[1].trim()

      // Clean up any formatting issues
      appContent = cleanupGeneratedCode(appContent)

      console.log(`      ✅ Extracted App.tsx content (${appContent.length} chars)`)

      // Extract notes if available
      const notesMatch = content.match(/---NOTES---\s*\n([\s\S]*?)$/)
      if (notesMatch) {
        const notes = notesMatch[1].trim()
        console.log(`      📝 Implementation notes: ${notes.substring(0, 100)}...`)
      }

      return appContent
    } else {
      console.log(`      ⚠️ No ---APP_CONTENT--- section found in response`)
      console.log(`      🔍 Response preview: ${content.substring(0, 200)}...`)
      return null
    }

  } catch (error) {
    console.log(`      ⚠️ AI showcase generation failed: ${error.message}`)
    return null
  }
}

function cleanupGeneratedCode(code: string): string {
  // Remove any leading/trailing backticks
  code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')

  // Remove any markdown language specifiers
  code = code.replace(/^tsx\n/, '').replace(/^typescript\n/, '').replace(/^javascript\n/, '')

  // Ensure proper line endings
  code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Remove extra empty lines at start/end
  code = code.trim()

  return code
}


export async function saveShowcaseAnalysis(
  components: Array<{name: string, type: string}>,
  showcaseImplementation: string
): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = resolve(rootDir, `outputs/component-showcase-${timestamp}.md`)

  const markdown = `# Component Showcase Implementation

**Generated:** ${new Date().toLocaleString()}
**Components Showcased:** ${components.length}

## Components Included

${components.map((comp, i) => `### ${i + 1}. ${comp.name}
- **Type:** ${comp.type}
- **Category:** Atomic Component
`).join('\n')}

## Implementation Details

${showcaseImplementation}

---
*Generated by Figma-to-Atomic-Design CLI*`

  try {
    writeFileSync(filename, markdown)
    console.log(`      📝 Saved showcase analysis to: ${filename}`)
  } catch (error) {
    console.log(`      ❌ Failed to save showcase analysis: ${error.message}`)
  }
}