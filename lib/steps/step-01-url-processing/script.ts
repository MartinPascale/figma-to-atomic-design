export function parseUrl(url: string): { nodeId: string, fileKey: string } {
  try {
    const urlObj = new URL(url)
    const nodeId = urlObj.searchParams.get('node-id')?.replace('-', ':')
    const pathParts = urlObj.pathname.split('/')
    const fileKey = pathParts[2] // /design/FILE_KEY/...

    if (!nodeId || !fileKey) {
      throw new Error('Invalid Figma URL')
    }

    return { nodeId, fileKey }
  } catch {
    throw new Error('Could not parse Figma URL - ensure format: https://figma.com/design/FILE_KEY/NAME?node-id=X-Y')
  }
}

export function validateApiKeys(figmaToken: string, claudeApiKey: string): void {
  if (!figmaToken) {
    throw new Error('FIGMA_ACCESS_TOKEN required in .env file')
  }

  if (!claudeApiKey) {
    throw new Error('ANTHROPIC_API_KEY required in .env file')
  }
}