# Env Vault — Yayın Öncesi Manuel Karar ve Bilgi Listesi (TODO)

Aşağıdaki alanlar yayıncı (Vellium) tarafından sağlanması gereken veya harici yasal/sertifikasyon süreçlerine bağlı konulardır. Kod ve yapılandırma tarafındaki tüm teknik yuvalar bu verileri almaya hazır hale getirilmiştir.

---

### 1. 🔑 Code Signing (Authenticode Sertifikası)
- [ ] **Durum:** `MANUAL INPUT REQUIRED`
- [ ] **Açıklama:** Windows SmartScreen güveni ve "Bilinmeyen Yayıncı" uyarısını engellemek için geçerli bir EV (Extended Validation) veya Standart Windows Code Signing sertifikası temin edilmelidir.
- [ ] **İlgili Dosya:** `src-tauri/tauri.conf.json` (`bundle.windows.certificateThumbprint` veya CI/CD `signCommand`).

---

### 2. 🌐 Resmi Web Sitesi & Destek URL'leri
- [ ] **Durum:** `MANUAL INPUT REQUIRED`
- [ ] **Resmi Web Sitesi (Homepage URL):** Yayıncının resmi web adresi belirlendiğinde eklenecek.
- [ ] **Destek İletişim (Support URL / Email):** Destek e-postası veya Issue Tracker adresi.
- [ ] **Gizlilik Politikası URL'si (Privacy Policy URL):** Web sitesinde yayınlanacak gizlilik sayfası bağlantısı.

---

### 3. ⚖️ Lisans Modeli (License Model)
- [ ] **Durum:** `MANUAL INPUT REQUIRED`
- [ ] **Açıklama:** Dağıtımın tescilli kapalı kaynak (Proprietary Commercial / Freeware) mı yoksa açık kaynak (MIT / Apache-2.0 vb.) mı olacağına dair nihai yasal karar.
- [ ] **Yapılacak İşlem:** Seçilen lisans metni `LICENSE.txt` olarak kök dizine eklenecektir.

---

### 4. 🏢 Yasal Şirket Unvanı
- [ ] **Durum:** `MANUAL INPUT REQUIRED`
- [ ] **Açıklama:** Marka adı `Vellium` olarak yapılandırılmıştır. Fatura/Sertifika sahibi resmi ticari unvan farklı ise Partner Center ve Code Signing adımlarında bu unvan kullanılacaktır.
