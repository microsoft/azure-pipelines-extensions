$InitializationScript = {
    function Load-AgentAssemblies
    {
        Get-ChildItem $env:AGENT_HOMEDIRECTORY\Agent\Worker\*.dll | % {
        [void][reflection.assembly]::LoadFrom( $_.FullName )
        Write-Verbose "Loading .NET assembly:`t$($_.name)"
        }

        Get-ChildItem $env:AGENT_HOMEDIRECTORY\Agent\Worker\Modules\Microsoft.TeamFoundation.DistributedTask.Task.DevTestLabs\*.dll | % {
        [void][reflection.assembly]::LoadFrom( $_.FullName )
        Write-Verbose "Loading .NET assembly:`t$($_.name)"
        }
    }
}

$InvokePsOnRemoteScriptBlock = {
    param (
        [string]$machineName,
        [string]$scriptToRun,
        [string]$winRmPort,
        [object]$credential,
        [string]$protocolOption,
        [string]$skipCAOption
        )

        Write-Verbose "machineName = $machineName"
        Write-Verbose "winRmPort = $winRmPort"
        Write-Verbose "protocolOption = $protocolOption"
        Write-Verbose "skipCAOption = $skipCAOption"

        Load-AgentAssemblies

        Write-Verbose "Initiating deployment on $machineName" -Verbose
        [String]$psOnRemoteScriptBlockString = "Invoke-PsOnRemote -MachineDnsName $machineName -ScriptBlockContent `$scriptToRun -WinRMPort $winRmPort -Credential `$credential $skipCAOption $protocolOption"
        [scriptblock]$psOnRemoteScriptBlock = [scriptblock]::Create($psOnRemoteScriptBlockString)
        $deploymentResponse = Invoke-Command -ScriptBlock $psOnRemoteScriptBlock

        Write-Output $deploymentResponse
}

function Invoke-RemoteDeployment
{
    param(
        [string]$machinesList,
        [string]$scriptToRun,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$protocol,
        [string]$testCertificate,
        [string]$deployInParallel
    )

    $errorMsg = ""
    $operationStatus = "Passed"

    $credential = Get-Credentials -userName $adminUserName -password $adminPassword
    $machinePortDict = Get-MachinePortDict -machinesList $machinesList -protocol $protocol
    $skipCAOption = Get-SkipCAOption -useTestCertificate $testCertificate
    $protocolOption = Get-ProtocolOption -protocol $protocol

    if($deployInParallel -eq "true")
    {
        [hashtable]$Jobs = @{}
        foreach($machine in $machinePortDict.Keys)
        {
            $winRmPort = $machinePortDict[$machine]
            Write-Host "Deployment started for machine: $machine"
            $job = Start-Job -InitializationScript $InitializationScript -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $machine, $scriptToRun, $winRmPort, $credential, $protocolOption, $skipCAOption
            $Jobs.Add($job.Id, $machine)
        }
        
        While (Get-Job)
        {
            Start-Sleep -Seconds 10
            foreach($job in Get-Job)
            {
                 if($job.State -ne "Running")
                {
                    $output = Receive-Job -Id $job.Id
                    Remove-Job $job
                    $machineName = $Jobs.Item($job.Id)

                    Write-Host "Deployment status for machine $machineName :", $output.Status
                    if($output.Status -ne "Passed")
                    {
                        $operationStatus = "Failed"
                        $errorMsg = ""
                        if($output.Error -ne $null)
                        {
                            $errorMsg = $output.Error.Message
                        }
                        Write-Host "Deployment failed on machine $machineName with following message : $errorMsg"
                    }
                }
            }
        }
    }
    else
    {
        . $InitializationScript
        foreach($machine in $machinePortDict.Keys)
        {
            Write-Host "Deployment started for machine: $machine"
            $winRmPort = $machinePortDict[$machine]
            $deploymentResponse = Invoke-Command -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $machine, $scriptToRun, $winRmPort, $credential, $protocolOption, $skipCAOption

            if ($deploymentResponse.Status -ne "Passed")
            {
                $operationStatus = "Failed"
                if($deploymentResponse.Error -ne $null)
                {
                    Write-Host "Deployment failed on machine $machine with following message :", $deploymentResponse.Error.ToString()
                    $errorMsg = $deploymentResponse.Error.Message
                    break
                }
           }
           Write-Host "Deployment status for machine $machineName :", $deploymentResponse.Status
        }
    }

    if($operationStatus -ne "Passed")
    {
         $errorMsg = 'Deployment on one or more machines failed.'
    }

    return $errorMsg
}

function Get-ProtocolOption
{
    param(
        [string]$protocol
    )

    $protocolOption = ""
    
    if($protocol -eq "http")
    {
        $protocolOption = "-UseHttp"
    }

    return $protocolOption
}

function Get-SkipCAOption
{
    param(
        [string]$useTestCertificate
    )

    $skipCAOption = ""

    if($useTestCertificate -eq "true")
    {
        $skipCAOption = "-SkipCACheck"
    }

    return $skipCAOption
}

function Get-Credentials
{
    param(
        [string]$userName,
        [string]$password
    )

    if([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($password))
    {
        throw "Invalid administrator credentials."
    }
    
    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    $creds = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $username, $securePassword
    return $creds
}

function Get-MachinePortDict
{
    param(
        [string]$machinesList,
        [string]$protocol
    )

    $machinePortDict = @{}
    $machines = @()

    $machinesList.split(',', [System.StringSplitOptions]::RemoveEmptyEntries) |`
    Foreach { if( ![string]::IsNullOrWhiteSpace($_) -and ![string]::Equals('\n', $_)) {$machines += $_}}

    foreach ($machine in $machines) {
        $tokens = Get-MachineNameAndPort -machine $machine
        if(![string]::IsNullOrWhiteSpace($tokens[1]))
        {
            $machinePortDict.add($tokens[0], $tokens[1])
        }
        elseif($protocol -eq "http")
        {
            $machinePortDict.add($tokens[0], "5985")
        }
        else
        {
            $machinePortDict.add($tokens[0], "5986")
        }
    }

    return $machinePortDict
}

function Get-MachineNameAndPort
{
    param(
        [string]$machine
    )

    $tokens = @()
    $machine.split(':') | Foreach { $tokens += $_.Trim()}

    if($tokens.Count -gt 2)
    {
        throw "Invalid user input, speficy machines in machine:port format."
    }

    [System.Int32]$port = $null
    if($tokens.Count -eq 2 -and ![System.Int32]::TryParse($tokens[1], [ref]$port))
    {
        throw "Invalid user input, port is not an integer."
    }

    if([string]::IsNullOrWhiteSpace($tokens[0]))
    {
        throw "Invalid user input, machine name can not be empty."
    }

    return ,$tokens
}