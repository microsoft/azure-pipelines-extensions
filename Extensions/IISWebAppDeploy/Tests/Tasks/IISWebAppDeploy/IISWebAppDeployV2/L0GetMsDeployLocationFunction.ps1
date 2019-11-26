[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppDeploy\IISWebAppDeployV2\MsDeployOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should throw exception when MsDeploy is not installed on given registry path
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"

Assert-Throws { Get-MsDeployLocation -regKeyPath $regKeyWithNoInstallPath }

# Test 2: Should throw when Get-ChildItem fails as MsDeploy not installed on the machine
$inValidInstallPathRegKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Invalid"

Assert-Throws { Get-MsDeployLocation -regKeyPath $inValidInstallPathRegKey } -MessagePattern "MsDeployNotFoundError"