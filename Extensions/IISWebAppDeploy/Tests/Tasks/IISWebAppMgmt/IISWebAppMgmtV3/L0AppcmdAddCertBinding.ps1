[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV3\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

# Test 1: AddCertBinding for IP-based binding calls Run-Command with correct netsh command

Register-Mock Run-Command { }

AddCertBinding -bindingType "ipport" -bindingValue "0.0.0.0" -port "443" -certhash "abc123def456"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -ParametersEvaluator {
    $command -like "netsh http add sslcert ipport=0.0.0.0:443 certhash=abc123def456 appid={*} certstorename=MY"
}

# Test 2: AddCertBinding for hostname-based (SNI) binding

Unregister-Mock Run-Command
Register-Mock Run-Command { }

AddCertBinding -bindingType "hostnameport" -bindingValue "mysite.com" -port "443" -certhash "abc123def456"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -ParametersEvaluator {
    $command -like "netsh http add sslcert hostnameport=mysite.com:443 certhash=abc123def456 appid={*} certstorename=MY"
}

# Test 3: AddCertBinding with different port and certhash

Unregister-Mock Run-Command
Register-Mock Run-Command { }

AddCertBinding -bindingType "ipport" -bindingValue "0.0.0.0" -port "8443" -certhash "asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -ParametersEvaluator {
    $command -like "netsh http add sslcert ipport=0.0.0.0:8443 certhash=asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg appid={*} certstorename=MY"
}
