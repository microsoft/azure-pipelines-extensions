function Get-MachinePortDict
{
    param(
        [string]$machineList,
        [string]$protocol
    )

    $machinePortDict = @{}
    $machines = @()

    $machineList.split(',', [System.StringSplitOptions]::RemoveEmptyEntries) |`
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