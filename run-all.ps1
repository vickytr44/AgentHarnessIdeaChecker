# run-all.ps1 - Start both Backend (.NET) and Frontend (Next.js)

param(
    [switch]$NewWindow = $false
)

$rootDir = $PSScriptRoot
if (-not $rootDir) {
    $rootDir = Get-Location
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Starting IdeaChecker (Backend + Frontend)   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 0. Clean up any stale processes on target ports
$stalePorts = 5053, 3000
foreach ($port in $stalePorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            if ($conn.OwningProcess -and $conn.OwningProcess -ne $PID) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 1. Launch Backend
Write-Host "[1/2] Launching Backend (.NET) on http://localhost:5053..." -ForegroundColor Green
$env:ASPNETCORE_URLS = "http://localhost:5053"
$env:ASPNETCORE_ENVIRONMENT = "Development"

$backendDll = "$rootDir\backend\bin\Debug\net10.0\AgentHarness.dll"
if (-not (Test-Path $backendDll)) {
    Write-Host "Building backend binary..." -ForegroundColor Gray
    dotnet build "$rootDir\backend\AgentHarness.csproj" -c Debug --nologo
}

$backendArgs = @{
    FilePath = "dotnet"
    ArgumentList = @($backendDll)
    WorkingDirectory = "$rootDir\backend"
    PassThru = $true
}
if (-not $NewWindow) {
    $backendArgs["NoNewWindow"] = $true
}
$backendProc = Start-Process @backendArgs

# Brief pause to let backend bind port
Start-Sleep -Seconds 2

# 2. Launch Frontend
Write-Host "[2/2] Launching Frontend (Next.js) on http://localhost:3000..." -ForegroundColor Green
$frontendArgs = @{
    FilePath = "npm.cmd"
    ArgumentList = @("run", "dev")
    WorkingDirectory = "$rootDir\frontend"
    PassThru = $true
}
if (-not $NewWindow) {
    $frontendArgs["NoNewWindow"] = $true
}
$frontendProc = Start-Process @frontendArgs

Write-Host ""
Write-Host "Both services are active:" -ForegroundColor Cyan
Write-Host " -> Backend AG-UI: http://localhost:5053" -ForegroundColor Yellow
Write-Host " -> Frontend UI:   http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to terminate both services." -ForegroundColor Gray

try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-Warning "Backend process exited with code $($backendProc.ExitCode)"
            break
        }
        if ($frontendProc.HasExited) {
            Write-Warning "Frontend process exited with code $($frontendProc.ExitCode)"
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nShutting down services..." -ForegroundColor Magenta
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "AgentHarness" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    foreach ($port in $stalePorts) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                if ($conn.OwningProcess -and $conn.OwningProcess -ne $PID) {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    Write-Host "Shutdown complete." -ForegroundColor Gray
}
