[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\DeployIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }
Register-Mock Get-Content { return "Dummy Script" }

# Test
$script = Get-ScriptToRun -webDeployPackage "pkg.zip" -webDeployParamFile "" -overRideParams "" -websiteName "Sample Web" -removeAdditionalFiles "false" -excludeFilesFromAppData "true" -takeAppOffline "true" -additonalArguments ""

Assert-AreEqual ($script.Contains('Dummy Script')) $true
Assert-AreEqual ($script.Contains('Execute-Main -WebDeployPackage "pkg.zip" -WebDeployParamFile "" -OverRideParams "" -WebsiteName "Sample Web" -RemoveAdditionalFiles false -ExcludeFilesFromAppData true -TakeAppOffline true -AdditionalArguments ""')) $true
