$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptDirName = Split-Path -Leaf $currentScriptPath
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$taskModuleSqlUtility = "taskModuleSqlUtility"
$VerbosePreference = 'Continue'

$sqlQueryOnTargetMachinesPath = "$currentScriptPath\..\..\..\Src\Tasks\$scriptDirName\$taskModuleSqlUtility\$sut"

if(-not (Test-Path -Path $sqlQueryOnTargetMachinesPath ))
{
    throw [System.IO.FileNotFoundException] "Unable to find SqlQueryOnTargetMachinesPath.ps1 at $sqlQueryOnTargetMachinesPath"
}

. "$sqlQueryOnTargetMachinesPath"

# Tests ----------------------------------------------------------------------------

Describe "Tests for verifying Import-SqlPs functionality" {

    Context "When Import execution fails" {

        $errMsg = "Module Not Found"
        Mock Import-SqlPs { throw $errMsg}
        
        try
        {
            Import-SqlPs
        }
        catch
        {
            $result = $_
        }
        
        It "should throw exception" {
            ($result.Exception.ToString().Contains("$errMsg")) | Should Be $true
        }
    }

    Context "When command execution successful" {

        Mock Import-SqlPs { return }

        try
        {
            Import-SqlPs
        }
        catch
        {
            $result = $_
        }
        
        It "should not throw exception" {
            $result.Exception | Should Be $null
        }
    }
}

Describe "Tests for verifying Execute-SqlQueryDeployment functionality" {

    Context "When execute sql is invoked with all inputs for Inline Sql"{

        Mock Import-SqlPs { return }
        Mock Get-SqlFilepathOnTargetMachine { return "sample.temp" }
        Mock Invoke-Expression -Verifiable { return } -ParameterFilter {$Command -and $Command.StartsWith("Invoke-Sqlcmd")}

        Execute-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 

        It "Should deploy inline Sql"{
            Assert-VerifiableMocks
            Assert-MockCalled Import-SqlPs -Times 1
            Assert-MockCalled Get-SqlFilepathOnTargetMachine -Times 1
            Assert-MockCalled Invoke-Expression -Times 1
        }
    }

    Context "When execute sql is invoked with Wrong Extension Sql File"{

        Mock Import-SqlPs { return }
        Mock Invoke-Expression -Verifiable { return } -ParameterFilter {$Command -and $Command.StartsWith("Invoke-Sqlcmd")}

        Mock Remove-Item { return }
        Mock Test-Path { return $true }

        try
        {
            Execute-SqlQueryDeployment -taskType "sqlQuery" -sqlFile "SampleFile.temp" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
        }
        catch
        {
            $result = $_
        }

        It "should throw exception" {
            ($result.Exception.ToString().Contains("Invalid Sql file [ SampleFile.temp ] provided")) | Should Be $true
        }
    }

    Context "When execute sql is invoked with Server Auth Type"{

        $UsernamePasswordParams = "-Username `"SqlUser`" -Password `"SqlPass`""

        Mock Import-SqlPs { return }
        Mock Get-SqlFilepathOnTargetMachine { return "sample.temp" }
        Mock Invoke-Expression -Verifiable { return } -ParameterFilter {$Command -and $Command.Contains($UsernamePasswordParams)}

        Execute-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" -sqlUsername "SqlUser" -sqlPassword "SqlPass" -authscheme sqlServerAuthentication

        It "Should deploy inline Sql with Server Authetication"{
            Assert-VerifiableMocks
            Assert-MockCalled  Import-SqlPs -Times 1
            Assert-MockCalled  Get-SqlFilepathOnTargetMachine -Times 1
            Assert-MockCalled  Invoke-Expression -Times 1
        }
    }

    Context "When finally gets called and Test-Path Fails"{

        Mock Import-SqlPs { throw }
        Mock Get-SqlFilepathOnTargetMachine { return "sample.temp" }

        # Marking Test Path as false so that Remove -Item is not called 
        # This tests Finally Part
        Mock Test-Path { return $false }
        Mock Remove-Item { return }

        try
        {
            Execute-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
        }
        catch
        {
            # Do Nothing
        }

        It "Should deploy inline Sql"{
            Assert-VerifiableMocks
            Assert-MockCalled Test-Path -Times 1
            Assert-MockCalled Remove-Item -Times 0
        }
    }

    Context "When finally gets called and Test-Path Returns True"{

        Mock Import-SqlPs { throw }
        Mock Get-SqlFilepathOnTargetMachine { return "sample.temp" }

        # Marking Test Path as true so that Remove -Item is called 
        # This tests Finally Part
        Mock Test-Path { return $true }
        Mock Remove-Item { return }

        try
        {
            Execute-SqlQueryDeployment -taskType "sqlInline" -inlineSql "SampleQuery" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB" 
        }
        catch
        {
            # Do Nothing
        }

        It "Should deploy inline Sql"{
            Assert-VerifiableMocks
            Assert-MockCalled Test-Path -Times 1
            Assert-MockCalled Remove-Item -Times 1
        }
    }

    Context "When execute sql is invoked with Sql File, Finally is no Op"{

        Mock Import-SqlPs { throw }

        Mock Remove-Item { return }
        Mock Test-Path { return $true }

        try
        {
            Execute-SqlQueryDeployment -taskType "sqlQuery" -sqlFile "SampleFile.temp" -targetMethod "server" -serverName "localhost" -databaseName "SampleDB"
        }
        catch
        {
            # Do Nothing
        }

        It "Should Short Circuit in Finally" {
            Assert-VerifiableMocks
            Assert-MockCalled Test-Path -Times 0
            Assert-MockCalled Remove-Item -Times 0
        }
    }    
}