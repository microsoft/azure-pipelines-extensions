[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\..\Src\Tasks\IISWebAppMgmt\IISWebAppMgmtV2\AppCmdOnTargetMachines.ps1
. $PSScriptRoot\MockHelpers.ps1

$sitename = "Sample Web Site"
$appPoolName = "Sample App Pool"

# Test 1 : Start Website 

$action = "start"

Register-Mock Run-Command { }

Start-Stop-Website -sitename $sitename -action $action

#Assert-WasCalled -Command Run-Command -Times 1
Assert-WasCalled -Command Run-Command -- -command "`"appcmdPath`" start site /site.name:`"Sample Web Site`""

# Test 2 : Stop Website 

$action = "stop"

Unregister-Mock Run-Command
Register-Mock Run-Command { }

Start-Stop-Website -sitename $sitename -action $action

Assert-WasCalled -Command Run-Command -Times 1
Assert-WasCalled -Command Run-Command -- -command "`"appcmdPath`" stop site /site.name:`"Sample Web Site`""

# Test 3 : Start Application Pool

$action = "start"

Unregister-Mock Run-Command
Register-Mock Run-Command { }

Start-Stop-Recycle-ApplicationPool -appPoolName $appPoolName -action $action

Assert-WasCalled -Command Run-Command -Times 2
Assert-WasCalled -Command Run-Command -- -command "`"appcmdPath`" start apppool /apppool.name:`"Sample App Pool`""

# Test 4 : Stop Application Pool

$action = "stop"

Unregister-Mock Run-Command
Register-Mock Run-Command { }

Start-Stop-Recycle-ApplicationPool -appPoolName $appPoolName -action $action

Assert-WasCalled -Command Run-Command -Times 2
Assert-WasCalled -Command Run-Command -- -command "`"appcmdPath`" stop apppool /apppool.name:`"Sample App Pool`""

# Test 5 : Recycle Application Pool

$action = "recycle"

Unregister-Mock Run-Command
Register-Mock Run-Command { }

Start-Stop-Recycle-ApplicationPool -appPoolName $appPoolName -action $action

Assert-WasCalled -Command Run-Command -Times 2
Assert-WasCalled -Command Run-Command -- -command "`"appcmdPath`" recycle apppool /apppool.name:`"Sample App Pool`""
