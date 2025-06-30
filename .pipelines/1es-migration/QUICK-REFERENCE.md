# 🚀 1ES Pipeline Quick Reference

## File Locations

**Your GitHub Repo Structure:**
```
microsoft/azure-pipelines-extensions/
├── Extensions/                    ← Your existing extensions
├── .pipelines/                    ← Add this folder
│   └── 1es-migration/            ← Copy all files here
│       ├── azure-pipelines.yml
│       ├── templates/*.yml
│       └── docs/*.md
└── ...
```

## Azure DevOps Setup (One Time)

```yaml
1. Pipelines → New → GitHub → Select Repo
2. Existing YAML: /.pipelines/1es-migration/azure-pipelines.yml
3. Add Variable Group: EPS.ESRPSigningProdAME
4. Save (don't run yet)
```

## Quick Commands

### Dev Build (No Signing)
```yaml
extensionName: Ansible
isDevBuild: true
publishExtension: false
```

### Production Build + Sign
```yaml
extensionName: Ansible
isDevBuild: false
publishExtension: false
```

### Publish to Marketplace
```yaml
extensionName: Ansible
isDevBuild: false
publishExtension: true
extensionVersion: 2.1.0
```

### Build All Extensions
```yaml
extensionName: all
isDevBuild: false
publishExtension: true
```

### GitHub Release Trigger
```bash
git tag Ansible-v2.1.0 -m "Release"
git push origin Ansible-v2.1.0
```

## Toggle Reference

| Toggle | True | False |
|--------|------|-------|
| `isDevBuild` | Skip sign/publish | Full pipeline |
| `publishExtension` | Deploy to marketplace | Build/sign only |
| `runOnTrigger` | Auto-detect from GitHub | Manual params |

## Validation Checks

✅ **Signing** - ESRP signatures verified  
✅ **Selection** - Correct extensions built  
✅ **1ES** - Templates properly integrated  
✅ **Toggles** - Parameters work correctly  
✅ **Publishing** - Marketplace deployment OK  

## Need Help?

📖 Full docs: `/.pipelines/1es-migration/docs/`  
🔧 Setup: `SETUP.md`  
🔀 Toggles: `TOGGLE-FLOW.md`  
🏗️ Architecture: `CONNECTION-ARCHITECTURE.md`