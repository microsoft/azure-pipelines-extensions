[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV3\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

# Test 1: ShowCertBinding for IP-based binding calls Run-Command with correct netsh command

Register-Mock Run-Command {
    return @(
        "`n",
        "SSL Certificate bindings:",
        "-------------------------",
        "`n",
        "The system cannot find the file specified.",
        "`n"
    )
}

$result = ShowCertBinding -bindingType "ipport" -bindingValue "0.0.0.0" -port "443"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "netsh http show sslcert ipport=0.0.0.0:443" -failOnErr $false

# Test 2: ShowCertBinding for hostname-based (SNI) binding

Unregister-Mock Run-Command
Register-Mock Run-Command {
    return @(
        "`n",
        "SSL Certificate bindings:",
        "-------------------------",
        "`n",
        "The system cannot find the file specified.",
        "`n"
    )
}

$result = ShowCertBinding -bindingType "hostnameport" -bindingValue "mysite.com" -port "443"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "netsh http show sslcert hostnameport=mysite.com:443" -failOnErr $false

# Test 3: ShowCertBinding returns netsh output when cert is found

Unregister-Mock Run-Command
Register-Mock Run-Command {
    return @(
        "`n",
        "SSL Certificate bindings:",
        "-------------------------",
        "`n",
        "    IP:port                      : 0.0.0.0:8080",
        "    Certificate Hash             : asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg",
        "    Application ID               : {randomClientGuid}",
        "    Certificate Store Name       : My"
    )
}

$result = ShowCertBinding -bindingType "ipport" -bindingValue "0.0.0.0" -port "8080"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "netsh http show sslcert ipport=0.0.0.0:8080" -failOnErr $false
Assert-AreNotEqual $null $result

# Test 4: ShowCertBinding with different port

Unregister-Mock Run-Command
Register-Mock Run-Command {
    return @(
        "`n",
        "SSL Certificate bindings:",
        "-------------------------",
        "`n",
        "The system cannot find the file specified.",
        "`n"
    )
}

$result = ShowCertBinding -bindingType "ipport" -bindingValue "0.0.0.0" -port "8443"

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "netsh http show sslcert ipport=0.0.0.0:8443" -failOnErr $false
