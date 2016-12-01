param([string] $baseDirectory,
      [string] $nugetAPIKey)

$subDirectories = Get-ChildItem -Directory $baseDirectory 

foreach($directory in $subDirectories) {
 
    try{
        $directoryName = $directory.Name
        Publish-Module -Path "$baseDirectory\$directoryName" -NuGetApiKey $nugetAPIKey
    }
    catch{
        Write-Warning $_.Exception
    }
}
