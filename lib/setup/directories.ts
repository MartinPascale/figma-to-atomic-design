import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the root directory of the CLI project
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..', '..')

export function setupOutputDirectories(baseDir: string = './src'): void {
  const dirs = [
    `${baseDir}/components/atoms`,
    resolve(rootDir, 'outputs/components') // For component analysis files - always in root outputs
  ]

  dirs.forEach(dir => {
    try {
      mkdirSync(resolve(dir), { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }
  })
}