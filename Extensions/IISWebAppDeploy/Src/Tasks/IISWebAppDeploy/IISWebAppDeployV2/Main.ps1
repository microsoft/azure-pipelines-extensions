[CmdletBinding()]
param()

$env:CURRENT_TASK_ROOTDIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\VstsTaskSdk

Trace-VstsEnteringInvocation $MyInvocation

# Import the loc strings.
Import-VstsLocStrings -LiteralPath $env:CURRENT_TASK_ROOTDIR\task.json

# Get inputs for the task
$machinesList = Get-VstsInput -Name MachinesList -Require
$adminUserName = Get-VstsInput -Name AdminUserName -Require
$adminPassword = Get-VstsInput -Name AdminPassword -Require
$winrmProtocol = Get-VstsInput -Name WinrmProtocol -Require
$testCertificate = Get-VstsInput -Name TestCertificate
$webDeployPackage = Get-VstsInput -Name WebDeployPackage -Require
$webDeployParamFile = Get-VstsInput -Name WebDeployParamFile
$overRideParams = Get-VstsInput -Name OverRideParams
$websiteName = Get-VstsInput -Name WebsiteName -Require
$removeAdditionalFiles = Get-VstsInput -Name RemoveAdditionalFiles
$excludeFilesFromAppData = Get-VstsInput -Name ExcludeFilesFromAppData
$takeAppOffline = Get-VstsInput -Name TakeAppOffline
$additionalArguments = Get-VstsInput -Name AdditionalArguments
$deployInParallel = Get-VstsInput -Name DeployInParallel

try
{
    if ([Console]::InputEncoding -is [Text.UTF8Encoding] -and [Console]::InputEncoding.GetPreamble().Length -ne 0) 
    { 
	    Write-Verbose "Resetting input encoding."
	    [Console]::InputEncoding = New-Object Text.UTF8Encoding $false 
    }

    . $env:CURRENT_TASK_ROOTDIR\TelemetryHelper\TelemetryHelper.ps1
    . $env:CURRENT_TASK_ROOTDIR\DeployIISWebApp.ps1

    (Main -machinesList $machinesList -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -webDeployPackage "$webDeployPackage" -webDeployParamFile "$webDeployParamFile" -overRideParams "$overRideParams" -websiteName "$websiteName" -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -additionalArguments $additionalArguments -deployInParallel $deployInParallel)
}
catch
{
    Write-Verbose $_.Exception.ToString() -Verbose
    throw
}
finally
{
    Trace-VstsLeavingInvocation $MyInvocation
}