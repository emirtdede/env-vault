# Env Vault — Sürüm Notları (Release Notes)

## Env Vault 1.0.0 (İlk Kararlı Sürüm)

*Yayınlanma Tarihi:* 31 Ağustos 2026  
*Yayıncı:* Vellium  
*Web Sitesi:* [Vellium.dev](https://vellium.dev)  
*Hedef Platform:* Windows 10 / Windows 11 (64-bit x64)

---

### 🌟 Yeni Özellikler & Geliştirmeler
- **Bağımsız Şifreli Kasa (Copy-in Architecture):** `.env` dosyaları Vault'a aktarıldığında kaynak proje klasöründen tamamen bağımsız hale gelir. Kaynak dosya veya proje silinse bile şifreli kopya korunur.
- **Askeri Düzeyde Kriptografi:** Argon2id anahtar türetme fonksiyonu (KDF) ve AES-256-GCM kimlik doğrulamalı simetrik şifreleme motoru.
- **Güvenli Bellek Yönetimi (Zeroize):** Parolalar, türetilmiş anahtarlar ve ham ortam değişkenleri işlem bittiğinde RAM'den sıfırlanarak temizlenir.
- **Yasal ve Kurumsal Şeffaflık Sayfaları:** Gizlilik Politikası, Kullanım Koşulları, Güvenlik & Kriptografi Açıklamaları, Açık Kaynak Lisansları ve Vellium Manifestosu entegre edildi.
- **Dinamik ve Tema Uyumlu Araç Çubuğu:** Başlık çubuğundaki tüm butonlar (Tema, Dil, Vellium, Ayarlar, Kilit) seçili temaya ve hover durumlarına kusursuz uyum sağlar.
- **Gelişmiş Oturum ve Kilit Koruması:** Kullanıcı oturum açmadığı sürece Ayarlar ve Kilit butonları gizlenir; alt sayfalardan Ayarlar menüsüne erişim tamamen kilitlenir.
- **Yedekleme ve Geri Yükleme:** Tek tıkla tüm projeleri şifreli `.vaultbak` arşivi olarak yedekleme ve geri yükleme yeteneği Ayarlar paneline entegre edildi.
- **Sözdizimi Vurgulamalı Dahili Editör:** Değişken anahtarlarını, değerlerini, yorum satırlarını ve gizli secret alanlarını renkli gösteren CodeMirror editörü.
- **Tek Tıkla Dışa Aktarma:** Seçili ortam dosyasını Windows Dosya Gezgini'ne veya belirlenen varsayılan dizine anında aktarma.
- **Gelişmiş Tema & Görsel Deneyim:** 16 farklı modern koyu ve açık renk teması.
- **Otomatik Kilitleme (Auto-Lock):** Belirlenen süre boyunca hareketsiz kalındığında veya tek tıkla kasayı anında kilitleme.

### 🛡️ Güvenlik ve Gizlilik
- Sıfır telemetri, sıfır analiz ve sıfır dış sunucu bağlantısı.
- Uygulama tamamen yerel (local-first) ve çevrimdışı (offline) çalışır.

---

### 📦 İndirilebilir Dosyalar ve SHA-256 Sağlama Toplamları

| Dosya Adı | Açıklama | SHA-256 Sağlama Toplamı |
| :--- | :--- | :--- |
| **`Env-Vault-1.0.0-Windows-x64-Setup.exe`** | NSIS Kurulum Sihirbazı | `05086265c13445e7e075664cd491bef167ab96ca99a6e0e0ab0ae761eaad764d` |
| **`Env-Vault-1.0.0-Windows-x64.msi`** | Windows Installer (MSI) | `e05e464ad1dce0fd36db4b7ec0321840d3f04f829b71ae644b5053df7934bc42` |
| **`Env-Vault-1.0.0-Windows-x64-Portable.exe`** | Bağımsız Taşınabilir EXE | `defe9f1141e2b5417659edd2a6adc1cb06262a02e7405fdb35f30691475593da` |
| **`Env-Vault-1.0.0-Windows-x64-Portable.zip`** | Taşınabilir ZIP Paketi | `ac702a71b50e9049e9f6bd3a87dcfc41487ad45346e6dd1186aac216697cf879` |
