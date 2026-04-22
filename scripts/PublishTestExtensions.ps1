<#
.SYNOPSIS
  Patches version and publishes test VSIX extensions to the marketplace.

.DESCRIPTION
  For each .vsix in the given directory, patches the version to
  <major>.<minor>.<BuildId> (keeping the original major.minor) and publishes
  it to the VS Marketplace.

.PARAMETER VsixDirectory
  Directory containing .vsix files to publish.

.PARAMETER BuildId
  Build ID used as the patch component of the new version.

.PARAMETER MarketplaceToken
  PAT / access-token for VS Marketplace authentication.
#>
param(
    [Parameter(Mandatory)] [string] $VsixDirectory,
    [Parameter(Mandatory)] [string] $BuildId,
    [Parameter(Mandatory)] [string] $MarketplaceToken
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Update-VsixVersion ([string]$VsixPath, [string]$NewVersion) {
    $extractDir = Join-Path $env:TEMP "vsix_$([IO.Path]::GetFileNameWithoutExtension($VsixPath))"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }

    Expand-Archive -Path $VsixPath -DestinationPath $extractDir -Force

    # Patch XML manifest  (extension.vsixmanifest → Identity/@Version)
    $xmlPath = Join-Path $extractDir 'extension.vsixmanifest'
    if (Test-Path $xmlPath) {
        $xml = [xml](Get-Content $xmlPath -Raw)
        $identity = $xml.PackageManifest.Metadata.Identity
        Write-Host "  vsixmanifest : $($identity.Version) -> $NewVersion"
        $identity.Version = $NewVersion
        $xml.Save($xmlPath)
    }

    # Patch JSON manifest (extension/vss-extension.json → "version")
    $jsonPath = Join-Path $extractDir 'extension' 'vss-extension.json'
    if (Test-Path $jsonPath) {
        $json = Get-Content $jsonPath -Raw | ConvertFrom-Json
        Write-Host "  vss-extension: $($json.version) -> $NewVersion"
        $json.version = $NewVersion
        $json | ConvertTo-Json -Depth 100 | Set-Content $jsonPath -Encoding utf8
    }

    # Re-package in place
    Remove-Item $VsixPath -Force
    Compress-Archive -Path "$extractDir\*" -DestinationPath $VsixPath -Force
    Remove-Item $extractDir -Recurse -Force
}

function Get-OverrideVersion ([string]$VsixName, [string]$BuildId) {
    # Filename pattern: <publisher>.<id>-<major>.<minor>.<patch>.vsix
    if ($VsixName -match '-(\d+)\.(\d+)\.\d+\.vsix$') {
        return "$($Matches[1]).$($Matches[2]).$BuildId"
    }
    Write-Host "##[warning]Could not parse version from $VsixName. Using 0.0.$BuildId."
    return "0.0.$BuildId"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
$vsixFiles = @(Get-ChildItem -Path $VsixDirectory -Filter '*.vsix')

if ($vsixFiles.Count -eq 0) {
    Write-Host "##[error]No .vsix files found in $VsixDirectory"
    exit 1
}

Write-Host "Found $($vsixFiles.Count) VSIX file(s) to publish:"
$vsixFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

$failCount = 0
foreach ($vsix in $vsixFiles) {
    Write-Host "`nPublishing: $($vsix.Name)..."

    $newVersion = Get-OverrideVersion -VsixName $vsix.Name -BuildId $BuildId
    Write-Host "  Target version: $newVersion"

    Update-VsixVersion -VsixPath $vsix.FullName -NewVersion $newVersion

    tfx extension publish --vsix $vsix.FullName `
        --service-url https://marketplace.visualstudio.com `
        --auth-type pat --token $MarketplaceToken --no-color

    if ($LASTEXITCODE -ne 0) {
        Write-Host "##[error]Failed to publish $($vsix.Name)"
        $failCount++
    } else {
        Write-Host "Published: $($vsix.Name) (version $newVersion)"
    }
}

if ($failCount -gt 0) {
    Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed to publish"
    exit 1
}

Write-Host "`nAll $($vsixFiles.Count) extension(s) published successfully"
