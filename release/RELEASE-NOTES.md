# Env Vault — Sürüm Notları (Release Notes)

## Env Vault 1.0.0 (İlk Kararlı Sürüm)

*Yayınlanma Tarihi:* 30 Ağustos 2026  
*Yayıncı:* Vellium  
*Web Sitesi:* [Vellium.dev](https://vellium.dev)  
*Hedef Platform:* Windows 10 / Windows 11 (64-bit x64)

---

### 🌟 Yeni Özellikler
- **Bağımsız Şifreli Kasa (Copy-in Architecture):** .env dosyaları Vault'a aktarıldığında kaynak proje klasöründen tamamen bağımsız hale gelir. Kaynak dosya veya proje silinse bile şifreli kopya korunur.
- **Askeri Düzeyde Kriptografi:** Argon2id anahtar türetme fonksiyonu (KDF) ve AES-256-GCM kimlik doğrulamalı simetrik şifreleme motoru.
- **Güvenli Bellek Yönetimi (Zeroize):** Parolalar, türetilmiş anahtarlar ve ham ortam değişkenleri işlem bittiğinde RAM'den sıfırlanarak temizlenir.
- **Gelişmiş Sürükle-Bırak (Drag & Drop):** Masaüstünden veya Dosya Gezgini'nden `.env` dosyalarını doğrudan pencereye bırakarak anında içe aktarma.
- **Sözdizimi Vurgulamalı Dahili Editör:** Değişken anahtarlarını, değerlerini, yorum satırlarını ve gizli secret alanlarını renkli gösteren CodeMirror editörü.
- **Tek Tıkla Dışa Aktarma:** Seçili ortam dosyasını Windows Dosya Gezgini'ne veya belirlenen varsayılan dizine anında aktarma.
- **Gelişmiş Tema & Görsel Deneyim:** Koyu Tema, Siyah OLED, Koyu Cam (Glass), Beyaz, Beyaz Cam ve Sistem Transparan temaları.
- **Otomatik Kilitleme (Auto-Lock):** Belirlenen süre boyunca hareketsiz kalındığında veya tek tıkla kasayı anında kilitleme.

### ⚡ İyileştirmeler
- Windows 11 Fluent tasarım ilkeleri ve modern siber kilit marka kimliği ile kusursuz UI uyumu.
- NSIS kurulum sihirbazı özel koyu tema görsel banner'ları ile zenginleştirildi.
- Uygulama başlatma süresi optimize edildi ve bellek tüketimi minimum düzeye indirildi.

### 🛡️ Güvenlik ve Gizlilik
- Sıfır telemetri, sıfır analiz ve sıfır dış sunucu bağlantısı.
- Uygulama tamamen yerel (local-first) ve çevrimdışı (offline) çalışır.

### 📌 Bilinen Durumlar
- İlk açılışta Windows SmartScreen uyarısı almamak için kurumsal Authenticode sertifikası ile imzalanmalıdır.
