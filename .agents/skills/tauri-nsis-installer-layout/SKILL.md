---
name: tauri-nsis-installer-layout
description: Windows NSIS (Tauri/Desktop) kurulum ve kaldırma sihirbazı için kusursuz logo konumlandırması, piksel hiza kilitlemesi ve build boru hattı entegrasyonu sağlar.
---

# Tauri & Windows NSIS Installer UI/UX Entegrasyon Kılavuzu

Bu beceri, Tauri veya doğrudan NSIS kullanan Windows masaüstü projelerinde kurulum ve kaldırma sihirbazlarının kurumsal ve piksel kusursuzluğunda derlenmesini sağlar.

## 1. Header Görseli (150x57 px BMP) Standartları
- **Boyut:** 150 piksel genişlik, 57 piksel yükseklik.
- **Arka Plan:** Saf beyaz (`#FFFFFF` / `255, 255, 255`).
- **Logo Konumu:** 48x48 piksel logo, 150x57 tuvalin **en sağına** (`icon_x = 150 - 48 - 8 = 94`, `icon_y = 4`) yerleştirilir.
- **Renk Modu:** 24-bit RGB BMP (NSIS şeffaf PNG desteklemediği için beyaz arka planla kaynaşır).

```python
# Örnek PIL oluşturma betiği
header_canvas = Image.new("RGBA", (150, 57), (255, 255, 255, 255))
header_icon = icon_master.resize((48, 48), Image.Resampling.LANCZOS)
header_canvas.alpha_composite(header_icon, (94, 4))
header_bmp = header_canvas.convert("RGB")
header_bmp.save("nsis-header.bmp", "BMP")
```

## 2. NSIS Modern UI 2 Şablon Kuralı (Kritik Sıralama)
NSIS derleyicisinin sağa hizalı header şablonunu (`modern_headerbmpr.exe`) seçebilmesi için `MUI_HEADERIMAGE` ve `MUI_HEADERIMAGE_RIGHT` direktifleri **mutlaka `!include MUI2.nsh` satırının ÖNCESİNDE** tanımlanmalıdır:

```nsis
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERIMAGE_BITMAP "${HEADER_PATH}"
!define MUI_HEADERIMAGE_UNBITMAP "${HEADER_PATH}"
!define MUI_CUSTOMFUNCTION_GUIINIT AlignHeaderTexts
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.AlignHeaderTexts
!include MUI2.nsh
```

## 3. WinAPI ile Başlık ve Alt Başlık Hiza Kilitleme
NSIS varsayılanında Alt Başlık (Control 1038), Ana Başlığa (Control 1037) göre 5 dialog birimi içeriden başlar. Her iki metni sol marjine (`left = 15px`) eşitlemek için WinAPI `SetWindowPos` kancası kullanılır:

```nsis
Function AlignHeaderTexts
  GetDlgItem $0 $HWNDPARENT 1037
  GetDlgItem $1 $HWNDPARENT 1038
  
  System::Call '*(&i4, &i4, &i4, &i4) p .r2'
  System::Call '*(&i4, &i4, &i4, &i4) p .r3'
  
  System::Call 'user32::GetWindowRect(p $0, p $2)'
  System::Call 'user32::GetWindowRect(p $1, p $3)'
  
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $2, i 2)'
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $3, i 2)'
  
  System::Call '*$2(i .r4, i .r5, i .r6, i .r7)'
  System::Call '*$3(i .r8, i .r9, i .r10, i .r11)'
  
  ; Subtitle X koordinatını Title X koordinatına ($4) kitle
  System::Call 'user32::SetWindowPos(p $1, p 0, i $4, i $9, i 0, i 0, i 0x0015)'
  
  System::Free $2
  System::Free $3
FunctionEnd

Function un.AlignHeaderTexts
  GetDlgItem $0 $HWNDPARENT 1037
  GetDlgItem $1 $HWNDPARENT 1038
  
  System::Call '*(&i4, &i4, &i4, &i4) p .r2'
  System::Call '*(&i4, &i4, &i4, &i4) p .r3'
  
  System::Call 'user32::GetWindowRect(p $0, p $2)'
  System::Call 'user32::GetWindowRect(p $1, p $3)'
  
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $2, i 2)'
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $3, i 2)'
  
  System::Call '*$2(i .r4, i .r5, i .r6, i .r7)'
  System::Call '*$3(i .r8, i .r9, i .r10, i .r11)'
  
  System::Call 'user32::SetWindowPos(p $1, p 0, i $4, i $9, i 0, i 0, i 0x0015)'
  
  System::Free $2
  System::Free $3
FunctionEnd
```

## 4. Uninstaller ve Dialog İkon Bütünlüğü
- `!define UNINSTALLERICON "${ICON_PATH}"` (Görev çubuğu ve çalışan uygulama uyarı kutuları için `MUI_UNICON` sağlar).
- `!define UNINSTALLERHEADERIMAGE "${HEADER_PATH}"` (Kaldırma sayfası üst başlığı için).

## 5. Build Boru Hattı Entegrasyonu
1. `npx @tauri-apps/cli build` çalıştırılır.
2. `installer.nsi` betiği yukarıdaki kurallarla yamalanır (`scripts/patch-nsis.py`).
3. `makensis.exe` ile `installer.nsi` yeniden derlenir.
4. Üretilen `nsis-output.exe`, hedef `release/` klasöründeki nihai kurulum dosyasına kopyalanır (`scripts/build-release.ps1`).
