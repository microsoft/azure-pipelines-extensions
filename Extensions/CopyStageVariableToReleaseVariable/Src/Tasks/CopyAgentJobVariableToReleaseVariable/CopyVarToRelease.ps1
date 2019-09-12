$currentTaskVersionRootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:CURRENT_TASK_ROOTDIR = $currentTaskVersionRootDir

Import-Module $env:CURRENT_TASK_ROOTDIR\ps_modules\VstsTaskSdk

Trace-VstsEnteringInvocation $MyInvocation
Import-VstsLocStrings -LiteralPath $env:CURRENT_TASK_ROOTDIR\task.json

try
{
    $stageVariableNames = Get-VstsInput -Name stageVariableNames -Require
    $releaseVariableNames = Get-VstsInput -Name releaseVariableNames
    $stageVariableNamesArray = $stageVariableNames.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)
    $releaseVariableNamesArray = @()
    if (!$releaseVariableNames)
    {
        Write-Verbose "Creating release variables with the same name as the stage variables"
        $releaseVariableNamesArray = $stageVariableNamesArray
    }
    else
    {
        $releaseVariableNamesArray = $releaseVariableNames.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($releaseVariableNamesArray.Length -ne $stageVariableNamesArray.Length)
        {
            Throw (Get-VstsLocString -Key "ReleaseVarLengthShoulbeSameAsStageVarLength")
        }

        Write-Verbose "Creating release variables with the names specified"
    }

    $collectionUri = (Get-VstsTaskVariable -Name 'System.CollectionUri' -Require).TrimEnd('/')
    $teamProject = Get-VstsTaskVariable -Name 'System.TeamProject' -Require
    $releaseId = Get-VstsTaskVariable -Name 'Release.ReleaseId' -Require
    $endpoint = Get-VstsEndpoint -Name SystemVssConnection -Require
    $accessToken = [string]($endpoint.auth.parameters.AccessToken)

    if(!$accessToken)
    {
        Throw (Get-VstsLocString -Key "PS_AccessTokenNotAvailable")
    }

    $ba = (":{0}" -f $accessToken)
    $ba = [System.Text.Encoding]::UTF8.GetBytes($ba)
    $ba = [System.Convert]::ToBase64String($ba)
    $headers = @{Authorization=("Basic{0}" -f $ba);ContentType="application/json"}

    $releaseUri = "$collectionUri/$teamProject/_apis/release/releases/$releaseId" + "?api-version=5.1"

    Write-Verbose "Fetching release.."

    $release = Invoke-RestMethod -Uri $releaseUri -Headers $headers -Method Get

    for($i = 0; $i -lt $stageVariableNamesArray.Length; $i++)
    {
        $stageVariableValue = Get-VstsTaskVariable -Name $stageVariableNamesArray[$i] -Require
        $value = [PSCustomObject]@{value=$stageVariableValue}
        Write-Host (Get-VstsLocString -Key "PS_AssignReleaseVariable" -ArgumentList $stageVariableNamesArray[$i], $releaseVariableNamesArray[$i])
        $release.variables | Add-Member -Name $releaseVariableNamesArray[$i] -MemberType NoteProperty -Value $value -Force
    }

    $updatedRelease = $release | ConvertTo-Json -Depth 100
    $updatedRelease = [Text.Encoding]::UTF8.GetBytes($updatedRelease)

    Write-Verbose "Updating release.."
    $content = Invoke-RestMethod -Uri $releaseUri -Method Put -Headers $headers -ContentType "application/json" -Body $updatedRelease -Verbose -Debug
    Write-Host (Get-VstsLocString -Key "PS_UpdatedRelease" -ArgumentList $content.id)
} 
finally {
	Trace-VstsLeavingInvocation $MyInvocation
}
