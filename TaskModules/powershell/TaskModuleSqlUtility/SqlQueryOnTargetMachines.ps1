# Function to import SqlPS module & avoid directory switch
function Import-SqlPs {
    push-location
    Import-Module SqlPS -ErrorAction 'SilentlyContinue' 3>&1 | out-null
    pop-location
}

function Get-SingleFile($files, $pattern)
{
    if ($files -is [system.array])
    {
        throw "Found more than one file to deploy with search pattern $pattern there can be only one."
    }
    else
    {
        if (!$files)
        {
            throw "No files were found to deploy with search pattern $pattern"
        }
        return $files
    }
}

function Get-SqlFilepathOnTargetMachine
{
    param([string] $inlineSql)

    $tempFilePath = [System.IO.Path]::GetTempFileName()
    ($inlineSql | Out-File $tempFilePath)

    return $tempFilePath
}

function Execute-SqlQueryDeployment
{
    param (
        [string]$taskType,
        [string]$sqlFile,
        [string]$inlineSql,
        [string]$serverName,
        [string]$databaseName,
        [string]$authscheme,
        [System.Management.Automation.PSCredential]$sqlServerCredentials,
        [string]$additionalArguments
    )

    Write-Verbose "Entering script SqlQueryOnTargetMachines.ps1"
    try 
    {
        if($taskType -eq "sqlInline")
        {
            # Convert this inline Sql to a temporary file on Server
            $sqlFile = Get-SqlFilepathOnTargetMachine $inlineSql
        }
        else
        {
            Write-Verbose "Finding files with pattern $sqlFile"
            $sqlFiles = Find-VstsFiles -LegacyPattern "$sqlFile"
            Write-Verbose "sqlFiles = $sqlFiles"
            $sqlFile = Get-SingleFile $sqlFiles $sqlFile

            # Validate Sql File
            if([System.IO.Path]::GetExtension($sqlFile) -ne ".sql")
            {
                throw "Invalid Sql file [ $sqlFile ] provided"
            }
        }

        # Import SQLPS Module
        Import-SqlPs

        $spaltArguments = @{
            ServerInstance=$serverName
            Database=$databaseName
            InputFile=$sqlFile
        }

        # Process Additional arguments 
        if($additionalArguments) 
        {
            $args = $additionalArguments.Split()
            $argScope = $null
            foreach($arg in $args) {
                $arg = $arg.Trim()
                if($arg)
                {
                    if ($arg.StartsWith("-") -and ($arg.Length -gt 1)){
                        $argVal = $arg.SubString(1)
                        if($argScope)
                        {
                            $spaltArguments.Add($argScope, $null)
                        }
                        $argScope = $argVal
                    } 
                    elseif (-not $arg.StartsWith("-")) 
                    {
                        if($argScope)
                        {
                            $spaltArguments.Add($argScope, $arg);
                        }
                        $argScope = $null
                    } 
                    else
                    {
                        #Ignore argument
                        Write-Verbose "Ignoring argument $arg"
                    }
                }
            }
            if ($argScope) {
                $spaltArguments.Add($argScope, $null)
            }
        }

        $spaltArgumentsToLog = $spaltArguments
        $spaltArgumentsToLogJson = $spaltArgumentsToLog | ConvertTo-Json
        Write-Verbose "Arguments : $spaltArgumentsToLogJson"

        if($authscheme -eq "sqlServerAuthentication")
        {
            if($sqlServerCredentials)
            {
                $sqlUsername = $sqlServerCredentials.Username
                $sqlPassword = $sqlServerCredentials.GetNetworkCredential().password
                $spaltArguments.Add("Username", $sqlUsername)
                $spaltArguments.Add("Password", $sqlPassword)
            }
        }

        Invoke-Sqlcmd @spaltArguments

    } # End of Try
    Finally
    {
        # Cleanup the temp file & dont error out in case Deletion fails
        if ($taskType -eq "sqlInline" -and $sqlFile -and ((Test-Path $sqlFile) -eq $true))
        {
            Write-Verbose "Removing File $sqlFile"
            Remove-Item $sqlFile -ErrorAction 'SilentlyContinue'
        }
    }
}