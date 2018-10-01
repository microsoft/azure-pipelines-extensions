[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Create website should be called, When website does not exist
Register-Mock Does-WebSiteExists { return $false } -ParametersEvaluator { $SiteName -eq "SampleWeb" }
Register-Mock Create-WebSite { return } -ParametersEvaluator { $siteName -eq "SampleWeb" }
Register-Mock Update-WebSite { return } -ParametersEvaluator { $siteName -eq "SampleWeb" }
Create-And-Update-WebSite -siteName "SampleWeb"
Assert-WasCalled Does-WebSiteExists
Assert-WasCalled Create-WebSite
Assert-WasCalled Update-WebSite

Unregister-Mock Does-WebSiteExists
Unregister-Mock Create-WebSite
Unregister-Mock Update-WebSite

# Test 2: Create website should not be called, When website exist
Register-Mock Does-WebSiteExists { return $true } -ParametersEvaluator { $SiteName -eq "SampleWeb" }
Register-Mock Create-WebSite { return } -ParametersEvaluator { $siteName -eq "SampleWeb" }
Register-Mock Update-WebSite { return } -ParametersEvaluator { $siteName -eq "SampleWeb" }
Create-And-Update-WebSite -siteName "SampleWeb"
Assert-WasCalled Does-WebSiteExists
Assert-WasCalled Update-WebSite
Assert-WasCalled -Command Create-WebSite -Times 0
