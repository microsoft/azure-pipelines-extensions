[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$createVirtualDirectory = ""
$createApplication = "false"

$actionIISWebsite = "CreateOrUpdateWebsite"
$actionIISApplicationPool = ""

$virtualPath = ""        

$websiteName = "Sample Web Site"
$physicalPath = "Drive:/Physical path"
$physicalPathAuth = "WebsiteUserPassThrough"        
$physicalPathAuthUserName = ""
$physicalPathAuthPassword = ""
       
$addBinding = "false"
$bindingsArray = @(
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

$bindings = $bindingsArray | ConvertTo-Json

$appPoolName = ""
$dotNetVersion = ""
$pipeLineMode = ""
$appPoolIdentity = ""        
$appPoolUsername = ""
$appPoolPassword = ""
       
$appCmdCommands = ""

# Test 1 

Register-Mock Test-Path { return $true } 

Register-Mock Add-WebsiteBindings { }
Register-Mock Add-And-Update-Website { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Add-WebsiteBindings -Times 0
Assert-WasCalled Add-And-Update-Website -Times 1
Assert-WasCalled Add-And-Update-Website -- -siteName "Sample Web Site" -appPoolName "" -physicalPath "Drive:/Physical path" -authType "WebsiteUserPassThrough" -websitePhysicalPathAuthCredentials $null

# Test 2 

$actionIISApplicationPool = "CreateOrUpdateAppPool"
$addBinding = "true"

Unregister-Mock Add-WebsiteBindings
Unregister-Mock Add-And-Update-Website 

Register-Mock Add-WebsiteBindings { }
Register-Mock Add-And-Update-Website { }
Register-Mock Add-And-Update-AppPool { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Add-WebsiteBindings -Times 1
Assert-WasCalled Add-WebsiteBindings -ParametersEvaluator {$siteName -eq "Sample Web Site"}
Assert-WasCalled Add-And-Update-AppPool -Times 1
Assert-WasCalled Add-And-Update-Website -Times 1

# Test 3

# Add aunthentication test here 

# Test 4 

$actionIISWebsite = "StartWebsite"
Register-Mock Start-Stop-Website { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Start-Stop-Website -- -siteName "Sample Web Site" -action "Start"

# Test 5 

$actionIISWebsite = "StopWebsite"
Unregister-Mock Start-Stop-Website
Register-Mock Start-Stop-Website { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Start-Stop-Website -- -siteName "Sample Web Site" -action "Stop"

# Test 6 

$appPoolName = "Sample App Pool"
$actionIISApplicationPool = "StartAppPool"

Register-Mock Start-Stop-Recycle-ApplicationPool { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Start-Stop-Recycle-ApplicationPool -- -appPoolName "Sample App Pool" -action "Start"

# Test 7

$appPoolName = "Sample App Pool"
$actionIISApplicationPool = "StopAppPool"

Unregister-Mock Start-Stop-Recycle-ApplicationPool
Register-Mock Start-Stop-Recycle-ApplicationPool { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Start-Stop-Recycle-ApplicationPool -- -appPoolName "Sample App Pool" -action "Stop"

# Test 8

$appPoolName = "Sample App Pool"
$actionIISApplicationPool = "RecycleAppPool"

Unregister-Mock Start-Stop-Recycle-ApplicationPool
Register-Mock Start-Stop-Recycle-ApplicationPool { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Start-Stop-Recycle-ApplicationPool -- -appPoolName "Sample App Pool" -action "Recycle"

# Test 9 

$CreateApplication = "true"

Register-Mock Add-And-Update-Application { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Add-And-Update-Application -Times 1 

# Test 10

$CreateVirtualDirectory = "true"

Register-Mock Add-And-Update-VirtualDirectory { }

Invoke-Main -ActionIISWebsite $actionIISWebsite -WebsiteName $websiteName -virtualPath $virtualPath -actionIISApplicationPool $actionIISApplicationPool -createVirtualDirectory $createVirtualDirectory -createApplication $createApplication -PhysicalPath $physicalPath -PhysicalPathAuth $physicalPathAuth `
    -PhysicalPathAuthUserName $physicalPathAuthUserName -PhysicalPathAuthPassword $physicalPathAuthPassword -AddBinding $addBinding -Bindings $bindings `
    -AppPoolName $appPoolName -DotNetVersion $dotNetVersion -PipeLineMode $pipeLineMode `
    -AppPoolIdentity $appPoolIdentity -AppPoolUsername $appPoolUsername -AppPoolPassword $appPoolPassword -AppCmdCommands $appCmdCommands

Assert-WasCalled Add-And-Update-VirtualDirectory -Times 1 
