===============================================================================
                       ENV VAULT v1.0.0 — KURULUM KILAVUZU
                                 Vellium © 2026
===============================================================================

Env Vault v1.0.0 dağıtım paketine hoş geldiniz.
Bu klasör, Windows x64 işletim sistemi için hazırlanmış resmi release paketlerini içerir.

-------------------------------------------------------------------------------
1. DAĞITIM DOSYALARI LİSTESİ
-------------------------------------------------------------------------------

1. Env-Vault-1.0.0-Windows-x64-Setup.exe
   - Windows için tam özellikli kurulum sihirbazı (NSIS Installer).
   - Başlat menüsü, masaüstü kısayolları ve Denetim Masası kaldırma kaydı oluşturur.

2. Env-Vault-1.0.0-Windows-x64.msi
   - Kurumsal ve sistem yöneticileri için Windows Installer (MSI) paketi.
   - Sessiz kurulum (silent install) ve grup politikası (GPO) dağıtımı için uygundur.

3. Env-Vault-1.0.0-Windows-x64-Portable.exe
   - Kurulum gerektirmeyen tek parça taşınabilir yürütülebilir dosya (Standalone Portable).
   - USB belleklerden veya istenen herhangi bir klasörden doğrudan çalıştırılabilir.

4. Env-Vault-1.0.0-Windows-x64-Portable.zip
   - Taşınabilir sürüm ve lisans dosyasını içeren sıkıştırılmış arşiv.

5. SHA256SUMS.txt
   - Tüm dağıtım dosyalarının SHA-256 kriptografik parmak izi (hash) listesi.

6. Dogrula-SHA256.bat
   - İndirdiğiniz dosyaların orijinal olup olmadığını ve bozulmadığını tek tıklamayla
     doğrulayan Windows batch aracı.

7. Build-Olustur.bat
   - Kaynak koddan sıfırdan temiz bir release build derlemesi almak için otomatik araç.

-------------------------------------------------------------------------------
2. BÜTÜNLÜK DOĞRULAMASI NASIL YAPILIR?
-------------------------------------------------------------------------------

Dosyaların güvenilirliğini doğrulamak için `Dogrula-SHA256.bat` dosyasına çift tıklayın.
Doğrulama aracı her bir dosyanın SHA-256 hash değerini hesaplar ve SHA256SUMS.txt
ile karşılaştırarak ekranda yeşil renkle sonucu bildirir.

-------------------------------------------------------------------------------
3. SİSTEM GEREKSİNİMLERİ
-------------------------------------------------------------------------------

- İşletim Sistemi: Windows 10 (1809+) veya Windows 11 (64-bit x64)
- WebView2 Runtime: Windows 10/11 sistemlerinde varsayılan olarak mevcuttur.
- Ağ Gereksinimi: %100 Çevrimdışı (İnternet bağlantısı gerektirmez).
- Resmi Web Sitesi: https://vellium.dev

Yayıncı ve Geliştirici: Vellium (https://vellium.dev)
===============================================================================
