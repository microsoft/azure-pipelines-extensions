# IISWebAppDeploy Extension — Overview

**Extension:** IIS Web App Deployment Using WinRM
**Publisher:** `ms-vscs-rm` | **Extension ID:** `iiswebapp`
**GitHub:** https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/IISWebAppDeploy
**Marketplace:** https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.iiswebapp
**Current version:** `1.279.14` (Sprint 279, Aug 2026)

---

## Table of Contents

1. [What is this extension?](#1-what-is-this-extension)
2. [How it works](#2-how-it-works)
3. [Tasks included](#3-tasks-included)
4. [Repository structure](#4-repository-structure)
5. [Tech stack & dependencies](#5-tech-stack--dependencies)
6. [Versioning scheme](#6-versioning-scheme)
7. [How to build](#7-how-to-build)
8. [How to publish to Marketplace](#8-how-to-publish-to-marketplace)
9. [Testing](#9-testing)
10. [Key files reference](#10-key-files-reference)
11. [Resources & links](#11-resources--links)

---

## 1. What is this extension?

This extension lets Azure Pipelines deploy web applications and SQL databases to **on-premises or Azure Windows servers** using **WinRM (Windows Remote Management)** — the Windows equivalent of SSH for remote command execution.

### Who uses it?

Teams that:
- Host their apps on **IIS (Internet Information Services)** on Windows servers
- Cannot use Azure App Service (legacy systems, on-prem infrastructure, compliance requirements)
- Need to deploy via **pipeline automation** rather than manual RDP

### What problem does it solve?

Without this extension, deploying to IIS requires either:
- Manual RDP into the server
- Custom PowerShell scripts with WinRM setup

This extension wraps all of that into simple pipeline task inputs.

---

## 2. How it works

```
┌─────────────────────────────────────────────────────────────────┐
│  Azure Pipelines Agent (runs on build agent)                    │
│                                                                 │
│  Task (IISWebAppMgmt / IISWebAppDeploy / SqlDacpacDeploy)       │
│       │                                                         │
│       │  WinRM (HTTP port 5985 or HTTPS port 5986)              │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Target Windows Server (IIS + Web Deploy + SQL Server)  │   │
│  │                                                         │   │
│  │  VisualStudioRemoteDeployer.exe (bootstrap)             │   │
│  │       │                                                 │   │
│  │       ▼                                                 │   │
│  │  PowerShell scripts                                     │   │
│  │       ├── AppCmd.exe      → Manage IIS websites/pools   │   │
│  │       ├── msdeploy.exe    → Deploy web packages         │   │
│  │       └── SqlPackage.exe  → Deploy DACPAC databases     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Step-by-step:**
1. Pipeline agent runs the task
2. Task opens a WinRM session to the target machine using credentials provided
3. A bootstrap executable (`VisualStudioRemoteDeployer.exe`) is launched on the target
4. The bootstrap runs PowerShell scripts that use native Windows tools (AppCmd, msdeploy, SqlPackage)
5. Results are streamed back to the pipeline log

---

## 3. Tasks included

The extension ships **7 task versions** across 3 task groups:

### 3.1 WinRM - IIS Web App Management (`IISWebAppMgmt`)

**Purpose:** Create or update IIS websites, web applications, virtual directories, and application pools.
**Tool used:** `AppCmd.exe` (built into IIS)

| Version | Status | Handler | Notes |
|---------|--------|---------|-------|
| **V1** (`v1.5.0`) | Stable | PowerShell | Original version |
| **V2** (`v2.3.0`) | Stable | PowerShell3 | Enhanced to manage Web Apps, Virtual Directories, and Application Pools |
| **V3** (`v3.2.0`) | **Current** | PowerShell3 | PS3 Handler support (same as V2, migrated handler) |

**What V2/V3 can do** (V1 only supports Website + App Pool):

| Configuration Type | Actions |
|-------------------|---------|
| IIS Website | Create/Update, Start, Stop |
| IIS Web Application | Create/Update |
| IIS Virtual Directory | Create/Update |
| IIS Application Pool | Create/Update, Start, Stop, Recycle |

**Key inputs (V3):**
- `machinesList` — target machine IP/FQDN (comma-separated for multiple)
- `IISDeploymentType` — Website / Web Application / Virtual Directory / Application Pool
- `ActionIISWebsite` — Create Or Update / Start / Stop
- `ActionIISApplicationPool` — Create Or Update / Start / Stop / Recycle
- `WebsiteName`, `WebsitePhysicalPath` — website config
- `AppPoolNameForWebsite`, `DotNetVersionForWebsite`, `PipeLineModeForWebsite`, `AppPoolIdentityForWebsite` — app pool config
- `AddBinding`, `Protocol`, `Port`, `SSLCertThumbPrint` — binding config
- `ConfigureAuthenticationForWebsite` — Anonymous / Basic / Windows auth

---

### 3.2 WinRM - IIS Web App Deployment (`IISWebAppDeploy`)

**Purpose:** Deploy a web application package to an IIS website.
**Tool used:** `msdeploy.exe` (Web Deploy) — must be pre-installed on the target machine.

| Version | Status | Handler | Notes |
|---------|--------|---------|-------|
| **V1** (`v1.6.0`) | Stable | PowerShell | Original version |
| **V2** (`v2.2.0`) | **Current** | PowerShell3 | Migrated to PS3 Handler |

**Key inputs:**
- `WebDeployPackage` — path to `.zip` Web Deploy package (must be accessible by target machine)
- `WebDeployParamFile` — optional parameters XML file
- `OverRideParams` — override specific parameters at deploy time (e.g., `name="ConnStr",value="..."`)
- `WebsiteName` — target IIS website name
- `TakeAppOffline` — take app offline during deployment
- `RemoveAdditionalFiles` — clean target before deploy
- `ExcludeFilesFromAppData` — protect App_Data folder
- `AdditionalArguments` — extra msdeploy.exe arguments

---

### 3.3 WinRM - SQL Server DB Deployment (`SqlDacpacDeploy`)

**Purpose:** Deploy a SQL Server database using DACPAC files or run inline SQL scripts.
**Tool used:** `SqlPackage.exe` (part of SSDT / DacFx).

| Version | Status | Handler | Notes |
|---------|--------|---------|-------|
| **V1** (`v1.5.0`) | Stable | PowerShell | Original version (includes SQL auth + connection string) |
| **V2** (`v2.2.0`) | **Current** | PowerShell3 | Migrated to PS3 Handler |

**Key inputs:**
- `TaskType` — `dacpac` (deploy DACPAC file) / `sqlQuery` (run SQL from file) / `sqlInline` (run inline SQL)
- `DacpacFile` — path to `.dacpac` file
- `SqlFile` — path to `.sql` file (when TaskType = sqlQuery)
- `InlineSql` — SQL script to run directly (when TaskType = sqlInline)
- `TargetMethod` — `server` / `connectionString` / `publishProfile`
- `ServerName`, `DatabaseName` — target SQL server and database
- `AuthScheme` — `windowsAuthentication` or `sqlServerAuthentication`
- `SqlUsername`, `SqlPassword` — credentials for SQL auth
- `ConnectionString` — full connection string (when TargetMethod = connectionString)
- `PublishProfile` — path to publish profile XML (when TargetMethod = publishProfile)

---

## 4. Repository structure

```
Extensions/IISWebAppDeploy/
├── Src/                                    ← Extension source
│   ├── vss-extension.json                  ← Extension manifest (version, publisher, task list)
│   ├── README.md                           ← Marketplace description page
│   ├── CHANGELOG.md                        ← Change log
│   ├── Assets/
│   │   └── MITLicense.txt
│   ├── Images/                             ← Screenshots shown on Marketplace
│   │   ├── IIS_Web_App.png
│   │   ├── IIS_Web_App_Large.png
│   │   ├── IISWebDeployment.png
│   │   ├── IISWebDeploymentTasks.png
│   │   ├── IISWebManagement.png
│   │   └── SQLServerDacpac.png
│   └── Tasks/
│       ├── IISWebAppDeploy/
│       │   ├── IISWebAppDeployV1/
│       │   │   ├── task.json               ← Task definition (inputs, version)
│       │   │   ├── Main.ps1                ← Entry point
│       │   │   ├── DeployIISWebApp.ps1     ← Orchestration script
│       │   │   ├── MsDeployOnTargetMachines.ps1  ← Core msdeploy logic
│       │   │   ├── README_IISAppDeploy.md  ← Task documentation
│       │   │   ├── externals.json          ← PS modules to bundle at build time
│       │   │   └── icon.png
│       │   └── IISWebAppDeployV2/          ← Same structure as V1 (PowerShell3 handler)
│       ├── IISWebAppMgmt/
│       │   ├── IISWebAppMgmtV1/
│       │   │   ├── task.json, Main.ps1, ManageIISWebApp.ps1
│       │   │   ├── AppCmdOnTargetMachines.ps1, README_IISAppMgmt.md
│       │   │   └── externals.json, icon.png
│       │   ├── IISWebAppMgmtV2/
│       │   │   ├── task.json, Main.ps1, Utility.ps1
│       │   │   ├── AppCmdOnTargetMachines.ps1, README_IISAppMgmt.md
│       │   │   └── externals.json, icon.png
│       │   └── IISWebAppMgmtV3/
│       │       ├── task.json               ← v3.2.0
│       │       ├── Main.ps1                ← Entry point
│       │       ├── AppCmdOnTargetMachines.ps1  ← Core logic
│       │       ├── Utility.ps1
│       │       ├── externals.json, icon.png
│       │       └── README_IISAppMgmt.md    ← Detailed task docs (aka.ms/IISMgmt)
│       └── SqlDacpacDeploy/
│           ├── SqlDacpacDeployV1/
│           └── SqlDacpacDeployV2/
│               ├── task.json               ← v2.2.0
│               ├── Main.ps1
│               ├── DeployToSqlServer.ps1   ← Core logic
│               ├── README.md
│               └── icon.png, icon.svg
└── Tests/
    └── Tasks/
        ├── IISWebAppDeploy/                ← L0 unit tests (PowerShell + Mocha)
        ├── IISWebAppMgmt/
        └── SqlDacpacDeploy/
```

---

## 5. Tech stack & dependencies

### Runtime (what runs on the target machine)

| Component | Version | Purpose |
|-----------|---------|---------|
| PowerShell | 3+ | Task execution runtime |
| `VstsTaskSdk` | 0.7.1 | Azure Pipelines PS helper module |
| `Sanitizer` | — | Input sanitization module |
| `RemoteDeployer` | 0.1.0 | WinRM bootstrapper (IISWebAppMgmt V2/V3 only) |
| `TaskModuleSqlUtility` | — | SQL utility module (SqlDacpacDeploy V1/V2 only) |
| `AppCmd.exe` | Built into IIS | IIS website/pool management |
| `msdeploy.exe` | Web Deploy 3.5+ | Web package deployment |
| `SqlPackage.exe` | SSDT / DacFx | DACPAC deployment |

### Build/Test tooling (NOT shipped in VSIX)

| Component | Purpose |
|-----------|---------|
| Node.js + npm | Build orchestration |
| Mocha | Unit test runner (L0 tests) |
| `azure-pipelines-task-lib` | Task lib for test mocking |
| `minimatch`, `brace-expansion` | Used by test tooling |
| NuGet (internal feed) | Fetch PS modules during build |

### PS modules are bundled at build time

The `externals.json` file in each task folder tells the build system which PS modules to download and bundle into the VSIX. The internal feed is used:
```
https://mseng.pkgs.visualstudio.com/PipelineTools/_packaging/PipelineTools_PublicPackages/nuget/v2/
```

---

## 6. Versioning scheme

### Extension version (vss-extension.json)

Format: `1.<sprint>.<patch>`

| Component | Meaning |
|-----------|---------|
| `1` | Major — fixed |
| `<sprint>` | Azure DevOps sprint number when published |
| `<patch>` | Patch number within the sprint |

Example: `1.279.14` = Sprint 279, patch 14

Each sprint ≈ 3 weeks. Sprint number increments every 3 weeks.

### Task version (task.json)

Format: `Major.Minor.Patch` (standard semantic versioning)

These are **independent** of the extension version. Task versions only change when the task source code changes.

```
IISWebAppDeployV2  → task version v2.2.0  (last changed Aug 2023)
IISWebAppMgmtV3    → task version v3.2.0  (last changed Aug 2023)
SqlDacpacDeployV2  → task version v2.2.0  (last changed Aug 2023)
```

> **Important:** The extension version (`1.279.x`) can change for infrastructure reasons (CI updates, CVE fixes in tooling) without any task code changing. Always check task versions to understand what actually changed for users.

---

## 7. How to build

The extension lives in: `microsoft/azure-pipelines-extensions` on GitHub.

### Prerequisites

- Node.js + npm
- NuGet CLI (to restore PS modules)
- Access to `mseng.pkgs.visualstudio.com` internal feed

### Build steps

```bash
# 1. Clone the repo
git clone https://github.com/microsoft/azure-pipelines-extensions.git
cd azure-pipelines-extensions

# 2. Install Node.js dependencies
cd Extensions/IISWebAppDeploy
npm install

# 3. Build — compiles and packages all tasks
npm run build

# Output goes to: Extensions/IISWebAppDeploy/_build/
```

### What the build does

1. Downloads PS modules (`VstsTaskSdk`, `RemoteDeployer`, `Sanitizer`) from the internal NuGet feed into each task's `ps_modules/` folder
2. Copies task source files into `_build/`
3. Packages everything into a `.vsix` file

---

## 8. How to publish to Marketplace

Publishing is done via a dedicated Azure Pipeline in the `mseng/AzureDevOps` ADO project.

### Wiki guide

Full instructions: [Pipeline for publishing extensions on Marketplace](https://mseng.visualstudio.com/AzureDevOps/_wiki/wikis/AzureDevOps.wiki/49785/Pipeline-for-publishing-extensions-on-Marketplace)

### High-level steps

1. Ensure master branch has all changes merged and tests passing
2. Confirm the version in `vss-extension.json` is correct (bump if needed)
3. Queue the publish pipeline in `mseng/AzureDevOps`
4. The pipeline builds the VSIX and publishes to Marketplace under publisher `ms-vscs-rm`
5. Verify the new version appears at: https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.iiswebapp

### Before publishing checklist

- [ ] All unit tests (L0) passing
- [ ] CI tests passing (`canarytest/PipelineTasks`, pipeline `AzDev-ReleaseManagement-IIS-Test`)
- [ ] `CHANGELOG.md` updated with new entry
- [ ] `README.md` and task READMEs reviewed for accuracy
- [ ] Version in `vss-extension.json` reflects the current sprint

---

## 9. Testing

The extension has two levels of testing:

### L0 Unit Tests (fast, offline)

**Location:** `Extensions/IISWebAppDeploy/Tests/Tasks/`
**Runner:** Mocha (Node.js)
**What they test:** Individual PowerShell functions using mocks — no real IIS or SQL Server needed.

```bash
# Run all unit tests
cd Extensions/IISWebAppDeploy
npm test
```

Test files per task:
| Task | Test Entry Point |
|------|------------------|
| IISWebAppDeployV1 | `Tests/Tasks/IISWebAppDeploy/IISWebAppDeployV1/_suite.ts` |
| IISWebAppDeployV2 | `Tests/Tasks/IISWebAppDeploy/IISWebAppDeployV2/_suite.ts` |
| IISWebAppMgmtV1 | `Tests/Tasks/IISWebAppMgmt/IISWebAppMgmtV1/_suite.ts` |
| IISWebAppMgmtV2 | `Tests/Tasks/IISWebAppMgmt/IISWebAppMgmtV2/_suite.ts` |
| IISWebAppMgmtV3 | `Tests/Tasks/IISWebAppMgmt/IISWebAppMgmtV3/_suite.ts` |
| SqlDacpacDeployV1 | `Tests/Tasks/SqlDacpacDeploy/SqlDacpacDeployV1/_suite.ts` |
| SqlDacpacDeployV2 | `Tests/Tasks/SqlDacpacDeploy/SqlDacpacDeployV2/_suite.ts` |

### CI Integration Tests (real end-to-end)

**Location:** `canarytest/PipelineTasks` org → `/ci-extensions/IIS/`
**Pipeline:** `AzDev-ReleaseManagement-IIS-Test` (definition ID 263)
**What they test:** Real tasks running against a real Windows VM with IIS and SQL Server installed.

| CI Job | Task Tested | Scenarios |
|--------|------------|-----------|
| `Test_IISWebAppDeploy` | `IISWebAppDeploy@2` | Deploy package, verify param file, verify OverRideParams |
| `Test_AppMgmt` | `IISWebAppMgmt@3` | Create website, change path, add binding, app pool, CLR version, all 4 identity types, auth, stop/start |
| `Test_SqlDacpacDeploy` | `SqlDacpacDeploy@2` | Inline SQL, DACPAC with Windows auth / SQL auth / connection string / publish profile |

---

## 10. Key files reference

| File | Path | Purpose |
|------|------|---------|
| Extension manifest | `Src/vss-extension.json` | Version, publisher, task list, Marketplace content |
| Marketplace README | `Src/README.md` | Content shown on Marketplace page |
| Change log | `Src/CHANGELOG.md` | User-facing release notes |
| IISWebAppMgmt V3 core | `Src/Tasks/IISWebAppMgmt/IISWebAppMgmtV3/AppCmdOnTargetMachines.ps1` | Main PS logic for website/pool management |
| IISWebAppDeploy V2 core | `Src/Tasks/IISWebAppDeploy/IISWebAppDeployV2/MsDeployOnTargetMachines.ps1` | Main PS logic for web deployment |
| SqlDacpacDeploy V2 core | `Src/Tasks/SqlDacpacDeploy/SqlDacpacDeployV2/DeployToSqlServer.ps1` | Main PS logic for SQL deployment |
| IISWebAppMgmt docs | `Src/Tasks/IISWebAppMgmt/IISWebAppMgmtV3/README_IISAppMgmt.md` | Detailed task documentation (linked as `aka.ms/IISMgmt`) |
| PS module config | `Src/Tasks/*/externals.json` | Declares which PS modules to bundle at build time |
| CI pipeline YAML | `canarytest: /ci-extensions/IIS/iis_CI_test.yml` | End-to-end integration test pipeline |

---

## 11. Resources & links

| Resource | Link |
|----------|------|
| Marketplace page | https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.iiswebapp |
| GitHub source | https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/IISWebAppDeploy |
| IISWebAppMgmt detailed docs | https://github.com/microsoft/azure-pipelines-extensions/blob/master/Extensions/IISWebAppDeploy/Src/Tasks/IISWebAppMgmt/IISWebAppMgmtV3/README_IISAppMgmt.md |
| IISWebAppDeploy detailed docs | https://github.com/microsoft/azure-pipelines-extensions/blob/master/Extensions/IISWebAppDeploy/Src/Tasks/IISWebAppDeploy/IISWebAppDeployV2/README_IISAppDeploy.md |
| SqlDacpacDeploy detailed docs | https://github.com/microsoft/azure-pipelines-extensions/blob/master/Extensions/IISWebAppDeploy/Src/Tasks/SqlDacpacDeploy/SqlDacpacDeployV2/README.md |
| Change log | https://aka.ms/iisextnchangelog |
| Publish pipeline wiki | https://mseng.visualstudio.com/AzureDevOps/_wiki/wikis/AzureDevOps.wiki/49785/Pipeline-for-publishing-extensions-on-Marketplace |
| CI pipeline (canarytest) | `canarytest/PipelineTasks/_build?definitionId=263` (internal) |
| WinRM setup guide (archived) | https://learn.microsoft.com/en-us/previous-versions/azure/devops/pipelines/apps/cd/deploy-webdeploy-iis-winrm?view=tfs-2017 |
| IIS deployment (current) | https://learn.microsoft.com/en-us/azure/devops/pipelines/release/deploy-webdeploy-iis-deploygroups |
| Web Deploy download | https://www.iis.net/downloads/microsoft/web-deploy |
| AppCmd.exe reference | https://learn.microsoft.com/iis/get-started/getting-started-with-iis/getting-started-with-appcmdexe |
| SqlPackage.exe reference | https://aka.ms/sqlpackage |

---

*Document prepared: 2026-08-03 | Based on master branch commit `1f4cf224` (Jul 2026)*
