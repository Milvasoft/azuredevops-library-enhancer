# Azure DevOps Library Enhancer

Enhance your Azure DevOps Library experience with hierarchical variable group organization and improved navigation.

## ✨ Features

### 🌳 Hierarchical Grouping
- Automatically groups Variable Groups by name using `-` delimiter
- Example: `myapp-api-prod`, `myapp-api-test` → grouped under `myapp` > `api`
- Collapsible/Expandable folders for better organization

### 🔗 Enhanced Navigation
- **Left Click**: Navigate to variable group details
- **Right Click** or **Ctrl+Click**: Open in new tab
- Maintains native Azure DevOps look and feel

## 🚀 Quick Start

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build the extension:**
```bash
npm run build
```

3. **Create package:**
```bash
npm run package
```

4. **Upload to Azure DevOps:**
   - Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
   - Upload the generated `.vsix` file
   - Install to your organization

### Usage

After installation, navigate to **Pipelines** → **Library (Enhanced)** in your Azure DevOps project.

## 🛠️ Development

```bash
# Watch mode for development
npm run dev

# Production build
npm run build

# Create extension package
npm run package
```

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── services/            # Business logic
│   ├── types/              # TypeScript types
│   └── library-hub.tsx     # Entry point
├── dist/                   # Build output
└── vss-extension.json     # Extension manifest
```

## 🎯 How It Works

The extension:
1. Loads all Variable Groups via Azure DevOps REST API
2. Parses names by `-` character to build hierarchy
3. Renders an interactive tree view with expand/collapse
4. Enables right-click and Ctrl+Click for new tab navigation

## ⚙️ Configuration

Update `vss-extension.json` to customize:
- Extension name and description
- Publisher ID
- Version number

## 🐛 Troubleshooting

**Extension not appearing?**
- Verify it's enabled in your organization settings
- Clear browser cache and reload

**Groups not forming correctly?**
- Ensure variable group names use `-` as delimiter
- Check browser console for errors

## 📝 License

MIT License - feel free to use and modify.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Milvasoft/azuredevops-library-enhancer/issues)
- **Email**: info@milvasoft.com

## ⚠️ Disclaimer

This extension is provided "as-is" without warranties. Test thoroughly in non-production environments before production deployment.

**Compatibility**: Azure DevOps Services and Azure DevOps Server 2019+

---

Made with ❤️ by [Milvasoft](https://milvasoft.com)
