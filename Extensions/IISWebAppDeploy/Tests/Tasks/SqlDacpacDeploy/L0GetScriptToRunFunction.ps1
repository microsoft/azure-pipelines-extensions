[CmdletBinding()]
param()

. $PSScriptRoot\..\..\..\..\Common\lib\Initialize-Test.ps1

. $PSScriptRoot\..\..\..\Src\Tasks\SqlDacpacDeploy\DeployToSqlServer.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\InvokeRemoteDeployment.ps1
. $PSScriptRoot\..\..\..\..\Common\DeploymentSDK\Src\Utility.ps1

Register-Mock Import-Module { Write-Verbose "Dummy Import-Module" -Verbose }

Register-Mock Get-Content {return "Dummy Script"}

# Test 1: should contain script content and invoke expression when task type is dacpac
$script = GetScriptToRun -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "dacpac" -inlineSql "" -sqlFile ""

Assert-AreEqual ($script.Contains('Dummy Script')) $true
Assert-AreEqual ($script.Contains('"authscheme":  "sqlServerAuthentication"')) $true
Assert-AreEqual ($script.Contains('"dacpacFile":  "sample.dacpac"')) $true
Assert-AreEqual ($script.Contains('"serverName":  "localhost"')) $true
Assert-AreEqual ($script.Contains('"additionalArguments":  ""')) $true
Assert-AreEqual ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) $true
Assert-AreEqual ($script.Contains('"databaseName":  "SampleDB"')) $true
Assert-AreEqual ($script.Contains('Invoke-DacpacDeployment @remoteSqlDacpacArgs')) $true

# Test 2: should contain script content and invoke expression when task type is sqlQuery
$script = GetScriptToRun -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlQuery" -inlineSql "" -sqlFile "sample.sql"

Assert-AreEqual ($script.Contains('Dummy Script')) $true
Assert-AreEqual ($script.Contains('"authscheme":  "sqlServerAuthentication"')) $true
Assert-AreEqual ($script.Contains('"inlineSql":  ""')) $true
Assert-AreEqual ($script.Contains('"databaseName":  "SampleDB"')) $true
Assert-AreEqual ($script.Contains('"serverName":  "localhost"')) $true
Assert-AreEqual ($script.Contains('"taskType":  "sqlQuery"')) $true
Assert-AreEqual ($script.Contains('"additionalArguments":  ""')) $true
Assert-AreEqual ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) $true
Assert-AreEqual ($script.Contains('"sqlFile":  "sample.sql"')) $true
Assert-AreEqual ($script.Contains('Invoke-SqlQueryDeployment @remoteSplattedSql')) $true

# Test 3: should contain script content and invoke expression when task type is sqlInline
$script = GetScriptToRun -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlInline" -inlineSql "Testing Inline SQL" -sqlFile ""

Assert-AreEqual ($script.Contains('Dummy Script')) $true
Assert-AreEqual ($script.Contains('"authscheme":  "sqlServerAuthentication"')) $true
Assert-AreEqual ($script.Contains('"databaseName":  "SampleDB"')) $true
Assert-AreEqual ($script.Contains('"serverName":  "localhost"')) $true
Assert-AreEqual ($script.Contains('"additionalArguments":  ""')) $true
Assert-AreEqual ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) $true
Assert-AreEqual ($script.Contains('"sqlFile":  ""')) $true
Assert-AreEqual ($script.Contains('Invoke-SqlQueryDeployment @remoteSplattedSql')) $true
