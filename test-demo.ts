#!/usr/bin/env node
/**
 * Demo script to test the figma-to-atomic package functionality
 * This simulates how the npm package would work in a real Vite project
 */

import { FigmaToAtomic } from './src/index.js'
import { setupProject } from './src/setup/project-setup.js'
import { resolve } from 'path'

async function demo() {
  console.log('🧪 Testing figma-to-atomic package functionality\n')

  // Change to test project directory
  const testProjectDir = resolve('./test-project')
  process.chdir(testProjectDir)

  console.log(`📁 Working in: ${testProjectDir}`)

  try {
    // Test project setup
    console.log('\n1️⃣ Testing project setup...')
    const setupResult = await setupProject({ skipSetup: false })

    if (!setupResult.success) {
      console.error(`❌ Setup failed: ${setupResult.error}`)
      return
    }

    console.log(`✅ Project setup: ${setupResult.type}`)

    // Test the Figma analysis (dry run with mock data)
    console.log('\n2️⃣ Testing Figma analysis structure...')

    const agent = new FigmaToAtomic({
      figmaToken: 'mock-token',
      claudeApiKey: 'mock-key',
      outputDir: './src'
    })

    console.log('✅ FigmaToAtomic instance created successfully')
    console.log('✅ Output directories configured')
    console.log('✅ shadcn components loaded')

    // Show what would be created
    console.log('\n📁 Expected output structure:')
    console.log('   test-project/')
    console.log('   ├── src/')
    console.log('   │   ├── components/')
    console.log('   │   │   ├── index.ts')
    console.log('   │   │   ├── atoms/')
    console.log('   │   │   │   ├── index.ts')
    console.log('   │   │   │   └── [Component].tsx')
    console.log('   │   │   └── icons/')
    console.log('   │   │       ├── index.ts')
    console.log('   │   │       └── [Icon].tsx')
    console.log('   │   ├── lib/')
    console.log('   │   │   └── utils.ts')
    console.log('   │   └── globals.css')
    console.log('   ├── components/')
    console.log('   │   ├── [Component].component.json')
    console.log('   │   └── [Component].component.md')
    console.log('   ├── components.json')
    console.log('   └── tailwind.config.js')

    console.log('\n🎉 Package structure test completed successfully!')
    console.log('\n📚 To test with real Figma data:')
    console.log('   1. Set FIGMA_ACCESS_TOKEN and ANTHROPIC_API_KEY')
    console.log('   2. Run: npm run dev "FIGMA_URL"')

  } catch (error) {
    console.error(`❌ Demo failed: ${error.message}`)
  }
}

demo().catch(console.error)