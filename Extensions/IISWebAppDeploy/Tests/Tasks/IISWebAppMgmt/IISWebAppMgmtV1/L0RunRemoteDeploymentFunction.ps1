[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\ManageIISWebApp.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$machinesList = "dummyMachinesList"
$script = "dummyscript"
$deployInParallel = "true"
$adminUserName = "dummyuser"
$adminPassword = "dummypassword"
$http = "http"
$https = "https"
$filter = "dummyFilter"

# Test 1: Should not throw any exception, On successful execution of remote deployment script
Register-Mock Invoke-RemoteDeployment { return "" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}
try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception
Assert-WasCalled Invoke-RemoteDeployment

Unregister-Mock Invoke-RemoteDeployment

# Test 2: Should throw exception on failure, Should throw on failure of remote execution
Register-Mock Invoke-RemoteDeployment { return "Error occurred" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}

try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-AreEqual $true ($result.Exception.Message.Contains('Error occurred'))
Assert-WasCalled Invoke-RemoteDeployment
