Import-Module $env:CURRENT_TASK_ROOTDIR\RemoteDeployer

Write-Verbose "Entering script DeployIISWebApp.ps1"

function Trim-Inputs([ref]$package, [ref]$paramFile, [ref]$siteName, [ref]$adminUser)
{
    Write-Verbose "Triming inputs for excess spaces, double quotes"

    $package.Value = $package.Value.Trim('"', ' ')
    $paramFile.Value = $paramFile.Value.Trim('"', ' ')
    $siteName.Value = $siteName.Value.Trim('"', ' ')

    $adminUser.Value = $adminUser.Value.Trim()
}

function EscapeSpecialChars
{
    param(
        [string]$str
    )

    return $str.Replace('`', '``').Replace('"', '`"').Replace('$', '`$')
}

function Get-ScriptToRun
{
    param (
        [string]$webDeployPackage,
        [string]$webDeployParamFile,
        [string]$overRideParams,
        [string]$websiteName,
        [string]$removeAdditionalFiles,
        [string]$excludeFilesFromAppData,
        [string]$takeAppOffline,
        [string]$additionalArguments
    )

    $msDeployScript = Get-Content  ./MsDeployOnTargetMachines.ps1 | Out-String
    $overRideParams = EscapeSpecialChars -str $overRideParams
    $websiteName = EscapeSpecialChars -str $websiteName
    $AdditionalArguments = EscapeSpecialChars -str $AdditionalArguments

    $invokeMain = "Execute-Main -WebDeployPackage `"$webDeployPackage`" -WebDeployParamFile `"$webDeployParamFile`" -OverRideParams `"$overRideParams`" -WebsiteName `"$websiteName`" -RemoveAdditionalFiles $removeAdditionalFiles -ExcludeFilesFromAppData $excludeFilesFromAppData -TakeAppOffline $takeAppOffline -AdditionalArguments `"$AdditionalArguments`""

    Write-Verbose "Executing main function in MsDeployOnTargetMachines : $invokeMain"
    $msDeployOnTargetMachinesScript = [string]::Format("{0} {1} ( {2} )", $msDeployScript,  [Environment]::NewLine,  $invokeMain)
    return $msDeployOnTargetMachinesScript
}

function Parse-TargetMachineNames {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $machineNames,
        [ValidateNotNullOrEmpty()]
        [char] $separator = ','
    )

    Write-Verbose "Executing Parse-TargetMachineNames"
    try {
        $targetMachineNames = $machineNames.ToLowerInvariant().Split($separator) |
        # multiple connections to the same machine are filtered here
            Select-Object -Unique |
                ForEach-Object {
                    if (![string]::IsNullOrEmpty($_)) {
                        Write-Verbose "TargetMachineName: '$_'" ;
                        $_.ToLowerInvariant()
                    } 
                }

        return ,$targetMachineNames;
    }
    finally {   
        Write-Verbose "Finished executing Parse-TargetMachineNames"
    }
}

function Get-TargetMachineCredential {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $userName,
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $password
    )

    Write-Verbose "Executing Get-TargetMachineCredential: $($userName)"
    try {
        $securePassword = ConvertTo-SecureString -AsPlainText -String $password -Force
        return (New-Object System.Management.Automation.PSCredential($userName, $securePassword))
    } finally {
        Write-Verbose "Finished executing Get-TargetMachineCredential"
    }
}

function Get-NewPSSessionOption {
    [CmdletBinding()]
    param(
        [string] $arguments
    )
    Write-Verbose "Executing Get-NewPSSessionOption"
    try {
        $commandString = "New-PSSessionOption $arguments"
        Write-Verbose "New-PSSessionOption command: $commandString"
        return (Invoke-Expression -Command $commandString)
    } finally {
        Write-Verbose "Finished executing Get-NewPSSessionOption"
    }
}

function Run-RemoteDeployment
{
    param(
        [string]$machinesList,
        [string]$scriptToRun,
        [string]$adminUserName,
        [string]$adminPassword,
        [string]$winrmProtocol,
        [string]$testCertificate,
        [string]$deployInParallel,
        [string]$webDeployPackage
    )

    Write-Host "Executing Run-RemoteDeployment"

    try {
        $targetMachineNames = Parse-TargetMachineNames -machineNames $machinesList

        $sessionOptionArguments = ''
        if ([System.Convert]::ToBoolean($testCertificate))
        {
            $sessionOptionArguments = "-SkipCACheck"
        }

        $sessionOption = Get-NewPSSessionOption -arguments $sessionOptionArguments
        $credential = Get-TargetMachineCredential -userName $adminUserName -password $adminPassword

        $remoteScriptJobArguments = @{
            scriptPath = "";
            scriptArguments = "";
            inlineScript = $scriptToRun;
            inline = $true;
            workingDirectory = "";
            errorActionPreference = "Stop";
            ignoreLASTEXITCODE = $false;
            failOnStdErr = $true;
            initializationScriptPath = "";
            sessionVariables = "";
        }

        Write-Host "Starting remote execution of Invoke-Main script for IIS Web Deploy Package  `"$webDeployPackage`""

        $jobResults = @()
        if($deployInParallel -eq $true) {
            $jobResults = Invoke-RemoteScript -targetMachineNames $targetMachineNames `
                                              -credential $credential `
                                              -protocol $winrmProtocol `
                                              -remoteScriptJobArguments $remoteScriptJobArguments `
                                              -sessionOption $sessionOption `
                                              -uploadLogFiles 
        } else {
            foreach($targetMachineName in $targetMachineNames) {
                $jobResults += Invoke-RemoteScript -targetMachineNames @($targetMachineName) `
                                                   -credential $credential `
                                                   -protocol $winrmProtocol `
                                                   -remoteScriptJobArguments $remoteScriptJobArguments `
                                                   -sessionOption $sessionOption `
                                                   -uploadLogFiles
            }
        }

        foreach($jobResult in $jobResults) {
            if ($jobResult.ExitCode -ne 0) {
                Write-Host "Execution on at least one of the target machines has failed."
                return $jobResults
            }
        }

        Write-Host "Successfully executed the script on all machines."
        return $jobResults
    }
    catch {
        Write-Host "Exception caught from task: $($_.Exception.ToString())"
        throw
    }
    finally {
        Write-Host "Finished executing Run-RemoteDeployment"
    }
}

function Main
{
    param (
    [string]$machinesList,
    [string]$adminUserName,
    [string]$adminPassword,
    [string]$winrmProtocol,
    [string]$testCertificate,
    [string]$webDeployPackage,
    [string]$webDeployParamFile,
    [string]$overRideParams,
    [string]$websiteName,
    [string]$removeAdditionalFiles,
    [string]$excludeFilesFromAppData,
    [string]$takeAppOffline,
    [string]$additionalArguments,
    [string]$deployInParallel
    )

    Write-Verbose "machinesList = $machinesList"
    Write-Verbose "adminUserName = $adminUserName"
    Write-Verbose "winrmProtocol  = $winrmProtocol"
    Write-Verbose "testCertificate = $testCertificate"
    Write-Verbose "webDeployPackage = $webDeployPackage"
    Write-Verbose "webDeployParamFile = $webDeployParamFile"
    Write-Verbose "overRideParams = $overRideParams"
    Write-Verbose "websiteName = $websiteName"
    Write-Verbose "removeAdditionalFiles = $removeAdditionalFiles"
    Write-Verbose "excludeFilesFromAppData = $excludeFilesFromAppData"
    Write-Verbose "takeAppOffline = $takeAppOffline"
    Write-Verbose "additionalArguments = $additionalArguments"
    Write-Verbose "deployInParallel = $deployInParallel"

    Trim-Inputs -package ([ref]$webDeployPackage) -paramFile ([ref]$webDeployParamFile) -siteName ([ref]$websiteName) -adminUser ([ref]$adminUserName)    
    $script = Get-ScriptToRun -webDeployPackage $webDeployPackage -webDeployParamFile $webDeployParamFile -websiteName $websiteName -overRideParams $overRideParams -removeAdditionalFiles $removeAdditionalFiles -excludeFilesFromAppData $excludeFilesFromAppData -takeAppOffline $takeAppOffline -additionalArguments $additionalArguments
    Run-RemoteDeployment -machinesList $machinesList -scriptToRun $script -adminUserName $adminUserName -adminPassword $adminPassword -winrmProtocol $winrmProtocol -testCertificate $testCertificate -deployInParallel $deployInParallel -webDeployPackage $webDeployPackage
}
