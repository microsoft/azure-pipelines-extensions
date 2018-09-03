[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should contain appropriate options in command line, when all the inputs are given non default values
$appCmd = "appcmd.exe"
$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
$output = Update-AppPool -appPoolName "SampleAppPool" -clrVersion "v2.0" -pipeLineMode "Classic" -identity "SpecificUser" -userName "TestUser" -password "SamplePassword" 4>&1 | Out-String

Assert-AreEqual $true ($output.Contains(" set config"))
Assert-AreEqual $true ($output.Contains("-section:system.applicationHost/applicationPools"))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedRuntimeVersion:v2.0'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedPipelineMode:Classic'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.identityType:SpecificUser'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.userName:"TestUser"'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.password:"SamplePassword"'))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 2: Should contain appropriate options in command line, when all the inputs are given non default values, but no password for custom user
$appCmd = "appcmd.exe"
$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
$output = Update-AppPool -appPoolName "SampleAppPool" -clrVersion "v2.0" -pipeLineMode "Classic" -identity "SpecificUser" -userName "TestUser" 4>&1 | Out-String

Assert-AreEqual $true ($output.Contains(" set config"))
Assert-AreEqual $true ($output.Contains("-section:system.applicationHost/applicationPools"))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedRuntimeVersion:v2.0'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedPipelineMode:Classic'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.identityType:SpecificUser'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.userName:"TestUser"'))
Assert-AreEqual $false ($output.Contains('/[name=''"SampleAppPool"''].processModel.password:'))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 3: Should contain appropriate options in command line, when all the inputs are given default values exception identity
$appCmd = "appcmd.exe"
$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
$output = Update-AppPool -appPoolName "SampleAppPool" -clrVersion "v4.0" -pipeLineMode "Integrated" -identity "LocalService" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains(" set config"))
Assert-AreEqual $true ($output.Contains("-section:system.applicationHost/applicationPools"))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedRuntimeVersion:v4.0'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedPipelineMode:Integrated'))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].processModel.identityType:LocalService'))
Assert-AreEqual $false ($output.Contains('/[name=''"SampleAppPool"''].processModel.userName:'))
Assert-AreEqual $false ($output.Contains('/[name=''"SampleAppPool"''].processModel.password:'))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation

Unregister-Mock Run-Command
Unregister-Mock Get-AppCmdLocation

# Test 4: Should contain appropriate options in command line, when .net clr version is no managed code
$appCmd = "appcmd.exe"
$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
$output = Update-AppPool -appPoolName "SampleAppPool" -clrVersion "No Managed Code" -pipeLineMode "Integrated" -identity "LocalService" 4>&1 | Out-String

Assert-AreEqual $true ($output.Contains(" set config"))
Assert-AreEqual $true ($output.Contains("-section:system.applicationHost/applicationPools"))
Assert-AreEqual $true ($output.Contains('/[name=''"SampleAppPool"''].managedRuntimeVersion:'))
Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
