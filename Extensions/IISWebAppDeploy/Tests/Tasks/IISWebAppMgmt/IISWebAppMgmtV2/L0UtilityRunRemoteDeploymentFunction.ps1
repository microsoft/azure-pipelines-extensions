[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\Utility.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

$machinesList = "dummyMachinesList"
$script = "dummyscript"
$deployInParallel = "true"
$adminUserName = "dummyuser"
$adminPassword = "dummypassword"
$http = "http"
$https = "https"
$filter = "dummyFilter"

# Test: 1
Register-Mock Invoke-RemoteScript { return "" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}
        
try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-WasCalled Invoke-RemoteScript
Assert-IsNullOrEmpty $result.Exception

Unregister-Mock Invoke-RemoteScript

# Test: 2
Register-Mock Invoke-RemoteScript { return "Error occurred" } -ParametersEvaluator { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}

try
{
    $result = Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
}
catch
{
    $result = $_
}

Assert-AreEqual $true ($result.Exception.Message.Contains('Error occurred'))