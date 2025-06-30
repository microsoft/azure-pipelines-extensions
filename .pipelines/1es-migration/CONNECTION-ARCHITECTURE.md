# Connection Architecture

## GitHub ↔️ Azure DevOps Integration Flow

```mermaid
graph TB
    subgraph "GitHub Repository"
        GH[microsoft/azure-pipelines-extensions]
        GH --> Code[Source Code]
        GH --> Pipeline[.pipelines/1es-migration/]
        Pipeline --> YAML[azure-pipelines.yml]
        Pipeline --> Templates[templates/*.yml]
        
        Code --> Ext1[Extensions/Ansible/]
        Code --> Ext2[Extensions/IIS.../]
        Code --> ExtN[Extensions/.../]
    end
    
    subgraph "Triggers"
        Manual[Manual Run]
        PR[Pull Request]
        Tag[Git Tag/Release]
        Schedule[Scheduled]
    end
    
    subgraph "Azure DevOps"
        ADO[Azure DevOps Project]
        ADO --> SC1[GitHub Service Connection]
        ADO --> SC2[Marketplace Connection]
        ADO --> SC3[ESRP Signing Connection]
        
        ADO --> Pipeline1[Imported Pipeline]
        Pipeline1 --> Execution[Pipeline Execution]
        
        Execution --> Stage1[Build]
        Execution --> Stage2[Sign]
        Execution --> Stage3[Publish]
        Execution --> Stage4[Validate]
    end
    
    subgraph "Outputs"
        Market[VS Marketplace]
        GHRelease[GitHub Release]
        Reports[Validation Reports]
    end
    
    %% Connections
    Manual --> ADO
    PR --> SC1
    Tag --> SC1
    Schedule --> ADO
    
    SC1 -.-> GH
    YAML -.-> Pipeline1
    Templates -.-> Execution
    
    Ext1 --> Stage1
    Ext2 --> Stage1
    ExtN --> Stage1
    
    Stage2 --> SC3
    Stage3 --> SC2
    Stage3 --> Market
    Stage3 --> GHRelease
    Stage4 --> Reports
    
    %% Styling
    classDef github fill:#f9f,stroke:#333,stroke-width:2px
    classDef azure fill:#0078d4,stroke:#333,stroke-width:2px,color:white
    classDef trigger fill:#ff9,stroke:#333,stroke-width:2px
    classDef output fill:#9f9,stroke:#333,stroke-width:2px
    
    class GH,Code,Pipeline,YAML,Templates,Ext1,Ext2,ExtN github
    class ADO,SC1,SC2,SC3,Pipeline1,Execution,Stage1,Stage2,Stage3,Stage4 azure
    class Manual,PR,Tag,Schedule trigger
    class Market,GHRelease,Reports output
```

## Key Connection Points

### 1. Service Connections
- **GitHub Connection** (`ADOExtensionAPIGHToken2`): Allows Azure DevOps to read from GitHub
- **Marketplace Connection** (`PublishSignedExtensions`): Publishes to VS Marketplace
- **ESRP Connection**: Signs extensions with Microsoft certificates

### 2. Pipeline Import
```yaml
# Azure DevOps imports and reads:
/.pipelines/1es-migration/azure-pipelines.yml

# Which references templates:
/.pipelines/1es-migration/templates/*.yml

# And builds extensions from:
/Extensions/{ExtensionName}/
```

### 3. Trigger Flow

**Manual Trigger:**
```
Azure DevOps UI → Run Pipeline → GitHub Checkout → Build
```

**PR Trigger:**
```
GitHub PR → Webhook → Azure DevOps → Status Check → GitHub
```

**Release Trigger:**
```
Git Tag Push → GitHub Webhook → Azure DevOps → Parse Tag → Build Specific Extension
```

### 4. Data Flow

```
GitHub Repo          Azure DevOps         External Services
-----------          ------------         -----------------
Source Code    →     Build Agent    →     npm registry
     ↓                    ↓                     ↓
YAML Pipeline  →     1ES Templates  →     ESRP Signing
     ↓                    ↓                     ↓
Extensions     →     Artifacts      →     VS Marketplace
     ↓                    ↓                     ↓
Git Tags       →     Validation     →     GitHub Releases
```

## Toggle-Based Routing

The connection behavior changes based on pipeline parameters:

| Toggle | Connection Impact |
|--------|------------------|
| `isDevBuild: true` | Minimal connections (GitHub only) |
| `isDevBuild: false` | Full connections (GitHub + ESRP + Marketplace) |
| `publishExtension: true` | Activates Marketplace connection |
| `runOnTrigger: true` | Enables GitHub webhook processing |

## Security Layers

1. **GitHub → Azure DevOps**: OAuth or PAT authentication
2. **Azure DevOps → ESRP**: Certificate-based auth via Key Vault
3. **Azure DevOps → Marketplace**: Service connection with RBAC
4. **Webhook Security**: Secret validation for GitHub webhooks

## Performance Optimization

- **Parallel Checkouts**: Multiple extensions built simultaneously
- **Artifact Caching**: Build outputs cached between stages
- **Shallow Clones**: Only required history fetched
- **Matrix Strategy**: Dynamic parallelization based on extension count