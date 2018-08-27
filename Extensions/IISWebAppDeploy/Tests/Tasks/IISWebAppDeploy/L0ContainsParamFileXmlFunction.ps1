[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$msDeploy = "MSDeploy.exe"
$webAppPackage = "Sample.zip"

# Test 1: When parameter file is not present in Package, Should return null since parameter file is not present in the package
Register-Mock Get-MsDeployLocation { return $msDeploy }
Register-Mock Run-Command { return "<output><parameters /></output>"}

$isParamFilePresent = Contains-ParamFile -packageFile $webAppPackage

Assert-AreEqual $isParamFilePresent $false
Assert-WasCalled Get-MsDeployLocation
Assert-WasCalled Run-Command

Unregister-Mock Run-Command

# Test 2: When parameter file is present but don't contains parameter 'IIS Web Application Name', Should return parameter file content since parameter file is not present in the package
Register-Mock Run-Command { return '<output><parameters><parameter name="DefaultConnection-Web.configConnectionString" defaultValue="Testvalue"></parameter></parameters></output>'}

$isParamFilePresent = Contains-ParamFile -packageFile $webAppPackage

Assert-AreEqual $isParamFilePresent $true
Assert-WasCalled Get-MsDeployLocation
Assert-WasCalled Run-Command
