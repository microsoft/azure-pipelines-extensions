[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\IISWebAppDeploy\DeployIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$machinesList = "dummyMachinesList"
$script = "dummyscript"
$deployInParallel = "true"
$adminUserName = "dummyuser"
$adminPassword = "dummypassword"
$http = "http"
$https = "https"
$filter = "dummyFilter"

# Test 1: Should be able to execute Run-RemoteDeployment function without exceptions
Register-Mock Invoke-RemoteDeployment { return "" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel }

try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-IsNullOrEmpty $result.Exception
Assert-WasCalled Invoke-RemoteDeployment -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel }

Unregister-Mock Invoke-RemoteDeployment

# Test 2: Should throw on failure of remote execution
Register-Mock Invoke-RemoteDeployment { return "Error occurred" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}

try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-AreEqual ($result.Exception.Message.Contains('Error occurred')) $true
Assert-WasCalled Invoke-RemoteDeployment -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel }

Unregister-Mock Invoke-RemoteDeployment
