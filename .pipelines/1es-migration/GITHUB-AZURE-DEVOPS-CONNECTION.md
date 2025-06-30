# GitHub to Azure DevOps Connection Guide

## Overview

The pipeline files reside in your GitHub repository, and Azure DevOps connects to GitHub to run the pipelines. Here's the complete setup process.

## 1. GitHub Repository Setup

### Add Pipeline Files to GitHub

In your `microsoft/azure-pipelines-extensions` repository, create this structure:

```bash
# Clone the repository
git clone https://github.com/microsoft/azure-pipelines-extensions.git
cd azure-pipelines-extensions

# Create pipeline directory structure
mkdir -p .pipelines/1es-migration/templates

# Copy the pipeline files to the correct locations
# Main pipeline
cp azure-pipelines.yml .pipelines/1es-migration/

# Templates
cp templates/*.yml .pipelines/1es-migration/templates/

# Documentation
cp README.md SETUP.md TOGGLE-FLOW.md .pipelines/1es-migration/

# Commit and push
git add .pipelines/
git commit -m "Add 1ES-compliant Azure DevOps pipeline"
git push origin feature/1es-pipeline
```

### Repository Structure After Setup
```
microsoft/azure-pipelines-extensions/
├── Extensions/                    # Your existing extensions
│   ├── Ansible/
│   ├── IIS Web App Deployment/
│   └── ...
├── .pipelines/                    # New pipeline folder
│   └── 1es-migration/
│       ├── azure-pipelines.yml
│       ├── templates/
│       │   ├── build-extension.yml
│       │   ├── sign-extension.yml
│       │   ├── publish-extension.yml
│       │   └── validate-deployment.yml
│       └── docs/
│           ├── README.md
│           ├── SETUP.md
│           └── TOGGLE-FLOW.md
├── .github/                       # Existing GitHub Actions (can coexist)
│   └── workflows/
└── README.md
```

## 2. Azure DevOps Connection Setup

### Step 1: Create GitHub Service Connection

1. In Azure DevOps, go to: **Project Settings** → **Service connections**
2. Click **New service connection** → **GitHub**
3. Choose authentication method:
   - **OAuth** (recommended)
   - **Personal Access Token**
4. Authorize and name it: `ADOExtensionAPIGHToken2`

### Step 2: Create Marketplace Service Connection

1. **Project Settings** → **Service connections**
2. **New service connection** → **Azure Resource Manager**
3. Configure:
   - Connection name: `PublishSignedExtensions`
   - Scope: Subscription or Management Group
   - Grant access to all pipelines

### Step 3: Import Pipeline from GitHub

1. Go to **Pipelines** → **New pipeline**
2. Select **GitHub** as source
3. You may need to:
   - Install Azure Pipelines app in GitHub
   - Authorize Azure Pipelines
4. Select repository: `microsoft/azure-pipelines-extensions`
5. Choose: **Existing Azure Pipelines YAML file**
6. Branch: `main` (or your feature branch)
7. Path: `/.pipelines/1es-migration/azure-pipelines.yml`
8. Click **Continue** → **Save** (don't run yet)

## 3. Configure Pipeline Settings

### Pipeline Permissions

1. Go to pipeline → **More actions** → **Settings**
2. Enable:
   - [x] Allow scripts to access the OAuth token
   - [x] Limit job authorization scope to current project
3. Under **Triggers**:
   - Disable CI triggers (we control via YAML)

### Variable Groups

1. **Pipelines** → **Library** → **Variable groups**
2. Create or link: `EPS.ESRPSigningProdAME`
3. Add variables:
   ```
   Control.EsrpServiceConnectionName = <your-esrp-connection>
   Control.AppRegistrationClientId = <app-client-id>
   Control.AppRegistrationTenantId = <tenant-id>
   Control.AuthAKVName = <keyvault-name>
   Control.AuthCertName = <auth-cert>
   Control.AuthSignCertName = <sign-cert>
   ```
4. Link to pipeline: **Pipeline** → **Variables** → **Variable groups**

### Pipeline Variables

Add these in **Pipeline** → **Variables**:
```
MarketplaceServiceConnection.AccessToken = <secure-token>
```

## 4. GitHub Webhook Setup (For Triggers)

### Enable GitHub Releases Trigger

1. In GitHub repository settings:
   - Go to **Settings** → **Webhooks**
   - Add webhook:
     - URL: `https://dev.azure.com/{org}/_apis/public/distributedtask/webhooks/{webhook-name}`
     - Events: Releases, Push (tags)

2. In Azure DevOps pipeline:
   - The YAML already has trigger configuration
   - Webhook will trigger when tags match pattern

### Release Tag Format
```bash
# Format: {extension-name}-v{version}
git tag Ansible-v2.1.0 -m "Release Ansible v2.1.0"
git push origin Ansible-v2.1.0
```

## 5. Test the Connection

### Test 1: Manual Pipeline Run
```yaml
1. Go to pipeline in Azure DevOps
2. Click "Run pipeline"
3. Set parameters:
   - extensionName: Ansible
   - isDevBuild: true
   - publishExtension: false
4. Click "Run"
5. Verify: Pipeline checks out from GitHub successfully
```

### Test 2: PR Validation
```yaml
1. Create PR in GitHub
2. Azure DevOps should:
   - Automatically run validation
   - Post status back to GitHub
   - Show checks in PR
```

### Test 3: Release Trigger
```bash
# In your local repo
git tag IIS-Web-App-Deployment-v1.0.1
git push origin IIS-Web-App-Deployment-v1.0.1

# Pipeline should:
# - Trigger automatically
# - Build IIS Web App Deployment extension
# - Use runOnTrigger logic
```

## 6. Security Considerations

### GitHub App Permissions
The Azure Pipelines GitHub App needs:
- **Read**: Code, metadata, pull requests
- **Write**: Checks, statuses
- **Admin**: Webhooks (for triggers)

### Azure DevOps Permissions
Service accounts need:
- **Build**: Queue builds, access repos
- **Release**: Create releases
- **Marketplace**: Publish extensions

### Branch Protection
In GitHub, protect `main` branch:
```yaml
- Require PR reviews
- Require status checks (Azure Pipelines)
- Dismiss stale reviews
- Require up-to-date branches
```

## 7. Troubleshooting

### Issue: Pipeline can't find repository
```
Solution:
1. Check service connection authorization
2. Verify repository access in GitHub
3. Re-authorize Azure Pipelines app
```

### Issue: Checkout fails
```
Solution:
1. Check branch exists
2. Verify path syntax
3. Check fetch depth settings
```

### Issue: Template not found
```
Solution:
1. Verify file paths are relative to repo root
2. Check template syntax
3. Ensure files are committed to GitHub
```

### Issue: Trigger not working
```
Solution:
1. Verify webhook configuration
2. Check tag format matches pattern
3. Review pipeline trigger conditions
4. Check GitHub webhook delivery logs
```

## 8. Best Practices

1. **Version Control**: Always test pipeline changes in a branch first
2. **Secrets**: Never commit secrets; use Azure Key Vault
3. **Service Connections**: Use managed identities where possible
4. **Monitoring**: Set up alerts for pipeline failures
5. **Documentation**: Keep pipeline docs in the repo

## 9. Migration Checklist

- [ ] Pipeline files added to GitHub repo
- [ ] GitHub service connection created
- [ ] Marketplace service connection configured
- [ ] Variable groups linked
- [ ] Pipeline imported from GitHub
- [ ] Manual run successful
- [ ] PR validation working
- [ ] Release triggers configured
- [ ] Security permissions verified
- [ ] Team trained on new process