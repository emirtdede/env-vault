# Env Vault — Release & Publication Metadata Specification

Bu doküman **Env Vault v1.0.0** üretim sürümü (production release) öncesindeki tüm yayın kimliğini, yapılandırma dosyalarındaki kaynak eşlemelerini, installer davranışını, code signing politikasını ve artifact standartlarını belgeler.

---

## 1. Nihai Metadata Özeti (Master Metadata Matrix)

| Alan (Field) | Değer (Final Value) | Tanımlandığı Dosya(lar) | Durum |
| :--- | :--- | :--- | :--- |
| **Product Name** | `Env Vault` | `src-tauri/tauri.conf.json` (`productName`) | ✅ Doğrulandı |
| **Product Version** | `1.0.0` | `src-tauri/tauri.conf.json`, `Cargo.toml`, `package.json` | ✅ Doğrulandı (Senkronize) |
| **File Version** | `1.0.0.0` | `src-tauri/tauri.conf.json` (`version`) | ✅ Doğrulandı |
| **Identifier** | `com.vellium.envvault` | `src-tauri/tauri.conf.json` (`identifier`) | ✅ Doğrulandı |
| **Publisher** | `Vellium` | `src-tauri/tauri.conf.json` (`bundle.publisher`), `Cargo.toml`, `package.json` | ✅ Doğrulandı |
| **Copyright** | `© 2026 Vellium. Tüm hakları saklıdır.` | `src-tauri/tauri.conf.json` (`bundle.copyright`) | ✅ Doğrulandı |
| **Category** | `DeveloperTool` | `src-tauri/tauri.conf.json` (`bundle.category`) | ✅ Doğrulandı |
| **Short Description** | `.env dosyalarınızı proje klasörlerinden bağımsız olarak şifreli biçimde saklayın, düzenleyin ve istediğiniz zaman dışa aktarın.` | `src-tauri/tauri.conf.json`, `package.json`, `Cargo.toml` | ✅ Doğrulandı |
| **Long Description** | `Env Vault, yazılım geliştiricilerin .env dosyalarını proje klasörlerinden bağımsız olarak yerel ve şifreli biçimde saklamasını sağlayan bir Windows masaüstü uygulamasıdır. Ortam dosyalarınızı sürükleyip bırakarak veya Ekle düğmesiyle Vault'a aktarabilir, düzenleyebilir, yönetebilir ve gerektiğinde tekrar .env dosyası olarak dışa aktarabilirsiniz. Kaynak proje veya .env dosyası daha sonra silinse bile Vault'a aktarılan şifreli kopya korunur. Env Vault temel işlevleri için internet bağlantısı gerektirmez ve secret verilerinizi uzak bir servise göndermez.` | `src-tauri/tauri.conf.json` (`bundle.longDescription`) | ✅ Doğrulandı |
| **Default Language** | `Turkish` (Türkçe) | `src-tauri/tauri.conf.json` (`bundle.windows.nsis.languages`) | ✅ Doğrulandı |
| **Architecture** | `x64` (64-bit Windows) | Derleme hedefi (`x86_64-pc-windows-msvc`) | ✅ Doğrulandı |
| **Installer Type** | `NSIS` (Nullsoft Scriptable Install System) | `src-tauri/tauri.conf.json` (`bundle.targets: ["nsis"]`) | ✅ Doğrulandı |
| **Install Scope** | `Current User` (`currentUser`) | `src-tauri/tauri.conf.json` (`bundle.windows.nsis.installMode`) | ✅ Doğrulandı |
| **Network Requirement** | `None` (Sıfır Ağ / Tamamen Yerel ve Çevrimdışı) | Mimaride yerleşik | ✅ Doğrulandı |
| **Telemetry & Analytics**| `None` (Hiçbir telemetri veya izleme bulunmaz) | Mimaride yerleşik | ✅ Doğrulandı |
| **DevTools** | `Disabled` in Release | `src-tauri/Cargo.toml` (Release profilinde kapalı) | ✅ Doğrulandı |
| **Homepage URL** | `https://vellium.dev` | `package.json`, `Cargo.toml`, `RELEASE-NOTES.md` | ✅ Doğrulandı |
| **Support URL / Email** | `https://vellium.dev` | `README-KURULUM.txt`, `RELEASE-NOTES.md` | ✅ Doğrulandı |
| **License Model** | `MIT License` | `LICENSE` | ✅ Doğrulandı |

---

## 2. Windows Executable & Installed Apps Entegrasyonu

### Windows Yüklü Uygulamalar (Settings → Apps → Installed Apps)
Uygulama NSIS ile kurulduktan sonra Windows kayıt defteri (Registry) üzerinden şu kimliklerle listelenir:
- **DisplayName:** `Env Vault`
- **Publisher:** `Vellium`
- **DisplayVersion:** `1.0.0`
- **DisplayIcon:** `{InstallDir}\env-vault.exe,0`
- **InstallLocation:** `%LOCALAPPDATA%\Programs\Env Vault`

### Windows Executable (.exe) Properties Details
Derlenen binary dosyasının Windows Özellikler (Properties → Details) sekmesindeki metadata tablosu:
- **File Description:** `.env dosyalarınızı proje klasörlerinden bağımsız olarak şifreli biçimde saklayın, düzenleyin ve istediğiniz zaman dışa aktarın.`
- **Product Name:** `Env Vault`
- **Product Version:** `1.0.0`
- **File Version:** `1.0.0.0`
- **Copyright:** `© 2026 Vellium. Tüm hakları saklıdır.`
- **Original Filename:** `env-vault.exe`

---

## 3. Installer (NSIS) & Uninstaller Stratejisi

### Kurulum (Install) Politikası
- **Kapsam:** `currentUser` (Yönetici / UAC şifresi istemez; kullanıcının `%LOCALAPPDATA%\Programs\Env Vault` alanına kurulur).
- **Dil:** Türkçe (`Turkish`).
- **Görsel Özelleştirme:**
  - Karşılama ve Bitiş Yan Banner: `src-tauri/icons/nsis-sidebar.bmp` (164x314 px, 24-bit BMP).
  - Adım Başlık Banner: `src-tauri/icons/nsis-header.bmp` (150x57 px, 24-bit BMP).
  - Kurulum & Kaldırma İkonu: `src-tauri/icons/icon.ico`.

### Kaldırma (Uninstall) & Veri Koruma İlkesi
- **Temel Güvenlik Kuralı:** Uygulama binary dosyalarının silinmesi, kullanıcının şifreli kasa verisini (`%APPDATA%\com.vellium.envvault\vault.enc`) **kesinlikle silmez**.
- Kullanıcı uygulamayı kaldırıp yeniden yüklese dahi şifreli ortam verileri korunur.

### Güncelleme (Upgrade) Davranışı
- `1.0.0` üzerine `1.0.1` veya daha üst bir sürüm kurulduğunda aynı `com.vellium.envvault` identifier'ı üzerinden eski ikili dosyalar güncellenir, kasa verisi ve ayarlar korunur, yinelenen kısayol veya kayıt oluşmaz.

---

## 4. Code Signing & Authenticode Stratejisi

### Durum: `MANUAL INPUT REQUIRED`
Public Windows dağıtımı öncesinde SmartScreen itibarını sağlamak ve Windows güvenlik uyarılarını önlemek için Authenticode sertifikası gereklidir.

- **Özet Algoritması:** `SHA-256`
- **Zaman Damgası (Timestamp Server):** RFC 3161 uyumlu SHA-256 timestamp servisi (Ör: `http://timestamp.digicert.com` veya `http://timestamp.sectigo.com`).
- **Tauri Yapılandırma Alanları:**
  ```json
  "windows": {
    "certificateThumbprint": "<CERTIFICATE_THUMBPRINT_OR_ENV_VAR>",
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.digicert.com"
  }
  ```
- **Güvenlik Kuralı:** Özel anahtarlar veya PFX sertifika dosyaları asla Git deposuna eklenmez; CI/CD ortamında secret veya HSM/Azure Key Vault üzerinden `signCommand` ile imzalanır.

---

## 5. Dağıtım Dosyaları İsimlendirme Standardı (Artifact Naming)

| Dağıtım Türü | Dosya Adı Standardı |
| :--- | :--- |
| **Windows NSIS Setup Installer** | `Env-Vault-1.0.0-Windows-x64-Setup.exe` |
| **Windows NSIS Installer Checksum** | `Env-Vault-1.0.0-Windows-x64-Setup.exe.sha256` |
| **Windows Taşınabilir EXE (Portable)** | `Env-Vault-1.0.0-Windows-x64-Portable.exe` |
| **Windows Taşınabilir ZIP (Portable)** | `Env-Vault-1.0.0-Windows-x64-Portable.zip` |
| **Windows MSI (Opsiyonel Enterprise)** | `Env-Vault-1.0.0-Windows-x64.msi` |

---

## 6. Sürüm Yönetimi ve Doğrulama

Sürüm numarası Semantic Versioning (`MAJOR.MINOR.PATCH`) standardını takip eder. Sürüm değişiklikleri `scripts/check-version-consistency.js` ile doğrulanır:
```bash
npm run check:version
```
Kaynaklar:
1. `src-tauri/tauri.conf.json` -> `version` (Single Source of Truth)
2. `src-tauri/Cargo.toml` -> `package.version`
3. `package.json` -> `version`
