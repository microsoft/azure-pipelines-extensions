# IISWebAppDeploy Extension — Developer Guide

**Extension:** IIS Web App Deployment Using WinRM
**Publisher:** `ms-vscs-rm` | **Extension ID:** `iiswebapp`
**GitHub:** https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/IISWebAppDeploy
**Marketplace:** https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.iiswebapp

---

## Table of Contents

1. [What is this extension?](#1-what-is-this-extension)
2. [How it works](#2-how-it-works)
3. [Tasks included](#3-tasks-included)
4. [Repository structure](#4-repository-structure)
5. [Code execution flow](#5-code-execution-flow)
6. [Key patterns & conventions](#6-key-patterns--conventions)
7. [Resources & links](#7-resources--links)

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
├── DEV-GUIDE.md                            ← This document
├── Src/
│   ├── vss-extension.json                  ← Extension manifest (version, publisher, task list)
│   ├── README.md                           ← Marketplace description page
│   ├── CHANGELOG.md                        ← Change log
│   ├── Images/                             ← Marketplace screenshots
│   └── Tasks/
│       ├── IISWebAppDeploy/
│       │   ├── IISWebAppDeployV1/
│       │   │   ├── task.json               ← Task definition (inputs, version)
│       │   │   ├── Main.ps1                ← Entry point
│       │   │   └── MsDeployOnTargetMachines.ps1  ← Core msdeploy logic
│       │   └── IISWebAppDeployV2/          ← Same structure (PowerShell3 handler)
│       ├── IISWebAppMgmt/
│       │   ├── IISWebAppMgmtV1/
│       │   ├── IISWebAppMgmtV2/
│       │   └── IISWebAppMgmtV3/
│       │       ├── task.json               ← Task definition
│       │       ├── Main.ps1                ← Entry point
│       │       ├── AppCmdOnTargetMachines.ps1  ← Core IIS management logic
│       │       └── README_IISAppMgmt.md    ← Detailed task documentation
│       └── SqlDacpacDeploy/
│           ├── SqlDacpacDeployV1/
│           └── SqlDacpacDeployV2/
│               ├── task.json               ← Task definition
│               ├── Main.ps1                ← Entry point
│               └── DeployToSqlServer.ps1   ← Core SQL deployment logic
└── Tests/
    └── Tasks/                              ← L0 unit tests (Mocha)
        ├── IISWebAppDeploy/
        ├── IISWebAppMgmt/
        └── SqlDacpacDeploy/
```

---

## 5. Code execution flow

All tasks follow the same pattern: **Main.ps1 → helper script → remote execution on target machine**.

Using `IISWebAppDeployV2` as an example:

```
Main.ps1
 │  Import-Module VstsTaskSdk
 │  Parse inputs via Get-VstsInput
 │
 └─► DeployIISWebApp.ps1 :: Main()
     │  Trim & sanitize inputs (quotes, special chars)
     │  Read MsDeployOnTargetMachines.ps1 as a script block
     │
     └─► Invoke-RemoteDeployment (from Extensions/Common/DeploymentSDK)
         │  Build WinRM credentials via Get-Credentials
         │  Open WinRM session to target machine(s)
         │
         └─► [On remote machine] MsDeployOnTargetMachines.ps1
             │  Find msdeploy.exe via registry (HKLM:\SOFTWARE\Microsoft\IIS Extensions\MSDeploy)
             │  Build msdeploy.exe -verb:sync command
             └─► Execute with retry (3 attempts, 3s intervals)
```

The other tasks follow the same shape:
- **IISWebAppMgmtV3:** Main.ps1 → Utility.ps1 → `Invoke-RemoteDeployment` → AppCmdOnTargetMachines.ps1 (uses `appcmd.exe` from `HKLM:\SOFTWARE\Microsoft\InetStp`)
- **SqlDacpacDeployV2:** Main.ps1 → `Invoke-RemoteDeployment` → DeployToSqlServer.ps1 (uses `SqlPackage.exe`)

---

## 6. Key patterns & conventions

### Shared modules

| Module | Location | Purpose |
|--------|----------|--------|
| **DeploymentSDK** | `Extensions/Common/DeploymentSDK/` | WinRM remote execution engine (`Invoke-RemoteDeployment`, credential handling, parallel/sequential dispatch) |
| **TelemetryHelper** | `Extensions/Common/TelemetryHelper/` | `Write-Telemetry` for structured error reporting to pipeline logs |
| **VstsTaskSdk** (0.7.1) | Downloaded to `ps_modules/` at build | Task input parsing (`Get-VstsInput`), invocation logging (`Trace-VstsEnteringInvocation`) |
| **Sanitizer** | Downloaded to `ps_modules/` at build | `Protect-ScriptArguments` — escapes user inputs before passing to command-line tools |

### Input sanitization (3-step pattern)

All tasks sanitize user inputs before execution:
1. **Trim** — remove surrounding quotes and whitespace
2. **Escape** — backtick, double-quote, and `$` characters for PowerShell
3. **Protect** — `Protect-ScriptArguments` from Sanitizer module for command-line args

### Credential handling

Credentials flow through `Extensions/Common/DeploymentSDK/Src/InvokeRemoteDeployment.ps1`:
- Builds `System.Net.NetworkCredential` from task inputs
- Passed to `Invoke-Command` for WinRM sessions
- Never logged (Sanitizer masks them in pipeline output)

### WinRM connection

- HTTP → port 5985 / HTTPS → port 5986
- `TestCertificate = true` skips SSL validation (for self-signed certs)
- Multi-machine: parallel via `Start-Job`, sequential via loop

### Testing approach

Tests live in `Tests/Tasks/<TaskName>/<Version>/` and follow the **L0** (unit test) pattern:

```powershell
# L0MyFeature.ps1
. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1   # Load test helpers
. $PSScriptRoot\..\..\<TaskPath>\<script>.ps1                 # Load script under test

Register-Mock Get-VstsInput { return "myValue" }              # Mock task inputs
$result = My-Function                                          # Call function
Assert-AreEqual $expected $result                              # Assert
```

Tests are run via Mocha → `_suite.ts` → `PSRunner` (spawns PowerShell).

---

## 7. Resources & links

| Resource | Link |
|----------|------|
| Marketplace page | https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.iiswebapp |
| GitHub source | https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/IISWebAppDeploy |
| Change log | https://aka.ms/iisextnchangelog |
| WinRM setup guide (archived) | https://learn.microsoft.com/en-us/previous-versions/azure/devops/pipelines/apps/cd/deploy-webdeploy-iis-winrm?view=tfs-2017 |
| IIS deployment (current) | https://learn.microsoft.com/en-us/azure/devops/pipelines/release/deploy-webdeploy-iis-deploygroups |
| AppCmd.exe reference | https://learn.microsoft.com/iis/get-started/getting-started-with-iis/getting-started-with-appcmdexe |
| SqlPackage.exe reference | https://aka.ms/sqlpackage |

For build, test, and publish instructions, see the [repository root README](../../README.md).
