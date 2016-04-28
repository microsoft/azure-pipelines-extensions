$InitializationScript = {
    function Invoke-PsOnRemote
    {
        param(
            [string]$machineDnsName,
            [string]$scriptContent,
            [int]$winRmPort,
            [object]$credentials,
            [bool]$skipCA,
            [bool]$useHttp
        )

        Import-Module .\Microsoft.VisualStudio.Services.DevTestLabs.Definition.dll
        Import-Module .\Microsoft.VisualStudio.Services.DevTestLabs.Deployment.dll

        try
        {
            $retryPolicy = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.RetryPolicy -ArgumentList 5, 30000
            $deploymentClient = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Deployment.Deployment.DeploymentClient -ArgumentList $retryPolicy
            $deploymentMachineSpec = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.DeploymentMachineSpecification -ArgumentList $machineDnsName, $winRmPort, $credentials, $skipCA, $useHttp, $false
            $scriptSpecification = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.ScriptSpecification -ArgumentList $scriptContent    
            return $deploymentClient.RunPowerShellAsync($deploymentMachineSpec, $scriptSpecification, $null, [Uri]$null, [System.Threading.CancellationToken]::None, $true).Result
        }
        catch
        {
            $deploymentResponse = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.DeploymentResponse
            $deploymentResponse.MachineName = $machineDnsName
            $deploymentResponse.Error = $_.Exception
            $deploymentResponse.DeploymentLog = $_.Exception.ToString()
            $deploymentResponse.Status = [Microsoft.VisualStudio.Services.DevTestLabs.Definition.DscStatus]::Failed
            return $deploymentResponse
        }
    }
}

$InvokePsOnRemoteScriptBlock = {
    param (
        [string]$machineName,
        [string]$scriptToRun,
        [int]$winRmPort,
        [object]$credential,
        [bool]$useHttp,
        [bool]$skipCA
        )

        Write-Verbose "Running Invoke-PsOnRemote"
        Write-Verbose "machineName = $machineName"
        Write-Verbose "winRmPort = $winRmPort"
        Write-Verbose "useHttp = $useHttp"
        Write-Verbose "skipCA = $skipCA"
        Write-Verbose "Initiating deployment on $machineName"

        $deploymentResponse = Invoke-PsOnRemote -MachineDnsName $machineName -ScriptBlockContent `$scriptToRun -WinRMPort $winRmPort -Credential `$credential -skipCA $skipCA -useHttp $useHttp
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

    Write-Verbose "Entered Invoke-RemoteDeployment function"
    Write-Verbose "machinesList = $machinesList"
    Write-Verbose "adminUserName = $adminUserName"
    Write-Verbose "protocol = $protocol"

    $credential = Get-Credentials -userName $adminUserName -password $adminPassword
    $machinePortDict = Get-MachinePortDict -machinesList $machinesList -protocol $protocol
    $skipCA = Get-SkipCAOption -useTestCertificate $testCertificate
    $useHttp = Get-UseHttpOption -protocol $protocol

    if($deployInParallel -eq "true")
    {
        Write-Host "Performing deployment in parallel on all the machines."
        [hashtable]$Jobs = @{}
        foreach($machine in $machinePortDict.Keys)
        {
            $winRmPort = [System.Convert]::ToInt32($machinePortDict[$machine])
            Write-Host "Deployment started for machine: $machine with port $winRmPort."
            $job = Start-Job -InitializationScript $InitializationScript -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $machine, $scriptToRun, $winRmPort, $credential, $useHttp, $skipCA
            $Jobs.Add($job.Id, $machine)
        }
        
        While ($Jobs.Count -gt 0)
        {
            Start-Sleep -Seconds 10
            foreach($job in Get-Job)
            {
                 if($Jobs.ContainsKey($job.Id) -and $job.State -ne "Running")
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
                    $Jobs.Remove($job.Id)
                }
            }
        }
    }
    else
    {
        Write-Host "Performing deployment in sequentially on all machines."
        . $InitializationScript
        foreach($machine in $machinePortDict.Keys)
        {
            $winRmPort = [System.Convert]::ToInt32($machinePortDict[$machine])
            Write-Host "Deployment started for machine: $machine with port $winRmPort."
            $deploymentResponse = Invoke-Command -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $machine, $scriptToRun, $winRmPort, $credential, $useHttp, $skipCA

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

function Get-UseHttpOption
{
    param(
        [string]$protocol
    )

    [bool]$useHttp = $false
    
    if($protocol -eq "http")
    {
        $useHttp = $true
    }

    return $useHttp
}

function Get-SkipCAOption
{
    param(
        [string]$useTestCertificate
    )

    [bool]$skipCAOption = $false

    try {
        $skipCAOption = [System.Convert]::ToBoolean($useTestCertificate)
    }
    catch [FormatException] {
        $skipCAOption = $false
    }

    return $skipCAOption
}

function Get-Credentials
{
    param(
        [string]$userName,
        [string]$password
    )

    Write-Verbose "Creating credentials object for connecting to remote host"
    if([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($password))
    {
        throw "Invalid administrator credentials."
    }

    $creds = New-Object -TypeName System.Net.NetworkCredential -ArgumentList $username, $password
    return $creds
}

function Get-MachinePortDict
{
    param(
        [string]$machinesList,
        [string]$protocol
    )

    Write-Verbose "Tokenizing machine name and port, to create dictonary"

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

    Write-Verbose "Splitting machine name and port into tokens"
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