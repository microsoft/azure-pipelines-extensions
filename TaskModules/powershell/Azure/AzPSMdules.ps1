<#
    Script to layout an aggregated zip containing supported Az module on Hosted agents.
#>

param (
    [string] $layoutPath = "$ENV:System_DefaultWorkingDirectory\AzurePowerShell\Modules",
    [string] $aggregatedZipPath = "$ENV:System_DefaultWorkingDirectory\AzurePowerShell\ZippedModules",
    [string] $currentMilestone
)

$supportedAzModuleVersions = @("1.0.0", "1.6.0", "2.3.2", "2.6.0")

if (Test-Path -Path $layoutPath) {
    Write-Host "Cleaning up directory $layoutPath."
    Remove-Item -Path $layoutPath -Recurse -Force
}

New-Item -ItemType Directory -Path $layoutPath | Out-Null

# Save the Az modules 
foreach ($moduleVersion in $supportedAzModuleVersions) {
    Write-Host "===================================== Saving Az module version $moduleVersion ====================================="
    $azModulePath = Join-Path -Path $layoutPath -ChildPath "az_$moduleVersion"
    if (!(Test-Path -Path $azModulePath)) {
        New-Item -ItemType Directory -Path $azModulePath | Out-Null
    }

    Save-Module -Name Az -Path $azModulePath -RequiredVersion $moduleVersion -Force
}

# Zip the modules at location of aggregatedZipPath
if (Test-Path -Path $aggregatedZipPath) {
    Write-Host "Cleaning up directory $aggregatedZipPath"
    Remove-Item -Path $aggregatedZipPath -Recurse -Force
}

New-Item -ItemType Directory -Path $aggregatedZipPath | Out-Null

$now = [System.DateTime]::UtcNow
$aggregatedZipVersion = "AzPSModules.$currentMilestone.$('{0:yyyyMMdd}' -f $now).$([System.Math]::Floor($now.timeofday.totalseconds))"

# Create a manifest json file
$manifestObj = @{
    version = $aggregatedZipVersion
}

$manifestObj | ConvertTo-Json | Set-Content -Path "$layoutPath\azmanifest.json"

Write-Host "Laying out aggregated zip of Az module"
[System.IO.Compression.ZipFile]::CreateFromDirectory($layoutPath, "$aggregatedZipPath\$aggregatedZipVersion.zip")

Write-Host "Successfully layed out aggregated zip at $aggregatedZipPath\$aggregatedZipVersion.zip"