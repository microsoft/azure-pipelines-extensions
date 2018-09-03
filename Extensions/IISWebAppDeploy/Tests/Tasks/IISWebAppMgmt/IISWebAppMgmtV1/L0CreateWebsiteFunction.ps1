[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Should contain appcmd add site, It should run appcmd add site command
$appCmd = "appcmd.exe"
$appCmdArgs = " add site /name:`"Sample Web`" /physicalPath:`"C:\Temp Path`""
Register-Mock Run-Command { return }
Register-Mock Get-AppCmdLocation { return $appCmd, 8 }

$output = Create-WebSite -siteName "Sample Web" -physicalPath "C:\Temp Path" 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$appCmd"))
Assert-AreEqual $true ($output.Contains("$appCmdArgs"))

Assert-WasCalled Run-Command
Assert-WasCalled Get-AppCmdLocation
