# Bitbucket Artifacts Extension - Developer Overview

> New to this extension? Start here. This document covers the extension purpose,
> customer workflow, runtime architecture, and the files most commonly touched
> when making Bitbucket changes.

---

## What Is This Extension?

This Azure DevOps extension integrates Azure Pipelines with Bitbucket source repositories. It registers Bitbucket as an artifact source for classic release pipelines and provides the `DownloadArtifactsBitbucket` task for both build and release pipelines.

Bitbucket is Atlassian's Git and Mercurial hosting product. Customers who keep source code in Bitbucket can use this extension to bring a repository snapshot into Azure Pipelines without manually downloading or copying source files.

---

## What Problem Does It Solve?

### Without this extension

1. A release needs source files from a Bitbucket repository.
2. Someone manually downloads or clones the repository at the desired branch and commit.
3. The files are copied into the release process by hand or through custom scripts.
4. The selected branch, commit, and credentials are managed outside the release artifact model.

### With this extension

1. Configure a Bitbucket service connection once.
2. Add Bitbucket as a classic release artifact source, or add `DownloadArtifactsBitbucket@15` to a YAML/classic pipeline.
3. The task authenticates to Bitbucket, resolves the repository clone URL, clones the repository, checks out the selected branch, and checks out the selected commit into `downloadPath`.

---

## How Customers Use It

### In YAML Pipelines

```yaml
steps:
  - task: DownloadArtifactsBitbucket@15
    inputs:
      connection: 'MyBitbucketConnection'
      definition: 'workspace/repository'
      branch: 'refs/heads/main'
      version: '1234567890abcdef1234567890abcdef12345678'
      downloadPath: '$(Build.SourcesDirectory)/bitbucket'
```

### In Classic Release Pipelines

1. Add a Bitbucket artifact source to the release pipeline.
2. Select the Bitbucket service connection.
3. Pick the repository, branch, and default version.
4. During release execution, Azure DevOps invokes `DownloadArtifactsBitbucket` to place the repository contents under the artifact download directory.

---

## Extension Components

### The Task

| Task | Version | Runs on | Purpose |
|------|---------|---------|---------|
| `DownloadArtifactsBitbucket` | V15 | Agent | Calls the Bitbucket REST API for repository metadata, clones the repository using the returned SCM type, then checks out the selected branch and commit. |

The task entry point is `Src/Tasks/DownloadArtifactsBitbucket/downloadBitbucket.js`. It is JavaScript, not TypeScript.

### The Service Connection

The task consumes Azure DevOps service connections of type `Bitbucket` through the `connection` input. The endpoint type is supplied by the Azure DevOps Bitbucket endpoint contribution demanded by `vss-extension.json`.

Supported authorization schemes:

| Scheme | Parameters | API authentication | Clone authentication |
|--------|------------|--------------------|----------------------|
| `OAuth` | `AccessToken`, `token`, or `access_token` | `Authorization: Bearer <token>` | Username `x-token-auth`, password is the OAuth access token |
| `OAuth2` | `AccessToken`, `token`, or `access_token` | Same as `OAuth`; accepted for custom service connection compatibility | Same as `OAuth` |
| `Token` | `apitoken`, optional `email` | Basic auth with `email:apitoken` | Username `x-bitbucket-api-token-auth`, password is the API token |
| `UsernamePassword` | `username`, `password` | Basic auth with username/password | Username/password |

Authorization parameter lookup is case-insensitive. Secrets are registered through `tl.setSecret` before use so token and password values are redacted from logs.

### The Release Artifact Type

`vss-extension.json` registers a Bitbucket release artifact type. This lets classic release pipelines show Bitbucket in the artifact source picker. The artifact type points at task GUID `A4CD16BE-6028-4077-8015-34F008F55477` through `downloadTaskId`.

---

## Key Bitbucket Concepts

### Repository Identifier

The `definition` input is the Bitbucket repository full name, typically `workspace/repository`. The task uses it to call:

```text
https://api.bitbucket.org/2.0/repositories/{definition}
```

The API response supplies the repository SCM type (`git` or `hg`) and clone links.

### Branch and Commit Checkout

The task clones the repository, checks out the selected branch, and then checks out the selected commit id.

If the selected branch starts with `refs/heads/`, the task converts it to `refs/remotes/origin/<branch>` before checkout. Other branch values are passed through as-is.

### Clone Credentials

The task injects credentials into the clone URL and also sets credentials on `SourceControlWrapper`. For OAuth, Bitbucket expects the Git username `x-token-auth`. For API tokens, Bitbucket expects `x-bitbucket-api-token-auth`.

---

## Architecture at a Glance

```text
Azure Pipelines task host
  |
  | inputs: connection, definition, branch, version, downloadPath
  v
DownloadArtifactsBitbucket/downloadBitbucket.js
  |-- reads endpoint auth with azure-pipelines-task-lib
  |-- removes any existing downloadPath recursively
  |-- calls Bitbucket API: /2.0/repositories/{definition}
  |-- parses scm + clone URL from the API response
  v
SourceControlWrapper
  |-- finds git or hg on PATH
  |-- clone <authenticated clone URL> <downloadPath>
  |-- checkout <branch ref>
  |-- checkout <commit id>
  v
Repository files on the build/release agent
```

The task is intentionally small. Most behavior is direct input handling, endpoint authentication, one Bitbucket API request, and a source-control command sequence.

---

## Repository Structure

```text
Extensions/BitBucket/
|-- Src/
|   |-- vss-extension.json                  Extension manifest, Marketplace metadata, release artifact type
|   |-- readme.md                           Public Marketplace documentation
|   |-- OVERVIEW.md                         Internal developer onboarding document
|   |-- mp_terms.md                         Marketplace license terms
|   |-- images/                             Screenshots used by readme.md
|   `-- Tasks/DownloadArtifactsBitbucket/
|       |-- task.json                        Task manifest, inputs, execution handlers
|       |-- downloadBitbucket.js             Task entry point
|       |-- sourcecontrolwrapper.js          Thin wrapper over git/hg command execution
|       |-- package.json                     Task dependencies
|       |-- package-lock.json                Locked task dependencies
|       `-- ThirdPartyNotices.txt           Dependency notices
`-- Tests/Tasks/DownloadArtifactsBitbucket/ L0 task tests and mock scenarios
```

---

## Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `Src/vss-extension.json` | Defines extension metadata, screenshots, task contribution, release artifact type, and data source bindings for repositories, branches, commits, and artifact browsing. |
| `Src/readme.md` | Public Marketplace-facing documentation. Keep customer-safe and avoid internal-only URLs or implementation notes. |
| `Src/OVERVIEW.md` | Internal developer onboarding document for architecture and maintenance context. |
| `Src/Tasks/DownloadArtifactsBitbucket/task.json` | Defines task inputs, task version, minimum agent version, and Node handlers. |
| `Src/Tasks/DownloadArtifactsBitbucket/downloadBitbucket.js` | Runtime task logic: endpoint auth, Bitbucket API call, clone URL auth, branch normalization, clone, and checkout. |
| `Src/Tasks/DownloadArtifactsBitbucket/sourcecontrolwrapper.js` | Wraps `git` or `hg` execution through `azure-pipelines-task-lib`, forwards output, and masks credentials. |
| `Tests/Tasks/DownloadArtifactsBitbucket/_suite.ts` | L0 test suite that runs each scenario across declared Node handlers. |
| `Tests/Tasks/DownloadArtifactsBitbucket/mockHelpers.ts` | Shared mock task setup for endpoint auth, Bitbucket API responses, file cleanup, and source-control calls. |

---

## Authentication Notes

OAuth support was added so Azure DevOps Bitbucket service connections can use the `OAuth` scheme. The runtime also accepts `OAuth2` as a compatibility alias for custom service connections.

Important details when changing auth behavior:

- Keep `OAuth` support; Azure DevOps Bitbucket OAuth connections use that scheme name.
- Keep OAuth token parameter fallback order: `AccessToken`, `token`, then `access_token`.
- Keep parameter lookup case-insensitive; existing tests cover this for token and username/password auth.
- `retireusernamepswd=true` disables `UsernamePassword` at runtime and tells users to move to OAuth2 or token authentication.
- Do not log raw tokens, passwords, or clone URLs containing credentials.

---

## Data Sources

The extension manifest defines live data source bindings for repository, branch, commit, latest version, and artifact browsing dropdowns. Key data sources include:

| Data source | Purpose |
|-------------|---------|
| `Repositories` | Populates the repository picker with Bitbucket repository full names. |
| `Branches` | Populates branch choices after repository selection. |
| `Commits` | Populates selectable commit versions for a repository and branch. |
| `LatestCommit` | Resolves the latest commit for release artifact default version behavior. |
| `artifacts` / `artifactItems` bindings | Browse repository contents through Bitbucket source APIs for classic release artifacts. |

The task runtime does not use these manifest data source bindings directly. They are used by Azure DevOps UI surfaces before the task starts.

---

## How to Build & Test

From the repository root:

```powershell
# One-time install from repo root
npm install

# Build only the BitBucket extension
gulp build --suite=BitBucket

# Run L0 tests only for BitBucket
gulp test --suite=BitBucket

# Package the extension as a .vsix
gulp package --suite=BitBucket
```

If the repository has not been built before, run `gulp build` once without `--suite` to prime shared build output.

---

## Test Coverage

L0 tests live in `Extensions/BitBucket/Tests/Tasks/DownloadArtifactsBitbucket/`. They mock the Bitbucket API, endpoint authorization, source-control wrapper, and filesystem cleanup.

Covered scenarios include:

- Token, OAuth, and username/password success paths.
- Git and Mercurial SCM selection from the Bitbucket API response.
- Case-insensitive authorization parameter lookup.
- Branch normalization from `refs/heads/*` to `refs/remotes/origin/*`.
- Recursive cleanup of an existing download path.
- Missing inputs, missing auth parameters, unsupported auth schemes, malformed API responses, clone failures, checkout failures, and username/password retirement behavior.

---

## Publishing Notes

Before publishing, bump the version in `Src/vss-extension.json` and `Src/Tasks/DownloadArtifactsBitbucket/task.json` consistently. The manifest currently publishes under publisher `ms-vscs-rm` with Marketplace item id `vss-services-bitbucket`.

Do not add `OVERVIEW.md` to the Marketplace `content.details` entry. `readme.md` remains the public documentation shown on the Marketplace listing.

---

## Useful Links

| Resource | Link |
|----------|------|
| GitHub source | <https://github.com/microsoft/azure-pipelines-extensions/tree/master/Extensions/BitBucket/Src> |
| Marketplace listing | <https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.vss-services-bitbucket> |
| Bitbucket Cloud REST API | <https://developer.atlassian.com/cloud/bitbucket/rest/> |
| Bitbucket OAuth documentation | <https://developer.atlassian.com/cloud/bitbucket/oauth-2/> |
| Azure Pipelines task-lib | <https://github.com/microsoft/azure-pipelines-task-lib> |