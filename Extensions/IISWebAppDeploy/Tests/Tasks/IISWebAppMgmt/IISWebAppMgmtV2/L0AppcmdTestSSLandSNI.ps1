[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

# Test 1 : SNI is not enabled if SNI input is not set 

$WebsiteName = "Sample Web Site"
$ServerNameIndication = "false"
$IpAddress = "All Unassigned"
$Port = "8080"
$HostName = "somehost"

Register-Mock Run-Command { }

Enable-SNI -siteName $WebsiteName -sni $ServerNameIndication -ipAddress $IpAddress -port $Port -hostname $HostName

Assert-WasCalled Run-Command -Times 0

# Test 2 : SNI input is set 

$ServerNameIndication = "true"

Unregister-Mock Run-Command 
Register-Mock Run-Command { }

Enable-SNI -siteName $WebsiteName -sni $ServerNameIndication -ipAddress $IpAddress -port $Port -hostname $HostName

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "`"appcmdPath`"  set site /site.name:`"Sample Web Site`" /bindings.[protocol='https',bindingInformation='*:8080:somehost'].sslFlags:`"1`""

# Test 3 : Add-SslCert with certifcate not already present 

$Port = "8080"
$IpAddress = "All Unassigned"
$SslCertThumbPrint = "asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg"
$HostName = "somehost"
$ServerNameIndication = "false"
$iisVersion = 8

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
} -ParametersEvaluator { $command -eq "netsh http show sslcert ipport=0.0.0.0:8080"}

Add-SslCert -ipAddress $IpAddress -port $Port -certhash $SslCertThumbPrint -hostname $HostName -sni $ServerNameIndication -iisVersion $iisVersion

Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "netsh http show sslcert ipport=0.0.0.0:8080" -failOnErr $false
Assert-WasCalled Run-Command -ParametersEvaluator {
    $command -like "netsh http add sslcert ipport=0.0.0.0:8080 certhash=asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg appid={*} certstorename=MY"
}

# Test 4 : Add-SslCert with certifcate already present 

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
        "    Certificate Store Name       : My",
        "    Verify Client Certificate Revocation : Enabled",
        "    Verify Revocation Using Cached Client Certificate Only : Disabled"
        "    Usage Check                  : Enabled",
        "    Revocation Freshness Time    : 0",
        "    URL Retrieval Timeout        : 0",
        "    Ctl Identifier               : (null)",
        "    Ctl Store Name               : (null)",
        "    DS Mapper Usage              : Disabled",
        "    Negotiate Client Certificate : Disabled",
        "    Reject Connections           : Disabled"
        )
} -ParametersEvaluator { $command -eq "netsh http show sslcert ipport=0.0.0.0:8080"}

Add-SslCert -ipAddress $IpAddress -port $Port -certhash $SslCertThumbPrint -hostname $HostName -sni $ServerNameIndication -iisVersion $iisVersion

Assert-WasCalled Run-Command -Times 1
Assert-WasCalled Run-Command -- -command "netsh http show sslcert ipport=0.0.0.0:8080" -failOnErr $false

# Test 5 : Add-SslCert with SNI enabled and certificate not present 

$ServerNameIndication = "true"

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
} -ParametersEvaluator { $command -eq "netsh http show sslcert hostnameport=somehost:8080"}

Add-SslCert -ipAddress $IpAddress -port $Port -certhash $SslCertThumbPrint -hostname $HostName -sni $ServerNameIndication -iisVersion $iisVersion

Assert-WasCalled Run-Command -Times 2
Assert-WasCalled Run-Command -- -command "netsh http show sslcert hostnameport=somehost:8080" -failOnErr $false
Assert-WasCalled Run-Command -ParametersEvaluator {
    $command -like "netsh http add sslcert hostnameport=somehost:8080 certhash=asdfghjklqwertyuiopzxcvbnmqazwsxedcrfvtg appid={*} certstorename=MY"
}
