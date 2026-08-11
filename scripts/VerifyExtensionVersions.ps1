<#
.SYNOPSIS
    Verifies that all detected extensions have their manifest version bumped
    above the current Marketplace version.

.DESCRIPTION
    Accepts a semicolon-separated list of extension names (from the
    detectChangedExtensions gulp task) and calls BumpExtensionVersion.ps1
    -VerifyOnly for each. Fails the pipeline if any extension version is
    not bumped.

.PARAMETER Extensions
    Semicolon-separated list of extension folder names to verify.

.PARAMETER SourceDirectory
    Root of the repository checkout (contains the Extensions/ folder).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Extensions,

    [Parameter(Mandatory)]
    [string]$SourceDirectory
)

$ErrorActionPreference = 'Stop'

[array]$extensionList = $Extensions -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ }

if ($extensionList.Count -eq 0) {
    Write-Host "No extensions to verify — skipping."
    exit 0
}

Write-Host "Extensions to verify: $($extensionList -join ', ')"
Write-Host ""

# ---------------------------------------------------------------------------
# Current Azure DevOps sprint (fetched directly from whatsprintis.it). The
# extension minor version must not be bumped ahead of the current sprint.
# https://github.com/microsoft/azure-pipelines-tasks/blob/master/docs/taskversionbumping.md
# ---------------------------------------------------------------------------
$sprint = $null
try {
    $current = Invoke-RestMethod -Uri 'https://whatsprintis.it/?json' -TimeoutSec 10 -ErrorAction Stop
    if ($current.sprint -and [int]$current.sprint -gt 0) {
        $sprint = [int]$current.sprint
        Write-Host "Current sprint : $sprint"
    }
    else {
        Write-Host "##[warning]Unexpected response from whatsprintis.it (no valid sprint number); skipping the sprint version guard."
    }
}
catch {
    Write-Host "##[warning]Could not fetch the current sprint from whatsprintis.it ($($_.Exception.Message)); skipping the sprint version guard."
}
Write-Host ""

# ---------------------------------------------------------------------------
# Verify each extension by calling BumpExtensionVersion.ps1 -VerifyOnly
# ---------------------------------------------------------------------------
$scriptPath = Join-Path $SourceDirectory 'scripts/BumpExtensionVersion.ps1'
$failures = @()
$aheadOfSprint = @()  # minor version bumped ahead of the current sprint

foreach ($ext in $extensionList) {
    $manifestPath = Join-Path $SourceDirectory "Extensions/$ext/Src/vss-extension.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "##[warning]No manifest for '$ext' — skipping (not a publishable extension)."
        continue
    }

    Write-Host "--- Verifying: $ext ---"

    # Sprint guard: the minor version must not be bumped ahead of the current
    # sprint. This is a guardrail to prevent accidentally bumping into a future
    # sprint. Skipped when the current sprint could not be determined.
    if ($null -ne $sprint) {
        try {
            $minor = ([version](Get-Content $manifestPath -Raw | ConvertFrom-Json).version).Minor
            if ($minor -gt $sprint) {
                Write-Host "##[error]$ext`: minor version $minor is ahead of the current sprint ($sprint). Do not bump into a future sprint."
                $aheadOfSprint += $ext
            }
        }
        catch {
            Write-Host "##[warning]$ext`: could not read the manifest version for the sprint guard ($($_.Exception.Message))."
        }
    }

    $ErrorActionPreference = 'Continue'
    & $scriptPath -ManifestPath $manifestPath -VerifyOnly
    $ErrorActionPreference = 'Stop'

    if ($LASTEXITCODE -ne 0) {
        $failures += $ext
    }
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Report result
# ---------------------------------------------------------------------------
if ($failures.Count -gt 0) {
    Write-Host "##[error]Version not bumped for: $($failures -join ', ')"
    Write-Host "##[error]Please update the 'version' field in vss-extension.json to exceed the Marketplace version."
    Write-Host "##[error]Run: gulp build --syncVersions $($failures -join ',')"
}

if ($aheadOfSprint.Count -gt 0) {
    Write-Host "##[error]Version bumped ahead of the current sprint ($sprint) for: $(($aheadOfSprint | Select-Object -Unique) -join ', ')"
    Write-Host "##[error]Set the minor version to the current sprint ($sprint) - do not bump into a future sprint."
}

if ($failures.Count -gt 0 -or $aheadOfSprint.Count -gt 0) {
    exit 1
}

Write-Host "All extension versions are valid."
