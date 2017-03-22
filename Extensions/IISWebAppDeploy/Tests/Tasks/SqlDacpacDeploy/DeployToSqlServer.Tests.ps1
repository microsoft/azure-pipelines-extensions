$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$deploySqlDacpacPath = "$currentScriptPath\..\..\..\Src\Tasks\$scriptDirName\$sut"

if(-not (Test-Path -Path $deploySqlDacpacPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find DeployToSqlServer.ps1 at $deploySqlDacpacPath"
}

$invokeRemoteDeploymentPath = "$currentScriptPath\..\..\..\Src\Tasks\$scriptDirName\DeploymentSDK\InvokeRemoteDeployment.ps1"
$utilityScriptPath = "$currentScriptPath\..\..\..\Src\Tasks\$scriptDirName\DeploymentSDK\Utility.ps1"

if(-not (Test-Path -Path $invokeRemoteDeploymentPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find InvokeRemoteDeployment.ps1 at $invokeRemoteDeploymentPath"
}



#Adding Import-Module dummy implementation for testability purpose
function Import-Module
{
    Write-Verbose "Dummy Import-Module" -Verbose
}

. "$deploySqlDacpacPath"
. "$invokeRemoteDeploymentPath"
. "$utilityScriptPath"

Describe "Tests for testing EscapeSpecialChars functionality" {

    Context "When input string contains double quote character" {

        It "Should add powershell escape character for double quotes" {
            (EscapeSpecialChars -str 'StringWithDouble"Quotes') | Should Be 'StringWithDouble`"Quotes'
        }
    }

    Context "When input string contains dollar symbol character" {

        It "Should add powershell escape character for dollar symbol" {
            (EscapeSpecialChars -str 'StringWith$dollar') | Should Be 'StringWith`$dollar'
        }
    }

    Context "When input string contains ` and $ symbol character" {

        It "Should add powershell escape ` and $ symbol character" {
            (EscapeSpecialChars -str 'StringWith`$dollar') | Should Be 'StringWith```$dollar'
        }
    }
}

Describe "Tests for testing TrimInputs functionality" {

    $dacpacFileNoExtraQuotes = "sample.dacpac"
    $pubProfileNoExtraQuotes = "c:\pub.xml"
    $sqlFileNoExtraQuotes = ""

    $adminUserNoSpaces = "adminuser"
    $sqlUserNoSpaces = "sqluser"
    
    Context "Should remove extra quotes for all inputs except usernames " {

        $dacpacFile = "`"sample.dacpac`""
        $pubProfile = "`"c:\pub.xml`""
        $sqlFile = "`"sample.sql`""
                
        TrimInputs -dacpacFile ([ref]$dacpacFile) -publishProfile ([ref]$pubProfile)  -adminUserName ([ref]$adminUserNoSpaces) -sqlUsername ([ref]$sqlUserNoSpaces) -sqlFile ([ref]$sqlFile)

        It "should not have extra double quotes"{
            ( $dacpacFile ) | Should Be $dacpacFileNoExtraQuotes
            ( $pubProfile ) | Should Be $pubProfileNoExtraQuotes
        }        
    }

    Context "Should remove extra spaces for sqlUsername, adminUserName" {
        $adminUser = " adminuser"
        $sqlUser = " sqluser "
        

        TrimInputs -dacpacFile ([ref]$dacpacFileNoExtraQuotes) -publishProfile ([ref]$pubProfileNoExtraQuotes)  -adminUserName ([ref]$adminUser) -sqlUsername ([ref]$sqlUser) -sqlFile ([ref]$sqlFileNoExtraQuotes)

        It "should not have extra double quotes"{
            ( $adminUser ) | Should Be $adminUserNoSpaces
            ( $sqlUser ) | Should Be $sqlUserNoSpaces
        }
    }
}

Describe "Tests for testing RunRemoteDeployment" {
    
    $machinesList = "dummyMachinesList"
    $script = "dummyscript"
    $deployInParallel = "true"
    $adminUserName = "dummyuser"
    $adminPassword = "dummypassword"
    $http = "http"
    $https = "https"
    $filter = "dummyFilter"


    Context "On successful execution of remote deployment script" {

        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}
        
        try
        {
            $result = RunRemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel
        }
        catch
        {
            $result = $_
        }

        It "Should not throw any exception" {
            $result.Exception | Should Be $null
            Assert-VerifiableMocks
        }
    }

    Context "Should throw on failure of remote execution" {
        
        Mock Invoke-RemoteDeployment -Verifiable { return "Error occurred" } -ParameterFilter { $MachinesList -eq $machinesList -and  $ScriptToRun -eq $script -and $AdminUserName -eq $adminUserName -and $AdminPassword -eq $AdminPassword  -and $Protocol -eq $http -and $TestCertificate -eq "false" -and $DeployInParallel -eq $deployInParallel}
        
        $result = RunRemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $http -testCertificate "false" -deployInParallel $deployInParallel 2>&1 | Out-String

        It "Should throw exception on failure" {
            ($result.Contains('Error occurred')) | Should Be $true
            Assert-VerifiableMocks
        }

    }
}

Describe "Tests for testing GetScriptToRun functionality" {
    Context "Should contain sqlpackage on remote machines script and invoke expression at the end" {

        Mock Get-Content {return "Dummy Script"}

        $script = GetScriptToRun -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "dacpac" -inlineSql "" -sqlFile ""

        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('"authscheme":  "sqlServerAuthentication"')) | Should Be $true
            ($script.Contains('"dacpacFile":  "sample.dacpac"')) | Should Be $true
            ($script.Contains('"serverName":  "localhost"')) | Should Be $true
            ($script.Contains('"additionalArguments":  ""')) | Should Be $true
            ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) | Should Be $true
            ($script.Contains('"databaseName":  "SampleDB"')) | Should Be $true
            ($script.Contains('Invoke-DacpacDeployment @remoteSqlDacpacArgs')) | Should Be $true
        }

        $script = GetScriptToRun -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlQuery" -inlineSql "" -sqlFile "sample.sql"

        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('"authscheme":  "sqlServerAuthentication"')) | Should Be $true
            ($script.Contains('"inlineSql":  ""')) | Should Be $true
            ($script.Contains('"databaseName":  "SampleDB"')) | Should Be $true
            ($script.Contains('"serverName":  "localhost"')) | Should Be $true
            ($script.Contains('"taskType":  "sqlQuery"')) | Should Be $true
            ($script.Contains('"additionalArguments":  ""')) | Should Be $true
            ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) | Should Be $true
            ($script.Contains('"sqlFile":  "sample.sql"')) | Should Be $true
            ($script.Contains('Invoke-SqlQueryDeployment @remoteSplattedSql')) | Should Be $true
        }

        $script = GetScriptToRun -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme "sqlServerAuthentication" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlInline" -inlineSql "Testing Inline SQL" -sqlFile ""

        It "should contain script content and invoke expression" {
            ($script.Contains('Dummy Script')) | Should Be $true
            ($script.Contains('"authscheme":  "sqlServerAuthentication"')) | Should Be $true
            ($script.Contains('"databaseName":  "SampleDB"')) | Should Be $true
            ($script.Contains('"serverName":  "localhost"')) | Should Be $true
            ($script.Contains('"additionalArguments":  ""')) | Should Be $true
            ($script.Contains('"sqlServerCredentials":  "$sqlServerCredentials"')) | Should Be $true
            ($script.Contains('"sqlFile":  ""')) | Should Be $true
            ($script.Contains('Invoke-SqlQueryDeployment @remoteSplattedSql')) | Should Be $true
        }
    }
}

Describe "Tests for testing Main functionality" {
    Context "Should integrate all the functions and call with appropriate arguments" {

        Mock Get-Content -Verifiable {return "dummyscript"}        
        Mock Invoke-RemoteDeployment -Verifiable { return "" } -ParameterFilter { $MachinesList -eq "dummyMachinesList" }
        Mock TrimInputs -Verifiable { return }

        Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "https" -testCertificate "true" -dacpacFile "sample.dacpac" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "dacpac" -inlineSql "" -sqlFile ""

        It "Should integrate all the functions and call with appropriate arguments" {
            Assert-VerifiableMocks
        }

        Main -machinesList "dummyMachinesList" -adminUserName "dummyadminuser" -adminPassword "dummyadminpassword" -winrmProtocol "http" -dacpacFile "" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -authscheme sqlServerAuthentication -sqlUserName "sampleuser" -sqlPassword "dummypassword" -connectionString "" -publishProfile "" -additionalArguments "" -taskType "sqlQuery" -inlineSql "" -sqlFile "sample.sql"

        It "Should integrate all the functions and call with appropriate arguments" {
            Assert-VerifiableMocks
        }
    }
}

