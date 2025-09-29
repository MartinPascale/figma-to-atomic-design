import { mkdirSync } from 'fs'
import { resolve } from 'path'

export function setupOutputDirectories(baseDir: string = './src'): void {
  const dirs = [
    `${baseDir}/components/atoms`,
    `${baseDir}/components/icons`,
    `${baseDir}/lib`,
    'components' // For component analysis files
  ]

  dirs.forEach(dir => {
    try {
      mkdirSync(resolve(dir), { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }
  })
}