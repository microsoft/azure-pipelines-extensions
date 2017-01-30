$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$UtilityScript = "$currentScriptPath\..\Src\$sut"

if(-not (Test-Path -Path $UtilityScript))
{
    throw [System.IO.FileNotFoundException] "Unable to find Utility.ps1 at $UtilityScript"
}

. "$UtilityScript"


Describe "Tests for ConvertTo-JsonFormat method" {
    Context "Convert object to json string on PS where ConvertTo-Json cmdlet exists" {
        $argumentAsObject = @{Name="test";Type="task"}
        
        Mock Get-Command -Verifiable { return $true}

        $jsonOutput = ConvertTo-JsonFormat -InputObject $argumentAsObject

        It "Should convert object to json string" {
            $jsonOutput | Should Not be $null
            $jsonOutput.GetType().Name | Should Be "String"
            $jsonOutput.Contains("Name") | Should Be $true
            $jsonOutput.Contains("Type") | Should Be $true
        }
    }

    Context "Convert object to json string on PS where ConvertTo-Json cmdlet doesnot exists" {
        $argumentAsObject = @{Name="test";Type="task"}
        
        Mock Get-Command -Verifiable { return $false}

        $jsonOutput = ConvertTo-JsonFormat -InputObject $argumentAsObject

        It "Should convert object to json string" {
            $jsonOutput | Should Not be $null
            $jsonOutput.GetType().Name | Should Be "String"
            $jsonOutput.Contains("Name") | Should Be $true
            $jsonOutput.Contains("Type") | Should Be $true
        }
    }

    Context "Convert json string to object on PS where ConvertTo-Json cmdlet exists" {
        $jsonString = "{`"Name`":`"test`",`"Type`":`"task`"}"
        
        Mock Get-Command -Verifiable { return $true}

        $argObject = ConvertFrom-JsonFormat -InputObject $jsonString

        It "Should convert json string into object" {
            $argObject | Should Not be $null
            $argObject.GetType().Name | Should Be "PSCustomObject"
            $argObject.Name | Should Be "test"
            $argObject.Type | Should Be "task"
        }
    }

    Context "Convert json string to object on PS where ConvertTo-Json cmdlet doesnot exists" {
        $jsonString = "{`"Name`":`"test`",`"Type`":`"task`"}"
        
        Mock Get-Command -Verifiable { return $false}

        $argObject = ConvertFrom-JsonFormat -InputObject $jsonString

        It "Should convert json string into object" {
            $argObject | Should Not be $null
            $argObject.Name | Should Be "test"
            $argObject.Type | Should Be "task"
        }
    }
}

