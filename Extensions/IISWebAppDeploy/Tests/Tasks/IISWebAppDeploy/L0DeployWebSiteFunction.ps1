[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test: It should append msDeploy path and msDeploy args and run
$msDeploy = "Msdeploy.exe"
$msDeployArgs = " -verb:sync -source:package=Web.zip -setParamFile=SampleParam.xml"

Register-Mock Run-Command { return }
Register-Mock Get-MsDeployLocation { return $msDeploy }
Register-Mock Get-MsDeployCmdArgs { return $msDeployArgs }

$output = Deploy-WebSite -websiteName "SampleWebApp" -webDeployPkg "Web.zip" -webDeployParamFile "SampleParam.xml" 4>&1 | Out-String

Assert-AreEqual ($output.Contains("$msDeploy")) $true
Assert-AreEqual ($output.Contains("$msDeployArgs")) $true
Assert-WasCalled Run-Command
Assert-WasCalled Get-MsDeployLocation
Assert-WasCalled Get-MsDeployCmdArgs