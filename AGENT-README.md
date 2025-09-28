# Figma Agent

Independent Figma Agent that uses Figma API + Claude AI to analyze designs and identify atomic components for shadcn/ui implementation.

## Features

- 🎨 **Universal Design Analysis**: Works with ANY Figma design
- 🤖 **AI-Powered**: Uses Claude AI for intelligent component identification
- ⚛️ **Atomic Design**: Identifies atoms, analyzes variants and properties
- 🛠️ **Shadcn Integration**: Maps components to shadcn/ui and installs them
- 📝 **Comprehensive Documentation**: Generates detailed implementation guides
- 🔧 **SVG Extraction**: Handles custom icons and logos (MCP integration ready)

## Setup

1. **Clone and Install**
```bash
git clone <your-repo>
cd figma-agent
npm install
```

2. **Configure API Keys**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Get API Keys**
- **Figma Token**: https://figma.com/developers/api#access-tokens
- **Claude API Key**: https://console.anthropic.com/

## Usage

```bash
# Analyze any Figma design
npm run agent "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"

# Or use npx directly
npx tsx figma-agent.ts "FIGMA_URL"
```

## What It Does

1. **Analyzes Figma Design**: Connects to Figma API and fetches design data
2. **Identifies Sections**: Uses Claude AI to identify page sections (header, hero, content, footer)
3. **Finds Atomic Components**: Identifies atoms in the first section (buttons, icons, text, inputs)
4. **Deep Analysis**: Focuses on the first atom for comprehensive analysis:
   - Component variants and properties
   - Design token extraction (colors, spacing, typography)
   - Shadcn component mapping
   - Implementation props generation
5. **Installs Components**: Automatically installs matching shadcn/ui components
6. **Generates Documentation**: Creates detailed markdown files with implementation guides

## Output

The agent generates:
- `atomic-analysis-[section]-[timestamp].md` - List of identified atoms
- `atom-implementation-[atom]-[timestamp].md` - Detailed implementation guide

## Architecture

- **Completely Independent**: No external dependencies beyond Figma + Claude APIs
- **TypeScript**: Fully typed for better development experience
- **Extensible**: Ready for MCP integration for SVG extraction
- **Focused Analysis**: Deep dive into one component at a time

## Example Output

```
🤖 Independent Figma Agent
📄 URL: https://figma.com/design/...
🔍 File: ABC123, Node: 1:23
📡 Fetching from Figma API...
📋 Loaded 51 valid shadcn components
🧠 Analyzing with Claude AI...

✅ Analysis Complete!
📊 Found 4 sections:
   1. Header Top (header)
   2. Breadcrumbs (section)
   3. Content (content)
   4. Footer (footer)

🔬 Analyzing atoms in first section: Header Top
   ⚛️ Found 10 atoms:
      1. Logo Vector (logo)
      2. Search Icon (icon)
      3. Search Placeholder Text (text)
      ...

🔧 Analyzing first atom for deep implementation...
   🧩 Deep Analysis - Atom 1: Logo Vector
   📊 Found 1 variants
   🎨 Creating custom SVG component
   📝 Saved implementation
```

## Contributing

This agent is designed to be extended with:
- MCP integration for SVG extraction
- Multi-atom analysis
- Design system rule generation
- Component variant testing

---
*Built with Figma API + Claude AI*
