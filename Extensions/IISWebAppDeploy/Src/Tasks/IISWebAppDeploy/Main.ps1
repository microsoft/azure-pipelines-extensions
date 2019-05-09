param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$webDeployPackage,
    [string]$webDeployParamFile,
    [string]$overRideParams,
    [string]$websiteName,
    [string]$removeAdditionalFiles,
    [string]$excludeFilesFromAppData,
    [string]$takeAppOffline,
    [string]$additionalArguments,
    [string]$deployInParallel
    )

if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
{ 
	Write-Verbose "Resetting input encoding."
	[Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
}

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

. $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
. $env:CURRENT_TASK_ROOTDIR\DeployIISWebApp.ps1

(Main -machinesList $machinesList -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -webDeployPackage "$webDeployPackage" -webDeployParamFile "$webDeployParamFile" -overRideParams "$overRideParams" -websiteName "$websiteName" -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -additionalArguments $additionalArguments -deployInParallel $deployInParallel)