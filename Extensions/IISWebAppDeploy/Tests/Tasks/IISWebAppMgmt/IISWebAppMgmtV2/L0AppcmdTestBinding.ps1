[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$siteName = "Sample Web Site"
$protocol = "http"
$ipAddress = "*"
$port = "8080"
$hostname = ""

$binding1 = [string]::Format("{0}/{1}:{2}:{3}", "http", $ipAddress, "80", "")
$binding2 = [string]::Format("{0}/{1}:{2}:{3}", "http", $ipAddress, "90", "localhost")
$binding3 = [string]::Format("{0}/{1}:{2}:{3}", "https", "$ipAddress", "100", "")

# Test 1 : Binding doesn't exist for any site 

Register-Mock Run-Command { 
    return @("SITE `"Sample Site1`" (id:1,bindings:$binding1,state:Started)",
             "SITE `"Sample Site2`" (id:2,bindings:$binding2,state:Started))",
             "SITE `"Test Web Site`" (id:3,bindings:$binding3,state:Unknown))"
             )

} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list sites" }

$result = Test-BindingExist -siteName $siteName -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname

Assert-WasCalled Run-Command -Times 1
Assert-AreEqual $false $result

# Test 2 : Binding already exists for the current site 

$protocol = "https"
$port = "100"

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return @("SITE `"Sample Site1`" (id:1,bindings:$binding1,state:Started)",
             "SITE `"Sample Site2`" (id:2,bindings:$binding2,state:Started))",
             "SITE `"Sample Web Site`" (id:3,bindings:$binding3,state:Started))"
             )

} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list sites" }

$result = Test-BindingExist -siteName $siteName -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname

Assert-WasCalled Run-Command -Times 1
Assert-AreEqual $true $result

# Test 3 : Binding exists for a different website 

$protocol = "http"
$port = "90"
$hostname = "localhost"

Unregister-Mock Run-Command
Register-Mock Run-Command { 
    return @("SITE `"Sample Site1`" (id:1,bindings:$binding1,state:Started)",
             "SITE `"Sample Site2`" (id:2,bindings:$binding2,state:Started))",
             "SITE `"Sample Web Site`" (id:3,bindings:$binding3,state:Started))"
             )

} -ParametersEvaluator { $command -eq "`"appcmdPath`"  list sites" }

Assert-Throws {
    Test-BindingExist -siteName $siteName -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname
} -MessagePattern "Binding (http / * : 90 : localhost) already exists for a different website*"

Assert-WasCalled Run-Command -Times 1

