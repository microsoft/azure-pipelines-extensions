[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test: Should deploy website When execute main is invoked with package input
$webDeployPackage = "WebDeploy.Pkg"
$webDeployParamFile = "Param.xml"
$overrideParams = "Abc=xyz"

Register-Mock Deploy-WebSite { return } -ParametersEvaluator { $webDeployPkg -eq $WebDeployPackage -and $webDeployParamFile -eq $webDeployParamFile -and $overRideParams -eq $overRideParams}
Register-Mock Is-Directory { return $false }
Register-Mock Contains-ParamFile { return $false }

Execute-Main -WebDeployPackage $WebDeployPackage -webDeployParamFile $WebDeployParamFile -overRiderParams $OverRideParams

Assert-WasCalled -Command Deploy-WebSite -Times 1
Assert-WasCalled Is-Directory
Assert-WasCalled Contains-ParamFile
