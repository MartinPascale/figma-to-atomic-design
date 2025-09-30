import { generateComponentShowcase } from './lib/steps/step-06-component-showcase/script.js';

// Test the step-06 function
console.log('🔍 Testing step-06-component-showcase...');

try {
  // This should run without errors even if no components exist
  await generateComponentShowcase('fake-api-key', 'test-project');
  console.log('✅ Step-06 integration test passed');
} catch (error) {
  console.log(`❌ Step-06 integration test failed: ${error.message}`);
}