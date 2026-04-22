<#
.SYNOPSIS
    Detects the current version of an Azure DevOps extension on the Marketplace
    and bumps the local manifest version to be higher than the published version.

.DESCRIPTION
    This script queries the Azure DevOps Marketplace REST API for both the public
    extension and its corresponding test extension (with "-test" suffix). It compares
    the local version against the higher of the two Marketplace versions. If the local
    version is less than or equal to the highest published version, the script
    auto-increments the patch number.

    Requires Azure CLI authentication ("az login") to query private test extensions.

.PARAMETER ManifestPath
    Path to the vss-extension.json file to check and update.

.EXAMPLE
    # First time: login to Azure CLI
    az login

    # Bump Ansible extension version (checks both public and private test extension)
    .\BumpExtensionVersion.ps1 -ManifestPath Extensions\Ansible\Src\vss-extension.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ManifestPath
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Obtain Azure CLI token (login is handled by the caller before this script runs)
# ---------------------------------------------------------------------------
$azToken = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv 2>$null
if ($LASTEXITCODE -ne 0 -or -not $azToken) {
    Write-Error "Failed to obtain Azure CLI access token. Ensure you are logged in (az login)."
    exit 1
}

if (-not (Test-Path $ManifestPath)) {
    Write-Error "Manifest not found: $ManifestPath"
    exit 1
}

Write-Host "Manifest  : $ManifestPath"

# ---------------------------------------------------------------------------
# Read manifest
# ---------------------------------------------------------------------------
$content = Get-Content $ManifestPath -Raw -Encoding UTF8

# Remove BOM if present
if ($content.Length -gt 0 -and $content[0] -eq [char]0xFEFF) {
    $content = $content.Substring(1)
}

$manifest = $content | ConvertFrom-Json

$localVersionStr = $manifest.version
if (-not $localVersionStr) {
    Write-Error "No 'version' field found in manifest"
    exit 1
}

$localVersion = [version]$localVersionStr

$extensionId = if ($manifest.id) { $manifest.id }
               elseif ($manifest.extensionId) { $manifest.extensionId }
               else { $null }

if (-not $extensionId) {
    Write-Error "No extension ID found in manifest (expected 'id' or 'extensionId' field)"
    exit 1
}

$publisher = $manifest.publisher
if (-not $publisher) {
    Write-Error "No 'publisher' field found in manifest"
    exit 1
}

Write-Host "Extension : $publisher.$extensionId"
Write-Host "Local ver : $localVersion"

# ---------------------------------------------------------------------------
# Helper: query Marketplace for a specific extension's latest version
# ---------------------------------------------------------------------------
function Get-MarketplaceVersion {
    param([string]$FullExtensionId, [string]$Token)

    $headers = @{
        "Content-Type"  = "application/json"
        "Accept"        = "application/json;api-version=7.1-preview.1"
        "Authorization" = "Bearer $Token"
    }

    $body = @{
        filters = @(
            @{
                criteria = @(
                    @{
                        filterType = 7
                        value      = $FullExtensionId
                    }
                )
            }
        )
        flags = 0x1  # IncludeVersions
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod `
            -Uri "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery" `
            -Method Post `
            -Headers $headers `
            -Body $body

        $exts = $response.results[0].extensions
        if ($exts -and $exts.Count -gt 0) {
            return [version]$exts[0].versions[0].version
        }
    }
    catch {
        Write-Warning "Failed to query Marketplace for '$FullExtensionId': $($_.Exception.Message)"
    }

    return $null
}

# ---------------------------------------------------------------------------
# Query both public and test extension versions
# ---------------------------------------------------------------------------
$prodId = "$publisher.$extensionId"
$testId = "$publisher.$extensionId-test"

$prodVersion = Get-MarketplaceVersion -FullExtensionId $prodId -Token $azToken
$testVersion = Get-MarketplaceVersion -FullExtensionId $testId -Token $azToken

if ($prodVersion) { Write-Host "PROD ver  : $prodVersion  ($prodId)" }
else              { Write-Host "PROD ver  : not found     ($prodId)" }

if ($testVersion) { Write-Host "TEST ver  : $testVersion  ($testId)" }
else              { Write-Host "TEST ver  : not found     ($testId)" }

# Take the higher of the two
$marketplaceVersion = $null
if ($prodVersion -and $testVersion) {
    $marketplaceVersion = if ($prodVersion -ge $testVersion) { $prodVersion } else { $testVersion }
}
elseif ($prodVersion) { $marketplaceVersion = $prodVersion }
elseif ($testVersion) { $marketplaceVersion = $testVersion }

if ($marketplaceVersion) {
    Write-Host "Max ver   : $marketplaceVersion"
}

# ---------------------------------------------------------------------------
# Compare and bump if needed
# ---------------------------------------------------------------------------
$newVersionStr = $localVersionStr

if ($marketplaceVersion) {
    if ($localVersion -le $marketplaceVersion) {
        $newVersionStr = "$($marketplaceVersion.Major).$($marketplaceVersion.Minor).$($marketplaceVersion.Build + 1)"
        Write-Host "Bumping   : $localVersion -> $newVersionStr  (local <= Marketplace max)"

        $updatedContent = $content -replace '(?m)(^\s*"version"\s*:\s*")[\d.]+(")', "`${1}$newVersionStr`${2}"
        Set-Content $ManifestPath $updatedContent -NoNewline -Encoding UTF8
        Write-Host "Updated   : $ManifestPath"
    }
    else {
        Write-Host "No bump needed: local ($localVersion) > Marketplace max ($marketplaceVersion)"
    }
}
else {
    Write-Host "No Marketplace version available. Using local version: $localVersionStr"
}

Write-Host "Final ver : $newVersionStr"
