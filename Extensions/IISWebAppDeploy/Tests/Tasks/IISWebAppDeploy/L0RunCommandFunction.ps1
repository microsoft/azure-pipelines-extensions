[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\MsDeployOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should throw exception when command execution fails
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

Assert-AreEqual ($result.Exception.ToString().Contains("$errMsg")) $true

Unregister-Mock cmd.exe

# Test 2: Should execute without throwing any exceptions
try
{
    $result = Run-Command -command "echo %cd%"
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception
