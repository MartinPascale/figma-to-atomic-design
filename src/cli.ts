#!/usr/bin/env node
import { FigmaToAtomic } from './index.js'
import { setupProject } from './setup/project-setup.js'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    showHelp()
    return
  }

  const figmaUrl = args[0]
  const options = parseOptions(args.slice(1))

  try {
    console.log('🚀 Figma to Atomic - Transform designs into React components\n')

    // Detect and setup project if needed
    const projectSetup = await setupProject(options)
    if (!projectSetup.success) {
      console.error(`❌ ${projectSetup.error}`)
      process.exit(1)
    }

    console.log(`✅ Project setup complete: ${projectSetup.type}`)

    // Run the Figma analysis
    const agent = new FigmaToAtomic({
      figmaToken: process.env.FIGMA_ACCESS_TOKEN || options.figmaToken,
      claudeApiKey: process.env.ANTHROPIC_API_KEY || options.claudeApiKey,
      outputDir: options.outputDir || './src',
      skipSetup: options.skipSetup
    })

    await agent.analyze(figmaUrl)

    console.log('\n🎉 Analysis complete! Your components are ready to use.')
    console.log('\n📚 Next steps:')
    console.log('   1. Review generated components in src/components/')
    console.log('   2. Import design tokens from src/globals.css')
    console.log('   3. Start using your atomic components!')

  } catch (error) {
    console.error(`❌ Error: ${error.message}`)

    if (error.message.includes('FIGMA_ACCESS_TOKEN')) {
      console.log('\n💡 Get Figma token: https://figma.com/developers/api#access-tokens')
      console.log('   Set environment variable: FIGMA_ACCESS_TOKEN=your_token')
    }

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      console.log('\n💡 Get Claude API key: https://console.anthropic.com/')
      console.log('   Set environment variable: ANTHROPIC_API_KEY=your_key')
    }

    process.exit(1)
  }
}

function parseOptions(args: string[]): any {
  const options: any = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i]
    } else if (arg === '--figma-token') {
      options.figmaToken = args[++i]
    } else if (arg === '--claude-key') {
      options.claudeApiKey = args[++i]
    } else if (arg === '--skip-setup') {
      options.skipSetup = true
    }
  }

  return options
}

function showHelp(): void {
  console.log(`
🎨 Figma to Atomic - Transform Figma designs into React components

USAGE:
  figma-atomic "FIGMA_URL" [options]

OPTIONS:
  -o, --output DIR        Output directory (default: ./src)
  --figma-token TOKEN     Figma access token
  --claude-key KEY        Claude API key
  --skip-setup           Skip project setup (Tailwind, shadcn)
  --help                 Show this help

ENVIRONMENT VARIABLES:
  FIGMA_ACCESS_TOKEN     Figma API token
  ANTHROPIC_API_KEY      Claude API key

EXAMPLES:
  figma-atomic "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"
  figma-atomic "FIGMA_URL" --output ./components
  figma-atomic "FIGMA_URL" --skip-setup

SETUP:
  The CLI automatically detects your project type and installs:
  - Tailwind CSS (if not present)
  - shadcn/ui configuration
  - Required dependencies (CVA, clsx, tailwind-merge)

REQUIREMENTS:
  - Vite + React + TypeScript project
  - Node.js 18+
`)
}

main().catch(console.error)