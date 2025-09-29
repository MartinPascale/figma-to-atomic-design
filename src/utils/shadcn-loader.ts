import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export function loadShadcnComponents(): Set<string> {
  const validComponents = new Set<string>()

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