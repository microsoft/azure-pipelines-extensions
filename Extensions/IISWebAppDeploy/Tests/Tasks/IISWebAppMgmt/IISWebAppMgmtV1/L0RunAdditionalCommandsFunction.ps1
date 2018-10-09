[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$AppCmdRegKey = "HKLM:\SOFTWARE\Microsoft\InetStp"

# Test 1: Should return, When additional commands is empty
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command  { return }
$output = Run-AdditionalCommands -additionalCommands "" 4>&1 | Out-String

Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 0

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 2: Should return, When one additional command is given
$command1 = "set apppool"
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command  { return }
$output = Run-AdditionalCommands -additionalCommands $command1 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$command1"))
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 1

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 3: Should return, When two additional commands is given
$command1 = "set apppool"
$command2 = "set website"
$commands = $command1 + [System.Environment]::NewLine + $command2
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command  { return }
$output = Run-AdditionalCommands -additionalCommands $commands 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$command1"))
Assert-AreEqual $true ($output.Contains("$command2"))
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 2

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 4: Should return, When two additional commands with an empty line in between is given
$command1 = "set apppool"
$command2 = " "
$command3 = "set website"
$commands = $command1 + [System.Environment]::NewLine + $command2 + [System.Environment]::NewLine + $command3
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command  { return }
$output = Run-AdditionalCommands -additionalCommands $commands 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$command1"))
Assert-AreEqual $true ($output.Contains("$command2"))
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 2

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 5: Should return, When two additional commands with an new line in between is given
$command1 = "set apppool"        
$command2 = "set website"
$commands = $command1 + [System.Environment]::NewLine + [System.Environment]::NewLine + [System.Environment]::NewLine + $command2
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command  { return }
$output = Run-AdditionalCommands -additionalCommands $commands 4>&1 | Out-String
Assert-AreEqual $true ($output.Contains("$command1"))
Assert-AreEqual $true ($output.Contains("$command2"))
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 2

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 6: Should return, When multiple commands are given and second command fails and hence Run-Command throws exception
$command1 = "set apppool"        
$command2 = "set website"
$command3 = "list sites"
$command4 = "list apppools"
$errorMsg = "Failed to run command"
$commands = $command1 + [System.Environment]::NewLine + $command2 + [System.Environment]::NewLine + $command3 + [System.Environment]::NewLine + $command4
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command { return } -ParametersEvaluator { $command -ne "`"appcmd.exe`" $command2" }
Register-Mock Run-Command  { throw $errorMsg } -ParametersEvaluator { $command -eq "`"appcmd.exe`" $command2"}

Assert-Throws { Run-AdditionalCommands -additionalCommands $commands } $errorMsg 
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 1 -ParametersEvaluator { $command -eq "`"appcmd.exe`" $command2" }
Assert-WasCalled -Command Run-Command -Times 1 -ParametersEvaluator { $command -ne "`"appcmd.exe`" $command2" }

Unregister-Mock Get-AppCmdLocation
Unregister-Mock Run-Command

# Test 7: Should return, When multiple commands are given and last command fails and hence Run-Command throws exception
$command1 = "set apppool"        
$command2 = "set website"
$command3 = "list sites"
$command4 = "list apppools"
$errorMsg = "Failed to run command"
$commands = $command1 + [System.Environment]::NewLine + $command2 + [System.Environment]::NewLine + $command3 + [System.Environment]::NewLine + $command4
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 } -ParametersEvaluator { $RegKeyPath -eq $AppCmdRegKey }
Register-Mock Run-Command { return } -ParametersEvaluator { $command -ne "`"appcmd.exe`" $command4" }
Register-Mock Run-Command  { throw $errorMsg } -ParametersEvaluator { $command -eq "`"appcmd.exe`" $command4"}

Assert-Throws { Run-AdditionalCommands -additionalCommands $commands } $errorMsg
Assert-WasCalled -Command Get-AppCmdLocation -Times 1
Assert-WasCalled -Command Run-Command -Times 1 -ParametersEvaluator { $command -eq "`"appcmd.exe`" $command4" }
Assert-WasCalled -Command Run-Command -Times 3 -ParametersEvaluator { $command -ne "`"appcmd.exe`" $command4" }
