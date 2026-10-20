<#
.SYNOPSIS
    Tests whether a Google Gemini model has achieved its rate limit (HTTP 429 / Quota Exceeded)
    and allows switching to alternative healthy models in the Google API provider.

.DESCRIPTION
    Sends a test request using the exact OpenAI-compatible endpoint used by the backend.
    Accurately identifies:
      - 200 OK: Model is healthy with active quota.
      - 429 Too Many Requests: Rate limit achieved / Quota exhausted.
      - 404 Not Found: Model deprecated or unavailable.
      - 400/401/403: Authentication / Permission error.

.PARAMETER Model
    The model name to test (e.g. gemini-3.5-flash-lite, gemini-3.8-flash, etc.).
    Defaults to the model currently configured in backend/appsettings.json.

.PARAMETER ScanAll
    Benchmarks and reports the rate limit / quota status of all candidate Google Gemini models.

.PARAMETER SwitchTo
    Tests the target model, and if healthy, automatically updates backend/appsettings.json.

.PARAMETER ApiKey
    Optional override for the Google API Key. Defaults to backend/appsettings.json.

.EXAMPLE
    .\check-rate-limit.ps1
    .\check-rate-limit.ps1 -Model gemini-3.8-flash
    .\check-rate-limit.ps1 -ScanAll
    .\check-rate-limit.ps1 -SwitchTo gemini-3.5-flash-lite
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Model,

    [string]$ApiKey,

    [switch]$ScanAll,

    [string]$SwitchTo
)

$ErrorActionPreference = "Stop"

# 1. Resolve paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppSettingsPath = Join-Path $ScriptDir "backend\appsettings.json"

if (-not (Test-Path $AppSettingsPath)) {
    $AppSettingsPath = "backend\appsettings.json"
}

# 2. Extract API Key and configured Model from appsettings.json
$Config = $null
if (Test-Path $AppSettingsPath) {
    try {
        $Config = Get-Content $AppSettingsPath -Raw | ConvertFrom-Json
    } catch {
        Write-Warning "Could not parse $AppSettingsPath as JSON."
    }
}

if (-not $ApiKey) {
    if ($Config -and $Config.Google -and $Config.Google.ApiKey) {
        $ApiKey = $Config.Google.ApiKey
    } elseif ($env:GOOGLE_API_KEY) {
        $ApiKey = $env:GOOGLE_API_KEY
    }
}

if (-not $ApiKey) {
    Write-Error "No Google API Key found! Please configure 'Google:ApiKey' in backend/appsettings.json or set the GOOGLE_API_KEY environment variable."
    exit 1
}

$CurrentConfiguredModel = if ($Config -and $Config.Google -and $Config.Google.Model) { $Config.Google.Model } else { "gemini-3.5-flash-lite" }
$Endpoint = if ($Config -and $Config.Google -and $Config.Google.Endpoint) { $Config.Google.Endpoint } else { "https://generativelanguage.googleapis.com/v1beta/openai/" }

if (-not $Endpoint.EndsWith("/")) {
    $Endpoint += "/"
}
$CompletionsUrl = "${Endpoint}chat/completions"

# Primary models available on Google Gemini
$CandidateModels = @(
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.8-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
)

function Test-GeminiModel {
    param (
        [string]$TargetModel,
        [string]$Key,
        [string]$Url
    )

    $result = [PSCustomObject]@{
        Model        = $TargetModel
        Status       = "Unknown"
        StatusCode   = 0
        IsRateLimited= $false
        Message      = ""
        LatencyMs    = 0
        Timestamp    = (Get-Date).ToString("s")
    }

    $bodyObj = @{
        model = $TargetModel
        messages = @(
            @{ role = "user"; content = "respond with single word 'OK'" }
        )
        max_tokens = 5
        temperature = 0.1
    }
    $jsonBody = $bodyObj | ConvertTo-Json -Compress

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    $cmd = Get-Command curl.exe -ErrorAction SilentlyContinue
    $curlPath = if ($cmd) { $cmd.Source } else { $null }

    if ($curlPath) {
        $tempFile = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($tempFile, $jsonBody, [System.Text.Encoding]::UTF8)

            # -4 forces IPv4 to avoid IPv6 routing hangs on Windows networks
            $rawOutput = & $curlPath -4 -s -w "`n__STATUS__:%{http_code}`n__TIME__:%{time_total}" `
                -X POST $Url `
                -H "Authorization: Bearer $Key" `
                -H "Content-Type: application/json" `
                --data-binary "@$tempFile" `
                --max-time 45

            $stopwatch.Stop()
            $result.LatencyMs = [int]$stopwatch.ElapsedMilliseconds

            $lines = $rawOutput -split "`n"
            $statusLine = $lines | Where-Object { $_ -like "__STATUS__:*" } | Select-Object -Last 1
            $code = 0
            if ($statusLine) {
                $code = [int]($statusLine -replace "__STATUS__:", "").Trim()
            }
            $result.StatusCode = $code

            $bodyLines = $lines | Where-Object { $_ -notlike "__STATUS__:*" -and $_ -notlike "__TIME__:*" }
            $resBody = ($bodyLines -join "`n").Trim()

            if ($code -eq 200) {
                $result.Status = "HEALTHY"
                try {
                    $jsonRes = $resBody | ConvertFrom-Json
                    if ($jsonRes.choices -and $jsonRes.choices.Count -gt 0) {
                        $result.Message = ($jsonRes.choices[0].message.content).Trim()
                    } else {
                        $result.Message = "200 OK"
                    }
                } catch {
                    $result.Message = "200 OK"
                }
            } elseif ($code -eq 429) {
                $result.Status = "RATE_LIMITED"
                $result.IsRateLimited = $true
                $result.Message = "HTTP 429 Too Many Requests (Quota Exceeded / Rate Limit Reached)"
                try {
                    $errJson = $resBody | ConvertFrom-Json
                    if ($errJson.error -and $errJson.error.message) {
                        $result.Message = "429 Rate Limit: " + $errJson.error.message
                    }
                } catch {}
            } elseif ($code -eq 404) {
                $result.Status = "NOT_FOUND"
                $result.Message = "HTTP 404 Model Not Found / Unsupported"
                try {
                    $errJson = $resBody | ConvertFrom-Json
                    if ($errJson.error -and $errJson.error.message) {
                        $result.Message = "404: " + $errJson.error.message
                    }
                } catch {}
            } elseif ($code -eq 400 -or $code -eq 401 -or $code -eq 403) {
                $result.Status = "AUTH_ERROR"
                $result.Message = "HTTP $code Auth Error"
                try {
                    $errJson = $resBody | ConvertFrom-Json
                    if ($errJson.error -and $errJson.error.message) {
                        $result.Message = "$($code): " + $errJson.error.message
                    }
                } catch {}
            } else {
                $result.Status = "ERROR_$($code)"
                $result.Message = if ($resBody) { $resBody } else { "HTTP $code" }
            }
            return $result
        }
        catch {
            $stopwatch.Stop()
            $result.LatencyMs = [int]$stopwatch.ElapsedMilliseconds
            $result.Status = "EXECUTION_ERROR"
            $result.Message = $_.Exception.Message
            return $result
        }
        finally {
            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        }
    }

    # Fallback to Net.Http.HttpClient with IPv4 preference
    try {
        Add-Type -AssemblyName System.Net.Http
        $handler = New-Object System.Net.Http.HttpClientHandler
        $client = New-Object System.Net.Http.HttpClient($handler)
        $client.Timeout = [System.TimeSpan]::FromSeconds(45)

        $content = New-Object System.Net.Http.StringContent($jsonBody, [System.Text.Encoding]::UTF8, "application/json")
        $client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $Key)

        $httpRes = $client.PostAsync($Url, $content).GetAwaiter().GetResult()
        $stopwatch.Stop()
        $result.LatencyMs = [int]$stopwatch.ElapsedMilliseconds
        $result.StatusCode = [int]$httpRes.StatusCode

        $resBody = $httpRes.Content.ReadAsStringAsync().GetAwaiter().GetResult()

        if ($httpRes.IsSuccessStatusCode) {
            $result.Status = "HEALTHY"
            try {
                $jsonRes = $resBody | ConvertFrom-Json
                $result.Message = ($jsonRes.choices[0].message.content).Trim()
            } catch {
                $result.Message = "200 OK"
            }
        } elseif ($result.StatusCode -eq 429) {
            $result.Status = "RATE_LIMITED"
            $result.IsRateLimited = $true
            $result.Message = "HTTP 429 Too Many Requests (Quota Exceeded / Rate Limit Reached)"
        } else {
            $result.Status = "ERROR_$($result.StatusCode)"
            $result.Message = $resBody
        }
    } catch {
        $stopwatch.Stop()
        $result.LatencyMs = [int]$stopwatch.ElapsedMilliseconds
        $result.Status = "NETWORK_ERROR"
        $result.Message = $_.Exception.Message
    }

    return $result
}

function Switch-ConfiguredModel {
    param (
        [string]$NewModel,
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        Write-Warning "Cannot switch model: File not found at $Path"
        return $false
    }

    try {
        $raw = Get-Content $Path -Raw
        $json = $raw | ConvertFrom-Json
        $old = $json.Google.Model
        $json.Google.Model = $NewModel
        $newJson = $json | ConvertTo-Json -Depth 10
        Set-Content -Path $Path -Value $newJson -Encoding UTF8
        Write-Host "`n [SUCCESS] Switched backend model in appsettings.json from '$old' to '$NewModel'!" -ForegroundColor Green
        Write-Host " Restart the backend (or run-all) to apply the change." -ForegroundColor Yellow
        return $true
    } catch {
        Write-Error "Failed to update appsettings.json: $_"
        return $false
    }
}

# ----------------- Main Execution -----------------
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    Google Gemini API Rate Limit & Model Quota Checker    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Config Path   : $AppSettingsPath" -ForegroundColor Gray
Write-Host "Current Model : $CurrentConfiguredModel" -ForegroundColor Gray
Write-Host "Endpoint      : $CompletionsUrl" -ForegroundColor Gray
Write-Host "Key (masked)  : $($ApiKey.Substring(0, [Math]::Min(12, $ApiKey.Length)))..." -ForegroundColor Gray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if ($SwitchTo) {
    Write-Host "`nTesting target model '$SwitchTo' before switching..." -ForegroundColor Yellow
    $res = Test-GeminiModel -TargetModel $SwitchTo -Key $ApiKey -Url $CompletionsUrl
    if ($res.Status -eq "HEALTHY") {
        Write-Host " [OK] Model '$SwitchTo' responded successfully in $($res.LatencyMs) ms!" -ForegroundColor Green
        Switch-ConfiguredModel -NewModel $SwitchTo -Path $AppSettingsPath
    } elseif ($res.IsRateLimited) {
        Write-Host " [REJECTED] Model '$SwitchTo' is currently RATE LIMITED (HTTP 429)!" -ForegroundColor Red
        Write-Host " Message: $($res.Message)" -ForegroundColor Yellow
    } else {
        Write-Host " [FAILED] Cannot switch to '$SwitchTo'. Status: $($res.Status)" -ForegroundColor Red
        Write-Host " Details: $($res.Message)" -ForegroundColor Gray
    }
    exit 0
}

if ($ScanAll) {
    Write-Host "`nScanning candidate Google Gemini models for rate limits and available quota..." -ForegroundColor Yellow
    $results = @()
    foreach ($cand in $CandidateModels) {
        Write-Host -NoNewline " Testing $cand ... "
        $t = Test-GeminiModel -TargetModel $cand -Key $ApiKey -Url $CompletionsUrl
        if ($t.Status -eq "HEALTHY") {
            Write-Host "HEALTHY ($($t.LatencyMs) ms)" -ForegroundColor Green
        } elseif ($t.IsRateLimited) {
            Write-Host "RATE LIMITED (429)" -ForegroundColor Red
        } elseif ($t.Status -eq "NOT_FOUND") {
            Write-Host "NOT FOUND / DEPRECATED" -ForegroundColor DarkGray
        } else {
            Write-Host "$($t.Status) ($($t.StatusCode))" -ForegroundColor Yellow
        }
        $results += $t
    }

    Write-Host "`n====================== SCAN SUMMARY ======================" -ForegroundColor Cyan
    $results | Format-Table -Property @(
        @{ Label = "Model"; Expression = { $_.Model } },
        @{ Label = "Status"; Expression = { $_.Status } },
        @{ Label = "Code"; Expression = { $_.StatusCode } },
        @{ Label = "Latency"; Expression = { "$($_.LatencyMs) ms" } },
        @{ Label = "Detail / Reply"; Expression = { $_.Message } }
    )

    $healthy = $results | Where-Object { $_.Status -eq "HEALTHY" }
    if ($healthy.Count -gt 0) {
        Write-Host "Healthy Models Available: $(($healthy | ForEach-Object { $_.Model }) -join ', ')" -ForegroundColor Green
        Write-Host "Tip: Run .\check-rate-limit.ps1 -SwitchTo $($healthy[0].Model) to automatically switch!" -ForegroundColor Cyan
    } else {
        Write-Host "All tested models are currently rate-limited or unavailable under your key." -ForegroundColor Red
    }
    exit 0
}

# Single Model Test (Default to current model if not specified)
$ModelToTest = if ($Model) { $Model } else { $CurrentConfiguredModel }
Write-Host "`nTesting model: $ModelToTest ..." -ForegroundColor Yellow

$testResult = Test-GeminiModel -TargetModel $ModelToTest -Key $ApiKey -Url $CompletionsUrl

Write-Host "Status Code   : $($testResult.StatusCode)"
Write-Host "Latency       : $($testResult.LatencyMs) ms"

if ($testResult.Status -eq "HEALTHY") {
    Write-Host "`n[RESULT] HEALTHY! No rate limit hit." -ForegroundColor Green
    Write-Host "Reply from model : $($testResult.Message)" -ForegroundColor Gray
    Write-Host "Quota is active and ready for multi-agent execution." -ForegroundColor Green
} elseif ($testResult.IsRateLimited) {
    Write-Host "`n[ALERT] RATE LIMIT ACHIEVED / QUOTA EXCEEDED (HTTP 429)!" -ForegroundColor Red
    Write-Host "Details: $($testResult.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing alternative models available in your Google API provider..." -ForegroundColor Cyan
    
    $altFound = $null
    foreach ($cand in $CandidateModels) {
        if ($cand -ne $ModelToTest) {
            Write-Host -NoNewline " Testing alternative: $cand ... "
            $candRes = Test-GeminiModel -TargetModel $cand -Key $ApiKey -Url $CompletionsUrl
            if ($candRes.Status -eq "HEALTHY") {
                Write-Host "HEALTHY ($($candRes.LatencyMs) ms)!" -ForegroundColor Green
                if (-not $altFound) { $altFound = $cand }
            } elseif ($candRes.IsRateLimited) {
                Write-Host "RATE LIMITED (429)" -ForegroundColor Red
            } elseif ($candRes.Status -eq "NOT_FOUND") {
                Write-Host "DEPRECATED (404)" -ForegroundColor DarkGray
            } else {
                Write-Host "$($candRes.Status)" -ForegroundColor Yellow
            }
        }
    }

    if ($altFound) {
        Write-Host "`nAlternative healthy model found: $altFound" -ForegroundColor Green
        Write-Host "To switch backend/appsettings.json to this model, run:" -ForegroundColor Cyan
        Write-Host "  .\check-rate-limit.ps1 -SwitchTo $altFound" -ForegroundColor White
    } else {
        Write-Host "`nAll candidate models appear to be rate-limited or unavailable under your key." -ForegroundColor Red
    }
} else {
    Write-Host "`n[RESULT] Status: $($testResult.Status)" -ForegroundColor Yellow
    Write-Host "Details: $($testResult.Message)" -ForegroundColor Gray
}
Write-Host "==========================================================`n" -ForegroundColor Cyan
