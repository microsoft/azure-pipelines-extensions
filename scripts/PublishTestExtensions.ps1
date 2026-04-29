<#
.SYNOPSIS
  Publishes test VSIX extensions to the marketplace.

.DESCRIPTION
  For each .vsix in the given directory, publishes it to the VS Marketplace
  using the version already embedded in the extension source code.

.PARAMETER VsixDirectory
  Directory containing .vsix files to publish.

.PARAMETER MarketplaceToken
  PAT / access-token for VS Marketplace authentication.
#>
param(
    [Parameter(Mandatory)] [string] $VsixDirectory,
    [Parameter(Mandatory)] [string] $MarketplaceToken
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

    tfx extension publish --vsix $vsix.FullName `
        --service-url https://marketplace.visualstudio.com `
        --auth-type pat --token $MarketplaceToken --no-color

    if ($LASTEXITCODE -ne 0) {
        Write-Host "##[error]Failed to publish $($vsix.Name)"
        $failCount++
    } else {
        Write-Host "Published: $($vsix.Name)"
    }
}

if ($failCount -gt 0) {
    Write-Host "##[error]$failCount of $($vsixFiles.Count) extension(s) failed to publish"
    exit 1
}

Write-Host "`nAll $($vsixFiles.Count) extension(s) published successfully"
