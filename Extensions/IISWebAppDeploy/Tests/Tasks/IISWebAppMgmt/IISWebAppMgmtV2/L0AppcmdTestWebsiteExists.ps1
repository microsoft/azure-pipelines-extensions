[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$siteName = "Sample Web Site"

# Test 1 : Returns false if website does not exist 
Register-Mock Run-Command { 
    return $null 
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list site /name:`"Sample Web Site`"" }

$result = Test-WebsiteExist -siteName $siteName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list site /name:`"Sample Web Site`"" -failOnErr $false
Assert-AreEqual $false $result 

# Test 2 : Returns true if website already exists 

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return "SITE `"Sample Web Site`" (id:1,bindings:http/*:80:,state:Started)"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list site /name:`"Sample Web Site`"" }

$result = Test-WebsiteExist -siteName $siteName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list site /name:`"Sample Web Site`"" -failOnErr $false
Assert-AreEqual $true $result 

# Test 3 : Returns false if appcmd.exe throws error 

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    Write-Verbose "Invoking stubbed tool"
    Write-Verbose "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
    return "ERROR ( message:Configuration error`ncommand: redirection.config`nLine Number: 0`nDescription: Cannot read configuration file due to insufficient permissions. )"
} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list site /name:`"Sample Web Site`"" }

$result = Test-WebsiteExist -siteName $siteName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  list site /name:`"Sample Web Site`"" -failOnErr $false
Assert-AreEqual $false $result 