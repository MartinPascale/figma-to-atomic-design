import { generateAtomicComponent } from './lib/steps/step-05-component-generation/script'
import { readFileSync } from 'fs'

async function testSkip() {
  console.log('🧪 Testing text component skip...')

  // Load the existing analysis data (should have skipImplementation: true)
  const analysisData = JSON.parse(readFileSync('./outputs/components/atoms/Text/analysis.json', 'utf8'))

  console.log(`Skip flag: ${analysisData.atom.skipImplementation}`)
  console.log(`Component type: ${analysisData.atom.type}`)

  // Test that text component is skipped
  await generateAtomicComponent(
    analysisData,
    process.env.ANTHROPIC_API_KEY!,
    './test-project/src'
  )
}

testSkip().catch(console.error)