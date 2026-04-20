<#
.SYNOPSIS
  Detects which extension(s) changed and sets pipeline variables.

.DESCRIPTION
  - Manual runs: uses the parameter value (single extension).
  - PR triggers (/azp run): auto-detects ALL changed extensions from git diff.

  Sets the following pipeline variables:
  - ExtensionName        : first detected extension (used for run naming)
  - DetectedExtensions   : semicolon-separated list (e.g. "Ansible;BitBucket")
  - ExtensionCopyPattern : glob for CopyFiles (e.g. "{Ansible,BitBucket}" or "Ansible")

.PARAMETER ParameterExtensionName
  Extension name from the pipeline parameter. Used as-is for manual runs,
  used as fallback for PR triggers when auto-detection finds nothing.
#>
param(
    [string]$ParameterExtensionName = ''
)

$ErrorActionPreference = 'Stop'

$validExtensions = @(
    'Ansible', 'BitBucket', 'CircleCI', 'ExternalTfs',
    'IISWebAppDeploy', 'ServiceNow', 'TeamCity'
)

$buildReason = $env:BUILD_REASON

Write-Host "Build reason       : $buildReason"
Write-Host "Parameter extension: $ParameterExtensionName"

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

# ── Non-PR triggers (Manual, etc.): use parameter value directly ──
if ($buildReason -ne 'PullRequest') {
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Non-PR trigger. Using parameter value: $ParameterExtensionName"
        Set-PipelineVariables -Extensions @($ParameterExtensionName)
        return
    }
    throw "Non-PR trigger requires a valid extensionName parameter. Received: '$ParameterExtensionName'"
}

# ── PR trigger (/azp run): auto-detect all changed extensions from git diff ──
Write-Host "`nPR trigger detected. Auto-detecting changed extensions..."

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
    Write-Host "##[warning]No changed files detected."
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Falling back to parameter: $ParameterExtensionName"
        Set-PipelineVariables -Extensions @($ParameterExtensionName)
        return
    }
    throw "No changed files detected and no valid fallback parameter."
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
    Write-Host "##[warning]No extension changes found in PR diff."
    if ($ParameterExtensionName -and ($validExtensions -contains $ParameterExtensionName)) {
        Write-Host "Falling back to parameter: $ParameterExtensionName"
        Set-PipelineVariables -Extensions @($ParameterExtensionName)
        return
    }
    throw "No extension changes detected and no valid fallback parameter."
}

Write-Host "`nAuto-detected extensions ($($detectedExtensions.Count)): $($detectedExtensions -join ', ')"
Set-PipelineVariables -Extensions $detectedExtensions
