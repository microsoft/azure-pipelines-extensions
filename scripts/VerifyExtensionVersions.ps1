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
# Verify each extension by calling BumpExtensionVersion.ps1 -VerifyOnly
# ---------------------------------------------------------------------------
$scriptPath = Join-Path $SourceDirectory 'scripts/BumpExtensionVersion.ps1'
$failures = @()

foreach ($ext in $extensionList) {
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
    Write-Host "##[error]Run: gulp build --syncVersions $($failures -join ',')"
    exit 1
}

Write-Host "All extension versions are valid."
