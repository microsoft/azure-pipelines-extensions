# TeamCity Artifacts Extension — Developer Overview

> **New to this extension?** Start here. This document covers everything you need to
> understand before making changes — no prior TeamCity knowledge required.

---

## What Is This Extension?

This Azure DevOps extension integrates **Azure Pipelines** with **JetBrains TeamCity**, letting pipelines consume build artifacts produced by a TeamCity server.

**TeamCity** is JetBrains's on-premises CI server. Many organisations still run TeamCity as their primary build system while adopting Azure Pipelines for release management. Without a bridge, developers must manually download TeamCity artifacts and re-upload them into Azure Pipelines before every release.

**This extension automates that bridge.** It registers TeamCity as an artifact source in Azure DevOps, so pipelines can pull TeamCity build outputs directly and use them as inputs to downstream deployment stages.

---

## What Problem Does It Solve?

### Without this extension (manual process)

1. Wait for the TeamCity build to finish
2. Download the artifacts from the TeamCity UI to a local machine
3. Upload them into Azure Pipelines (or a file share, or a package feed)
4. Kick off the Azure Pipelines release manually with the right build number recorded elsewhere

### With this extension (automated)

1. Configure a TeamCity **service connection** once (URL + credentials)
2. Add TeamCity as an **artifact source** in a Release pipeline, or add the **Download TeamCity Artifacts** task in a YAML/classic build pipeline
3. Pipeline runs → task authenticates against TeamCity → downloads the specified build's artifacts to the agent → downstream stages consume them

---

## How Customers Use It

### In YAML Pipelines (modern approach)

```yaml
steps:
  - task: DownloadTeamCityArtifacts@15
    inputs:
      connection: 'MyTeamCityConnection'           # Service connection name
      project: 'MyProject'                         # TeamCity project id
      definition: 'MyProject_BuildConfiguration'   # TeamCity build type id
      version: '12345'                             # Specific buildId (use dropdown or a variable to pick 'latest' from the UI)
      itemPattern: '**'                            # Optional; minimatch glob, defaults to '**'
      downloadPath: '$(Build.ArtifactStagingDirectory)/teamcity'
```

### In Classic/Designer Release Pipelines (legacy approach)

1. Add a **TeamCity artifact source** to the release pipeline (Artifacts → **+ Add** → **TeamCity**). Pick the service connection, project, build configuration, and default version.
2. On every release trigger, Azure DevOps runs the download task under the hood before the first stage begins, dropping artifacts into `$(System.ArtifactsDirectory)/<alias>/`.

---

## Extension Components

### The Task

| Task | Versions | runsOn | What it does |
|------|----------|--------|-------------|
| `DownloadTeamCityArtifacts` | V15 | **Agent** | Authenticates to a TeamCity server, resolves the build id, calls the artifact-engine to download files matching `itemPattern` into `downloadPath`. |

> **Important:** This task runs on a **build agent** (agent task, not a server task). It has full access to the agent file system, so `downloadPath` writes real files that downstream steps consume. TypeScript source lives in `Src/Tasks/DownloadTeamCityArtifacts/download.ts`.

### The Service Connection

The extension registers a **`teamcity` service connection type** in Azure DevOps. Customers create one service connection per TeamCity server.

| Method | How it works | When to use |
|--------|-------------|------------|
| **Basic Auth** | Username + password (or TeamCity access token pasted into the password field) | Only auth scheme supported |

> **OAuth is not supported.** TeamCity access tokens work in the password field.

> ⚠️ **Password redaction.** `download.ts` calls `tl.setSecret(password)` inside a `try/catch`; if it fails it only warns. Do not add code that logs `password` directly.

### The Release Artifact Type

The extension also registers **TeamCity as an artifact source type** for classic Release pipelines. This is what lets customers pick "TeamCity" from the "+ Add artifact" list in a release definition. The artifact type points at the download task via `downloadTaskId` (GUID `15ECB9F3-C0F7-42CF-9CE3-C6DDED17DE81`).

---

## Key TeamCity Concepts

### Build Hierarchy

```
Project → Build Configuration → Build
   │            │                 │
   │            │                 └── The concrete run (a "build id" e.g. 12345)
   │            └── The pipeline template (a "buildTypeId" e.g. MyProject_Debug)
   └── Container grouping build configurations
```

The task's dropdowns walk this hierarchy in order: pick project → pick build config → pick build.

### Artifact URL Shape

Artifacts are addressed via TeamCity's REST API:

```
{serverUrl}/httpAuth/app/rest/builds/id:{buildId}/artifacts/children/{itemPath}
```

The `Artifacts` data source (see `vss-extension.json`) walks these children recursively to populate the UI browse tree.

### itemPattern Semantics

- Default is `**` (download everything).
- Uses **minimatch glob** syntax (implemented in artifact-engine — see [`Extensions/ArtifactEngine`](../../ArtifactEngine)).
- Supports include lines, exclude lines (prefixed with `!`), and precedence rules.
- `.teamcity/perfmon/` files are **not** auto-excluded — customers who don't want them must add an explicit exclude line.

> **Parallelism knob.** The pipeline variable `release.artifact.download.parallellimit` overrides `ArtifactEngineOptions.parallelProcessingLimit`. `System.Debug=true` enables verbose engine logs.

### Handlebars Template

`teamcity.handlebars` maps TeamCity's REST JSON (nested `files` / `children/href` shape) into the flat `{path, downloadUrl}` items that the artifact-engine `WebProvider` consumes. If TeamCity's REST shape changes, edit the template — not `download.ts`.

### Data Sources (7 total)

The extension populates dropdowns in the task and endpoint UI by calling TeamCity APIs live. All 7 data sources are defined in `vss-extension.json`:

| Data source | Endpoint | Purpose |
|-------------|----------|---------|
| `TestConnection` | `/httpAuth/app/rest/projects` | Validates the service connection |
| `Projects` | `/httpAuth/app/rest/projects` | Populates the Project dropdown |
| `BuildConfigurations` | `/httpAuth/app/rest/projects/{{project}}/buildTypes` | Populates the Build Configuration dropdown |
| `Builds` | `/httpAuth/app/rest/buildTypes/{{definition}}/builds/?locator=branch:default:any` | Populates the Version dropdown (successful builds) |
| `LatestBuild` | `/httpAuth/app/rest/buildTypes/{{definition}}/builds?…&count=1&status=success` | Resolves `version: 'latest'` |
| `Artifacts` | `/httpAuth/app/rest/builds/id:{{version}}/artifacts/children/{{itemPath}}` | Populates the artifact browse tree |
| `BranchName` | `/httpAuth/app/rest/builds/id:{{version}}` | Records the branch name on the artifact |

---

## Architecture at a Glance

```
DownloadTeamCityArtifacts (this extension)          artifact-engine (sibling package)
────────────────────────────────────────            ────────────────────────────────
Src/Tasks/DownloadTeamCityArtifacts/download.ts     Extensions/ArtifactEngine/
  ├─ Parse task inputs (tl.getInput)                  ├─ ArtifactEngine.processItems()
  ├─ Read endpoint URL + basic-auth creds             │    └─ pattern matching, parallel
  ├─ Build WebProvider (TeamCity REST URL             │       download, retries, telemetry
  │    + teamcity.handlebars template)                ├─ Providers/WebProvider (HTTP)
  ├─ Build FilesystemProvider (target dir)            ├─ Providers/FilesystemProvider (disk)
  └─ engine.processItems(web, fs, opts) ──────────►   └─ typed-rest-client/Handlers
                                                            └─ BasicCredentialHandler
```

**Key idea — this task is a thin wrapper.** `download.ts` does only input parsing, endpoint auth setup, and one call to `ArtifactEngine.processItems`. All the interesting work (HTTP requests, glob filtering, parallel downloads, retries, error surfacing) lives in the artifact-engine sibling package.

When debugging: check whether the bug is in this task's small surface (inputs, template, provider construction) or downstream in artifact-engine.

> ⚠️ **Reliability telemetry.** On failure, `publishEvent('reliability', ...)` emits `##vso[telemetry.publish ...]` (agent ≥ 2.120) or falls back to `##vso[task.logissue ...]`. Do not remove this call.

---

## Repository Structure

```
Extensions/TeamCity/
└── Src/
    ├── vss-extension.json                  ← Extension manifest: version, contributions, auth scheme, data sources
    ├── readme.md                           ← PUBLIC Marketplace documentation (customer-facing)
    ├── OVERVIEW.md                         ← This file (internal developer doc)
    ├── mp_terms.md                         ← Marketplace license terms
    ├── vss_default.png, vss_wide.png       ← Marketplace icons
    ├── images/                             ← Screenshots used in readme.md
    │   ├── screen1.png                     ← service connection setup
    │   ├── screen2.png                     ← artifact link in release pipeline
    │   └── tc-icon128px.png                ← extension icon
    └── Tasks/DownloadTeamCityArtifacts/
        ├── task.json / task.loc.json       ← Task manifest + input definitions
        ├── download.ts                     ← Task entry point (TypeScript)
        ├── teamcity.handlebars             ← REST response → artifact-engine item mapping template
        ├── Strings/                        ← Localised resources
        ├── package.json                    ← Task deps (pinned artifact-engine + task-lib)
        └── icon.png                        ← Task icon in the pipeline editor
```

L0 tests live outside `Src/` at `Extensions/TeamCity/Tests/Tasks/DownloadTeamCityArtifacts/` (added by PR #1454). They mock artifact-engine so they run in seconds without a real TeamCity server.

---

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `Src/vss-extension.json` | The heart of the extension. Defines: version number, task + endpoint + release-artifact contributions, the `teamcity` service endpoint type, 7 data sources, basic-auth scheme, and data source bindings. Publisher must be `ms-devlabs` and `public: true` for production. |
| `Src/Tasks/DownloadTeamCityArtifacts/task.json` | Defines task inputs (`connection`, `project`, `definition`, `version`, `itemPattern`, `downloadPath`), the task GUID, and version metadata. |
| `Src/Tasks/DownloadTeamCityArtifacts/download.ts` | Task entry point. Reads inputs, constructs WebProvider + FilesystemProvider, calls `ArtifactEngine.processItems`. Emits reliability telemetry on failure. |
| `Src/Tasks/DownloadTeamCityArtifacts/teamcity.handlebars` | Template consumed by `WebProvider` — shapes TeamCity REST JSON into artifact-engine items. |
| `.pipelines/1es-migration/azure-pipelines.yml` | **PROD release pipeline** — builds, signs with ESRP, runs CI tests, waits for manual approval, then publishes to Marketplace. Shared across extensions in the repo; select via `extensionName: TeamCity`. TeamCity uses `PublisherId: ms-devlabs`. |
| `.pipelines/1es-migration/azure-pipelines-integration.yml` | **PR check pipeline** — auto-detects changed extensions via `gulp detectChangedExtensions`, builds test version, runs CI tests. Blocks PRs if tests fail. |
| `scripts/DetermineCiTestPipelineName.ps1` | Maps extension name → CI test pipeline name. TeamCity maps to `AzDev-ReleaseManagement-TeamCity-CI-Test`. |
| `scripts/TriggerCiTestsForExtensions.ps1` | Triggers CI test pipelines for changed extensions on PRs. Same mapping as above. |
| `scripts/BumpExtensionVersion.ps1` | Bumps the version in `vss-extension.json`. Always run before publishing. |
| `scripts/VerifyExtensionVersions.ps1` | Verifies the version was bumped in a PR. Called automatically by the PR check pipeline. |

---

## How to Build & Test

From the repository root:

```powershell
# One-time
npm install

# Build only the TeamCity extension
gulp build --suite=TeamCity

# Run L0 tests only for TeamCity
gulp test --suite=TeamCity

# Package the extension as a .vsix (output in _build/)
gulp package --suite=TeamCity
```

If the whole repo has not been built yet, run `gulp build` once without `--suite` to prime shared build artifacts.

---

## CI Coverage

CI runs in the `canarytest` Azure DevOps organisation against a self-hosted TeamCity ACI.

| Pipeline | Repo | Purpose |
|----------|------|---------|
| `AzDev-ReleaseManagement-TeamCity-CI-Test` (definition #317) | `canarytest/PipelineTasks` | Full end-to-end CI tests |

### What the CI pipeline tests

| Stage | OS / Job | Scenario tested |
|-------|----------|----------------|
| 1 | Ubuntu | Happy path — default `itemPattern`, one `DownloadTeamCityArtifacts@15` call, `ls -R` verify |
| 2 | Windows | Same as Stage 1 on windows-latest |
| 3 | macOS | Same as Stage 1 on macOS-latest |
| 4 *(planned — see WI #2429483)* | Ubuntu | Negative paths: 401 wrong credentials, 404 non-existent build, empty pattern match |

> Tests run against a real TeamCity server (self-hosted ACI) with pinned connection/project/definition/version values in `variables.yml`.

### To run tests manually

1. Go to <https://dev.azure.com/canarytest/PipelineTasks/_build?definitionId=317>
2. Click **Run pipeline**
3. All stages run automatically — no manual inputs needed

---

## Publishing to Marketplace

Extensions are published via the shared **PROD release pipeline** at `.pipelines/1es-migration/azure-pipelines.yml` (search for `AzDev-ReleaseManagement-TeamCity` in the `mseng/AzureDevOps` project).

### Publishing steps

1. Bump version: `scripts/BumpExtensionVersion.ps1`
2. Commit and merge to master
3. Run PROD pipeline with `extensionName: TeamCity`
4. Pipeline builds → signs (ESRP) → runs CI tests (`AzDev-ReleaseManagement-TeamCity-CI-Test`) → waits for manual approval → publishes
5. Extension goes live at: `ms-devlabs.vss-services-teamcity`

> ⚠️ **Always bump the version** in `vss-extension.json` before publishing. The PR check pipeline will fail if the version was not incremented.

> ⚠️ **Before committing**, ensure `vss-extension.json` has:
> ```json
> "publisher": "ms-devlabs",
> "public": true
> ```
> Do not commit test publisher values.

> ⚠️ **TeamCity publishes under `ms-devlabs`.** The publisher is selected by the `PublisherId` variable in `.pipelines/1es-migration/azure-pipelines.yml` based on `extensionName`. Do not commit test publisher values.

---

## Useful Links

| Resource | Link |
|----------|------|
| GitHub source | <https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/TeamCity/Src> |
| Marketplace listing | <https://marketplace.visualstudio.com/items?itemName=ms-devlabs.vss-services-teamcity> |
| TeamCity REST API docs | <https://www.jetbrains.com/help/teamcity/rest-api.html> |
| Sibling package | [`Extensions/ArtifactEngine`](../../ArtifactEngine) — the download engine |
| Task-lib reference | <https://github.com/microsoft/azure-pipelines-task-lib> |
| CI test pipeline | `canarytest/PipelineTasks` — definition ID 317 |
| PROD release pipeline | `mseng/AzureDevOps` — `AzDev-ReleaseManagement-TeamCity` |
| PR check pipeline | `mseng/AzureDevOps` — `AzDev-ReleaseManagement-Extensions-Integration` |
