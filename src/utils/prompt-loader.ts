import { readFileSync } from 'fs'
import { resolve } from 'path'

export function loadPrompt(stepDir: string, variables: Record<string, string> = {}): string {
  const filePath = resolve(process.cwd(), 'steps', stepDir, 'prompt.md')

  try {
    let content = readFileSync(filePath, 'utf-8')

    // Extract just the AI prompt section (after "## AI Prompt")
    const lines = content.split('\n')
    let inPromptSection = false
    let prompt = ''

    for (const line of lines) {
      if (line.includes('## AI Prompt')) {
        inPromptSection = true
        continue
      }
      if (inPromptSection) {
        prompt += line + '\n'
      }
    }

    // Use the extracted prompt, or fall back to full content if no section found
    content = prompt.trim() || content

    // Replace variables in {{VARIABLE}} format
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, 'g'), value)
    }

    return content.trim()
  } catch (error) {
    throw new Error(`Failed to load prompt file: ${stepDir}/prompt.md. Error: ${error.message}`)
  }
}