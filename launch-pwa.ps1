# Grant Crosswalk PWA PowerShell Launcher
Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Grant Crosswalk PWA..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Check if port 8000 is running
$portActive = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if (-not $portActive) {
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    Start-Sleep -Seconds 1
}

# Launch in standalone App mode
$edgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

$browserFound = $false
foreach ($path in $edgePaths) {
    if (Test-Path $path) {
        Start-Process $path -ArgumentList "--app=http://localhost:8000"
        $browserFound = $true
        break
    }
}

if (-not $browserFound -and (Test-Path $chromePath)) {
    Start-Process $chromePath -ArgumentList "--app=http://localhost:8000"
    $browserFound = $true
}

if (-not $browserFound) {
    Start-Process "http://localhost:8000"
}

Write-Host "Grant Crosswalk is now open in standalone app mode at http://localhost:8000" -ForegroundColor Green
