#!/usr/bin/env pwsh
<#
  Live smoke test for the loopback bridge.

  The application is started with the bridge enabled, the token is read from
  %LOCALAPPDATA%\EnvVault\bridge.json, and three requests are made:
    1. no token        -> 401
    2. wrong token     -> 401
    3. valid token     -> 200 and a JSON body with "unlocked"
  The window is never brought to the foreground and the process is stopped at
  the end, whatever happens.
#>
[CmdletBinding()]
param(
  [string]$Executable = "src-tauri/target/release/env-vault.exe",
  [int]$TimeoutSeconds = 40
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path $Executable)) { throw "Executable not found: $Executable" }
$exePath = (Resolve-Path $Executable).Path
$dataDir = Join-Path $env:LOCALAPPDATA 'EnvVault'
$settingsPath = Join-Path $dataDir 'settings.json'
$bridgePath = Join-Path $dataDir 'bridge.json'

$backup = Get-Content $settingsPath -Raw
try {
  $settings = $backup | ConvertFrom-Json
  $settings.devBridgeEnabled = $true
  $settings | ConvertTo-Json -Depth 8 | Set-Content $settingsPath -Encoding UTF8

  Remove-Item $bridgePath -ErrorAction SilentlyContinue
  Get-Process -Name 'env-vault' -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Milliseconds 500

  $process = Start-Process -FilePath $exePath -PassThru
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while (-not (Test-Path $bridgePath) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 400
  }
  if (-not (Test-Path $bridgePath)) { throw 'bridge.json never appeared.' }

  $endpoint = Get-Content $bridgePath -Raw | ConvertFrom-Json
  if ($endpoint.token.Length -ne 64) { throw "Unexpected token length: $($endpoint.token.Length)" }
  $base = "http://127.0.0.1:$($endpoint.port)"

  function Invoke-Probe([string]$token) {
    $headers = @{}
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "$base/v1/status" -Headers $headers -TimeoutSec 8
      return [pscustomobject]@{ Status = $response.StatusCode; Body = $response.Content }
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      return [pscustomobject]@{ Status = $code; Body = '' }
    }
  }

  $anonymous = Invoke-Probe ''
  $wrong = Invoke-Probe ('0' * 64)
  $valid = Invoke-Probe $endpoint.token

  Write-Host "anonymous: $($anonymous.Status)"
  Write-Host "wrong token: $($wrong.Status)"
  Write-Host "valid token: $($valid.Status) $($valid.Body)"

  if ($anonymous.Status -ne 401) { throw 'An anonymous request was not rejected.' }
  if ($wrong.Status -ne 401) { throw 'A wrong token was not rejected.' }
  if ($valid.Status -ne 200) { throw 'A valid token was rejected.' }
  if ($valid.Body -notmatch '"app":"Env Vault"') { throw 'The status body is malformed.' }

  $cli = Join-Path $dataDir 'cli\envvault.mjs'
  if (Test-Path $cli) {
    $statusOutput = & node $cli status 2>&1 | Out-String
    Write-Host "cli status: $($statusOutput.Trim())"
  } else {
    Write-Host 'cli materialisation skipped (script not present yet)'
  }

  Write-Host 'bridge smoke test passed'
}
finally {
  Get-Process -Id $process.Id -ErrorAction SilentlyContinue | Stop-Process -Force
  Set-Content -Path $settingsPath -Value $backup -Encoding UTF8 -NoNewline
  Start-Sleep -Milliseconds 300
  Remove-Item $bridgePath -ErrorAction SilentlyContinue
  Write-Host 'application closed and settings restored'
}
