[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$appPoolName = "Sample App Pool"

# Test 1 : Application pool does not exist 

Register-Mock Run-Command { return $null } 

$result = Test-AppPoolExist -appPoolName $appPoolName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list apppool /name:`"Sample App Pool`"" -failOnErr $false
Assert-AreEqual $false $result

# Test 2 : Application pool already exists

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return "apppool /name:`"Sample App Pool`" (applicationPool:DefaultAppPool)"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list apppool /name:`"Sample App Pool`"" }

$result = Test-AppPoolExist -appPoolName $appPoolName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list apppool /name:`"Sample App Pool`"" -failOnErr $false
Assert-AreEqual $true $result 

# Test 3 : Return false if appcmd throws error 

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    Write-Verbose "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
    return "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list apppool /name:`"Sample App Pool`"" }

$result = Test-AppPoolExist -appPoolName $appPoolName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list apppool /name:`"Sample App Pool`"" -failOnErr $false
Assert-AreEqual $false $result 