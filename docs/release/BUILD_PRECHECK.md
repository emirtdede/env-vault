# Env Vault — Production Build Precheck & Verification Gates

Bu kontrol listesi, üretim sürümü (production installer build) başlatılmadan önceki tüm teknik, yasal, güvenlik ve paketleme gereksinimlerinin denetim kaydıdır.

---

## 1. Kimlik ve Metadata Denetimi (Identity & Metadata)

| Madde | Açıklama | Beklenen Değer | Durum |
| :--- | :--- | :--- | :--- |
| **1.1** | Product Name | `Env Vault` | ✅ PASS |
| **1.2** | Version (SemVer) | `1.0.0` | ✅ PASS |
| **1.3** | Version Consistency | `tauri.conf.json` == `Cargo.toml` == `package.json` | ✅ PASS |
| **1.4** | Identifier | `com.vellium.envvault` | ✅ PASS |
| **1.5** | Publisher | `Vellium` | ✅ PASS |
| **1.6** | Copyright | `© 2026 Vellium. Tüm hakları saklıdır.` | ✅ PASS |
| **1.7** | Category | `DeveloperTool` | ✅ PASS |
| **1.8** | Short Description | `.env dosyalarınızı proje klasörlerinden bağımsız olarak şifreli biçimde saklayın, düzenleyin ve istediğiniz zaman dışa aktarın.` | ✅ PASS |
| **1.9** | Long Description | Resmi uzun Türkçe ürün açıklaması tanımlandı. | ✅ PASS |
| **1.10** | Default Language | `Turkish` (Türkçe) | ✅ PASS |
| **1.11** | Architecture | `x64` (`x86_64-pc-windows-msvc`) | ✅ PASS |

---

## 2. Kullanıcı Arayüzü ve "Hakkında" Ekranı (UI & About)

| Madde | Açıklama | Denetim Kriteri | Durum |
| :--- | :--- | :--- | :--- |
| **2.1** | Runtime Version API | `getVersion()` API'si ile dinamik sürüm okuma | ✅ PASS |
| **2.2** | Başlık Çubuğu (TitleBar) | `Env Vault` başlığı ve vektörel Logo | ✅ PASS |
| **2.3** | Ayarlar → Hakkında | `Env Vault`, `Sürüm 1.0.0`, `Vellium`, Telif metni | ✅ PASS |
| **2.4** | Kasa Kurulum & Kilit | Vektörel SVG Logo %100 entegre edildi | ✅ PASS |
| **2.5** | Hardcoded Version | Arayüzde elle yazılmış eski sürüm string'i bırakılmadı | ✅ PASS |

---

## 3. İkon ve Marka Vektörleri (Branding & Icons)

| Madde | Çözünürlük / Format | Dosya Yolu | Durum |
| :--- | :--- | :--- | :--- |
| **3.1** | Master Vektör | Saf SVG, dış font/bağımlılık içermez (`public/logo.svg`) | ✅ PASS |
| **3.2** | Çok Katmanlı ICO | 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256 (`src-tauri/icons/icon.ico`) | ✅ PASS |
| **3.3** | Standart PNG Seti | `16x16.png`, `24x24.png`, `32x32.png`, `48x48.png`, `64x64.png`, `128x128.png`, `256x256.png`, `icon.png` (512x512) | ✅ PASS |
| **3.4** | Windows Tile Seti | `Square30x30`, `Square44x44`, `Square71x71`, `Square150x150`, `Square310x310`, `StoreLogo` | ✅ PASS |
| **3.5** | NSIS Banners | `nsis-sidebar.bmp` (164x314), `nsis-header.bmp` (150x57) | ✅ PASS |

---

## 4. Paketleme ve Installer Davranışı (Packaging & Installer)

| Madde | Alan | Yapılandırma | Durum |
| :--- | :--- | :--- | :--- |
| **4.1** | Hedef Paketleyici | `NSIS` (Tauri 2 Windows Bundle) | ✅ PASS |
| **4.2** | Kurulum Kapsamı | `currentUser` (Yönetici izni gerektirmez, kullanıcı dizinine kurulur) | ✅ PASS |
| **4.3** | Dil Seçici | `displayLanguageSelector: false` (Varsayılan Türkçe) | ✅ PASS |
| **4.4** | Kaldırma (Uninstall) | Kullanıcı kasa dosyaları silinmez; yalnızca binary dosyaları kaldırılır | ✅ PASS |
| **4.5** | Yüklü Uygulamalar | Kayıt defterinde `Env Vault`, `Vellium`, `1.0.0` metadata'sı | ✅ PASS |
| **4.6** | Sessiz Kurulum (Silent) | NSIS `/S` bayrağını destekler | ✅ PASS |

---

## 5. Güvenlik ve İzinler (Security & Capabilities)

| Madde | Denetim Alanı | Durum |
| :--- | :--- | :--- |
| **5.1** | DevTools | Üretim derlemesinde kapalı (`Cargo.toml` devtools bayrağı içermez) | ✅ PASS |
| **5.2** | Ağ Bağımsızlığı | Sıfır uzak bağlantı, telemetri yok, analytics yok, cloud sync yok | ✅ PASS |
| **5.3** | Minimum Yetki | Geniş filesystem/shell izinleri kapalı; yalnızca gerekli pencere ve dialog izinleri aktif | ✅ PASS |
| **5.4** | Kriptografi | Argon2id anahtar türetme + AES-256-GCM kimlik doğrulamalı şifreleme + Zeroize | ✅ PASS |
| **5.5** | Bellek Temizliği | Hassas parola ve anahtarlar kullanım sonrası sıfırlanır | ✅ PASS |

---

## 6. Code Signing ve Dağıtım Hazırlığı (Code Signing & Publication)

| Madde | Alan | Durum |
| :--- | :--- | :--- |
| **6.1** | Digest Algoritması | `SHA-256` yapılandırıldı | ✅ PASS |
| **6.2** | Timestamp URL | RFC 3161 yapılandırma yuvası hazır | ✅ PASS |
| **6.3** | Özel Sertifika Dosyaları | Depoya hiçbir `.pfx`, `.key` eklenmedi (Güvenli) | ✅ PASS |
| **6.4** | Authenticode Sertifikası | Yayıncı tarafından CI/CD secret veya yerel HSM sağlanmalıdır | ⚠️ MANUAL INPUT REQUIRED |
| **6.5** | Dağıtım İsimlendirme | `Env-Vault-1.0.0-Windows-x64-Setup.exe` standardı hazır | ✅ PASS |
| **6.6** | Checksum Doğrulama | `scripts/release-checksum.ps1` SHA-256 aracı hazır | ✅ PASS |

---

## 7. Ön Denetim Sonucu (Precheck Verdict)

- **Teknik ve Yapılandırma Önkoşulları:** **TAMAMLANDI (PASS)**
- **Eksik Manuel Bilgiler:** `TODO_RELEASE_METADATA.md` dosyasında listelendi.
- **Üretim Derleme Hazırlığı:** **READY TO BUILD** (Sertifika ataması yapıldığında veya unsigned dahili release için build alınabilir).
