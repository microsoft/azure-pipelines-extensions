[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$virtualDirectoryName = "Sample Web Site/Application/VirtualDir"

# Test 1 : Virtual directory does not exist 

Register-Mock Run-Command { 
    return $null 
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" }

$result = Test-VirtualDirectoryExist -virtualDirectoryName $virtualDirectoryName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" -failOnErr $false
Assert-AreEqual $false $result

# Test 2 : Virtual directory already exist

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return "vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`" (applicationPool:Defaultvdir)"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" }

$result = Test-VirtualDirectoryExist -virtualDirectoryName $virtualDirectoryName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" -failOnErr $false
Assert-AreEqual $true $result 

# Test 3 : Return false if appcmd throws error 

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    Write-Verbose "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
    return "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" }

$result = Test-VirtualDirectoryExist -virtualDirectoryName $virtualDirectoryName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list vdir -vdir.name:`"Sample Web Site/Application/VirtualDir`"" -failOnErr $false
Assert-AreEqual $false $result 