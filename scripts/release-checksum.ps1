# Env Vault Release Artifact Checksum Generator
param(
    [string]$TargetDir = "release"
)

if (-not (Test-Path $TargetDir)) {
    Write-Warning "Directory '$TargetDir' does not exist. Checking 'portable' as fallback..."
    if (Test-Path "portable") {
        $TargetDir = "portable"
    } else {
        Write-Error "No artifact directory found!"
        exit 1
    }
}

Write-Host "Generating SHA-256 Checksums for artifacts in: $TargetDir" -ForegroundColor Cyan
Write-Host ("-" * 60)

$files = Get-ChildItem -Path $TargetDir -File | Where-Object { $_.Extension -in @(".exe", ".zip", ".msi") }

if ($files.Count -eq 0) {
    Write-Warning "No release binaries (.exe, .zip, .msi) found in $TargetDir."
    exit 0
}

foreach ($file in $files) {
    $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash.ToLower()
    $sha256File = "$($file.FullName).sha256"
    "$hash  $($file.Name)" | Out-File -FilePath $sha256File -Encoding ascii -NoNewline
    
    Write-Host "Artifact : $($file.Name)" -ForegroundColor Green
    Write-Host "SHA-256  : $hash" -ForegroundColor Yellow
    Write-Host "Saved to : $($file.Name).sha256" -ForegroundColor Gray
    Write-Host ("-" * 60)
}

Write-Host "Checksum generation completed successfully!" -ForegroundColor Cyan
