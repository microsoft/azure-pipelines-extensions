<#
.SYNOPSIS
  Detects which extension changed in a PR and sets the ExtensionName pipeline variable.

.DESCRIPTION
  Supports two trigger modes:
  - Manual runs (from ADO UI): uses the parameter value passed in directly.
  - PR triggers (/azp run or auto-trigger): auto-detects the changed extension
    by diffing the PR branch against the target branch, and overrides the
    ExtensionName variable accordingly.
  Falls back to the parameter value if auto-detection finds no extension changes.
  Warns if multiple extensions changed (uses the first detected).

.PARAMETER ParameterExtensionName
  The extension name supplied via the pipeline parameter (used as-is for manual runs,
  used as fallback for PR triggers).

.PARAMETER AdoVariableName
  The pipeline variable name to set. Defaults to 'ExtensionName'.
#>
param(
    [string]$ParameterExtensionName = '',
    [string]$AdoVariableName = 'ExtensionName'
)

$ErrorActionPreference = 'Stop'

$validExtensions = @(
    'Ansible', 'BitBucket', 'CircleCI', 'ExternalTfs',
    'IISWebAppDeploy', 'ServiceNow', 'TeamCity'
)

$buildReason = $env:BUILD_REASON

Write-Host "Build reason       : $buildReason"
Write-Host "Parameter extension: $ParameterExtensionName"

function Set-ExtensionVariable {
    param([string]$Value)
    Write-Host "Setting pipeline variable '$AdoVariableName' = '$Value'"
    Write-Host "##vso[task.setvariable variable=$AdoVariableName]$Value"
}

# ── Non-PR triggers (Manual, CI, Schedule, etc.): trust the parameter value ──
if ($buildReason -ne 'PullRequest') {
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Non-PR trigger detected. Using parameter value: $ParameterExtensionName"
        Set-ExtensionVariable -Value $ParameterExtensionName
        return
    }
    throw "Non-PR trigger requires a valid extensionName parameter. Received: '$ParameterExtensionName'"
}

# ── PR trigger (/azp run or auto-trigger): auto-detect from git diff ──
Write-Host "`nPR trigger detected. Auto-detecting changed extension from diff..."

$targetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH
if (-not $targetBranch) {
    throw "SYSTEM_PULLREQUEST_TARGETBRANCH is not set. Cannot determine target branch."
}

$targetRef = $targetBranch -replace '^refs/heads/', ''
Write-Host "PR target branch: $targetRef"

# Ensure the target branch ref is available locally for comparison
git fetch origin $targetRef --depth=50 2>&1 | ForEach-Object { Write-Host $_ }

$changedFiles = git diff --name-only "origin/$targetRef...HEAD" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "##[warning]Three-dot diff failed. Trying two-dot diff as fallback."
    $changedFiles = git diff "origin/$targetRef" HEAD --name-only
}

if (-not $changedFiles) {
    Write-Host "##[warning]No changed files detected between branch and origin/$targetRef."
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Falling back to parameter value: $ParameterExtensionName"
        Set-ExtensionVariable -Value $ParameterExtensionName
        return
    }
    throw "No changed files detected and no valid fallback parameter provided."
}

Write-Host "`nChanged files:"
$changedFiles | ForEach-Object { Write-Host "  $_" }

# Extract unique extension names from changed file paths
$detectedExtensions = @()
foreach ($file in $changedFiles) {
    if ($file -match '^Extensions/([^/]+)/') {
        $extName = $Matches[1]
        if (($validExtensions -contains $extName) -and ($detectedExtensions -notcontains $extName)) {
            $detectedExtensions += $extName
        }
    }
}

if ($detectedExtensions.Count -eq 0) {
    Write-Host "##[warning]No extension-related file changes detected in the PR diff."
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Falling back to parameter value: $ParameterExtensionName"
        Set-ExtensionVariable -Value $ParameterExtensionName
        return
    }
    throw "No extension changes detected in PR and no valid fallback parameter provided."
}

if ($detectedExtensions.Count -gt 1) {
    Write-Host "##[warning]Multiple extensions changed: $($detectedExtensions -join ', '). Using first detected: $($detectedExtensions[0])."
    Write-Host "##[warning]Consider splitting changes into separate PRs for independent CI testing."
}

Write-Host "`nAuto-detected extension: $($detectedExtensions[0])"
Set-ExtensionVariable -Value $detectedExtensions[0]
