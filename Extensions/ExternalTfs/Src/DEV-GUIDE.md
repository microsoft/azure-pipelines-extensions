# External TFS Artifacts Extension — Developer Guide

> **New to this extension?** Start here. This document covers everything you need to
> understand before making changes — no prior TFS/Azure DevOps artifact-engine knowledge required.

---

## What Is This Extension?

This Azure DevOps extension lets a pipeline (release or build) **download artifacts from a _different_ Azure DevOps organization or TFS server** than the one running the pipeline. It bridges the gap when your build outputs or source code live in a separate account.

---

## What Problem Does It Solve?

### Without this extension

1. Build outputs live in Org-A (or an on-prem TFS collection)
2. Your release pipeline runs in Org-B
3. You must manually copy artifacts between orgs, or write custom scripts to authenticate and download across the boundary

### With this extension

1. Create a **service connection** pointing to the remote org/TFS
2. Link an **External TFS artifact source** in a release definition, or add one of the **Download Artifacts** tasks in YAML/classic
3. The pipeline authenticates against the remote server → downloads the specified build outputs or Git repo → downstream stages consume them

---

## How Customers Use It

### In YAML Pipelines

```yaml
# Download a build drop from another Azure DevOps org
steps:
  - task: DownloadExternalBuildArtifacts@16
    inputs:
      connectionType: 'reposOrTfs'
      connection: 'MyRemoteTfsConnection'
      project: 'RemoteProject'
      definition: 'CI-Build'
      version: '12345'
      downloadPath: '$(Build.ArtifactStagingDirectory)/external'
```

```yaml
# Clone a Git repo from another Azure DevOps org
steps:
  - task: DownloadArtifactsTfsGit@16
    inputs:
      connectionType: 'reposOrTfs'
      connection: 'MyRemoteTfsConnection'
      project: 'RemoteProject'
      definition: 'my-repo-id'
      branch: 'refs/heads/main'
      version: 'abc1234f'
      downloadPath: '$(Build.ArtifactStagingDirectory)/repo'
```

### In Classic Release Pipelines

1. Add an artifact source → pick **External TFS Build** or **External TFS Git**
2. Select the service connection, project, build definition (or repo), and default version
3. On every release, the backing task downloads artifacts into `$(System.ArtifactsDirectory)/<alias>/`

---

## Extension Components

### Tasks (2)

| Task | Version | What it does |
|------|---------|-------------|
| `DownloadExternalBuildArtifacts` | @16 | Downloads build artifacts (container or file-share) from a remote TFS/Azure DevOps build via artifact-engine |
| `DownloadArtifactsTfsGit` | @16 | Clones a Git repository from a remote TFS/Azure DevOps org via `git clone` |

> Both tasks run on a **build agent** (Node execution handler). They have full access to the agent file system.

### Artifact Source Types (3)

| Type | Display Name | Backing Task | Download mechanism |
|------|-------------|-------------|-------------------|
| `ExternalTfsBuild` | External TFS Build | `DownloadExternalBuildArtifacts` (GUID `B099689B-039E-4450-8658-C72E3895DD3F`) | artifact-engine HTTP download |
| `ExternalTfsGit` | External TFS Git | `DownloadArtifactsTfsGit` (GUID `bf7b17db-eb58-4014-ab2b-e4bf9d3b28f1`) | git clone |
| `ExternalTfsXamlBuild` | External TFS XAML Build | _(none — handled by the release server)_ | Server-side |

### Service Connections (2 supported)

| Connection type | Task input field | Auth mechanism |
|----------------|-----------------|---------------|
| **Azure Repos/Team Foundation Server** (`externaltfs` / `Externaltfs`) | `connection` | Username+Password or Token (PAT) |
| **Azure DevOps** (`workloadidentityuser`) | `azureDevOpsServiceConnection` | Workload Identity Federation (MSAL token exchange) |

> The `connectionType` input (`reposOrTfs` or `ado`) determines which connection field is read.

> **Important:** This extension does NOT register the `ExternalTFS` endpoint type — it is a built-in Azure DevOps endpoint. The extension only registers artifact types and tasks that _consume_ it.

---

## Architecture at a Glance

```
DownloadExternalBuildArtifacts                       DownloadArtifactsTfsGit
─────────────────────────────────                    ────────────────────────
download.ts                                          downloadTfGit.js
  ├─ connectionType switch                             ├─ connectionType switch
  │    ├─ 'ado'  → auth.ts (WIF token)                │    ├─ 'ado'  → auth.js (WIF token)
  │    └─ 'reposOrTfs' → endpoint creds               │    └─ 'reposOrTfs' → endpoint creds
  ├─ WebApi → getBuildApi()                            ├─ WebApi → getGitApi()
  │    └─ getArtifacts(project, buildId)               │    └─ getRepository() → remoteUrl
  ├─ Per artifact:                                     ├─ git clone <url> (with retries)
  │    ├─ container → WebProvider + vsts.handlebars    ├─ git fetch (if PR branch)
  │    └─ filepath → FilesystemProvider                └─ git checkout <commitId>
  └─ engine.processItems(web/fs, fs, opts)
```

**Key difference:** The External Build task uses **artifact-engine** (same pattern as TeamCity) while the Git task uses **shell git commands** via `gitwrapper.js`.

---

## Auth Module (`auth.ts` / `auth.js`)

Both tasks share the same auth logic (TypeScript in External Build, compiled JS copy in TFS Git):

```
getAccessTokenViaWorkloadIdentityFederation(serviceConnection)
  ├─ Validates scheme is "workloadidentityfederation"
  ├─ Gets federated token via Azure CLI utility
  ├─ Exchanges federated token for access token via MSAL
  │    └─ ConfidentialClientApplication.acquireTokenByClientCredential()
  │         scope: "499b84ac-1321-427f-aa17-267ca6975798/.default" (Azure DevOps resource)
  └─ Returns access token (masked via tl.setSecret)
```

> ⚠️ **Secret handling:** Both tasks call `tl.setSecret()` inside try/catch for all tokens and passwords. If masking fails, it only warns — never blocks execution.

---

## Handlebars Template (`vsts.handlebars`)

Used only by `DownloadExternalBuildArtifacts` for **container-type** artifacts. Maps the Azure DevOps Container API response into artifact-engine items:

```json
{
  "path": "{{this.path}}",
  "lastModified": "{{this.dateLastModified}}",
  "fileLength": "{{this.fileLength}}",
  "itemType": "{{this.itemType}}",
  "metadata": {
    "downloadUrl": "{{{this.contentLocation}}}&isShallow=true"
  }
}
```

> File-share (`filepath`) artifacts bypass the template entirely — they use `FilesystemProvider` → `FilesystemProvider` copy.

---

## Data Sources

Data sources are defined in `vss-extension.json` for the artifact type bindings:

| Data source | Purpose |
|-------------|---------|
| `Projects` | Populates the Project dropdown |
| `Builds` | Populates the Build/Version dropdown (successful builds) |
| `LatestBuild` | Resolves "Latest" default version |
| `Artifacts` | Lists build artifacts |
| `ArtifactItems` | Browses inside a container artifact |
| `BranchName` | Records branch metadata |
| `Repositories` | Populates the Repository dropdown (Git) |
| `Branches` | Populates the Branch dropdown (Git) |
| `GitCommits` | Populates the Commit/Version dropdown (Git) |
| `GitLatestCommit` | Resolves "Latest from branch" (Git) |
| `GitArtifacts` | Lists Git repo root contents |
| `GitArtifactItems` | Browses Git tree items |
| `XamlProjects` | Populates Projects for XAML builds |
| `XamlDefinitions` | Populates XAML build definitions |
| `XamlBuilds` | Populates XAML build versions |
| `LatestXamlBuild` | Resolves latest XAML build |
| `XamlBuild` | Gets XAML build drop details |

---

## Repository Structure

```
Extensions/ExternalTfs/
├── Src/
│   ├── vss-extension.json              ← Extension manifest: contributions, data sources, artifact types
│   ├── readme.md                       ← PUBLIC Marketplace documentation (customer-facing)
│   ├── DEV-GUIDE.md                    ← This file (internal developer doc)
│   ├── mp_terms.md                     ← Marketplace license terms
│   └── Tasks/
│       ├── DownloadExternalBuildArtifacts/
│       │   ├── task.json               ← Task manifest (GUID B099689B-...)
│       │   ├── download.ts             ← Entry point (TypeScript, artifact-engine)
│       │   ├── auth.ts                 ← WIF token exchange module
│       │   ├── vsts.handlebars         ← Container response → artifact-engine items
│       │   └── package.json            ← Dependencies
│       └── DownloadArtifactsTfsGit/
│           ├── task.json               ← Task manifest (GUID bf7b17db-...)
│           ├── downloadTfGit.js        ← Entry point (JavaScript, git clone)
│           ├── auth.js                 ← WIF token exchange (JS copy)
│           ├── gitwrapper.js           ← Shell git command wrapper
│           └── package.json            ← Dependencies
└── Tests/
    └── Tasks/
        ├── DownloadExternalBuildArtifacts/  ← 13 L0 test files
        └── DownloadArtifactsTfsGit/        ← 22 L0 test files
```

---

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `Src/vss-extension.json` | Extension manifest. Defines 3 artifact types, 2 tasks, 17 data sources, data source bindings. Publisher: `ms-vscs-rm`, `public: true`. |
| `Src/Tasks/DownloadExternalBuildArtifacts/task.json` | Task inputs: `connectionType`, `connection`, `azureDevOpsServiceConnection`, `project`, `definition`, `version`, `itemPattern`, `downloadPath` (+ ADO variants). GUID `B099689B-039E-4450-8658-C72E3895DD3F`. |
| `Src/Tasks/DownloadExternalBuildArtifacts/download.ts` | Entry point. Resolves auth, calls Build API `getArtifacts()`, dispatches to artifact-engine (container) or filesystem copy (filepath). Retries `getArtifacts` up to 3 times. |
| `Src/Tasks/DownloadExternalBuildArtifacts/auth.ts` | Workload Identity Federation token exchange via MSAL. Shared logic for Azure DevOps service connections. |
| `Src/Tasks/DownloadExternalBuildArtifacts/vsts.handlebars` | Maps Container API JSON into artifact-engine items (`{path, itemType, metadata.downloadUrl, …}`). |
| `Src/Tasks/DownloadArtifactsTfsGit/task.json` | Task inputs: same connection toggle + `project`, `definition` (repo ID), `branch`, `version` (commit ID), `downloadPath`. GUID `bf7b17db-eb58-4014-ab2b-e4bf9d3b28f1`. |
| `Src/Tasks/DownloadArtifactsTfsGit/downloadTfGit.js` | Entry point. Resolves auth, looks up repo remote URL via Git API, runs `git clone` (4 retries) + `git checkout`. |
| `Src/Tasks/DownloadArtifactsTfsGit/gitwrapper.js` | Thin wrapper around the `git` CLI. Injects credentials into clone URLs. |
| `.pipelines/1es-migration/azure-pipelines.yml` | PROD release pipeline. Select via `extensionName: ExternalTfs`. Publisher: `ms-vscs-rm`. |
| `scripts/DetermineCiTestPipelineName.ps1` | Maps `ExternalTfs` → `AzDev-ReleaseManagement-ExternalTFS-CI-Test`. |

---

## Useful Links

| Resource | Link |
|----------|------|
| GitHub source | <https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/ExternalTfs/Src> |
| Marketplace listing | <https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.vss-services-externaltfs> |
| Sibling package | [`Extensions/ArtifactEngine`](../../ArtifactEngine) — the download engine (used by External Build task) |
| Task-lib reference | <https://github.com/microsoft/azure-pipelines-task-lib> |
| CI test pipeline | `canarytest/PipelineTasks` — `AzDev-ReleaseManagement-ExternalTFS-CI-Test` |
| PROD release pipeline | `mseng/AzureDevOps` — `AzDev-ReleaseManagement-ExternalTfs` |
