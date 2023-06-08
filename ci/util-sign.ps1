# !!! EXPERIMENTAL - use with caution !!!

param(
    [Parameter(Mandatory = $true)]
    [string]$rootFolder,
    [Parameter(Mandatory = $true)]
    [string]$action
)

# get all tasks (TODO: SampleTask and ArtifactEngine might be excluded)
$folders = Get-ChildItem -Path "$rootFolder\_build" -Recurse -Directory -Filter "Tasks" | Where-Object { $_.FullName -like "*src\tasks*" } | Select-Object FullName | ForEach-Object { Get-ChildItem $_.FullName -Directory | Select-Object FullName }

# temporarily only works for ExternalTfs, we can expand for all tasks later
$folders = $folders | Where-Object { $_.FullName -like "*ExternalTfs*" }

if ($action -eq "prepare") {
    # create nuspec file
    $nuspecTemplate = "<?xml version=""1.0"" encoding=""utf-8""?><package xmlns=""http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd""><metadata><id>_TASKNAME_</id><version>0.0.0</version><authors>Microsoft</authors><copyright>© Microsoft Corporation. All rights reserved.</copyright></metadata></package>"
    $nuspecFile = "task.nuspec"
    $folders | ForEach-Object { New-Item "$($_.FullName)\$nuspecFile" -ItemType File -Value $nuspecTemplate.Replace("_TASKNAME_", $(Split-Path $_.FullName -Leaf)) -Force | Out-Null }

    # create signing folder
    mkdir "$rootFolder\_signing" -Force | Out-Null

    # create zip for all folders
    $folders | ForEach-Object { Compress-Archive "$($_.FullName)\*" "$rootFolder\_signing\$(Split-Path $_.FullName -Leaf).zip" -Force }
}
elseif ($action -eq "finish") {
    # expand signed zips
    Get-ChildItem -Path "$rootFolder\_signing" -Filter "*.zip" | ForEach-Object { Expand-Archive $_.FullName "$rootFolder\_signing\$($_.BaseName)" }

    # get all signatures
    $signatures = Get-ChildItem -Path "$rootFolder\_signing" -Recurse -Filter "*.p7s" | Select-Object FullName

    # copy signatures to related folders
    $signatures | ForEach-Object {
        $currentFile = $_.FullName
        $currentParentName = $(Split-Path (Split-Path $currentFile) -Leaf)
        $targetPath = $folders | Where-Object { $_.FullName -like "*$currentParentName" }
        
        # copy signature
        Copy-Item $currentFile $targetPath.FullName -Force

        # remove current parent folder
        Remove-Item (Split-Path $currentFile -Parent) -Recurse -Force
    }
}