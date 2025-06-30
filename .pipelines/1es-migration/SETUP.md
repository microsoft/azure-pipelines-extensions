# Pipeline Configuration Guide

## Initial Setup for azure-pipelines-extensions

This guide helps you configure the 1ES pipeline for the `microsoft/azure-pipelines-extensions` repository.

## Prerequisites

1. **Azure DevOps Project**
   - Project with 1ES templates enabled
   - Proper permissions to create pipelines

2. **Service Connections**
   - `ADOExtensionAPIGHToken2` - GitHub connection
   - `PublishSignedExtensions` - Marketplace connection
   - ESRP signing connection (automatically configured with 1ES)

3. **Variable Groups**
   - `EPS.ESRPSigningProdAME` - Contains ESRP signing variables

## Step 1: Create Pipeline

1. In Azure DevOps, go to Pipelines > New Pipeline
2. Select GitHub as source
3. Choose `microsoft/azure-pipelines-extensions`
4. Select "Existing Azure Pipelines YAML file"
5. Path: `/1es-migration-v1/azure-pipelines.yml`

## Step 2: Configure Variables

### Required Variable Group: `EPS.ESRPSigningProdAME`
```yaml
Control.EsrpServiceConnectionName: <ESRP-Service-Connection>
Control.AppRegistrationClientId: <App-Client-ID>
Control.AppRegistrationTenantId: <Tenant-ID>
Control.AuthAKVName: <KeyVault-Name>
Control.AuthCertName: <Auth-Cert-Name>
Control.AuthSignCertName: <Signing-Cert-Name>
```

### Pipeline Variables
```yaml
MarketplaceServiceConnection.AccessToken: <Marketplace-PAT>
```

## Step 3: First Test Run

### Test 1: Dev Build (No Signing)
```yaml
Run pipeline with:
- extensionName: 'Ansible'
- isDevBuild: true
- publishExtension: false
- extensionVersion: ''
- runOnTrigger: false
```

Expected: Build completes, no signing, validation shows "Dev build correctly skipped signing"

### Test 2: Single Extension with Signing
```yaml
Run pipeline with:
- extensionName: 'Ansible'
- isDevBuild: false
- publishExtension: false
- extensionVersion: ''
- runOnTrigger: false
```

Expected: Build and sign complete, validation passes all checks

### Test 3: Publish to Dev Marketplace
```yaml
Run pipeline with:
- extensionName: 'IIS Web App Deployment'
- isDevBuild: false
- publishExtension: true
- extensionVersion: '1.0.0-dev'
- runOnTrigger: false
```

Expected: Extension published to marketplace with dev tag

## Step 4: Production Configuration

### Branch Policies
Add branch policy to `main` branch:
- Require PR build validation
- Require specific reviewers for releases

### Release Pipeline
For production releases:
1. Create release branch
2. Run pipeline with `publishExtension: true`
3. Monitor validation report

## Step 5: GitHub Integration

### Enable Release Triggers
1. In GitHub, create webhook for releases
2. In Azure DevOps, enable webhook trigger
3. Test with pre-release first

### Release Process
```bash
# Tag format: <extension-name>-v<version>
git tag Ansible-v2.1.0 -m "Release Ansible extension v2.1.0"
git push origin Ansible-v2.1.0
```

Pipeline will:
1. Detect the tag
2. Extract extension name
3. Build, sign, and publish
4. Create GitHub release with artifacts

## Monitoring

### Key Metrics to Track
- Build duration per extension
- Signing success rate
- Publishing success rate
- Validation pass rate

### Alerts to Configure
- Build failures
- Signing failures
- Publishing failures
- Validation failures

## Rollback Process

If issues occur:
1. Previous versions remain in marketplace
2. Use marketplace admin to unpublish if needed
3. Git revert and rebuild
4. Signed artifacts are retained for 30 days

## Advanced Scenarios

### Bulk Updates
Update all extensions with security patch:
```yaml
- extensionName: 'all'
- isDevBuild: false
- publishExtension: true
- extensionVersion: ''  # Auto-increment all
- runOnTrigger: false
```

### Scheduled Builds
Add to pipeline:
```yaml
schedules:
- cron: "0 0 * * 0"  # Weekly on Sunday
  displayName: Weekly security scan
  branches:
    include:
    - main
  always: true
```

### Custom Extension
For extensions not in standard folder:
```yaml
- extensionName: 'custom'
- customExtensionName: 'MySpecialExtension'
- isDevBuild: false
- publishExtension: false
- extensionVersion: ''
- runOnTrigger: false
```

## Troubleshooting Checklist

- [ ] Service connections authenticated
- [ ] Variable groups linked
- [ ] Node.js version compatible
- [ ] gal CLI accessible
- [ ] ESRP certificates valid
- [ ] Marketplace PAT active
- [ ] GitHub webhook configured
- [ ] Branch policies set
- [ ] Validation reports reviewed