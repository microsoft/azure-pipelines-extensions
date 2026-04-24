<#
.SYNOPSIS
  Detects which extension(s) changed in a PR and sets pipeline variables.

.DESCRIPTION
  Auto-detects changed extensions from git diff against the PR target branch.
  Only detected extensions will be published and have CI tests run.
  If no extension-specific changes are found, no extensions are published.

  Sets the following pipeline variables:
  - DetectedExtensions   : semicolon-separated list (e.g. "Ansible;BitBucket")
  - HasExtensionChanges  : 'true' or 'false' (also set as output variable for cross-stage conditions)
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

    $extensionList = $Extensions -join ';'

    Write-Host "`nSetting pipeline variable:"
    
    Write-Host "  DetectedExtensions   = $extensionList"
    Write-Host "##vso[task.setvariable variable=DetectedExtensions]$extensionList"

    $hasChanges = if ($Extensions.Count -gt 0) { 'true' } else { 'false' }
    Write-Host "  HasExtensionChanges  = $hasChanges"
    Write-Host "##vso[task.setvariable variable=HasExtensionChanges]$hasChanges"
    Write-Host "##vso[task.setvariable variable=HasExtensionChanges;isOutput=true]$hasChanges"
}

$targetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH

if (-not $targetBranch) {
    # Manual run (not a PR) — build, publish and test ALL extensions.
    Write-Host "##[warning]Not a PR-triggered run (SYSTEM_PULLREQUEST_TARGETBRANCH is not set)."
    Write-Host "Defaulting to ALL valid extensions: $($validExtensions -join ', ')"
    $detectedExtensions = $validExtensions
} else {
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
        Write-Host "`n##[warning]No extension-specific changes detected. No extensions will be published and CI tests will be skipped."
    }
}

Write-Host "`nDetected extensions ($($detectedExtensions.Count)): $($detectedExtensions -join ', ')"
Set-PipelineVariables -Extensions $detectedExtensions
