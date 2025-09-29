# 🧪 Testing Guide

## **Quick Start - 3 Ways to Test**

### **1. 🚀 Test Package Structure (No API Keys)**
```bash
npm run test:demo
```
**What this tests:**
- Project detection (Vite + React + TS)
- Dependency installation (Tailwind, shadcn/ui, CVA)
- Directory structure creation
- Package configuration

**Expected output:**
```
✅ Project setup: Vite + React + TypeScript
✅ FigmaToAtomic instance created successfully
✅ Output directories configured
📁 Expected output structure: [shows file tree]
```

### **2. 🎨 Test with Real Figma Design (API Keys Required)**

#### **Step 1: Get API Keys**
1. **Figma Token**: https://figma.com/developers/api#access-tokens
2. **Claude Key**: https://console.anthropic.com/

#### **Step 2: Update .env**
```bash
# Edit your .env file
code .env

# Add your tokens:
FIGMA_ACCESS_TOKEN=your_actual_figma_token
ANTHROPIC_API_KEY=your_actual_claude_key
```

#### **Step 3: Test with Figma URL**
```bash
# Use any public Figma design URL
npm run dev "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"

# Or use the original command structure
npm run agent "https://figma.com/design/FILE_KEY/Design?node-id=X-Y"
```

**What this tests:**
- Full Figma API integration
- Claude AI analysis
- Design token extraction
- React component generation
- File creation in proper structure

### **3. 📦 Test as NPM Package (Most Realistic)**
```bash
# Test in the included Vite project
cd test-project

# Run the CLI as an npm package would
npx tsx ../src/cli.ts "FIGMA_URL" --output ./src

# Or test setup only
npx tsx ../src/cli.ts "FIGMA_URL" --skip-setup
```

## **📋 Testing Checklist**

### **✅ Package Structure Test**
- [ ] Runs `npm run test:demo` successfully
- [ ] Shows correct project detection
- [ ] Creates components.json
- [ ] Installs dependencies
- [ ] Shows expected file structure

### **✅ Real Figma Test** (with API keys)
- [ ] Connects to Figma API
- [ ] Identifies sections
- [ ] Discovers atomic components
- [ ] Extracts design tokens
- [ ] Generates React components
- [ ] Creates these files:
  - [ ] `components/[Atom].component.json`
  - [ ] `components/[Atom].component.md`
  - [ ] `src/components/atoms/[Atom].tsx`
  - [ ] `src/lib/utils.ts`
  - [ ] `src/globals.css` (if tokens extracted)

### **✅ Generated Component Test**
- [ ] Component has TypeScript interfaces
- [ ] Uses CVA for variants
- [ ] Imports shadcn/ui components
- [ ] Has proper exports
- [ ] Validates without warnings

## **🔍 What to Look For**

### **Console Output Should Show:**
```
🤖 Figma to Atomic - Transform designs into React components
🔍 Step 1: Processing URL and validating APIs...
📡 Step 2: Fetching page data and identifying sections...
🔬 Step 3: Discovering atoms in first section...
🧩 Step 4: Comprehensive analysis of first atom...
      🎨 Extracting design tokens...
      📝 Generated React component: src/components/atoms/[Name].tsx
      📋 Updated component index
✅ Analysis Complete!
```

### **Generated Files Should Contain:**
- **Component.tsx**: CVA variants, TypeScript, forwardRef
- **component.json**: Design tokens + implementation data
- **component.md**: Human-readable analysis
- **utils.ts**: cn() function with proper types

## **🐛 Troubleshooting**

### **"Missing API Keys"**
```bash
# Check your .env file
cat .env

# Make sure you have both:
FIGMA_ACCESS_TOKEN=figd_...
ANTHROPIC_API_KEY=sk-ant-...
```

### **"Not a supported project type"**
```bash
# Make sure you're in a Vite + React + TS project
ls package.json vite.config.ts

# Check package.json has react and typescript
cat package.json | grep -E "(react|typescript)"
```

### **"Failed to install dependencies"**
```bash
# Run manually if needed
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
```

## **🎯 Success Criteria**

**✅ Test is successful when:**
1. No error messages in console
2. Component files are generated in correct locations
3. Generated components have valid TypeScript
4. Package.json shows new dependencies installed
5. components.json is created with correct paths
6. You can import and use the generated components

## **🚀 Next Steps After Testing**

1. **Try the generated components** in your React app
2. **Test with different Figma designs** to see variety
3. **Customize the output** with CLI options
4. **Build the package** with `npm run build`
5. **Publish to npm** (when ready)

---

**💡 Need help?** Check the generated component files to see exactly what was created!