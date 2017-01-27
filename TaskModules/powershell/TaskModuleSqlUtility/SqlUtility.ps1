function ConvertFrom-Json20([object] $InputObject){ 
    add-type -assembly system.web.extensions
    $scriptSerializer=new-object system.web.script.serialization.javascriptSerializer
    #The comma operator is the array construction operator in PowerShell
    return ,$scriptSerializer.DeserializeObject($InputObject)
}

function ConvertTo-Json20([object] $InputObject){
    add-type -assembly system.web.extensions
    $scriptSerializer=new-object system.web.script.serialization.javascriptSerializer
    return $scriptSerializer.Serialize($InputObject)
}

function convertTo-JsonFormat($InputObject) {
    if (Get-Command ConvertTo-Json -ErrorAction SilentlyContinue)
    {
        $jsonOutput = ConvertTo-Json -InputObject $InputObject
    } 
    else
    {
        $jsonOutput = ConvertTo-Json20 -InputObject $InputObject
    }
    return $jsonOutput
}

function convertFrom-JsonFormat($InputObject) {
    if (Get-Command ConvertTo-Json -ErrorAction SilentlyContinue)
    {
        $convertedObject = ConvertFrom-Json -InputObject $InputObject
    } 
    else
    {
        $convertedObject = ConvertFrom-Json20 -InputObject $InputObject
    }
    return $convertedObject
}
