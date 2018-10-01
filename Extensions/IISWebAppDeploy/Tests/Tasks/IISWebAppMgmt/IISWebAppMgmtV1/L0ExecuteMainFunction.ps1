[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV1\AppCmdOnTargetMachines.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

# Test 1: Create and update application pool should not be called, createAppPool is false
$AppPoolName = "SampleAppPool"
$CreateAppPool = "false"
$CreateWebsite = "true"
Register-Mock Create-And-Update-WebSite { return } -ParametersEvaluator { $WebsiteName -eq $WebsiteName }
Register-Mock Create-And-Update-AppPool { return } -ParametersEvaluator { $appPoolName -eq $AppPoolName }
Execute-Main -AppPoolName $AppPoolName -CreateWebsite $CreateWebsite -CreateAppPool $CreateAppPool
Assert-WasCalled Create-And-Update-WebSite
Assert-WasCalled -Command Create-And-Update-AppPool -Times 0

Unregister-Mock Create-And-Update-WebSite
Unregister-Mock Create-And-Update-AppPool

# Test 2: Create and update application pool should be called, createAppPool is true
$AppPoolName = "SampleAppPool"
$createAppPool = "true"
$CreateWebsite = "true"
Register-Mock Create-And-Update-WebSite { return } -ParametersEvaluator { $WebsiteName -eq $WebsiteName }
Register-Mock Create-And-Update-AppPool { return } -ParametersEvaluator { $appPoolName -eq $AppPoolName }
Execute-Main -AppPoolName $AppPoolName -CreateWebsite $CreateWebsite -CreateAppPool $CreateAppPool
Assert-WasCalled Create-And-Update-WebSite
Assert-WasCalled Create-And-Update-AppPool

Unregister-Mock Create-And-Update-WebSite
Unregister-Mock Create-And-Update-AppPool

# Test 3: No exception should be thrown, CreateWebSite is false
$CreateWebsite = "false"
Register-Mock Create-And-Update-WebSite { return } -ParametersEvaluator { $SiteName -eq $WebsiteName }
Execute-Main -CreateWebsite $CreateWebsite
Assert-WasCalled -Command Create-And-Update-WebSite -Times 0

Unregister-Mock Create-And-Update-WebSite

# Test 4: Create and update website should be called, CreateWebSite is true and protocol is http
$Protocol = "http"
$CreateWebsite = "true"
Register-Mock Create-And-Update-WebSite { return } -ParametersEvaluator { $SiteName -eq $WebsiteName }
Register-Mock Add-SslCert { return }
Register-Mock Enable-SNI { return }
Execute-Main -CreateWebsite $CreateWebsite -Protocol $Protocol
Assert-WasCalled Create-And-Update-WebSite
Assert-WasCalled -Command Add-SslCert -Times 0
Assert-WasCalled -Command Enable-SNI -Times 0

Unregister-Mock Create-And-Update-WebSite
Unregister-Mock Add-SslCert
Unregister-Mock Enable-SNI

# Test 5: Create and update website should be called along with setting cert and SNI, CreateWebSite is true and protocol is https
$Protocol = "https"
$SslCertThumbPrint = "SampleHash"
$CreateWebsite = "true"
$AddBinging = "true"
Register-Mock Create-And-Update-WebSite { return } -ParametersEvaluator { $SiteName -eq $WebsiteName }
Register-Mock Add-SslCert { return } -ParametersEvaluator { $Certhash -eq $SslCertThumbPrint }
Register-Mock Enable-SNI { return } -ParametersEvaluator { $SiteName -eq $WebsiteName }
Register-Mock Get-AppCmdLocation { return "appcmd.exe", 8 }
Execute-Main -CreateWebsite $CreateWebsite -Protocol $Protocol -SslCertThumbPrint $SslCertThumbPrint -AddBinding $AddBinging
Assert-WasCalled Create-And-Update-WebSite
Assert-WasCalled Add-SslCert
Assert-WasCalled Enable-SNI
Assert-WasCalled Get-AppCmdLocation
