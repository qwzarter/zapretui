function Write-ColorHost {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-GameFilterStatus {
    $scriptRoot = $PSScriptRoot
    $gameFlagFile = Join-Path $scriptRoot "bin\game_filter.enabled"

    $GameFilterStatus = "disabled"
    $GameFilter = "0"
    if (Test-Path $gameFlagFile) {
        $GameFilterStatus = "enabled"
        $GameFilter = "1024-65535"
    }

    [PSCustomObject]@{
        Status     = $GameFilterStatus;
        FilterValue = $GameFilter
    } | ConvertTo-Json -Compress | Out-String
}

function Test-ZapretService {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ServiceName,
        [switch]$SoftMode
    )

    $Service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

    if ($Service -and $Service.Status -eq 'Running') {
        if ($SoftMode) {
            Write-ColorHost ("`"{0}`" уже ЗАПУЩЕН как служба, используйте `"{1}\service.bat`" и выберите `"`Remove Services`" first if you want to run standalone bat." -f $ServiceName, $PSScriptRoot) "Yellow"
            return $true
        } else {
            Write-ColorHost ("Служба `"{0}`" ЗАПУЩЕНА." -f $ServiceName) "Green"
            return $true
        }
    } else {
        if (-not $SoftMode) {
            Write-ColorHost ("Служба `"{0}`" НЕ ЗАПУЩЕНА." -f $ServiceName) "Red"
        }
        return $false
    }
}

function Set-GameFilterStatus {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Action
    )

    $scriptRoot = $PSScriptRoot
    $gameFlagFile = Join-Path $scriptRoot "bin\game_filter.enabled"

    $success = $false
    $message = ""

    try {
        if ($Action -eq 'enable') {
            if (-not (Test-Path $gameFlagFile)) {
                "ENABLED" | Out-File -FilePath $gameFlagFile -Encoding UTF8 -ErrorAction Stop
                $success = $true
                $message = "Игровой фильтр ВКЛЮЧЕН."
            } else {
                $success = $true
                $message = "Игровой фильтр уже ВКЛЮЧЕН."
            }
        } elseif ($Action -eq 'disable') {
            if (Test-Path $gameFlagFile) {
                Remove-Item -Path $gameFlagFile -Force -ErrorAction Stop
                $success = $true
                $message = "Игровой фильтр ВЫКЛЮЧЕН."
            } else {
                $success = $true
                $message = "Игровой фильтр уже ВЫКЛЮЧЕН."
            }
        } else {
            $message = "Неверный аргумент для Set-GameFilterStatus. Используйте 'enable' или 'disable'."
        }
    } catch {
        $message = "Ошибка при операции с файлом game_filter.enabled: $($_.Exception.Message)"
    }

    [PSCustomObject]@{
        success = $success;
        message = $message
    } | ConvertTo-Json -Compress | Out-String
}

function Get-ZapretBypassStatus {
    $winwsProcessRunning = (Get-Process -Name "winws" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0

    $zapretServiceRunning = (Get-Service -Name "zapret" -ErrorAction SilentlyContinue).Status -eq 'Running'

    $windivertServiceRunning = (Get-Service -Name "WinDivert" -ErrorAction SilentlyContinue).Status -eq 'Running'
    $windivert14ServiceRunning = (Get-Service -Name "WinDivert14" -ErrorAction SilentlyContinue).Status -eq 'Running'

    $overallConnected = $winwsProcessRunning -or $zapretServiceRunning

    [PSCustomObject]@{
        isRunning             = $overallConnected;
        winwsProcessStatus    = $winwsProcessRunning;
        zapretServiceStatus   = $zapretServiceRunning;
        winDivertServiceStatus = $windivertServiceRunning;
        winDivert14ServiceStatus = $windivert14ServiceRunning;
        message               = if ($overallConnected) { "Обход (Bypass) АКТИВЕН" } else { "Обход (Bypass) НЕ НАЙДЕН" };
    }
}