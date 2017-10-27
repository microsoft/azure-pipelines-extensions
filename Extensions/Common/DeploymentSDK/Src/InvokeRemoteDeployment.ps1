$InitializationScript = {
    function Invoke-PsOnRemote
    {
        param(
            [string]$machineDnsName,
            [string]$scriptContent,
            [int]$winRmPort,
            [System.Net.NetworkCredential]$credentials,
            [bool]$skipCA,
            [bool]$useHttp
        )

        #TODO : $env:CURRENT_TASK_ROOTDIR variable is being set by main file of the task. Need to finout better way to do this
        Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\Microsoft.VisualStudio.Services.DevTestLabs.Definition.dll
        Import-Module $env:CURRENT_TASK_ROOTDIR\DeploymentSDK\Microsoft.VisualStudio.Services.DevTestLabs.Deployment.dll

        Write-Verbose "Loading modules from $env:CURRENT_TASK_ROOTDIR\DeploymentSDK"
        try
        {
            <#
            RetryPolicy -- This is used to define retry policy for deployment client in case of network network issues or connection failures.
            Params
                int noOfRetries : The first argument defines how many times retry needs to happen.
                int retryInterval : The second parameter specifies retry interval in milli seconds.
            #>
            $retryPolicy = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.RetryPolicy -ArgumentList 5, 30000

            <#
            DeploymentClient -- This class provides all the functionality necessary for doing a remote machine deployment using WinRM.
            Params
                RetryPolicy retryPolicy : Used to specify retry policy for this instance of deployment client.
            #>
            $deploymentClient = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Deployment.Deployment.DeploymentClient -ArgumentList $retryPolicy
            
            <#
            DeploymentMachineSpecification -- This class is used to specify all necessary information of target machine for the deployment.
            Params
                string machineDnsName -- It should be set to FQDN/IP Address of the target machine.
                int winRmPort -- It should be set to the port number of target machine for which WinRM listeners are configured.
                NetworkCredential credentials -- Administrator credentials for connecting to target machine.
                bool skipCA -- It specifies whether to skip CA check for target machine certificate or not. This input is useful in case of https connection.
                bool useHttp -- It specifies whether to use http or https protocol for making connection with target machine, set it to false for making https connection.
                bool useCredSSP -- Input for cred SSP currently only false is supported.
            #>
            $deploymentMachineSpec = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.DeploymentMachineSpecification -ArgumentList $machineDnsName, $winRmPort, $credentials, $skipCA, $useHttp, $false

            <#
            ScriptSpecification -- This class is used to specify all necessary information about the script to be executed
            Params
                string scriptContent -- Content of the script file to be executed
                string scriptArgs    -- Arguments that needs to be passed to script
                Dict   params        -- Set of params to be passed to script
                bool   isExpandParams -- Indicates whether to expand parameters or not.
            #>
            $scriptSpecification = New-Object -TypeName Microsoft.VisualStudio.Services.DevTestLabs.Definition.ScriptSpecification -ArgumentList $scriptContent, "", @{}, $false

            <#
            RunPowerShellAsync -- It executes the powershell script on the remote machine asychronously returns response.
            Params
                DeploymentMachineSpecification deploymentMachineSpec -- Deployment machine specification
                ScriptSpecification scriptSpecification -- Script specification to be executed
                ScriptSpecification initScriptSpecification -- Initialization script specification, in general used to set some environment variables etc.
                Uri applicationPath -- Base path for the script to be executed.
                CancellationToken cancellationToken -- Currently only None is supported.
                bool enableDetailedLogging -- Setting it to true will result in getting all the logs related to remote deployment.
                bool allowPallelDeployment -- Setting this to true will allows multiple deployments at the same time target machines
            Returns:
                DeploymentResponse -- This object contains all the logs related to deployment and remote infra structure service.
            #>
            return $deploymentClient.RunPowerShellAsync($deploymentMachineSpec, $scriptSpecification, $null, [Uri]$null, [System.Threading.CancellationToken]::None, $true, $true).Result
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
        [string]$scriptContent,
        [int]$winRmPort,
        [System.Net.NetworkCredential]$credential,
        [bool]$useHttp,
        [bool]$skipCA
        )

        Write-Verbose "Running Invoke-PsOnRemote"
        Write-Verbose "machineName = $machineName"
        Write-Verbose "winRmPort = $winRmPort"
        Write-Verbose "useHttp = $useHttp"
        Write-Verbose "skipCA = $skipCA"
        Write-Verbose "Initiating deployment on $machineName"

        $deploymentResponse = Invoke-PsOnRemote -MachineDnsName $machineName -ScriptContent $scriptContent -WinRMPort $winRmPort -Credentials $credential -SkipCA $skipCA -UseHttp $useHttp
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
    $resourceList = Get-ResourceList -machinesList $machinesList -protocol $protocol
    $skipCA = Get-SkipCAOption -useTestCertificate $testCertificate
    $useHttp = Get-UseHttpOption -protocol $protocol

    if($deployInParallel -eq "true")
    {
        Write-Host "Performing deployment in parallel on all the machines."
        [hashtable]$Jobs = @{}
        $dtlsdkErrors = @()
        foreach($resource in $resourceList)
        {
            $winRmPort = [System.Convert]::ToInt32($resource.port)
            Write-Host "Deployment started for machine: $($resource.name) with port $winRmPort."
            $job = Start-Job -InitializationScript $InitializationScript -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $resource.name, $scriptToRun, $winRmPort, $credential, $useHttp, $skipCA
            $Jobs.Add($job.Id, $resource.name)
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

                    Write-Host "Deployment status for machine $machineName : $($output.Status)"
                    if($output.Status -ne "Passed")
                    {
                        $operationStatus = "Failed"
                        $errorMsg = ""
                        if($output.Error -ne $null)
                        {
                            $errorMsg = $output.Error.ToString()
                        }
                        Write-Verbose ($output|Format-List -Force|Out-String)
                        Write-Host "Deployment failed on machine $machineName with following message : $errorMsg"
                        $dtlsdkErrors += $output.DeploymentSummary
                    }
                    else
                    {
                        Write-Verbose $output.DeploymentLog
                    }
                    $Jobs.Remove($job.Id)
                }
            }
        }

        if($operationStatus -ne "Passed")
        {
            foreach ($error in $dtlsdkErrors) {
                Write-Telemetry "DTLSDK_Error" $error
            }            
            $errorMsg = [string]::Format("Deployment on one or more machines failed. {0}", $errorMsg)
        }
    }
    else
    {
        Write-Host "Performing deployment in sequentially on all machines."
        . $InitializationScript
        foreach($resource in $resourceList)
        {
            $winRmPort = [System.Convert]::ToInt32($resource.port)
            Write-Host "Deployment started for machine: $($resource.name) with port $winRmPort."
            $deploymentResponse = Invoke-Command -ScriptBlock $InvokePsOnRemoteScriptBlock -ArgumentList $resource.name, $scriptToRun, $winRmPort, $credential, $useHttp, $skipCA

            Write-Host "Deployment status for machine $($resource.name) : $($deploymentResponse.Status)"
            if ($deploymentResponse.Status -ne "Passed")
            {
                $operationStatus = "Failed"
                Write-Telemetry "DTLSDK_Error" $deploymentResponse.DeploymentSummary
                Write-Verbose ($deploymentResponse|Format-List -Force|Out-String)
                if($deploymentResponse.Error -ne $null)
                {
                    $errorMsg = $deploymentResponse.Error.ToString()
                    break
                }                
            }
            else
            {
                Write-Verbose $deploymentResponse.DeploymentLog
            }
        }
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

    Write-Verbose "Using useHttp = $useHttp"
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

    Write-Verbose "Using skipCA = $skipCAOption"
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
        Write-Telemetry "Input_Validation" "Invalid administrator credentials. UserName/Password null/empty"
        throw "Invalid administrator credentials."
    }

    $creds = New-Object -TypeName System.Net.NetworkCredential -ArgumentList $username, $password
    return $creds
}

function Get-ResourceList
{
    param(
        [string]$machinesList,
        [string]$protocol
    )

    Write-Verbose "Tokenizing machine name and port, to create dictonary"

    $resourceList = @()
    $machines = @()

    $machinesList.split(',', [System.StringSplitOptions]::RemoveEmptyEntries) |`
    Foreach { if( ![string]::IsNullOrWhiteSpace($_) -and ![string]::Equals('\n', $_)) {$machines += $_}}

    foreach ($machine in $machines) {
        $tokens = Get-MachineNameAndPort -machine $machine
        if(![string]::IsNullOrWhiteSpace($tokens[1]))
        {
            $machineName = $tokens[0]
            $machinePort = $tokens[1]
        }
        elseif($protocol -eq "http")
        {
            $machineName = $tokens[0]
            $machinePort = "5985"
        }
        else
        {
            $machineName = $tokens[0]
            $machinePort = "5986"
        }

        $resource = New-Object psobject
        $resource | Add-Member -MemberType NoteProperty -Name "name" -Value $machineName
        $resource | Add-Member -MemberType NoteProperty -Name "port" -Value $machinePort
        $resourceList += $resource
    }

    return , $resourceList
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
        Write-Telemetry "Input_Validation" "Invalid user input, speficy machines in machine:port format."
        throw "Invalid user input, speficy machines in machine:port format."
    }

    [System.Int32]$port = $null
    if($tokens.Count -eq 2 -and ![System.Int32]::TryParse($tokens[1], [ref]$port))
    {
        Write-Telemetry "Input_Validation" "Invalid user input, port is not an integer."
        throw "Invalid user input, port is not an integer."
    }

    if([string]::IsNullOrWhiteSpace($tokens[0]))
    {
        Write-Telemetry "Input_Validation" "Invalid user input, machine name can not be empty."
        throw "Invalid user input, machine name can not be empty."
    }

    return , $tokens
}