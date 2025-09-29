
export async function getFigmaData(fileKey: string, nodeId: string, figmaToken: string): Promise<any> {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': figmaToken
    }
  })

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const nodeData = data.nodes[nodeId]?.document

  if (!nodeData) {
    throw new Error(`Node ${nodeId} not found`)
  }

  return nodeData
}

export async function identifySections(pageData: any, claudeApiKey: string): Promise<Array<{id: string, name: string, type: string}>> {
  const { loadPrompt } = await import('../../utils/prompt-loader')

  const childrenList = pageData.children?.map((child: any, i: number) =>
    `${i + 1}. "${child.name}" (id: ${child.id}, y: ${child.y || 0}, height: ${child.height || 0})`
  ).join('\n') || 'No children'

  const prompt = loadPrompt('step-02-section-identification', {
    PAGE_NAME: pageData.name,
    CHILDREN_COUNT: String(pageData.children?.length || 0),
    CHILDREN_LIST: childrenList
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log(`Claude API Response: ${response.status} - ${errorText}`)
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  const content = result.content[0]?.text || ''

  try {
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\[.*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // Fallback: basic analysis without Claude
    console.log('⚠️ Claude analysis failed, using basic analysis')
  }

  // Fallback analysis
  return basicSectionAnalysis(pageData)
}

function basicSectionAnalysis(pageData: any): Array<{id: string, name: string, type: string}> {
  if (!pageData?.children) return []

  return pageData.children.map((child: any, index: number) => {
    const name = child.name?.replace(/[_-]/g, ' ').trim() || `Section ${index + 1}`
    const lowerName = name.toLowerCase()
    const isFirst = index === 0
    const isLast = index === pageData.children.length - 1

    let type = 'section'
    if (isFirst && lowerName.includes('header')) type = 'header'
    else if (isLast && lowerName.includes('footer')) type = 'footer'
    else if (lowerName.includes('hero') || lowerName.includes('banner')) type = 'hero'
    else if (lowerName.includes('nav')) type = 'navigation'
    else if (lowerName.includes('content') || lowerName.includes('product')) type = 'content'

    return { id: child.id, name, type }
  })
}