<#
.SYNOPSIS
    Verifies that all extensions with actual file changes have their manifest
    version bumped above the current Marketplace version.

.DESCRIPTION
    Uses git diff to detect which extensions have file changes (ignoring shared
    infra), then calls BumpExtensionVersion.ps1 -VerifyOnly for each.
    Fails the pipeline if any extension version is not bumped.

.PARAMETER SourceDirectory
    Root of the repository checkout (contains the Extensions/ folder).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$SourceDirectory
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Determine changed extensions via git diff (only Extensions/<name>/ paths)
# ---------------------------------------------------------------------------
$targetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH -replace '^refs/heads/', ''
if (-not $targetBranch) {
    Write-Host "Not a PR build — skipping version verification."
    exit 0
}

$ErrorActionPreference = 'Continue'
try {
    git fetch --no-tags --quiet --depth=200 origin "${targetBranch}:refs/remotes/origin/$targetBranch" 2>$null
} catch {
    Write-Warning "git fetch failed: $($_.Exception.Message)"
}

$changedFiles = git diff --name-only "origin/$targetBranch...HEAD" 2>$null
if ($LASTEXITCODE -ne 0) {
    $changedFiles = git diff --name-only "origin/$targetBranch" HEAD 2>$null
}
$ErrorActionPreference = 'Stop'

if (-not $changedFiles) {
    Write-Host "No changed files detected — skipping version verification."
    exit 0
}

[array]$changedExtensions = $changedFiles |
    Where-Object { $_ -match '^Extensions/([^/]+)/' } |
    ForEach-Object { $Matches[1] } |
    Select-Object -Unique |
    Where-Object { $_ -ne 'Common' }

if ($changedExtensions.Count -eq 0) {
    Write-Host "No extension-specific file changes detected — skipping version verification."
    exit 0
}

Write-Host "Extensions with file changes: $($changedExtensions -join ', ')"
Write-Host ""

# ---------------------------------------------------------------------------
# Verify each extension by calling BumpExtensionVersion.ps1 -VerifyOnly
# ---------------------------------------------------------------------------
$scriptPath = Join-Path $SourceDirectory 'scripts/BumpExtensionVersion.ps1'
$failures = @()

foreach ($ext in $changedExtensions) {
    $manifestPath = Join-Path $SourceDirectory "Extensions/$ext/Src/vss-extension.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "##[warning]No manifest for '$ext' — skipping (not a publishable extension)."
        continue
    }

    Write-Host "--- Verifying: $ext ---"
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
    Write-Host "##[error]Run: scripts/BumpExtensionVersion.ps1 -ManifestPath Extensions/<name>/Src/vss-extension.json"
    exit 1
}

Write-Host "All extension versions are valid."
