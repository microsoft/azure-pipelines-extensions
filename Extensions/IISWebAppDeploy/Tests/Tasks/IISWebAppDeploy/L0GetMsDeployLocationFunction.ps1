[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should throw exception when MsDeploy is not installed on given registry path
$regKeyWithNoInstallPath = "HKLM:\SOFTWARE\Microsoft"

Assert-Throws { Get-MsDeployLocation -regKeyPath $regKeyWithNoInstallPath }

# Test 2: Should throw when Get-ChildItem fails as MsDeploy not installed on the machine
$msDeployNotFoundError = "Cannot find MsDeploy.exe location. Verify MsDeploy.exe is installed on $env:ComputeName and try operation again."
$inValidInstallPathRegKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Invalid"

Assert-Throws { Get-MsDeployLocation -regKeyPath $inValidInstallPathRegKey } $msDeployNotFoundError 
