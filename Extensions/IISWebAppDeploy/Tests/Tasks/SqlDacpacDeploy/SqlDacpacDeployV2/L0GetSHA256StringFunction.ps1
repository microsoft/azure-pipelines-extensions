[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\SqlDacpacDeploy\SqlDacpacDeployV2\DeployToSqlServer.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: should return correct SHA256 hash for a known input string
$result = GetSHA256String -inputString "hello"
$expected = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
Assert-AreEqual $expected $result

# Test 2: should return correct SHA256 hash and be case-insensitive (input is lowered internally)
$result = GetSHA256String -inputString "Hello"
$resultLower = GetSHA256String -inputString "hello"
Assert-AreEqual $result $resultLower

# Test 3: should return empty string for null input
$result = GetSHA256String -inputString $null
Assert-AreEqual "" $result

# Test 4: should return empty string for empty string input
$result = GetSHA256String -inputString ""
Assert-AreEqual "" $result

# Test 5: should return correct SHA256 hash for a complex string
$result = GetSHA256String -inputString "test-connection-string-2026"
Assert-AreNotEqual "" $result
Assert-AreEqual 64 $result.Length
