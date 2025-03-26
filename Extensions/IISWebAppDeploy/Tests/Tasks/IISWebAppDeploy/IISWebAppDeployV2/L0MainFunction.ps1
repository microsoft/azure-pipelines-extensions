[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppDeploy\IISWebAppDeployV2\DeployIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppDeploy\IISWebAppDeployV2\ps_modules\Sanitizer\ArgumentsSanitizer.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test
Register-Mock Get-Content {return "dummyscript"}
Register-Mock Invoke-RemoteDeployment { return "" } -ParametersEvaluator { $MachinesList -eq "dummyMachinesList" }

Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -webDeployPackage "pkg.zip" -webDeployParamFile "param.xml" -overRideParams "dummyoverride" -websiteName "dummyweb"

Assert-WasCalled Get-Content
Assert-WasCalled Invoke-RemoteDeployment -ParametersEvaluator { $MachinesList -eq "dummyMachinesList" }

Unregister-Mock Invoke-RemoteDeployment