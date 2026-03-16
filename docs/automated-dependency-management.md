# Automated Dependency Management Setup

This document describes the automated dependency update infrastructure for this repository.

## Overview

Two complementary systems handle dependency updates:

| System | Handles | Config File |
|--------|---------|-------------|
| **Dependabot** | Direct dependency version updates | `.github/dependabot.yml` |
| **npm audit fix workflow** | Transitive vulnerability patches | `.github/workflows/dependency-audit.yml` |

## Registry

All projects use the public Azure DevOps npm feed at `pkgs.dev.azure.com/mseng/PipelineTools/_packaging/PipelineTools_PublicPackages`. No authentication is required — the `.npmrc` files in each project directory handle registry resolution automatically.

## How It Works

### Dependabot (direct dependencies)

- Runs automatically every Monday
- Checks all 10 `package.json` files for outdated direct dependencies
- Creates grouped PRs (minor+patch batched together) to reduce noise
- Also keeps GitHub Actions workflow dependencies up to date

### npm audit fix workflow (transitive vulnerabilities)

- Runs every Monday at 08:00 UTC (also available via manual trigger)
- Executes `npm audit fix --package-lock-only` in each project directory
- Only modifies `package-lock.json` — does not change `package.json`
- Creates a single PR with a summary of before/after vulnerability counts

## Maintenance

- **New sub-projects:** If a new `package.json` is added to the repo, add its directory to both `dependabot.yml` and `dependency-audit.yml`.
- **Override management:** `npm audit fix` handles lock file patches. For cases requiring new `overrides` entries in `package.json`, manual intervention is still needed (or consider migrating to Renovate for full override automation).
