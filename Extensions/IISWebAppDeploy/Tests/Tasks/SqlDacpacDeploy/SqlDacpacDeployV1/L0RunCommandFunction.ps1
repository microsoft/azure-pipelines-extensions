[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

# Test 1: should throw exception, When command execution fails
$errMsg = "Command Execution Failed"
Register-Mock cmd.exe { throw $errMsg}

try
{
    $result = RunCommand -command "NonExisingCommand"
}
catch
{
    $result = $_
}

Assert-AreEqual ($result.Exception.ToString().Contains("$errMsg")) $true

Unregister-Mock cmd.exe

# Test 2: should not throw exception, When command execution successful
try
{
    $result = RunCommand -command "echo %cd%"
}
catch
{
    $result = $_
}

Assert-isNullOrEmpty $result.Exception
