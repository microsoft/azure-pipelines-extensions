<#
.SYNOPSIS
  Detects which extension(s) changed in a PR and sets pipeline variables.

.DESCRIPTION
  Auto-detects ALL changed extensions from git diff against the PR target branch.
  If only infrastructure files changed (no extension folders), builds all extensions
  to validate no regressions.

  Sets the following pipeline variables:
  - ExtensionName        : first detected extension (used for run naming)
  - DetectedExtensions   : semicolon-separated list (e.g. "Ansible;BitBucket")
  - ExtensionCopyPattern : glob for CopyFiles (e.g. "{Ansible,BitBucket}" or "Ansible")
#>

$ErrorActionPreference = 'Stop'

$validExtensions = @(
    'Ansible', 'BitBucket', 'CircleCI', 'ExternalTfs',
    'IISWebAppDeploy', 'ServiceNow', 'TeamCity'
)

# ── Auto-detect all changed extensions from git diff ──
Write-Host "Auto-detecting changed extensions from PR diff..."

function Set-PipelineVariables {
    param([string[]]$Extensions)

    $first = $Extensions[0]
    $joined = $Extensions -join ';'
    $copyPattern = if ($Extensions.Count -eq 1) { $first } else { '{' + ($Extensions -join ',') + '}' }

    Write-Host "`nSetting pipeline variables:"
    Write-Host "  ExtensionName        = $first"
    Write-Host "  DetectedExtensions   = $joined"
    Write-Host "  ExtensionCopyPattern = $copyPattern"

    Write-Host "##vso[task.setvariable variable=ExtensionName]$first"
    Write-Host "##vso[task.setvariable variable=DetectedExtensions]$joined"
    Write-Host "##vso[task.setvariable variable=ExtensionCopyPattern]$copyPattern"
}

$targetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH
if (-not $targetBranch) {
    throw "SYSTEM_PULLREQUEST_TARGETBRANCH is not set."
}

$targetRef = $targetBranch -replace '^refs/heads/', ''
Write-Host "PR target branch: $targetRef"

# Fetch target branch so we can diff against it.
Write-Host "Fetching origin/$targetRef ..."
git fetch origin $targetRef --depth=100 --no-tags 2>&1 | ForEach-Object { Write-Host $_ }

# Diff: three-dot gives the true PR diff (merge-base to HEAD).
# Falls back to two-dot if merge-base can't be found (very shallow clone).
$changedFiles = @(git diff --name-only "origin/$targetRef...HEAD" 2>$null)
if ($LASTEXITCODE -ne 0) {
    Write-Host "##[warning]Three-dot diff failed. Falling back to two-dot diff."
    $changedFiles = @(git diff --name-only "origin/$targetRef" HEAD)
}

if (-not $changedFiles -or $changedFiles.Count -eq 0) {
    Write-Host "##[warning]No changed files detected. Building ALL extensions as a safety measure."
    $changedFiles = @()
}

Write-Host "`nChanged files ($($changedFiles.Count)):"
$changedFiles | ForEach-Object { Write-Host "  $_" }

$detectedExtensions = @()
$nonExtensionFiles = @()

foreach ($file in $changedFiles) {
    if ($file -match '^Extensions/([^/]+)/') {
        $extName = $Matches[1]
        if (($validExtensions -contains $extName) -and ($detectedExtensions -notcontains $extName)) {
            $detectedExtensions += $extName
        }
    } else {
        $nonExtensionFiles += $file
    }
}

if ($nonExtensionFiles.Count -gt 0) {
    Write-Host "`nNon-extension files changed ($($nonExtensionFiles.Count)):"
    $nonExtensionFiles | ForEach-Object { Write-Host "  $_" }
}

if ($detectedExtensions.Count -eq 0) {
    Write-Host "`nNo extension-specific changes found. Building ALL extensions to validate no regressions."
    $detectedExtensions = $validExtensions
}

Write-Host "`nAuto-detected extensions ($($detectedExtensions.Count)): $($detectedExtensions -join ', ')"
Set-PipelineVariables -Extensions $detectedExtensions
