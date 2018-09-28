[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\DeployIISWebApp.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$targetMachines = Parse-TargetMachineNames -machineNames "dummyMachinesList"

# Test
Register-Mock Get-Content {return "dummyscript"}
Register-Mock Get-TargetMachineCredential {return ""} -ParametersEvaluator { $userName -eq "dummyadminuser" -and $password -eq "dummyadminpassword"}
Register-Mock Invoke-RemoteScript { return "" } -ParametersEvaluator { $targetMachineNames -eq $targetMachines }

Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -webDeployPackage "pkg.zip" -webDeployParamFile "param.xml" -overRideParams "dummyoverride" -websiteName "dummyweb"

Assert-WasCalled Get-Content
Assert-WasCalled Invoke-RemoteScript

Unregister-Mock Invoke-RemoteScript