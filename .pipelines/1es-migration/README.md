# Azure Pipelines Extensions - 1ES Migration v1

This folder contains the modernized Azure DevOps pipeline for building, signing, and publishing Azure DevOps extensions using Microsoft's 1ES (One Engineering System) standards.

## Overview

This pipeline system replaces the legacy GitHub Actions workflow with a fully 1ES-compliant Azure DevOps pipeline that provides:

- **1ES Template Integration**: Uses official 1ES pipeline templates for compliance
- **Secure Signing**: ESRP code signing for all extensions
- **Dynamic Extension Selection**: Build one, multiple, or all extensions
- **Parameter Toggles**: Control dev/prod behavior, publishing, and triggers
- **Automated Validation**: 5-point validation system ensures quality
- **GitHub Integration**: Can be triggered by GitHub releases

## Architecture

```
azure-pipelines.yml          # Main pipeline file
templates/
├── build-extension.yml      # Builds extensions using gal CLI
├── sign-extension.yml       # ESRP signing process
├── publish-extension.yml    # Marketplace publishing
└── validate-deployment.yml  # Post-deployment validation
```

## Key Features

### 1. Dynamic Extension Selection
- Build all extensions: `extensionName: all`
- Build specific extension: `extensionName: Ansible`
- Build custom extension: `extensionName: custom` + `customExtensionName: MyExtension`

### 2. Parameter Toggles

| Parameter | Type | Description |
|-----------|------|-------------|
| `extensionName` | string | Which extension(s) to build |
| `isDevBuild` | boolean | Skip signing/publishing for dev builds |
| `publishExtension` | boolean | Publish to marketplace after signing |
| `extensionVersion` | string | Override version (empty = auto-increment) |
| `runOnTrigger` | boolean | Enable GitHub release triggers |

### 3. Security & Compliance
- **ESRP Signing**: Uses Microsoft's enterprise signing service
- **Security Scanning**: ESLint, CredScan, BinSkim
- **SBOM Generation**: Software Bill of Materials for each build
- **SDL Integration**: Full Security Development Lifecycle compliance

### 4. Validation System
The pipeline performs 5 independent validations:
1. **Secure Signing**: Verifies all extensions are properly signed
2. **Extension Selection**: Confirms correct extensions were processed
3. **1ES Compliance**: Validates 1ES template integration
4. **Parameter Toggles**: Ensures toggles behave correctly
5. **Marketplace Publishing**: Verifies successful publication

## Usage Examples

### Build and Sign Specific Extensions
```yaml
parameters:
  extensionName: 'Ansible'
  isDevBuild: false
  publishExtension: false
  extensionVersion: ''
  runOnTrigger: false
```

### Dev Build (Skip Signing)
```yaml
parameters:
  extensionName: 'IIS Web App Deployment'
  isDevBuild: true
  publishExtension: false
  extensionVersion: ''
  runOnTrigger: false
```

### Production Release
```yaml
parameters:
  extensionName: 'all'
  isDevBuild: false
  publishExtension: true
  extensionVersion: '2.1.0'
  runOnTrigger: false
```

### GitHub Release Trigger
```yaml
parameters:
  extensionName: 'all'
  isDevBuild: false
  publishExtension: true
  extensionVersion: ''
  runOnTrigger: true
```

## Pipeline Flow

1. **Initialize Stage**
   - Determines which extensions to build
   - Creates build matrix for parallel processing
   - Handles GitHub trigger detection

2. **Build Stage**
   - Runs in parallel for each extension
   - Uses `gal` CLI for building
   - Generates VSIX packages
   - Runs tests and security scans

3. **Sign & Package Stage**
   - ESRP signing with proper certificates
   - Verification of signatures
   - Creates signed artifacts

4. **Publish Stage**
   - Publishes to Azure DevOps Marketplace
   - Creates GitHub releases (if triggered)
   - Updates deployment records

5. **Validate Stage**
   - Runs 5-point validation
   - Generates validation report
   - Sends notifications

## Improvements Over Reference Pipeline

1. **Dynamic Extension Discovery**: Automatically discovers extensions instead of hardcoding
2. **Parallel Processing**: Uses matrix strategy for faster builds
3. **Better Toggle System**: Clear parameter toggles for different scenarios
4. **Comprehensive Validation**: 5-point validation system ensures quality
5. **GitHub Integration**: Native support for GitHub release triggers
6. **Cleaner Structure**: Modular templates instead of inline scripts
7. **Version Management**: Smart version handling with override support
8. **Error Handling**: Robust error handling and recovery

## Security Considerations

- All signing keys and certificates are stored in Azure Key Vault
- Service connections use managed identities where possible
- Build outputs are scanned for vulnerabilities
- SBOM is generated for supply chain security
- All artifacts are signed before publishing

## Migration Guide

To migrate from the old system:

1. **Update Repository Settings**
   - Add this pipeline to Azure DevOps
   - Configure service connections
   - Set up variable groups

2. **Extension Requirements**
   - Ensure `vss-extension.json` exists
   - `package.json` should have build scripts
   - Extensions should be in `Extensions/` folder

3. **Configure Secrets**
   - ESRP signing certificates
   - Marketplace PAT
   - GitHub connection

4. **Test Migration**
   - Start with dev builds
   - Test single extension
   - Validate signing works
   - Test publishing to dev

## Troubleshooting

### Common Issues

1. **Signing Fails**
   - Check ESRP service connection
   - Verify certificates are valid
   - Ensure Key Vault access

2. **Build Fails**
   - Check Node.js version compatibility
   - Verify gal CLI is installed
   - Check extension dependencies

3. **Publishing Fails**
   - Verify marketplace PAT
   - Check publisher permissions
   - Validate version numbers

### Debug Mode

Set these variables for debugging:
```yaml
variables:
  System.Debug: true
  Pipeline.Verbose: true
```

## Future Enhancements

- Container-based builds for consistency
- Automated dependency updates
- Performance metrics tracking
- Cost optimization features
- Multi-region deployment support

## Support

For issues or questions:
- Check build logs for detailed errors
- Review validation reports
- Contact the DevOps team
- File issues in the repository