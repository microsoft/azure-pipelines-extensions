[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Extensions\Common\lib\Initialize-Test.ps1
. $PSScriptRoot\MockHelpers.ps1

. $PSScriptRoot\..\..\TaskModuleIISManageUtility\AppCmdOnTargetMachines.ps1

$siteName = "Test Web Site"
$bindings = @(
    @{
        protocol = "http";
        ipAddress = "All Unassigned";
        port = "80";
        hostname = "";
        sslThumbprint = "";
        sniFlag = $false;
        id = "id1";
        initiallyExpanded = $false
    },
    @{
        protocol = "http";
        ipAddress = "All Unassigned";
        port = "90";
        hostname = "";
        sslThumbprint = "";
        sniFlag = $false;
        id = "id2";
        initiallyExpanded = $false
    })

# Test 1 : Multiple bindings get added and both bindings do not exist

Register-Mock Invoke-VstsTool { }
Register-Mock Test-BindingExist { return $false } 

Add-WebsiteBindings -siteName $siteName -bindings $bindings

Assert-WasCalled Test-BindingExist -Times 2 
Assert-WasCalled Invoke-VstsTool -Times 2 
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Test Web Site`" /+bindings.[protocol='http',bindingInformation='*:80:']"  -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Test Web Site`" /+bindings.[protocol='http',bindingInformation='*:90:']"  -RequireExitCodeZero

# Test 2 : Both bindings already exist 

Unregister-Mock Invoke-VstsTool
Unregister-Mock Test-BindingExist

Register-Mock Add-SslCert { }
Register-Mock Enable-SNI { }
Register-Mock Invoke-VstsTool { }
Register-Mock Test-BindingExist { return $true } 

Add-WebsiteBindings -siteName $siteName -bindings $bindings

Assert-WasCalled Test-BindingExist -Times 2 
Assert-WasCalled Invoke-VstsTool -Times 0 
Assert-WasCalled Add-SslCert -Times 0
Assert-WasCalled Enable-SNI -Times 0

# Test 3 : One https binding is present 

$bindings = @(
    @{
        protocol = "http";
        ipAddress = "127.0.0.1";
        port = "80";
        hostname = "www.fakebindings.com";
        sslThumbprint = "";
        sniFlag = $false;
        id = "id1";
        initiallyExpanded = $false
    },
    @{
        protocol = "https";
        ipAddress = "All Unassigned";
        port = "90";
        hostname = "";
        sslThumbprint = "adadadadadadadadadadadadadadadadadadadad";
        sniFlag = $false;
        id = "id2";
        initiallyExpanded = $false
    })

Unregister-Mock Invoke-VstsTool
Unregister-Mock Test-BindingExist
Unregister-Mock Add-SslCert
Unregister-Mock Enable-SNI 

Register-Mock Add-SslCert { }
Register-Mock Enable-SNI { }
Register-Mock Invoke-VstsTool { }
Register-Mock Test-BindingExist { return $false } 

Add-WebsiteBindings -siteName $siteName -bindings $bindings

Assert-WasCalled Test-BindingExist -Times 2 
Assert-WasCalled Invoke-VstsTool -Times 2 
Assert-WasCalled Add-SslCert -Times 1
Assert-WasCalled Enable-SNI -Times 1
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Test Web Site`" /+bindings.[protocol='http',bindingInformation='127.0.0.1:80:www.fakebindings.com']"  -RequireExitCodeZero
Assert-WasCalled Invoke-VstsTool -- -FileName "appcmdPath" -Arguments " set site /site.name:`"Test Web Site`" /+bindings.[protocol='https',bindingInformation='*:90:']"  -RequireExitCodeZero
Assert-WasCalled Add-SslCert -- -ipAddress "*" -port "90" -certhash "adadadadadadadadadadadadadadadadadadadad" -hostname "" -sni $false -iisVersion 8
Assert-WasCalled Enable-SNI -- -siteName "Test Web Site" -sni $false -ipAddress "*" -port "90" -hostname ""

# Test 4 : Bindings already exists but the ssl certificate is added for https

$bindings[1].sniFlag = $true 
$bindings[1].ipAddress = "127.0.0.1"
$bindings[1].hostname = "somehost.com"

Unregister-Mock Invoke-VstsTool
Unregister-Mock Test-BindingExist
Unregister-Mock Add-SslCert
Unregister-Mock Enable-SNI 

Register-Mock Add-SslCert { }
Register-Mock Enable-SNI { }
Register-Mock Invoke-VstsTool { }
Register-Mock Test-BindingExist { return $true } 

Add-WebsiteBindings -siteName $siteName -bindings $bindings

Assert-WasCalled Test-BindingExist -Times 2 
Assert-WasCalled Add-SslCert -Times 1
Assert-WasCalled Enable-SNI -Times 1

Assert-WasCalled Add-SslCert -- -ipAddress "127.0.0.1" -port "90" -certhash "adadadadadadadadadadadadadadadadadadadad" -hostname "somehost.com" -sni $true -iisVersion 8
Assert-WasCalled Enable-SNI -- -siteName "Test Web Site" -sni $true -ipAddress "127.0.0.1" -port "90" -hostname "somehost.com"