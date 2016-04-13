$currentScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path).Replace(".Tests.", ".")
$VerbosePreference = 'Continue'

$invokeRemoteDeployment = "$currentScriptPath\..\..\..\src\Tasks\IISWebAppDeploy\$sut"

if(-not (Test-Path -Path $invokeRemoteDeployment ))
{
    throw [System.IO.FileNotFoundException] "Unable to find InvokeRemoteDeployment.ps1 at $invokeRemoteDeployment"
}

. "$invokeRemoteDeployment"

<#
1. Takes machineList, user etc etc
2. Parse the machine1:port1,machine2:port2 input and return dict
3. If Parallel is true run a job
4. Else run in sequence for each machine1:port1
#>

Describe "Tests for testing Get-MachinePortDict function" {

    Context "When machineList is machine1 and protocol http" {

        $machines = Get-MachinePortDict -machineList "machine1" -protocol "http"

        It "Should create dict with @{`"machine1`":`"5985`"}" {
            ($machines.Count) | Should Be 1
            ($machines.Keys[0]) | Should Be "machine1"
            ($machines["machine1"]) | Should Be "5985"
        }
    }
    
    Context "When machineList is machine1 and protocol https" {

        $machines = Get-MachinePortDict -machineList "machine1" -protocol "https"

        It "Should create dict with @{`"machine1`":`"5986`"}" {
            ($machines.Count) | Should Be 1
            ($machines.Keys[0]) | Should Be "machine1"
            ($machines["machine1"]) | Should Be "5986"
        }
    }
    
    Context "When machineList is machine1:8345 with http" {

        $machines = Get-MachinePortDict -machineList "machine1:8345" -protocol "http"

        It "Should create dict with @{`"machine1`":`"8345`"}" {
            ($machines.Count) | Should Be 1
            ($machines.Keys[0]) | Should Be "machine1"
            ($machines["machine1"]) | Should Be "8345"
        }
    }
    
    Context "When machineList is machine1:2332,machine2:4343 with https" {

        $machines = Get-MachinePortDict -machineList "machine1:2332,machine2:4343" -protocol "https"

        It "Should create dict with @{`"machine1`":`"2332`";`"machine2`":`"4343`";}" {
            ($machines.Count) | Should Be 2
            ($machines["machine1"]) | Should Be "2332"
            ($machines["machine2"]) | Should Be "4343"
        }
    }
    
    Context "When machineLust is machine1:4344,machine2,machine3:4389 with https" {

        $machines = Get-MachinePortDict -machineList "machine1:4344,machine2,machine3:4389" -protocol "https"

        It "Should create dict with @{`"machine1`":`"4344`";`"machine2`":`"5986`";`"machine3`":`"4389`"}" {
            ($machines.Count) | Should Be 3
            ($machines["machine1"]) | Should Be "4344"
            ($machines["machine2"]) | Should Be "5986"
            ($machines["machine3"]) | Should Be "4389"
        }
    }

    Context "When machineLust is machine1:4344,machine2,machine3:4389 with http" {

        $machines = Get-MachinePortDict -machineList "machine1:4344,machine2,machine3:4389" -protocol "http"

        It "Should create dict with @{`"machine1`":`"4344`";`"machine2`":`"5986`";`"machine3`":`"4389`"}" {
            ($machines.Count) | Should Be 3
            ($machines["machine1"]) | Should Be "4344"
            ($machines["machine2"]) | Should Be "5985"
            ($machines["machine3"]) | Should Be "4389"
        }
    }
    
    
    Context "When machines list contains spaces or newlines machine1, ,machine2,\n,machine3" {

        $machines = Get-MachinePortDict -machineList "machine1, ,machine2,\n,machine3" -protocol "http"

        It "Should create dict with @{`"machine1`":`"5985`";`"machine2`":`"5985`";`"machine3`":`"595`"}" {
            ($machines.Count) | Should Be 3
            ($machines["machine1"]) | Should Be "5985"
            ($machines["machine2"]) | Should Be "5985"
            ($machines["machine3"]) | Should Be "5985"
        }
    }
}

Describe "Tests for testing Get-MachineNameAndPort functionality" {
    Context "When machine name or port has leading or trailing white spaces ex: machine1 : 5343" {

        $tokens = Get-MachineNameAndPort -machine "machine1 : 5343"

        It "Should return array with @(machine1,5343)" {
            ($tokens.Count) | Should Be 2
            ($tokens[0]) | Should Be "machine1"
            ($tokens[1]) | Should Be "5343"
        }
    }

    Context "When machine name is empty :5986 with https" {

        $errorMsg = "Invalid user input, machine name can not be empty."

        It "Should throw exception" {
            { Get-MachineNameAndPort -machine ":5986" } | Should Throw $errorMsg
        }
    }

    Context "When port is not a valid integer machine1:port1" {

        $errorMsg = "Invalid user input, port is not an integer."

        It "Should throw exception" {
            { Get-MachineNameAndPort -machine "machine1:port" } | Should Throw $errorMsg
        }
    }

    Context "When machine port combination has more than two tokens machine1:port1:port2" {

        $errorMsg = "Invalid user input, speficy machines in machine:port format."

        It "Should throw exception" {
            { Get-MachineNameAndPort -machine "machine1:port1:port2" } | Should Throw $errorMsg
        }
    }
}