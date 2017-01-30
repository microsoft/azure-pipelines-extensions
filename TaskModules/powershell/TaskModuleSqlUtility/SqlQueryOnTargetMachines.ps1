# Function to import SqlPS module & avoid directory switch
function Import-SqlPs {
    push-location
    Import-Module SqlPS -ErrorAction 'SilentlyContinue' 3>&1 | out-null
    pop-location
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

        $spaltArgumentsToLog = $spaltArguments
        $spaltArgumentsToLogJson = $spaltArgumentsToLog | ConvertTo-Json

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

        $additionalArguments = EscapeSpecialChars $additionalArguments

        Write-Verbose "Invoke-SqlCmd arguments : $spaltArgumentsToLogJson  $additionalArguments"
        Invoke-Expression "Invoke-SqlCmd @spaltArguments $additionalArguments"

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

function EscapeSpecialChars
{
    param(
        [string]$str
    )

    return $str.Replace('`', '``').Replace('$', '`$')
}