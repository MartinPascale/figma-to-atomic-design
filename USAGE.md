# How to Run the Figma Agent

## Quick Start

### 1. **Install Dependencies** (if not already done)
```bash
npm install
```

### 2. **Set up API Keys** (if not already done)
Make sure your `.env` file contains:
```env
FIGMA_ACCESS_TOKEN=your_figma_token_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### 3. **Run the Agent**

#### **Original Monolithic Agent** (current working version)
```bash
npm run agent "FIGMA_URL"
```

#### **New Modular Agent** (step-by-step architecture)
```bash
npm run agent:new "FIGMA_URL"
```

## Example

```bash
npm run agent:new "https://figma.com/design/ABC123/My-Design?node-id=1-23"
```

## What Each Version Does

### **Original Agent** (`npm run agent`)
- **File**: `figma-agent.ts` (monolithic, 26KB)
- **Status**: Fully working and tested
- **Process**: All steps in one file
- **Output**: Same markdown files

### **New Modular Agent** (`npm run agent:new`)
- **File**: `src/main.ts` (uses step folders)
- **Status**: Same functionality, clean step-based architecture
- **Structure**: Each step has its own folder with:
  - `script.ts` - TypeScript implementation
  - `prompt.md` - Self-documenting AI prompt with human docs
- **Process**:
  1. Step 1: URL Processing & API Validation
  2. Step 2: Section Identification
  3. Step 3: Atom Discovery
  4. Step 4: Deep Implementation Analysis
- **Output**: Same markdown files

## Agent Capabilities

Both versions provide:
- ✅ **Universal Design Analysis**: Works with ANY Figma design
- ✅ **Section Identification**: Categorizes page sections (header, hero, content, footer)
- ✅ **Atom Discovery**: Finds all atomic components in first section
- ✅ **Deep Analysis**: Comprehensive implementation guide for first atom
- ✅ **Shadcn Integration**: Validates and installs shadcn components
- ✅ **Documentation**: Generates detailed markdown files

## Current Scope

**Processes**:
- All sections identified (but only first section analyzed)
- All atoms discovered (but only first atom gets deep analysis)

**Outputs**:
- `atomic-analysis-[section]-[timestamp].md` - Complete atom inventory
- `atom-implementation-[atom]-[timestamp].md` - Implementation guide

## Next Steps

The modular architecture is ready for extension to:
- Process all sections (not just first)
- Analyze all atoms (not just first)
- Add Phase 2 token extraction
- Implement component hierarchy (molecules/organisms)
- Add validation phase

---

**Recommendation**: Start with `npm run agent:new` to use the modular architecture that's ready for future enhancements.