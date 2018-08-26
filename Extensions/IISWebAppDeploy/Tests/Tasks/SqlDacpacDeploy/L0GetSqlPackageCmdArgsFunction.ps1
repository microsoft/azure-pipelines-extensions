[CmdletBinding()]
param()

. $PSScriptRoot\SqlDacpacDeployTestL0Initialize.ps1

Import-Module Microsoft.PowerShell.Security

# Test 1: Should contain targetmethod as server and no sqluser argument should be present, When target method is server and with windows authentication
$cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "windowsAuthentication"
Assert-AreEqual ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetServerName:"localhost" /TargetDatabaseName:"SampleDB"')) $true
Assert-AreEqual ($cmdArgs.Contains('/TargetUser:"dummyuser" /TargetPassword:"dummypassword"')) $false

## TODO: raagra: Fix this test
# Test 2: Should contain targetmethod as server and sqluser argument should be present, When target method is server and with mixed mode authentication
# $secureAdminPassword = ConvertTo-SecureString "dummypassword" -AsPlainText -Force
# $psCredential = New-Object System.Management.Automation.PSCredential ("dummyuser", $secureAdminPassword)
# $cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlServerCredentials $psCredential
# Assert-AreEqual ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetServerName:"localhost" /TargetDatabaseName:"SampleDB"')) $true
# Assert-AreEqual ($cmdArgs.Contains('/TargetUser:"dummyuser" /TargetPassword:"dummypassword"')) $true

# Test 3: Should contain targetmethod as server and sqluser argument should be present, When target method is connectionString
$cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -targetMethod "connectionString" -connectionString "dummyconnectionString"
Assert-AreEqual ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish /TargetConnectionString:"dummyconnectionString"')) $true

# Test 4: Should contain targetmethod as server and sqluser argument should be present, When publish profile setting is provided
$cmdArgs = Get-SqlPackageCmdArgs -dacpacFile "sample.dacpac" -publishProfile "dummypublish.xml"
Assert-AreEqual ($cmdArgs.Contains('/SourceFile:"sample.dacpac" /Action:Publish')) $true
Assert-AreEqual ($cmdArgs.Contains('/Profile:"dummypublish.xml"')) $true
