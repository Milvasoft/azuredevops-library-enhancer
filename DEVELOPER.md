# Developer Documentation

## Prerequisites

- Node.js 14+ and npm
- Azure DevOps organization (for testing)
- tfx-cli (Azure DevOps Extension CLI)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/Milvasoft/azuredevops-library-enhancer.git
cd azuredevops-library-enhancer
npm install
```

### 2. Install tfx-cli (if not already installed)

```bash
npm install -g tfx-cli
```

## Development

### Project Structure

```
azuredevops-library-enhancer/
├── src/
│   ├── components/          # React components
│   │   ├── HierarchicalTree.tsx      # Tree view component
│   │   ├── LibraryHub.tsx            # Production component (with SDK)
│   │   └── LibraryHubTest.tsx        # Test component (without SDK)
│   ├── services/            # Business logic
│   │   └── VariableGroupService.ts   # Hierarchy building & URL generation
│   ├── styles/              # CSS files
│   │   └── library-hub.css          # Main styles (theme-aware)
│   ├── types/               # TypeScript types
│   │   └── types.ts                 # VariableGroup, TreeNode interfaces
│   ├── library-hub.tsx      # Production entry point
│   └── test-hub.tsx         # Test entry point
├── test/
│   └── test-data.json       # Sample data for local testing
├── dist/                    # Build output (webpack)
├── webpack.config.js        # Webpack configuration (dual entry)
├── vss-extension.json       # Extension manifest
└── package.json
```

### Local Development & Testing

#### Option 1: Local Preview (Recommended for UI Development)

1. **Build the test bundle:**
   ```bash
   npm run build
   ```

2. **Start local server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

   This will load `LibraryHubTest` component with data from `test/test-data.json`.

#### Option 2: Install in Azure DevOps (Testing with Real Data)

1. **Build and package:**
   ```bash
   npm run build
   npm run package
   ```

2. **Upload to Azure DevOps:**
   - Go to https://marketplace.visualstudio.com/manage/publishers/[your-publisher]
   - Upload the `.vsix` file from root directory
   - Share with your Azure DevOps organization

3. **Install in your organization:**
   - Organization Settings → Extensions → Shared
   - Install the extension

## Build Commands

### Development Build
```bash
npm run build
```
Creates optimized production bundles:
- `dist/library-hub.js` (production - 688KB)
- `dist/test-hub.js` (test preview - 615KB)

### Package Extension
```bash
npm run package
```
Creates `.vsix` file: `milvasoft.library-enhancer-[version].vsix`

### Complete Build & Package
```bash
npm run build && npm run package
```

## Configuration

### Extension Manifest (`vss-extension.json`)

Key configuration options:

```json
{
  "version": "2.0.14",              // Extension version (update before packaging)
  "publisher": "milvasoft",          // Your publisher ID
  "public": true,                    // Make extension public in marketplace
  "scopes": [
    "vso.variablegroups_read"        // Read-only access to variable groups
  ]
}
```

**Important:** Update `version` before each release!

### Webpack Configuration

The project uses dual entry points:

- **library-hub**: Production bundle with Azure DevOps SDK
- **test-hub**: Test bundle without SDK (for local preview)

## Code Architecture

### Data Flow

```
Azure DevOps API
    ↓
LibraryHub.tsx (SDK integration)
    ↓
VariableGroupService.buildHierarchy()
    ↓
HierarchicalTree.tsx (recursive rendering)
```

### Key Components

#### 1. LibraryHub.tsx (Production)
- Initializes Azure DevOps SDK
- Fetches variable groups via REST API
- Handles navigation and authentication
- Renders HierarchicalTree

#### 2. LibraryHubTest.tsx (Testing)
- Loads data from `test/test-data.json`
- No SDK dependencies
- Dual view mode (Hierarchy / List)
- Perfect for UI development

#### 3. HierarchicalTree.tsx
- Recursive tree component
- Collapsible rows
- Level-based styling
- Mouse interactions (left/middle/right-click, ctrl-click)
- Copy button for variable group names

#### 4. VariableGroupService.ts
- Parses variable group names (dash-separated hierarchy)
- Builds tree structure (two-pass algorithm)
- Generates Azure DevOps URLs

### Styling

All styles use CSS variables for theme compatibility:

```css
/* Light/Dark theme support */
var(--background-color, #fff)
var(--text-primary-color, #323130)
var(--communication-foreground, #0078d4)
```

## Testing

### Unit Testing (Local Preview)

1. Edit `test/test-data.json` with your test scenarios
2. Run `npm start`
3. Test in browser at http://localhost:3000

### Integration Testing (Azure DevOps)

1. Create a test Azure DevOps organization
2. Package and install extension
3. Navigate to: Pipelines → Library (Enhanced)
4. Test with real variable groups

### Test Scenarios

- ✅ Single-level variable groups
- ✅ Multi-level hierarchy (3+ levels)
- ✅ Parent is both folder and variable group
- ✅ Empty variable groups
- ✅ Large variable counts (100+)
- ✅ Special characters in names
- ✅ Dark/Light theme switching
- ✅ All mouse interactions

## Release Process

### 1. Update Version

Edit `vss-extension.json`:
```json
"version": "2.0.15"
```

### 2. Update Changelog

Add to `README.md`:
```markdown
## Version 2.0.15
- New feature description
- Bug fixes
```

### 3. Build & Package

```bash
npm run build
npm run package
```

### 4. Test Package

Install the `.vsix` file in a test organization first!

### 5. Publish to Marketplace

1. Go to https://marketplace.visualstudio.com/manage/publishers/milvasoft
2. Update existing extension or publish new version
3. Upload `.vsix` file
4. Update extension details (description, screenshots, etc.)

### 6. Commit & Push

```bash
git add .
git commit -m "Release v2.0.15: [description]"
git tag v2.0.15
git push origin main --tags
```

## Troubleshooting

### Build Errors

**Problem:** `Module not found: Error: Can't resolve...`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem:** TypeScript errors
```bash
# Check tsconfig.json and types
npm run build -- --display-error-details
```

### Extension Loading Issues

**Problem:** Extension not showing in Azure DevOps
- Verify extension is installed: Organization Settings → Extensions
- Check browser console for errors (F12)
- Verify contribution target: `ms.vss-build-web.build-release-hub-group`

**Problem:** Permission errors
- Check scope in `vss-extension.json`: `vso.variablegroups_read`
- Reinstall extension to apply new permissions

**Problem:** Data not loading
- Check network tab for API calls
- Verify project context is available
- Check console logs: `console.log('Variable groups loaded:', vgs.length)`

### Packaging Errors

**Problem:** `Scope is not valid` error
- Use modern scope format: `vso.variablegroups_read` (not `vso.variablegroups`)

**Problem:** `.woff2` content type warning
- This is a warning, not an error - safe to ignore
- Extension will still work correctly

## Performance Optimization

### Bundle Size

Current sizes:
- library-hub.js: ~688KB (includes Azure DevOps UI library)
- test-hub.js: ~615KB

To reduce bundle size:
- Use code splitting with `import()`
- Lazy load heavy components
- Tree-shake unused dependencies

### Runtime Performance

- Tree rendering is optimized with React's virtual DOM
- Collapse/expand operations are O(1)
- Hierarchy building is O(n) where n = number of variable groups

## Browser Support

Tested and working on:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## Dependencies

### Production Dependencies
```json
{
  "react": "16.8.1",
  "react-dom": "16.8.1",
  "azure-devops-extension-api": "^4.0.2",
  "azure-devops-extension-sdk": "^4.0.2",
  "azure-devops-ui": "^2.167.91"
}
```

### Dev Dependencies
- webpack 5
- typescript 4.x
- css-loader, style-loader
- tfx-cli

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Update documentation if needed
4. Commit with descriptive message
5. Push and create pull request

## License

MIT

## Support

- GitHub Issues: https://github.com/Milvasoft/azuredevops-library-enhancer/issues
- Documentation: https://github.com/Milvasoft/azuredevops-library-enhancer
