[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$appPoolName = "Sample App Pool"
$dotNetVersion = "v4.0"
$pipeLineMode = "Integrated"
$appPoolIdentity = "ApplicationPoolIdentity"
$appPoolCredentials = $null

#Test 1 : App pool doesn't exist. Create and update the app pool

Register-Mock Test-AppPoolExist { return $false }
Register-Mock Run-Command { }

Add-And-Update-AppPool -appPoolName $appPoolName -clrVersion $dotNetVersion -pipeLineMode $pipeLineMode -identity $appPoolIdentity -appPoolCredentials $appPoolCredentials 

Assert-WasCalled Test-AppPoolExist -Times 1
Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  add apppool /name:`"Sample App Pool`""
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set apppool /apppool.name:`"Sample App Pool`" -managedRuntimeVersion:v4.0 -managedPipelineMode:Integrated -processModel.identityType:ApplicationPoolIdentity"

#Test 2 : App pool exists. Update the app pool

$pipeLineMode = "Classic"
$dotNetVersion = "No Managed Code"
$appPoolIdentity = "NetworkService"

Unregister-Mock Test-AppPoolExist
Unregister-Mock Run-Command

Register-Mock Test-AppPoolExist { return $true }
Register-Mock Run-Command { }

Add-And-Update-AppPool -appPoolName $appPoolName -clrVersion $dotNetVersion -pipeLineMode $pipeLineMode -identity $appPoolIdentity -appPoolCredentials $appPoolCredentials 

Assert-WasCalled Test-AppPoolExist -Times 1
Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set apppool /apppool.name:`"Sample App Pool`" -managedRuntimeVersion: -managedPipelineMode:Classic -processModel.identityType:NetworkService"

#Test 3: Applicatin pool exists and updating the app pool identity for specific user 

$pipeLineMode = "Classic"
$dotNetVersion = "v2.0"
$appPoolIdentity = "SpecificUser"
$appPoolCredentials = Get-MockCredentials

Unregister-Mock Test-AppPoolExist
Unregister-Mock Run-Command

Register-Mock Test-AppPoolExist { return $true }
Register-Mock Run-Command { }

Add-And-Update-AppPool -appPoolName $appPoolName -clrVersion $dotNetVersion -pipeLineMode $pipeLineMode -identity $appPoolIdentity -appPoolCredentials $appPoolCredentials 

Assert-WasCalled Test-AppPoolExist -Times 1
Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set apppool /apppool.name:`"Sample App Pool`" -managedRuntimeVersion:v2.0 -managedPipelineMode:Classic -processModel.identityType:SpecificUser -processModel.userName:`"domain\name`" -processModel.password:`"random!123```"`$password`""