<#
    Script to layout an aggregated zip containing supported Azure and AzureRm modules on Hosted agents.
#>

param (
    [string] $layoutPath = "$ENV:System_DefaultWorkingDirectory\AzurePowerShell\Modules",
    [string] $aggregatedZipPath = "$ENV:System_DefaultWorkingDirectory\AzurePowerShell\ZippedModules",
    [string] $currentMilestone
)

$supportedAzureModuleVersions = @("3.8.0", "4.2.1", "5.1.1")
$supportedAzureRmModuleVersions = @("3.8.0", "4.2.1", "5.1.1", "6.7.0")

if (Test-Path -Path $layoutPath) {
    Write-Host "Cleaning up directory $layoutPath."
    Remove-Item -Path $layoutPath -Recurse -Force
}

New-Item -ItemType Directory -Path $layoutPath | Out-Null

# Save the Azure modules 
foreach ($moduleVersion in $supportedAzureModuleVersions) {
    Write-Host "===================================== Saving Azure module version $moduleVersion ====================================="
    $azureModulePath = Join-Path -Path $layoutPath -ChildPath "azure_$moduleVersion"
    if (!(Test-Path -Path $azureModulePath)) {
        New-Item -ItemType Directory -Path $azureModulePath | Out-Null
    }

    Save-Module -Name Azure -Path $azureModulePath -RequiredVersion $moduleVersion -Force
}

# Save the AzureRm modules
foreach ($moduleVersion in $supportedAzureRmModuleVersions) {
    Write-Host "===================================== Saving AzureRm module version $moduleVersion ====================================="
    $azureRmModulePath = Join-Path -Path $layoutPath -ChildPath "azurerm_$moduleVersion"
    if (!(Test-Path -Path $azureRmModulePath)) {
        New-Item -ItemType Directory -Path $azureRmModulePath | Out-Null
    }

    Save-Module -Name AzureRM -Path $azureRmModulePath -RequiredVersion $moduleVersion -Force
}

# Zip the modules at location of aggregatedZipPath
if (Test-Path -Path $aggregatedZipPath) {
    Write-Host "Cleaning up directory $aggregatedZipPath"
    Remove-Item -Path $aggregatedZipPath -Recurse -Force
}

New-Item -ItemType Directory -Path $aggregatedZipPath | Out-Null

$now = [System.DateTime]::UtcNow
$aggregatedZipVersion = "AzurePSModules.$currentMilestone.$('{0:yyyyMMdd}' -f $now).$([System.Math]::Floor($now.timeofday.totalseconds))"

# Create a manifest json file
$manifestObj = @{
    version = $aggregatedZipVersion
}

$manifestObj | ConvertTo-Json | Set-Content -Path "$layoutPath\manifest.json"

Write-Host "Laying out aggregated zip of Azure and AzureRm modules"
[System.IO.Compression.ZipFile]::CreateFromDirectory($layoutPath, "$aggregatedZipPath\$aggregatedZipVersion.zip")

Write-Host "Successfully layed out aggregated zip at $aggregatedZipPath\$aggregatedZipVersion.zip"
