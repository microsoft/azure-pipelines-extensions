[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

Register-Mock Get-AppCmdLocation {return "appcmd.exe", 8}

# Test 1: function should return false, List WebSite command returns null.
Register-Mock Run-command { return $null } -ParametersEvaluator { $failOnErr -eq $false }
$result = Does-WebSiteExists -siteName "SampleWeb"
Assert-AreEqual $false $result

Unregister-Mock Run-command

# Test 2: function should return true, List WebSite command returns non-null
Register-Mock Run-command { return "" } -ParametersEvaluator { $failOnErr -eq $false }
$result = Does-WebSiteExists -siteName "SampleWeb"
Assert-AreEqual $true $result
