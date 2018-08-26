[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1
. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\TaskModuleSqlUtility\SqlQueryOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: should throw exception, When Import execution fails
$errMsg = "Module Not Found"
Register-Mock Import-SqlPs { throw $errMsg}

try
{
    Import-SqlPs
}
catch
{
    $result = $_
}

Assert-AreEqual ($result.Exception.ToString().Contains("$errMsg")) $true

Unregister-Mock Import-SqlPs
$result = $null

# Test 2: should not throw exception, When command execution successful
Register-Mock Import-SqlPs { return }

try
{
    Import-SqlPs
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception

