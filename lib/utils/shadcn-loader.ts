import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function loadShadcnComponents(): Set<string> {
  const validComponents = new Set<string>()

  try {
    const componentFile = resolve(__dirname, '..', 'resources', 'shadcn-components.md')

    if (existsSync(componentFile)) {
      const content = readFileSync(componentFile, 'utf-8')
      // Extract component names from markdown (lines starting with - `)
      const matches = content.match(/- `([^`]+)`/g)
      if (matches) {
        matches.forEach(match => {
          const component = match.match(/- `([^`]+)`/)?.[1]
          if (component) {
            validComponents.add(component)
          }
        })
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not load shadcn components list: ${error.message}`)
  }

  return validComponents
}