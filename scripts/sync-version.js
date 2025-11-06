const fs = require('fs');
const path = require('path');

// Read version from vss-extension.json
const vssExtensionPath = path.join(__dirname, '../vss-extension.json');
const vssExtension = JSON.parse(fs.readFileSync(vssExtensionPath, 'utf8'));
const version = vssExtension.version;

// Update package.json with the same version
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Synced version to ${version}`);
