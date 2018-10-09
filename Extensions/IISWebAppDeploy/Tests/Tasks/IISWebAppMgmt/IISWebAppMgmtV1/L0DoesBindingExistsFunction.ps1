[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

$protocal = "http"
$ipAddress = "*"
$port = "80"
$hostname = ""
$binding1 = [string]::Format("{0}/{1}:{2}:{3}", $protocal, $ipAddress, $port, $hostname)
$binding2 = [string]::Format("{0}/{1}:{2}:{3}", $protocal, $ipAddress, "8080", "localhost")

# Test 1: Does-BindingExists should throw exception, When current and another website has same bindings
Register-Mock Run-command {return @("SITE SampleWeb (id:1,bindings:$binding1,state:Started)" , 
                "SITE AnotherSite (id:1,bindings:$binding1,state:Started)")} -ParametersEvaluator { $failOnErr -eq $false }
try
{
    $result = Does-BindingExists -siteName "SampleWeb" -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname
}
catch
{
    $result = $_.Exception.Message
}

Assert-AreEqual $true ($result.Contains('Given binding already exists for a different website'))
Assert-AreEqual $true ($result.Contains('change the port and retry the operation'))

Unregister-Mock Run-command

# Test 2: Does-BindingExists should return true, When current has same binding and no other website has same bindings
Register-Mock Run-command {return @("SITE SampleWeb (id:1,bindings:$binding1,state:Started)" , 
                "SITE AnotherSite (id:1,bindings:$binding2,state:Started)")} -ParametersEvaluator { $failOnErr -eq $false }
$result = Does-BindingExists -siteName "SampleWeb" -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname
Assert-AreEqual $true $result

Unregister-Mock Run-command

# Test 3: Does-BindingExists should throw exception, When no website has same bindings
Register-Mock Run-command {return @("SITE SampleWeb (id:1,bindings:$binding2,state:Started)" , 
                "SITE AnotherSite (id:1,bindings:$binding2,state:Started)")} -ParametersEvaluator { $failOnErr -eq $false }
$result = Does-BindingExists -siteName "SampleWeb" -protocol $protocol -ipAddress $ipAddress -port $port -hostname $hostname 4>&1 | Out-String
Assert-AreEqual $true ($result.Contains("Does bindings exist for website (`"SampleWeb`") is : False"))
