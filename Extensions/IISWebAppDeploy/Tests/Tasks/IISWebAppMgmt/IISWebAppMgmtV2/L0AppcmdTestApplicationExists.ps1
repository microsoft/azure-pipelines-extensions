[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$applicationName = "Sample Web Site/Application"

# Test 1 : Application does not exist 
Register-Mock Run-Command { 
    return $null 
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list app `"Sample Web Site/Application`"" }

$result = Test-ApplicationExist -applicationName $applicationName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list app `"Sample Web Site/Application`"" -failOnErr $false
Assert-AreEqual $false $result

# Test 2 : Application already exists

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return "APP `"Sample Web Site/Application`" (applicationPool:DefaultAppPool)"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list app `"Sample Web Site/Application`"" }

$result = Test-ApplicationExist -applicationName $applicationName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list app `"Sample Web Site/Application`"" -failOnErr $false
Assert-AreEqual $true $result 

# Test 3 : Return false if appcmd throws error 

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    Write-Verbose "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
    return "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list app `"Sample Web Site/Application`"" }

$result = Test-ApplicationExist -applicationName $applicationName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list app `"Sample Web Site/Application`"" -failOnErr $false
Assert-AreEqual $false $result 