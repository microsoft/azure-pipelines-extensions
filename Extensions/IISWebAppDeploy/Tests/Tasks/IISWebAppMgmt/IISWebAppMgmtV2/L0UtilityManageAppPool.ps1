[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\ManageIISWebApp.ps1
. $PSScriptRoot\..\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1

$actionIISApplicationPool = "CreateOrUpdateAppPool"
$appPoolName = "Sample App Pool"
$startStopRecycleAppPoolName = ""
$dotNetVersion = "v4.0"
$pipeLineMode = "Classic"
$appPoolIdentity = "ApplicationPoolIdentity"
$appPoolUsername = ""
$appPoolPassword = ""
$appCmdCommands = ""

# Test 1 

$result = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISApplicationPool CreateOrUpdateAppPool -AppPoolName "Sample App Pool" -DotNetVersion "v4.0" -PipeLineMode "Classic" -AppPoolIdentity ApplicationPoolIdentity -AppPoolUsername "" -AppPoolPassword "" -AppCmdCommands ""' $result

# Test 2 

$appPoolIdentity = "SpecificUser"

$result = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISApplicationPool CreateOrUpdateAppPool -AppPoolName "Sample App Pool" -DotNetVersion "v4.0" -PipeLineMode "Classic" -AppPoolIdentity SpecificUser -AppPoolUsername "" -AppPoolPassword "" -AppCmdCommands ""' $result

# Test 3 

$actionIISApplicationPool = "StartAppPool"
$startStopRecycleAppPoolName = "Sample App Pool"

$result = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISApplicationPool StartAppPool -AppPoolName "Sample App Pool" -AppCmdCommands ""' $result

# Test 4 

$actionIISApplicationPool = "StopAppPool"
$startStopRecycleAppPoolName = "Sample App Pool"

$result = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISApplicationPool StopAppPool -AppPoolName "Sample App Pool" -AppCmdCommands ""' $result

# Test 5 

$actionIISApplicationPool = "RecycleAppPool"
$startStopRecycleAppPoolName = "Sample App Pool"

$result = Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
                -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands

Assert-AreEqual 'Invoke-Main -ActionIISApplicationPool RecycleAppPool -AppPoolName "Sample App Pool" -AppCmdCommands ""' $result

# Test 6

$actionIISApplicationPool = "InvalidOption"

Assert-Throws {
    Set-IISApplicationPool -actionIISApplicationPool $actionIISApplicationPool -appPoolName $appPoolName -startStopRecycleAppPoolName $startStopRecycleAppPoolName -dotNetVersion $dotNetVersion `
            -pipeLineMode $pipeLineMode -appPoolIdentity $appPoolIdentity -appPoolUsername $appPoolUsername -appPoolPassword $appPoolPassword -appCmdCommands $appCmdCommands
} -MessagePattern 'Invalid action "InvalidOption" selected for the IIS Application Pool.'