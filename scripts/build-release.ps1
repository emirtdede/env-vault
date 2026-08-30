# Env Vault Automated Release Builder
$ErrorActionPreference = "Stop"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $rootDir

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                  Env Vault v1.0.0 - Production Release Builder               " -ForegroundColor White
Write-Host "                                 Vellium (c) 2026                             " -ForegroundColor DarkGray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Sürüm Tutarlılık Kontrolü Yapılıyor..." -ForegroundColor Yellow
node scripts/check-version-consistency.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "[HATA] Sürüm tutarsızlığı tespit edildi!" -ForegroundColor Red
    exit 1
}

Write-Host "[2/6] Eski Derleme Artıkları ve Geçici Dosyalar Temizleniyor..." -ForegroundColor Yellow
# Stop any running instances first
Get-Process | Where-Object { $_.Path -like "*Env-Vault*" -or $_.Name -like "*env-vault*" -or $_.ProcessName -like "*env-vault*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Remove-Item -Path "dist", "portable", "src-tauri\target\release\bundle", "src-tauri\target\release\wix", "src-tauri\target\release\env-vault.exe" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\Env-Vault-1.0.0-*" -Force -ErrorAction SilentlyContinue

Write-Host "[3/6] Testler Çalıştırılıyor..." -ForegroundColor Yellow
npm test -- --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "[HATA] Frontend testleri başarısız!" -ForegroundColor Red
    exit 1
}

Set-Location (Join-Path $rootDir "src-tauri")
cargo test
if ($LASTEXITCODE -ne 0) {
    Write-Host "[HATA] Rust testleri başarısız!" -ForegroundColor Red
    exit 1
}
Set-Location $rootDir

Write-Host "[4/6] Tauri Production Build Alınıyor (NSIS + MSI + Standalone)..." -ForegroundColor Yellow
python (Join-Path $rootDir "scripts\generate-nsis-assets.py")
npx @tauri-apps/cli build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[HATA] Tauri derleme işlemi başarısız!" -ForegroundColor Red
    exit 1
}

# NSIS Başlık Hizalaması & Uninstaller İkon Yaması
$patchScript = Join-Path $rootDir "scripts\patch-nsis.py"
$nsiScript = Join-Path $rootDir "src-tauri\target\release\nsis\x64\installer.nsi"
$makensisExe = "C:\Users\emir\AppData\Local\tauri\NSIS\makensis.exe"

if (Test-Path $nsiScript) {
    Write-Host "NSIS Başlık Hizalaması ve Kaldırma İkonu Entegre Ediliyor..." -ForegroundColor Cyan
    python $patchScript

    if (Test-Path $makensisExe) {
        & $makensisExe $nsiScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[UYARI] NSIS yeniden paketleme başarısız oldu, varsayılan paket kullanılacak." -ForegroundColor Yellow
        } else {
            Write-Host "NSIS Kurulum ve Kaldırma Paketi Kusursuz Hizalama ile Güncellendi!" -ForegroundColor Green
        }
    }
}

Write-Host "[5/6] Release Paketleri Hazırlanıyor..." -ForegroundColor Yellow
$releaseDir = Join-Path $rootDir "release"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
}

# Ensure no running instance blocks overwriting
Get-Process | Where-Object { $_.Path -like "*Env-Vault*" -or $_.Name -like "*env-vault*" -or $_.ProcessName -like "*env-vault*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$nsisSource = Join-Path $rootDir "src-tauri\target\release\bundle\nsis\Env Vault_1.0.0_x64-setup.exe"
$msiSource = Join-Path $rootDir "src-tauri\target\release\bundle\msi\Env Vault_1.0.0_x64_tr-TR.msi"
$exeSource = Join-Path $rootDir "src-tauri\target\release\env-vault.exe"

Copy-Item $nsisSource (Join-Path $releaseDir "Env-Vault-1.0.0-Windows-x64-Setup.exe") -Force
Copy-Item $msiSource (Join-Path $releaseDir "Env-Vault-1.0.0-Windows-x64.msi") -Force
Copy-Item $exeSource (Join-Path $releaseDir "Env-Vault-1.0.0-Windows-x64-Portable.exe") -Force

# Create portable zip
$licenseFile = Join-Path $rootDir "LICENSE"
$zipTarget = Join-Path $releaseDir "Env-Vault-1.0.0-Windows-x64-Portable.zip"
if (Test-Path $zipTarget) {
    Remove-Item -Path $zipTarget -Force -ErrorAction SilentlyContinue
}
tar.exe -a -c -f "$zipTarget" -C "$releaseDir" "Env-Vault-1.0.0-Windows-x64-Portable.exe" -C "$rootDir" "LICENSE"

Write-Host "[6/6] SHA-256 Checksum Listesi Üretiliyor..." -ForegroundColor Yellow
$files = Get-ChildItem -Path $releaseDir -File | Where-Object { $_.Name -like "Env-Vault-1.0.0-*" }
$lines = foreach ($file in $files) {
    $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash.ToLower()
    "$hash  $($file.Name)"
}
$checksumPath = Join-Path $releaseDir "SHA256SUMS.txt"
$lines | Out-File -FilePath $checksumPath -Encoding UTF8 -Force

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "              TEBRİKLER: Env Vault v1.0.0 Başarıyla Derlendi!                 " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "Paketler 'release/' klasörüne kaydedildi:" -ForegroundColor White
Get-Content $checksumPath | ForEach-Object { Write-Host " - $_" -ForegroundColor Cyan }
Write-Host "===============================================================================" -ForegroundColor Green
