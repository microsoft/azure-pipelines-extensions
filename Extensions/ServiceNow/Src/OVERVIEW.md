# ServiceNow Change Management Extension — Developer Overview

> **New to this extension?** Start here. This document covers everything you need to
> understand before making changes — no prior ServiceNow knowledge required.

---

## What Is This Extension?

This Azure DevOps extension integrates **Azure Pipelines** with **ServiceNow Change Management**.

**ServiceNow** is an IT service management (ITSM) platform used by large enterprises to
control changes to production systems. Before any software deployment, these organizations
require a formal "change request" (CR) to be reviewed and approved — often by a Change
Advisory Board (CAB). Without approval, the deployment cannot proceed.

**This extension automates that process.** Instead of a developer manually creating a CR,
waiting for approval, starting the pipeline, then manually closing the CR — the pipeline
handles all of it automatically via ServiceNow's REST API.

---

## What Problem Does It Solve?

### Without this extension (manual process):
1. Developer creates a change request in ServiceNow manually
2. Waits hours or days for CAB approval
3. Manually starts the Azure DevOps pipeline after approval
4. Manually updates and closes the CR after deployment

### With this extension (automated):
1. Pipeline starts → extension automatically creates a CR in ServiceNow
2. Pipeline **waits** (gates) until ServiceNow signals approval
3. Deployment proceeds automatically
4. Extension automatically marks the CR as implemented after deployment

---

## How Customers Use It

### In YAML Pipelines (modern approach)

```yaml
stages:
- stage: DeployToProduction
  jobs:
  - deployment: Deploy
    environment:
      name: Production          # This environment has a ServiceNow check configured
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying..."

          # After deployment: mark the CR as closed
          - task: ServiceNowUpdateChangeRequest@2
            inputs:
              ServiceNowConnection: 'MyServiceNowConnection'
              UpdateStatus: true
              NewStatus: '3'     # 3 = Closed
              CloseCode: 'successful'
```

The `CreateAndQueryChangeRequest` task is configured as a **check** on the environment — it
runs automatically before the deployment job starts, creating or querying the CR and
blocking until ServiceNow gives the green light.

### In Classic/Designer Release Pipelines (legacy approach)

1. Add **`ServiceNow Change Management` gate** before a stage → creates/monitors the CR
2. Add **`Update ServiceNow Change Request` task** as the last step of the stage → closes the CR

---

## Extension Components

### The Two Tasks

| Task | Versions | runsOn | What it does |
|------|----------|--------|-------------|
| `CreateAndQueryChangeRequest` | V0, V1, V2 | **ServerGate** | Creates a new ServiceNow CR (or queries an existing one). The pipeline **waits** here until ServiceNow moves the CR to the desired state (e.g., Approved, Implement). |
| `UpdateServiceNowChangeRequest` | V0, V1, V2 | **Server** | Updates an existing CR — sets status, adds work notes, or updates custom fields. Typically used as the final step of a stage to mark the deployment as done. |

> **Important:** Both tasks are **agentless (server tasks)**. They do NOT run on a build
> agent. This means they have **no access to local files, environment variables from agent
> jobs, or the file system**. They run entirely on the Azure DevOps server and communicate
> with ServiceNow via REST API.
>
> **Execution type:** Both tasks use `HttpRequestChain` — the task executes as a chain of
> HTTP requests directly to ServiceNow's REST API, orchestrated entirely by Azure DevOps
> server. There is no JavaScript or TypeScript code in these tasks — all logic is driven
> by the JSON configuration in `task.json` and `vss-extension.json`.

### The Two Modes of CreateAndQueryChangeRequest

The Create task supports two modes controlled by the `changeRequestAction` input:

| Mode | What it does | When to use |
|------|-------------|------------|
| `createNew` | Creates a brand new CR in ServiceNow | Default — most common |
| `useExisting` | Queries an existing CR by number or query string | When CR was created outside Azure DevOps |

This is why the task is named "Create **AND** Query" — it handles both scenarios.

### The Service Connection

The extension registers a **`ServiceNow` service connection type** in Azure DevOps.
Customers create one service connection per ServiceNow instance.

Two authentication methods:

| Method | How it works | When to use |
|--------|-------------|------------|
| **Basic Auth** | Username + password of a ServiceNow service account | Simple setup, most common |
| **OAuth2** | Azure DevOps registered as an OAuth app in ServiceNow; token-based | More secure, recommended for production |

> **OAuth2 note:** Token requests use `HTTP POST` to `/oauth_token.do` as required by
> RFC 6749. This is explicitly configured via `requestVerb: Post` in `vss-extension.json`
> data source bindings.

---

## Key ServiceNow Concepts

### Change Request (CR)

A record in ServiceNow tracking a planned change. Has a numeric state value:

```
New(-5) → Assess(-4) → Authorize(-3) → Scheduled(-2) → Implement(-1) → Review(0) → Closed(3)
```

The `CreateAndQueryChangeRequest` gate watches the CR's state and **unblocks the pipeline**
when the state matches the configured `desiredStatus` (e.g., `-1` for Implement).

### Change Types

| Type | Description | Approval path |
|------|-------------|--------------|
| **Normal** | Standard change with full review and approval cycle | CAB review required |
| **Standard** | Pre-approved change using a change template | No CAB review — faster |
| **Emergency** | Urgent change bypassing normal approvals | Expedited process |

### Success Criteria

The gate can succeed based on:
- **Desired state**: A single numeric state value (e.g., `-1` for Implement)
- **Advanced**: A custom expression on the CR fields, e.g.:
  `eq(jsonpath('$.result.state')[0],'-1')`

### Output Variables

The gate produces two output variables accessible in downstream agentless jobs:

| Variable | Example value | Description |
|----------|--------------|-------------|
| `CHANGE_REQUEST_NUMBER` | `CHG0012345` | Human-readable CR number |
| `CHANGE_SYSTEM_ID` | `abc123def456...` | ServiceNow internal sys_id |

Access pattern in downstream tasks:
```
$(PREDEPLOYGATE.<refname>.CHANGE_REQUEST_NUMBER)
$(PREDEPLOYGATE.<refname>.CHANGE_SYSTEM_ID)
```

### Data Sources (18 total)

The extension populates dropdowns in the task configuration UI by calling ServiceNow APIs
live. All 18 data sources are defined in `vss-extension.json`:

| Category | Data sources |
|----------|-------------|
| Connection | TestConnection |
| Auth | AccessToken, RefreshToken |
| Change request fields | Priority, State, Risk, Impact, Category, Close code |
| Labels (display names) | PriorityLabel, StateLabel, RiskLabel, ImpactLabel, CategoryLabel, CloseCodeLabel |
| Related records | StandardChangeTemplate, Configuration Item, Assignment Group |

### ServiceNow App Requirement

Customers must install the **Azure Pipelines app** from the ServiceNow Store on their instance:
https://store.servicenow.com/sn_appstore_store.do#!/store/application/fa788cb5dbb5630040669c27db961940

This app exposes the custom REST API endpoints that this extension calls:
- `GET/POST /api/x_mioms_azpipeline/change_request` — create/query CRs
- `GET /api/x_mioms_azpipeline/app_version` — version compatibility check

---

## Repository Structure

```
Extensions/ServiceNow/
└── Src/
    ├── vss-extension.json          ← Extension manifest: version, contributions, auth schemes, data sources
    ├── readme.md                   ← PUBLIC Marketplace documentation (customer-facing)
    ├── OVERVIEW.md                 ← This file (internal developer doc)
    ├── images/                     ← Screenshots used in readme.md
    └── Tasks/
        ├── CreateAndQueryChangeRequest/
        │   ├── CreateAndQueryChangeRequestV0/  ← task.json + icon.png
        │   ├── CreateAndQueryChangeRequestV1/  ← task.json + icon.png
        │   └── CreateAndQueryChangeRequestV2/  ← task.json + icon.png (latest, recommended)
        └── UpdateChangeRequest/
            ├── UpdateChangeRequestV0/          ← task.json + icon.png
            ├── UpdateChangeRequestV1/          ← task.json + icon.png
            └── UpdateChangeRequestV2/          ← task.json + icon.png (latest, recommended)
```

> There is **no TypeScript or JavaScript** in these task folders. The tasks are pure
> `task.json` definitions. All logic runs on the Azure DevOps server using the service
> endpoint data sources and auth scheme configurations defined in `vss-extension.json`.

---

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `vss-extension.json` | The heart of the extension. Defines: version number, task contributions, the `ServiceNow` service endpoint type, all 18 data sources, both auth schemes (Basic + OAuth2), and `HttpRequestChain` data source bindings. Publisher must be `ms-vscs-rm` and `public: true` for production. |
| `Tasks/*/task.json` | Defines task inputs, outputs, version (Major.Minor.Patch), and execution mode (`ServerGate` for the create task, `Server` for the update task). Execution type is `HttpRequestChain` — no JavaScript involved. |
| `.pipelines/1es-migration/azure-pipelines.yml` | **PROD release pipeline** — builds, signs with ESRP, runs CI tests, then publishes to Marketplace. Requires manual approval before final publish. |
| `.pipelines/1es-migration/azure-pipelines-integration.yml` | **PR check pipeline** — auto-detects changed extensions via `gulp detectChangedExtensions`, builds test version, runs CI tests. Blocks PRs if tests fail. |
| `scripts/DetermineCiTestPipelineName.ps1` | Maps extension name → CI test pipeline name for the PROD pipeline. ServiceNow maps to `AzDev-ReleaseManagement-ServiceNow-CI-Test`. |
| `scripts/TriggerCiTestsForExtensions.ps1` | Triggers CI test pipelines for all changed extensions on PRs. ServiceNow maps to `AzDev-ReleaseManagement-ServiceNow-CI-Test`. |
| `scripts/BumpExtensionVersion.ps1` | Bumps the version in `vss-extension.json`. Always run this before publishing. |
| `scripts/VerifyExtensionVersions.ps1` | Verifies version was bumped in a PR. Called automatically by the PR check pipeline. |

---

## How to Test Your Changes

CI tests run in the `canarytest` Azure DevOps organization against a real ServiceNow instance.

| Pipeline | Purpose | Link |
|----------|---------|------|
| `AzDev-ReleaseManagement-ServiceNow-CI-Test` | Full end-to-end CI tests (6 stages, all scenarios) | https://dev.azure.com/canarytest/PipelineTasks/_build/definition?definitionId=323 |

### What the CI pipeline tests:

| Stage | Scenario tested |
|-------|----------------|
| Stage 1 | `createNew` + Normal change type + desiredStatus success criteria (Basic Auth) |
| Stage 2 | `useExisting` — query existing CR by build ID (Basic Auth) |
| Stage 3 | `createNew` + Standard change type using a template (Basic Auth) |
| Stage 4 | `createNew` + Emergency change type (Basic Auth) |
| Stage 5 | `createNew` + Advanced success criteria expression (Basic Auth) |
| Stage 6 | `createNew` + Normal change type (OAuth2 connection) |

> Tests run against a real ServiceNow instance — they create actual Change Requests.
> Both Basic Auth and OAuth2 service connections are tested.

### To run tests manually:
1. Go to the CI pipeline link above
2. Click **Run pipeline**
3. All 6 stages run automatically — no manual inputs needed

---

## Publishing to Marketplace

Extensions are published via the **PROD release pipeline**:
https://dev.azure.com/mseng/AzureDevOps/_build/definition?definitionId=21050

### Publishing steps:
1. Bump version: `scripts/BumpExtensionVersion.ps1`
2. Commit and merge to master
3. Run PROD pipeline with `extensionName: ServiceNow`
4. Pipeline builds → signs (ESRP) → runs CI tests → waits for manual approval → publishes
5. Extension goes live at: `ms-vscs-rm.vss-services-servicenowchangerequestmanagement`

> ⚠️ **Always bump the version** in `vss-extension.json` before publishing.
> The PR check pipeline will fail if the version was not incremented.

> ⚠️ **Before committing**, ensure `vss-extension.json` has:
> ```json
> "publisher": "ms-vscs-rm",
> "public": true
> ```
> Do not commit test publisher values.

---

## Useful Links

| Resource | Link |
|----------|------|
| GitHub source | https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/ServiceNow/Src |
| Marketplace listing | https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.vss-services-servicenowchangerequestmanagement |
| Public Azure DevOps docs | https://learn.microsoft.com/en-us/azure/devops/pipelines/release/approvals/servicenow |
| ServiceNow Azure Pipelines app | https://store.servicenow.com/sn_appstore_store.do#!/store/application/fa788cb5dbb5630040669c27db961940 |
| CI test pipeline | https://dev.azure.com/canarytest/PipelineTasks/_build/definition?definitionId=323 |
| PROD release pipeline | https://dev.azure.com/mseng/AzureDevOps/_build/definition?definitionId=21050 |
| PR check pipeline | https://dev.azure.com/mseng/AzureDevOps/_build/definition?definitionId=22302 |
| OAuth 2.0 spec (RFC 6749) | https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3 |
