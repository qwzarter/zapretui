. (Join-Path $PSScriptRoot "service.ps1")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location -Path $PSScriptRoot

$gameFilterJsonString = (Get-GameFilterStatus | Out-String).Trim()
try {
    if (-not [string]::IsNullOrWhiteSpace($gameFilterJsonString)) {
        $gameFilterResult = $gameFilterJsonString | ConvertFrom-Json
    } else {
        $gameFilterResult = [PSCustomObject]@{ FilterValue = "" }
    }
}
catch {
    Write-Error "Не удалось распарсить JSON из Get-GameFilterStatus: $($_.Exception.Message)"
    $gameFilterResult = [PSCustomObject]@{ FilterValue = "" }
}
$GameFilter = $gameFilterResult.FilterValue

$status = Get-ZapretBypassStatus
Write-Host $status.message
Write-Host ""

$BIN = Join-Path $PSScriptRoot "bin\"
$LISTS = Join-Path $PSScriptRoot "lists\"

$WinWSArgs = @(
    "--wf-tcp=80,443,$GameFilter",
    "--wf-udp=443,50000-50100,$GameFilter",
    "--filter-udp=443",
    "--hostlist=`"$LISTS`list-general.txt`"",
    "--dpi-desync=fake",
    "--dpi-desync-repeats=6",
    "--dpi-desync-fake-quic=`"$BIN`quic_initial_www_google_com.bin`"",
    "--new",
    "--filter-udp=50000-50100",
    "--filter-l7=discord,stun",
    "--dpi-desync=fake",
    "--dpi-desync-repeats=6",
    "--new",
    "--filter-tcp=80",
    "--hostlist=`"$LISTS`list-general.txt`"",
    "--dpi-desync=fake,multisplit",
    "--dpi-desync-autottl=2",
    "--dpi-desync-fooling=md5sig",
    "--new",
    "--filter-tcp=443",
    "--hostlist=`"$LISTS`list-general.txt`"",
    "--dpi-desync=fake,multidisorder",
    "--dpi-desync-split-pos=midsld",
    "--dpi-desync-repeats=8",
    "--dpi-desync-fooling=md5sig,badseq",
    "--new",
    "--filter-udp=443",
    "--ipset=`"$LISTS`ipset-all.txt`"",
    "--dpi-desync=fake",
    "--dpi-desync-repeats=6",
    "--dpi-desync-fake-quic=`"$BIN`quic_initial_www_google_com.bin`"",
    "--new"
)

Start-Process -FilePath (Join-Path $BIN "winws.exe") -ArgumentList $WinWSArgs -WindowStyle Hidden