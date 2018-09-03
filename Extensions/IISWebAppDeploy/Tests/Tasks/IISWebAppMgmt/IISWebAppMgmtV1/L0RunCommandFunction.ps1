[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: should throw exception, When command execution fails
$errMsg = "Command Execution Failed"
Register-Mock cmd.exe { throw $errMsg}

try
{
    $result = Run-Command -command "NonExisingCommand"
}
catch
{
    $result = $_
}

Assert-AreEqual $true ($result.Exception.ToString().Contains("$errMsg"))

Unregister-Mock cmd.exe

# Test 2: should not throw exception, When command execution successful
try
{
    $result = Run-Command -command "echo %cd%"
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception
