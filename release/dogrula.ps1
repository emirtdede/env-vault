# Env Vault SHA-256 Checksum Validator
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$checksumFile = Join-Path $scriptDir "SHA256SUMS.txt"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "            Env Vault v1.0.0 - SHA-256 Dosya Dogrulayici                      " -ForegroundColor White
Write-Host "                               Vellium (c) 2026                               " -ForegroundColor DarkGray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $checksumFile)) {
    Write-Host "[HATA] SHA256SUMS.txt dosyasi bulunamadi!" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $checksumFile -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }
$allValid = $true
$checkedCount = 0

foreach ($line in $lines) {
    $parts = $line.Trim() -split '\s+'
    if ($parts.Length -lt 2) { continue }
    $expectedHash = $parts[0].ToLower()
    $fileName = $parts[1]
    $filePath = Join-Path $scriptDir $fileName

    if (-not (Test-Path $filePath)) {
        Write-Host "[EKSIK]  $fileName -> Dosya bulunamadi!" -ForegroundColor Yellow
        $allValid = $false
        continue
    }

    $actualHash = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash.ToLower()
    $checkedCount++

    if ($expectedHash -eq $actualHash) {
        Write-Host "[TAMAM]  $fileName -> SHA-256 DOGRULANDI" -ForegroundColor Green
        Write-Host "         Hash: $actualHash" -ForegroundColor DarkGray
    } else {
        Write-Host "[HATA]   $fileName -> HASH UYUSMAZLIGI!" -ForegroundColor Red
        Write-Host "         Beklenen : $expectedHash" -ForegroundColor DarkYellow
        Write-Host "         Hesaplanan: $actualHash" -ForegroundColor DarkRed
        $allValid = $false
    }
    Write-Host ""
}

if ($allValid -and ($checkedCount -gt 0)) {
    Write-Host "===============================================================================" -ForegroundColor Green
    Write-Host " TEBRIKLER: $checkedCount adet dosyanin SHA-256 hash imzalari dogrulandi." -ForegroundColor Green
    Write-Host " Dosyalar orijinaldir ve guvenle kullanilabilir." -ForegroundColor Green
    Write-Host "===============================================================================" -ForegroundColor Green
} else {
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host " UYARI: Bir veya daha fazla dosyada dogrulama basarisiz oldu!" -ForegroundColor Red
    Write-Host "===============================================================================" -ForegroundColor Red
}
