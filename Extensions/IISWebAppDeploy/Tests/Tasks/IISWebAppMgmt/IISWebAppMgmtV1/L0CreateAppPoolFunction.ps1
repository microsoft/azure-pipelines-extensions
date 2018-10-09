[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should contain appcmd add site, It should run appcmd add apppool command
$appCmd = "appcmd.exe"
$appCmdArgs = " add apppool /name:`"Sample App Pool`""

Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }

$output = Create-AppPool -appPoolName "Sample App Pool" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$appCmd"))
Assert-AreEqual $true ($output.Contains("$appCmdArgs"))

Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
