# Env Vault — Ürün Geliştirme Ana Dokümanı

> **Belge türü:** PRD + SRS + SAD + UI/UX + Tasarım Sistemi + Tema + Dil + Güvenlik + Kriptografi + Veri Modeli + Risk + Performans + Test + Dağıtım + Kabul Kriterleri  
> **Çalışma adı:** Env Vault  
> **Hedef platform:** Windows 10 / Windows 11, öncelik Windows 11  
> **Belge dili:** Türkçe  
> **Sürüm:** 1.0  
> **Tarih:** 29 Ağustos 2026  
> **Durum:** Geliştirmeye hazır teknik ana spesifikasyon  
> **Temel ilke:** Bir `.env` dosyası Env Vault'a içe aktarıldığı anda kaynak proje klasöründen bağımsız, şifreli ve kalıcı bir Vault kaydı haline gelir.

---

# 1. Belgenin amacı

Bu belge Env Vault masaüstü uygulamasının baştan sona geliştirilmesi için gereken bütün ürün, yazılım, mimari, kullanıcı deneyimi, güvenlik, kriptografi, performans, test ve dağıtım gereksinimlerini tek bir kaynakta toplar.

Belgenin hedefleri:

1. Geliştirme sırasında eksik veya çelişkili ürün kararlarını ortadan kaldırmak.
2. Kodlama ajanı veya geliştiricinin güvenlik açısından kritik kararları kendi varsayımlarına bırakmasını önlemek.
3. `.env` dosyalarının proje klasörlerinden gerçekten bağımsız biçimde saklanmasını garanti altına almak.
4. Vault içeriğinin diskte plaintext olarak kalmamasını sağlamak.
5. İçe aktarma, sürükle-bırak, düzenleme, indirme, silme ve yedekleme davranışlarını kesin biçimde tanımlamak.
6. Premium, modern, sade ve yüksek kaliteli bir Windows masaüstü arayüzü oluşturmak.
7. Node Cleaner ile aynı görsel ürün ailesine ait hissi veren fakat güvenlik odaklı kendi ürün kimliğine sahip bir uygulama geliştirmek.
8. Performansı, sistem kaynak tüketimini ve veri bütünlüğünü ölçülebilir ürün gereksinimleri haline getirmek.
9. God Context, God Component ve kontrolsüz native erişim gibi sürdürülebilirlik sorunlarını baştan engellemek.
10. Release öncesi acceptance criteria, security test ve backup/restore testlerini zorunlu hale getirmek.

Bu belge geliştirme süresince **tek gerçek kaynak** olarak kabul edilmelidir.

---

# 2. Ürün özeti

Env Vault, bireysel yazılım geliştiricilerin farklı projelere ait `.env` dosyalarını güvenli biçimde:

- içe aktarabileceği,
- proje bazında düzenleyebileceği,
- şifreli olarak saklayabileceği,
- istediği zaman görüntüleyebileceği,
- düzenleyebileceği,
- silebileceği,
- doğrudan `.env` olarak dışa aktarabileceği,
- uygulamadan Windows Dosya Gezgini'ne sürükleyip bırakabileceği,
- varsayılan bir dışa aktarma klasörüne tek tıklamayla kaydedebileceği

yerel ve offline bir Windows masaüstü uygulamasıdır.

Uygulama bir “proje klasörüne bağlantı yöneticisi” değildir.

Uygulama bir **secret archive / local encrypted vault** ürünüdür.

---

# 3. En önemli ürün kuralı: Copy-in, link değil

Bir `.env` dosyası Env Vault'a eklendiğinde:

```text
C:\Projects\MyApp\.env
        │
        │ İçe aktar
        ▼
Env Vault şifreli depolaması
```

işlemi gerçekleşir.

Bundan sonra iki veri birbirinden bağımsızdır.

Kaynak dosyanın:

- düzenlenmesi,
- yeniden adlandırılması,
- başka klasöre taşınması,
- silinmesi,
- proje klasörünün tamamen silinmesi,
- disk üzerindeki repository'nin kaldırılması

Vault içindeki kaydı **etkilemez**.

Örnek:

```text
1. C:\Projects\VelliumApi\.env dosyası içe aktarıldı.
2. Env Vault kendi şifreli kopyasını oluşturdu.
3. C:\Projects\VelliumApi klasörü tamamen silindi.
4. Env Vault'taki VelliumApi / .env kaydı aynen korunur.
5. Kullanıcı aylar sonra Env Vault'u açar.
6. .env dosyasını yeni bir klasöre indirir.
```

Bu davranış ürünün temel kabul kriteridir.

Kaynak path yalnızca metadata olarak tutulabilir.

Vault kaydının yaşaması için kaynak path'e hiçbir zaman ihtiyaç duyulmamalıdır.

---

# 4. Ürün vizyonu

Env Vault şu özellikleri aynı anda taşımalıdır:

- Apple seviyesinde görsel sadelik,
- Windows masaüstü uygulamasının doğal davranışları,
- premium ticari uygulama kalitesi,
- geliştirici aracının teknik doğruluğu,
- password manager seviyesinde güvenlik disiplini,
- küçük utility uygulamasının performans ve kaynak verimliliği.

Kullanıcı algısı:

- güvenli,
- sakin,
- hızlı,
- düzenli,
- premium,
- local-first,
- şeffaf,
- öngörülebilir.

Uygulamanın ana mesajı:

> **Projelerin silinse bile ortam dosyaların güvende kalır.**

---

# 5. Hedef kullanıcı

## 5.1. Birincil kullanıcı

Bireysel yazılım geliştirici.

Tipik profil:

- 10–100+ proje,
- React, Node.js, Python, Flutter, .NET veya farklı teknoloji yığınları,
- `.env`, `.env.local`, `.env.production`, `.env.development` gibi dosyalar,
- eski projeleri zaman zaman silme,
- API key, database URL, token ve credentials kaybetmek istememe,
- Git repository'ye `.env` commit etmeme,
- cloud secret manager kurmak istememe,
- local ve sade masaüstü UI tercih etme.

## 5.2. İkincil kullanıcı

- freelancer,
- ajans geliştiricisi,
- öğrenci,
- küçük SaaS geliştiricisi,
- çok sayıda prototip tutan geliştirici.

---

# 6. Ürün kapsamı

## 6.1. V1 kapsamında

- Windows 10 / Windows 11.
- Tamamen local çalışma.
- Vault oluşturma.
- Master password ile Vault kilidi.
- Şifreli at-rest storage.
- Proje oluşturma.
- Proje adlandırma.
- `.env` dosyası içe aktarma.
- Dosya seçici ile ekleme.
- Drag-and-drop ile içe aktarma.
- `.env*` varyantları.
- Kaynak dosyadan bağımsız saklama.
- Env dosyasını görüntüleme.
- Env dosyasını düzenleme.
- Raw text'in tam korunması.
- Yorum ve satır sırasının korunması.
- Secret değerlerini varsayılan gizleme.
- Tek tek değer reveal.
- Tüm içeriği gösterme.
- Dosyayı `.env` olarak dışa aktarma.
- “İndir” butonu.
- “Ekle” butonu.
- “Farklı Konuma İndir”.
- Varsayılan indirme/dışa aktarma dizini.
- “İndirirken konum sorma” ayarı.
- Bu ayarı açma/kapatma.
- Varsayılan dizini değiştirme.
- Uygulamadaki env dosyasını Explorer'a sürükleyerek export.
- Vault kaydını silme.
- Proje silme.
- Encrypted backup.
- Encrypted restore.
- Tema sistemi.
- Premium Liquid Glass tasarım.
- Beş tema.
- SVG ikonografi.
- Özel SVG logo.
- Windows multi-resolution `.ico`.
- Türkçe UI.
- Tauri 2.
- Rust backend.
- Modüler kod.
- Security tests.
- Performance tests.
- Installer.

## 6.2. V1 dışında

- cloud sync,
- kullanıcı hesabı,
- ekip paylaşımı,
- web paneli,
- remote server,
- GitHub/GitLab secret push,
- CI/CD secret injection,
- Kubernetes integration,
- AWS Secrets Manager integration,
- Azure Key Vault integration,
- Vault server,
- organization/team permissions,
- secret rotation automation,
- telemetry,
- analytics,
- subscription,
- mobile uygulama.

---

# 7. Başarı kriterleri

## 7.1. Veri kalıcılığı

Aşağıdaki test kesinlikle geçmelidir:

```text
.env import
↓
Vault'a kaydet
↓
kaynak .env sil
↓
kaynak proje klasörünü sil
↓
uygulamayı kapat
↓
Windows'u yeniden başlat
↓
uygulamayı aç
↓
Vault kilidini aç
↓
.env içeriği eksiksiz
↓
başka klasöre export
↓
byte/line doğruluğu kabul sınırında
```

## 7.2. Güvenlik

- plaintext `.env` Vault database içinde bulunmamalı.
- master password plaintext olarak tutulmamalı.
- secret içerik loglanmamalı.
- crash dump'a secret sızmasını minimize eden tasarım uygulanmalı.
- frontend localStorage'a secret yazılmamalı.
- secret içerik URL/query param'a girmemeli.
- clipboard otomatik kullanılmamalı.
- export explicit kullanıcı işlemi olmalı.
- backup şifreli olmalı.

## 7.3. Performans

Referans:

- Windows 11,
- NVMe SSD,
- 16 GB RAM,
- 8 mantıksal işlemci.

Hedef:

| Ölçüm | Hedef |
|---|---:|
| Boşta CPU | <%0,5 |
| Boşta disk polling | 0 |
| Boşta network | 0 |
| Boşta RAM | tercihen <130 MB |
| İlk pencere | tercihen <1,5 sn |
| Vault unlock | hedef <1 sn, KDF tuning'e bağlı |
| 100 proje listesi | anlık |
| 1000 env kayıt listesi | akıcı |
| 1 MB `.env` açma | görünür bloklama yok |
| Save feedback | <150 ms UI acknowledgement |
| Drag-in feedback | <200 ms hedef |
| Export başlangıcı | <200 ms küçük dosyalarda |

## 7.4. UX

Yeni kullanıcı yardım dokümanı okumadan:

1. Vault oluşturmalı,
2. bir proje oluşturmalı,
3. `.env` dosyasını sürükleyip bırakmalı,
4. kaydın Vault'a alındığını anlamalı,
5. düzenlemeli,
6. `.env` olarak indirebilmeli.

---

# 8. Teknoloji kararı

## 8.1. Masaüstü

**Tauri 2**

## 8.2. Frontend

- React
- TypeScript
- Vite
- CSS Modules / scoped CSS
- CSS Custom Properties
- Zustand, domain bazlı
- CodeMirror 6, minimal bundle ile
- gerekli yerde TanStack Virtual

## 8.3. Backend

- Rust
- Tauri Commands
- Tauri Channels/Events
- Windows native OLE/Shell APIs
- şifreli storage service
- metadata repository
- export/import services

## 8.4. Güvenlik

Tercih edilen kombinasyon:

- Tauri Stronghold
- Argon2id
- Windows DPAPI opsiyonel convenience layer
- authenticated encryption
- random nonce/salt
- CSPRNG

Kendi kriptografik algoritmamız yazılmaz.

---

# 9. Kriptografi mimarisi

Env Vault'ta güvenlik uygulamanın yan özelliği değil, çekirdeğidir.

Önerilen key hierarchy:

```text
Master Password
      │
      ▼
Argon2id
      │
      ▼
Password-derived key / Stronghold unlock
      │
      ▼
Vault Key Material
      │
      ▼
Encrypted Secret Payloads
```

Alternatif implementation Stronghold snapshot içinde payload saklama olabilir.

Ancak metadata ve secret payload separation tercih edilir.

---

# 10. Önerilen storage mimarisi

En dengeli çözüm:

```text
App Local Data
│
├── metadata.db
│
├── vault/
│   ├── stronghold.snapshot
│   └── salt
│
├── backups/
│   └── (kullanıcı seçerse)
│
└── settings.json
```

## 10.1. Metadata database

Secret olmayan bilgiler:

- proje adı,
- env dosyası görünen adı,
- oluşturulma tarihi,
- değiştirilme tarihi,
- kaynak path opsiyonel,
- environment etiketi,
- sıralama,
- favorite.

Secret değeri metadata database'e plaintext girmez.

## 10.2. Secret storage

`.env` raw içeriği şifreli secret store içinde tutulur.

Vault kaydı ID bazlı:

```text
env-document/<uuid>
```

şeklinde saklanabilir.

---

# 11. Storage'ın proje klasöründen ayrılması

Kesin yasak:

```text
C:\Projects\MyApp\.env.vault
```

gibi kaynak proje içine Vault verisi yazmak.

Vault verisi:

- `AppLocalData`,
- veya kullanıcı tarafından belirlenen dedicated Vault storage

altında saklanmalıdır.

Kaynak proje ile depolama lifecycle'ı bağımsız olmalıdır.

---

# 12. Windows AppData stratejisi

Default:

```text
%LOCALAPPDATA%\EnvVault\
```

veya Tauri'nin resolve ettiği application local data directory.

Neden LocalAppData:

- kullanıcı profiline özel,
- proje dizininden bağımsız,
- uygulama lifecycle için doğal,
- kullanıcı write permission,
- Windows convention.

Roaming zorunlu değildir.

Vault'un otomatik cloud roaming yapması istenmez.

---

# 13. Master Password

İlk açılışta kullanıcı Vault oluşturur.

Alanlar:

```text
Ana Parola
Ana Parolayı Tekrarla
```

Kurallar:

- minimum 12 karakter önerilir,
- passphrase desteklenir,
- maksimum makul yüksek limit,
- clipboard paste engellenmez,
- strength bar zorunlu değildir,
- parola ipucu default yok.

UI kullanıcıya:

```text
Ana parolanız kurtarılamaz. Kaybederseniz Vault içeriğine erişemeyebilirsiniz.
```

uyarısı verir.

---

# 14. Argon2id

Password derivation için:

**Argon2id**

kullanılmalıdır.

Başlangıç minimum referansı:

```text
memory: >= 19 MiB
iterations: >= 2
parallelism: >= 1
```

OWASP minimumundan aşağı inilmemelidir.

Ancak desktop uygulamasında cihaz benchmark edilerek:

- yaklaşık 250–500 ms unlock KDF

hedeflenebilir.

Tuning sonucu config içinde versioned parametre olarak tutulmalıdır.

---

# 15. Stronghold kullanımı

Tauri Stronghold plugin:

- password-derived 32-byte hash,
- encrypted snapshot,
- key-value Store,
- secret Vault

altyapısı sağlayabilir.

Stronghold initialization:

```text
app local data
  ↓
salt
  ↓
Argon2
  ↓
Stronghold snapshot
```

Stronghold API doğrudan React component'lerden çağrılmamalıdır.

Rust security service arkasında encapsulate edilmelidir.

---

# 16. DPAPI kullanımı

Opsiyonel özellik:

```text
Windows ile otomatik kilit aç
```

kullanıcı etkinleştirirse Vault unlock secret/key material:

**Windows DPAPI — Current User scope**

ile korunabilir.

Kritik:

DPAPI vault'un tek kurtarma mekanizması olmamalıdır.

DPAPI genellikle:

- aynı Windows kullanıcı hesabı,
- aynı bilgisayar

bağlamına bağlıdır.

Bu nedenle portable backup için master-password tabanlı ayrı encrypted backup formatı şarttır.

---

# 17. Kilit modeli

State:

```text
uninitialized
locked
unlocking
unlocked
locking
error
```

Uygulama açıldığında:

```text
locked
```

olmalıdır.

Otomatik unlock açık değilse secret metadata bile sınırlı gösterilebilir.

---

# 18. Auto-lock

Ayar:

```text
Otomatik Kilitle
```

Seçenekler:

- 1 dakika
- 5 dakika
- 15 dakika
- 30 dakika
- 1 saat
- Uygulama kapanınca

Varsayılan öneri:

**15 dakika**

Idle sadece kullanıcı interaction yokluğuna göre ölçülür.

Background timer saniyede bir çalışmamalıdır.

Tek deadline/timer kullanılabilir.

---

# 19. Windows kilitlenince Vault

Windows workstation lock algılanabiliyorsa Vault:

- memory key'lerini drop etmeli,
- UI'yı locked state'e geçirmeli.

MVP'de bu native event güvenilir şekilde uygulanabiliyorsa aktif edilmelidir.

Başarısızsa en azından app minimize/idle auto-lock korunur.

---

# 20. Memory güvenliği

Secret'ları process memory'den tamamen korumak mümkün değildir.

Ama risk minimize edilir.

Kurallar:

- secret string gereksiz clone edilmez,
- global store içinde uzun süre plaintext tutulmaz,
- editor açıkken sadece aktif doküman memory'de bulunur,
- kapatıldığında state temizlenir,
- Rust'ta uygun secret type/zeroize değerlendirilir,
- clipboard otomatik temizleme opsiyonu eklenebilir,
- console.log secret yasak.

---

# 21. `.env` dosyası formatı

V1 şu dosyaları kabul eder:

```text
.env
.env.local
.env.development
.env.production
.env.staging
.env.test
.env.<özel-ad>
```

Ana kural:

filename `.env` ile başlıyorsa kabul edilir.

Opsiyonel olarak dosya seçicide:

```text
.env dosyaları
Tüm dosyalar
```

filtreleri olabilir.

Tüm dosyalar seçilse bile import öncesi kullanıcıya uygun uyarı verilir.

---

# 22. Raw text korunması

İçe aktarılan dosyanın yalnızca key-value listesi saklanmaz.

Aşağıdakiler korunmalıdır:

```dotenv
# Database
DATABASE_URL="..."

# Empty
OPTIONAL_VALUE=

# Disabled
# OLD_API_KEY="..."

MULTILINE="..."
```

Korunacak:

- yorumlar,
- boş satırlar,
- key sırası,
- quote stili,
- satır sonları mümkün olduğunca,
- UTF-8 BOM bilgisi gerektiğinde,
- final newline.

Vault içindeki canonical payload:

```text
raw bytes veya lossless text representation
```

olmalıdır.

---

# 23. Encoding

Öncelik:

- UTF-8
- UTF-8 BOM

UTF-16 algılanırsa:

- kullanıcıya uyarı,
- güvenli şekilde UTF-8'e dönüştürme opsiyonu.

Binary dosya reddedilir.

Dosya boyutu default üst sınırı:

```text
10 MB
```

`.env` için olağanüstü büyüktür.

Limit ayarlanabilir ama security/DoS için bounded olmalıdır.

---

# 24. Proje modeli

Örnek:

```text
Vellium API
├── .env
├── .env.local
└── .env.production

Vellium Web
├── .env
└── .env.production

Eski SaaS Projesi
└── .env
```

---

# 25. Veri modeli

## 25.1. Project

```ts
type Project = {
  id: string;
  name: string;
  description?: string;
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  sortOrder?: number;
};
```

## 25.2. EnvDocument

```ts
type EnvDocument = {
  id: string;
  projectId: string;
  filename: string;
  displayName?: string;
  sourcePath?: string;
  sourceImportedAt: string;
  createdAt: string;
  updatedAt: string;
  byteLength: number;
  checksum: string;
  secretRef: string;
};
```

## 25.3. Secret payload

```ts
type EnvSecretPayload = {
  schemaVersion: 1;
  filename: string;
  encoding: "utf-8";
  lineEnding: "lf" | "crlf";
  hadBom: boolean;
  rawText: string;
};
```

Bu obje metadata database'te plaintext saklanmaz.

---

# 26. Checksum

Import sırasında plaintext üzerinde:

```text
SHA-256
```

checksum hesaplanabilir.

Ama checksum secret veri hakkında sınırlı information leak yaratabilir.

Tercih:

- metadata içinde unkeyed checksum saklamamak,
- veya HMAC-based integrity fingerprint kullanmak.

Authenticated encryption zaten bütünlük doğrulaması sağlıyorsa ayrı checksum zorunlu değildir.

Export correctness testlerinde runtime hash hesaplanabilir.

---

# 27. Proje oluşturma UX

Ana eylem:

```text
+ Proje Ekle
```

Modal:

```text
Proje adı
Kaynak klasör (isteğe bağlı)
```

Kaynak klasör seçmek zorunlu değildir.

Proje klasörü daha sonra silinse bile proje kaydı kalır.

---

# 28. `.env` ekleme yöntemleri

V1 üç yöntem sunar:

## Yöntem A — Ekle butonu

```text
[ Ekle ]
```

native file picker açar.

## Yöntem B — Drag-in

Explorer'dan `.env` dosyası uygulamanın üstüne bırakılır.

## Yöntem C — Boş `.env` oluştur

Opsiyonel:

```text
Yeni .env Oluştur
```

ile program içinde sıfırdan bir env dosyası oluşturulabilir.

Bu özellik MVP içinde bulunabilir.

---

# 29. Drag-in davranışı

Kullanıcı Windows Dosya Gezgini'nden:

```text
C:\Projects\App\.env
```

dosyasını Env Vault'a sürükler.

Uygulama:

1. drag enter algılar,
2. drop zone gösterir,
3. drop sonrası path'i alır,
4. file type doğrular,
5. boyut doğrular,
6. dosyayı okur,
7. Vault'a şifreli copy oluşturur,
8. metadata kaydeder,
9. başarı feedback verir.

Kaynak dosyaya:

- move,
- delete,
- rename

uygulanmaz.

Drag-in her zaman **copy/import semantics** taşır.

---

# 30. Drag-in hedef belirleme

Eğer kullanıcı bir proje ekranındaysa:

```text
Vellium API
```

drop doğrudan bu projeye eklenir.

Ana ekrandaysa modal:

```text
Bu .env hangi projeye eklensin?
```

gösterilir.

Seçenek:

- mevcut proje,
- yeni proje oluştur.

Tek drop'ta birden fazla `.env*` desteklenebilir.

---

# 31. Duplicate import

Aynı projede aynı filename varsa:

```text
.env zaten mevcut
```

Seçenekler:

- Mevcut dosyayı güncelle
- Yeni adla ekle
- Vazgeç

Default:

**Vazgeç**

Silent overwrite yasaktır.

---

# 32. Update import

“Mevcut dosyayı güncelle” seçilirse:

- yeni payload eski kaydın yerine encrypted olarak yazılır,
- updatedAt güncellenir.

V1'de revision history opsiyoneldir.

---

# 33. Editor

`.env` düzenlemek için tam IDE gereksizdir.

Öneri:

**CodeMirror 6 minimal configuration**

Özellikler:

- line numbers,
- syntax highlight,
- search,
- undo/redo,
- selection,
- monospace font,
- bracket/quote basic behavior,
- no telemetry,
- no autocomplete network.

---

# 34. Editor secret mask

Env editor iki görüntüleme modu sunabilir:

## Güvenli görünüm

Values:

```text
DATABASE_URL=••••••••••••
API_KEY=••••••••••••
```

## Düzenleme görünümü

Gerçek raw text.

Edit mode'a geçmek explicit kullanıcı işlemi olur.

Alternatif daha sade V1:

- editor açıldığında değerler görünür,
- liste/preview'da maskeli.

Tercih edilen:

**Liste ve preview maskeli; Edit ekranı explicit olduğu için plaintext gösterir.**

---

# 35. Preview

Env card preview:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_KEY
JWT_SECRET
```

Value göstermeden key listesi gösterilebilir.

Bu metadata runtime parse ile üretilir.

Key listesi ayrıca plaintext database'e kaydedilmemesi tercih edilir.

---

# 36. Edit save

Kullanıcı:

```text
[ Kaydet ]
```

dediğinde:

1. frontend current content backend'e gönderir,
2. backend format limitlerini doğrular,
3. encrypted storage günceller,
4. metadata `updatedAt` güncellenir,
5. memory buffer temizlenir mümkün olduğunca,
6. UI success feedback.

Autosave default **kapalı**.

Secret edit için explicit Save daha öngörülebilir.

---

# 37. Unsaved changes

Editor değişmişse:

- başka dosyaya geçerken,
- pencere kapanırken,
- Vault kilitlenirken

modal:

```text
Kaydedilmemiş değişiklikler var.
```

Seçenek:

```text
[ Değişiklikleri Sil ] [ Vazgeç ] [ Kaydet ]
```

Destructive seçenek en baskın olmamalıdır.

---

# 38. İndirme / dışa aktarma

Kullanıcının istediği temel aksiyon:

```text
[ İndir ]
```

Bu eylem Vault'taki şifreli payload'u plaintext `.env` dosyası olarak seçilen konuma yazar.

Export sonrası Vault kaydı değişmez.

---

# 39. Export modları

## Mod A — Her seferinde konum sor

Varsayılan.

```text
İndir
  ↓
Windows Save dialog
  ↓
dosya konumu
  ↓
.env yaz
```

## Mod B — Varsayılan dizine indir

Ayar etkinse:

```text
İndir
  ↓
default export directory
  ↓
dosya yaz
```

Dialog açılmaz.

## Mod C — Farklı konuma indir

Default directory açık olsa bile:

```text
Farklı Konuma İndir
```

her zaman save dialog açar.

---

# 40. İndirme ayarı

Ayarlar:

```text
İndirme
────────────────────────
Her indirmede konum sor         [ Açık/Kapalı ]

Varsayılan indirme klasörü
C:\Users\...\Desktop\EnvExports
[ Değiştir ]

Dosya varsa
[ Sor ] [ Üzerine Yaz ] [ Yeni Ad Oluştur ]
```

Önerilen default:

```text
Her indirmede konum sor = Açık
```

---

# 41. Default export directory

Kullanıcı:

```text
[ Varsayılan Klasör Seç ]
```

ile klasör seçer.

Metadata settings'te path saklanır.

Vault secret değildir.

Klasör silinirse:

- sessiz fallback yapılmaz,
- kullanıcıya “Varsayılan indirme klasörü bulunamadı” denir,
- klasör yeniden seçmesi istenir,
- alternatif save dialog açılabilir.

---

# 42. Dosya adı davranışı

EnvDocument filename:

```text
.env.production
```

ise export default adı aynı olmalıdır.

Kullanıcı değiştirebilir.

Uygulama otomatik:

```text
.env.txt
```

eklememelidir.

Windows Save dialog filtreleri buna göre ayarlanmalıdır.

---

# 43. Existing file davranışı

Default:

**Sor**

Modal:

```text
Bu konumda .env zaten var.
```

Seçenek:

- Üzerine Yaz
- Yeni Adla Kaydet
- Vazgeç

Silent overwrite default yasaktır.

---

# 44. Export atomic write

Plaintext export:

1. hedef klasörde temporary file oluştur,
2. tüm içerik yaz,
3. flush,
4. güvenli replace/rename.

Ancak temporary file de plaintext'tir.

Export zaten kullanıcının explicit plaintext oluşturma talebidir.

Temporary file:

- aynı hedef directory,
- kısa ömürlü,
- işlem sonrası temiz.

---

# 45. Export file permissions

Windows ACL üzerinde aşırı karmaşık custom permission varsayılan yapılmaz.

Kullanıcının seçtiği folder'ın normal ACL'i korunur.

İleride “yalnızca mevcut kullanıcı” seçeneği değerlendirilebilir.

---

# 46. Drag-out: uygulamadan Explorer'a `.env` sürükleme

Kullanıcının istediği davranış:

```text
Env Vault içindeki .env kartını tut
        ↓
Windows Explorer klasörüne sürükle
        ↓
bırak
        ↓
o klasörde .env oluşsun
```

Bu V1 hedefidir.

---

# 47. Drag-out güvenlik kararı

Kolay fakat güvenlik açısından zayıf yaklaşım:

```text
plaintext temp .env oluştur
↓
CF_HDROP ile sürükle
↓
temp dosya sonra sil
```

Bu yaklaşım plaintext secret'ın:

- temp directory'de kalması,
- antivirüs/indexer tarafından okunması,
- crash sonrası temizlenmemesi

riskini yaratır.

Bu nedenle tercih edilmemelidir.

---

# 48. Native virtual file drag-out

Tercih edilen Windows implementasyonu:

```text
CFSTR_FILEDESCRIPTOR
+
CFSTR_FILECONTENTS
+
IDataObject
+
IDropSource
+
DoDragDrop / SHDoDragDrop
```

Bu yöntem Windows Shell'e:

> “Bu dosya filesystem üzerinde mevcut olmayabilir; içeriğini gerektiğinde stream edeceğim.”

şeklinde virtual file sunmaya olanak verir.

Avantaj:

- plaintext temp `.env` dosyası gerektirmez,
- hedef Explorer dropped file'ı kendi seçtiği konumda oluşturur.

---

# 49. Drag-out veri akışı

```text
mouse down
  ↓
drag threshold
  ↓
backend decrypt aktif EnvDocument
  ↓
virtual IDataObject
  ├── FILEDESCRIPTOR: ".env"
  └── FILECONTENTS: IStream
  ↓
SHDoDragDrop / DoDragDrop
  ↓
Explorer drop target
  ↓
target asks FILECONTENTS
  ↓
memory stream
  ↓
target writes .env
  ↓
drag loop ends
  ↓
plaintext buffer zeroize/drop
```

---

# 50. Drag-out threading

OLE drag-and-drop:

- `OleInitialize`
- STA thread

gerektirir.

Drag source implementasyonu dedicated STA thread üzerinde olabilir.

UI donmamalıdır.

Drag operation süresince visual state korunur.

---

# 51. Drag-out scope

V1:

- tek env document drag-out.

V1.1:

- birden fazla env document aynı anda drag.

Çünkü aynı proje içinde `.env`, `.env.local` birlikte export faydalı olabilir.

---

# 52. Drag-out UX

Draggable alan:

- tüm card değil,
- filename satırı veya drag handle.

Böylece edit/select ile drag çakışmaz.

Cursor/overlay:

```text
.env dosyasını dışa aktar
```

anlamı vermelidir.

Emoji yok.

---

# 53. Drag-out fallback

Virtual file drag teknik olarak bazı hedef uygulamalarda unsupported olabilir.

Fallback context:

```text
[ İndir ]
[ Farklı Konuma İndir ]
```

her zaman kullanılabilir olmalıdır.

Drag-out ürünün tek export yöntemi değildir.

---

# 54. Ekle butonu

Ana projede:

```text
[ Ekle ]
```

ikon:

- FilePlus / Plus

Tooltip:

```text
.env dosyası ekle
```

Native picker açar.

---

# 55. İndir butonu

Env document selected state:

```text
[ İndir ]
```

default export behavior'a göre çalışır.

Ek menu:

```text
Farklı Konuma İndir
Yolu Kopyala (uygun değil)
Dosya Adını Değiştir
Sil
```

Vault'ta fiziksel plaintext path olmadığı için “Dosya yolunu kopyala” sunulmaz.

---

# 56. Silme semantiği

Vault içindeki “Sil”:

- kaynak project `.env` dosyasını silmez,
- sadece Env Vault kaydını siler.

Bu UI'da açık olmalıdır.

Modal:

```text
.env Vault'tan silinsin mi?

Bu işlem Env Vault içindeki kayıtlı kopyayı siler.
Kaynak proje dosyasına dokunulmaz.
```

---

# 57. Secure deletion gerçeği

SSD ve modern filesystem üzerinde bitlerin fiziksel olarak garantili secure erase'i uygulama seviyesinde garanti edilemez.

Bu nedenle “Güvenli Sil” gibi yanlış bir iddia kullanılmamalıdır.

Vault kaydı silinirken:

- encrypted record kaldırılır,
- key/index metadata kaldırılır,
- memory plaintext temizlenir mümkün olduğunca.

Cryptographic deletion model tercih edilebilir.

---

# 58. Proje silme

Bir proje silinirse altındaki bütün env kayıtları da Vault'tan silinir.

Confirmation:

```text
“Vellium API” projesi Vault'tan silinsin mi?

Bu projeye ait 3 ortam dosyası kaldırılacak.
Bu işlem geri alınamaz.
```

Default focus:

**Vazgeç**

---

# 59. Backup

Env Vault'un amacı uzun süre secret saklamak olduğundan backup V1 kapsamında olmalıdır.

Buton:

```text
Vault Yedeği Oluştur
```

Çıktı:

```text
env-vault-backup-2026-08-29.evault
```

Dosya plaintext `.env` koleksiyonu değildir.

Tamamen şifreli container'dır.

---

# 60. Backup içeriği

Encrypted backup:

- project metadata,
- env metadata,
- env secret payloads,
- schema version,
- KDF parameters,
- integrity metadata.

Backup master password ile açılabilir olmalıdır.

DPAPI'ye bağımlı olmamalıdır.

---

# 61. Backup şifreleme

Backup için:

- Argon2id password derivation,
- random salt,
- authenticated encryption,
- versioned container format.

Örnek:

```text
EVLT
version
kdf
salt
nonce
encrypted payload
auth tag
```

Bu sadece conceptual format.

Implementation için standart audited crypto crates kullanılır.

---

# 62. Backup restore

Flow:

```text
Yedeği Geri Yükle
↓
.evault seç
↓
parola
↓
decrypt + integrity verify
↓
preview
↓
merge / replace
```

Default:

**Merge**

Duplicate behavior sorulur.

Full replace ayrı warning ister.

---

# 63. Backup recovery test

Release blocker:

1. Vault oluştur.
2. 20 proje ekle.
3. 50 env document ekle.
4. backup oluştur.
5. local vault'u test environment'ta kaldır.
6. fresh install simüle et.
7. backup restore.
8. bütün payload'ları byte-level karşılaştır.

---

# 64. Export ile Backup farkı

**Export / İndir**

```text
plaintext .env
```

**Vault Yedeği**

```text
encrypted .evault
```

UI bunları karıştırmamalıdır.

---

# 65. Search

Arama:

- proje adı,
- env filename.

Secret value içinde global search V1'de yapılmaz.

Sebep:

- plaintext secret index oluşturmayı engellemek,
- gereksiz decrypt maliyetini azaltmak,
- bilgi sızıntısını azaltmak.

---

# 66. Secret key arama

İleride “DATABASE_URL hangi projelerde var?” yararlı olabilir.

V1.1 kapsamında:

- runtime decrypt,
- memory scan,
- persisted plaintext index olmadan

uygulanabilir.

MVP dışında.

---

# 67. UI ana bilgi mimarisi

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo  Env Vault                                  Kilitle    │
├────────────────┬─────────────────────────────────────────────┤
│ Projeler       │ Vellium API                                 │
│                │                                             │
│ Ara...         │ .env                      Güncellendi 2 gün │
│                │                                             │
│ ★ Vellium API  │ DATABASE_URL       •••••••••••              │
│   Vellium Web  │ SUPABASE_URL       •••••••••••              │
│   CRM          │ SUPABASE_KEY       •••••••••••              │
│   Eski SaaS    │                                             │
│                │ [ Düzenle ] [ İndir ] [ ••• ]               │
│ + Proje Ekle   │                                             │
│                │ .env.production                             │
│                │ ...                                         │
├────────────────┴─────────────────────────────────────────────┤
│ Dosyayı buraya sürükleyerek içe aktarabilirsiniz            │
└──────────────────────────────────────────────────────────────┘
```

ASCII yalnızca mimari anlatım içindir.

Gerçek UI SVG ikon kullanır.

---

# 68. İlk açılış

State:

```text
Env Vault
─────────────────────────
Projelerinizin ortam dosyalarını
şifreli ve düzenli biçimde saklayın.

[ Yeni Vault Oluştur ]
```

Vault varsa:

```text
Env Vault Kilitli

Ana Parola
[________________]

[ Kilidi Aç ]
```

---

# 69. Empty state

Unlock sonrası proje yoksa:

```text
İlk projenizi ekleyin

.env dosyalarınızı proje bazında saklayabilir,
düzenleyebilir ve istediğiniz zaman dışa aktarabilirsiniz.

[ Proje Ekle ]
```

---

# 70. Proje ekranı

Header:

- proje adı,
- optional source path,
- env sayısı,
- Ekle,
- menu.

Cards/table:

- filename,
- updated date,
- key count runtime parse,
- actions.

---

# 71. Layout tercihi

Env Vault, Node Cleaner'daki yoğun table'dan biraz daha card/document odaklı olabilir.

Önerilen:

- sol navigation rail,
- sağ content workspace.

Premium ve sade.

---

# 72. Liquid Glass tasarım ilkesi

Liquid Glass:

- titlebar,
- sidebar,
- floating toolbar,
- modal,
- bottom action surface,
- popover

gibi fonksiyonel katmanlarda kullanılır.

Secret editor'ın arkasında ağır translucent hareketli içerik kullanılmaz.

Okunabilirlik birincildir.

---

# 73. Kök dizindeki Liquid Glass örneği

Proje kök dizinine verilecek örnek:

1. design reference olarak incelenir,
2. blur/opacity/radius çıkarılır,
3. dependency maliyeti değerlendirilir,
4. birebir copy zorunlu değildir,
5. security veya performance kuralını geçersiz kılmaz.

---

# 74. Tema sistemi

Beş tema:

1. Beyaz
2. Siyah
3. Transparan
4. Beyaz Transparan
5. Koyu Transparan

---

# 75. Beyaz tema

```css
--app-bg: #F5F5F7;
--surface: rgba(255,255,255,.94);
--surface-strong: #FFFFFF;
--text-primary: #111113;
--text-secondary: #66666B;
--border: rgba(0,0,0,.08);
--separator: rgba(0,0,0,.06);
```

---

# 76. Siyah tema

```css
--app-bg: #0B0B0D;
--surface: rgba(22,22,24,.96);
--surface-strong: #171719;
--text-primary: #F5F5F7;
--text-secondary: #A4A4AA;
--border: rgba(255,255,255,.10);
```

---

# 77. Beyaz Transparan

```css
--glass-bg: rgba(255,255,255,.56);
--glass-bg-strong: rgba(255,255,255,.72);
--glass-border: rgba(255,255,255,.55);
--text-primary: #111113;
```

---

# 78. Koyu Transparan

```css
--glass-bg: rgba(18,18,21,.62);
--glass-bg-strong: rgba(24,24,28,.76);
--glass-border: rgba(255,255,255,.11);
--text-primary: #F4F4F5;
```

---

# 79. Transparan

Sistem appearance ile uyumlu.

Windows 11:

- Mica öncelikli.

Windows 10:

- Acrylic test edilir,
- performans kötüyse opaque fallback.

---

# 80. Accent

Env Vault için güven/gizlilik hissi veren sakin accent.

Başlangıç:

```css
--accent: #0A84FF;
--accent-hover: #0077ED;
--success: #2E9B63;
--danger: #E5484D;
--warning: #D99028;
```

Final marka tasarımında değişebilir.

---

# 81. Blur token

```css
--glass-blur-sm: 12px;
--glass-blur-md: 20px;
--glass-blur-lg: 28px;
```

28px yalnızca küçük yüzeylerde.

Her env card'a backdrop blur yasak.

---

# 82. Typography

Öneri:

- Inter Variable
- veya Geist Sans

Editor:

- JetBrains Mono
- Geist Mono
- Cascadia Mono

Fontlar local package.

CDN yasak.

---

# 83. Spacing

4px grid:

```text
4 8 12 16 20 24 32 40 48 64
```

---

# 84. Radius

```text
control: 10–12
card: 14–16
glass panel: 16–20
modal: 18–22
floating toolbar: 20–24
```

---

# 85. İkonografi

Emoji kesinlikle yasak.

Öneri:

**Lucide**

Örnek:

| İşlem | İkon |
|---|---|
| Ekle | FilePlus2 |
| İndir | Download |
| Proje | Folder |
| Kilit | Lock |
| Kilidi aç | Unlock |
| Düzenle | Pencil |
| Sil | Trash2 |
| Yedek | Archive |
| Geri yükle | ArchiveRestore |
| Ayarlar | Settings |
| Göz | Eye |
| Gizle | EyeOff |
| Sık kullanılan | Star |
| Arama | Search |
| Sürükle | GripVertical |

---

# 86. Logo tasarım brief'i

Özel SVG.

Konseptler:

- vault,
- key/value,
- shield,
- environment layers,
- brace / code,
- secure container.

En fazla iki kavram birleştirilir.

Doğrudan klasik “asma kilit” clipart görünümü ana logo yapılmamalıdır.

---

# 87. Logo dosyaları

```text
assets/brand/
├── logo-master.svg
├── logo-mark.svg
├── logo-wordmark.svg
├── logo-light.svg
├── logo-dark.svg
└── app-icon.svg
```

---

# 88. Windows icon

`.ico`:

- 16×16
- 24×24
- 32×32
- 40×40
- 48×48
- 64×64
- 128×128
- 256×256

Master:

- SVG
- 1024×1024 PNG render.

Tekrarlanabilir icon generation script.

---

# 89. Dil

UI yüzde 100 Türkçe.

Teknik terimler gerekirse korunur:

- `.env`
- Node.js
- npm
- API
- token
- Vault

“Vault” ürün adı içinde kullanılabilir.

---

# 90. Türkçe terim sözlüğü

| Terim | UI karşılığı |
|---|---|
| Import | İçe Aktar / Ekle |
| Export | İndir / Dışa Aktar |
| Vault | Vault |
| Project | Proje |
| Environment file | Ortam Dosyası |
| Master Password | Ana Parola |
| Lock | Kilitle |
| Unlock | Kilidi Aç |
| Backup | Yedek |
| Restore | Geri Yükle |
| Default Folder | Varsayılan Klasör |
| Ask Every Time | Her Seferinde Sor |
| Save | Kaydet |
| Edit | Düzenle |
| Delete | Sil |
| Drag and Drop | Sürükle ve Bırak |

---

# 91. Microcopy tonu

- kısa,
- profesyonel,
- sakin,
- teknik doğruluk.

Kaçınılacak:

```text
Harika!
Süper!
Başardınız!
```

---

# 92. Erişilebilirlik

- WCAG AA.
- visible focus.
- keyboard navigation.
- icon-only `aria-label`.
- reduced motion.
- color-only state yok.
- glass kontrast fallback.
- screen reader label.

---

# 93. Keyboard

Minimum:

```text
Ctrl+N       Yeni proje
Ctrl+O       .env ekle
Ctrl+S       Aktif editörü kaydet
Ctrl+F       Ara
Ctrl+L       Vault'u kilitle
Esc          Modal kapat
```

`Delete` doğrudan Vault kaydı silmemeli.

---

# 94. Clipboard

Secret value için:

```text
Kopyala
```

aksiyonu olabilir.

Security:

- explicit click,
- toast,
- opsiyonel 30/60 saniye sonra clipboard temizleme.

Windows clipboard'u temizlerken başka uygulamanın clipboard'u değiştirmiş olması ihtimali kontrol edilmelidir.

Kendi yazdığımız value hâlâ clipboard'daysa temizle.

---

# 95. Reveal

Value preview:

```text
••••••••••••
```

Eye button ile geçici reveal.

Auto-hide:

- 10–30 saniye,
- veya focus loss.

Ayar olabilir.

---

# 96. Secret UI screenshot riski

Uygulama screenshot'ı tamamen engelleyemez.

Windows display affinity gibi screenshot protection mekanizmaları opsiyonel araştırılabilir.

MVP'de:

- reveal explicit,
- plaintext default görünmez.

---

# 97. Search field

Project list search:

```text
Proje ara...
```

Env list:

```text
Dosya ara...
```

Secret value search yok.

---

# 98. Favorite

Sık kullanılan projeler:

- star,
- sidebar top.

Metadata only.

---

# 99. Sorting

Projeler:

- A-Z,
- son güncellenen,
- eklenme tarihi.

Env:

- filename,
- updated date.

---

# 100. Source path metadata

Import sırasında kaynak path opsiyonel saklanabilir:

```text
C:\Projects\VelliumApi\.env
```

UI:

```text
İçe aktarıldığı konum
```

olarak gösterilir.

Bu path sadece bilgi amaçlıdır.

Vault içeriğini okumak için kullanılmaz.

---

# 101. Source sync yasak

V1'de:

- kaynak `.env` değiştiğinde Vault otomatik güncellenmez,
- watcher yok,
- two-way sync yok.

Neden:

- source lifecycle independence,
- background resource yok,
- secret overwrite riskini azaltma.

İleride explicit:

```text
Kaynak Dosyadan Güncelle
```

özelliği eklenebilir.

---

# 102. İçe aktarım sonrası doğrulama

Import başarılı olunca:

```text
.env Vault'a eklendi.
```

Alt bilgi:

```text
Kaynak dosya daha sonra silinse bile Vault'taki kopya korunur.
```

Bu mesaj ilk birkaç kullanımda gösterilebilir.

---

# 103. Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                 React / TypeScript                        │
│                                                           │
│  app shell                                                │
│  projects                                                 │
│  env documents                                            │
│  editor                                                   │
│  import/export                                            │
│  backup                                                   │
│  settings                                                 │
│  theme                                                    │
└─────────────────────────┬─────────────────────────────────┘
                          │
                    Typed Tauri API
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                       Rust Core                           │
│                                                           │
│  vault/       crypto/       metadata/                     │
│  import/      export/       backup/                       │
│  dragdrop/    settings/     platform/windows/             │
│                                                           │
└───────────────┬───────────────────┬───────────────────────┘
                │                   │
          Stronghold           Windows APIs
                │              OLE / Dialog / DPAPI
                │
          encrypted data
```

---

# 104. Frontend klasör yapısı

```text
src/
├── app/
│   ├── App.tsx
│   ├── bootstrap.ts
│   └── providers/
├── features/
│   ├── vault/
│   ├── projects/
│   ├── env-documents/
│   ├── editor/
│   ├── import/
│   ├── export/
│   ├── drag-drop/
│   ├── backup/
│   ├── settings/
│   └── theme/
├── components/
│   ├── primitives/
│   └── shared/
├── stores/
├── lib/
│   └── tauri/
├── locales/
├── styles/
└── types/
```

---

# 105. Rust klasör yapısı

```text
src-tauri/src/
├── lib.rs
├── commands/
│   ├── vault_commands.rs
│   ├── project_commands.rs
│   ├── env_commands.rs
│   ├── import_commands.rs
│   ├── export_commands.rs
│   ├── backup_commands.rs
│   └── settings_commands.rs
├── vault/
│   ├── mod.rs
│   ├── service.rs
│   ├── stronghold.rs
│   └── session.rs
├── crypto/
│   ├── mod.rs
│   ├── kdf.rs
│   ├── random.rs
│   └── zeroize.rs
├── metadata/
│   ├── mod.rs
│   ├── models.rs
│   ├── repository.rs
│   └── migrations.rs
├── env/
│   ├── parser.rs
│   ├── encoding.rs
│   └── models.rs
├── import/
├── export/
├── backup/
├── dragdrop/
│   ├── import_drop.rs
│   └── windows_virtual_file.rs
├── platform/
│   └── windows/
│       ├── dpapi.rs
│       ├── ole_drag.rs
│       └── known_folders.rs
├── settings/
└── error/
```

---

# 106. God Context yasağı

Tek context:

```text
VaultContext
```

içinde her şey tutulmaz.

Ayrım:

```text
vault-session-store
project-store
env-list-store
editor-store
preferences-store
ui-store
```

Secret plaintext global persistent store'a yazılmaz.

---

# 107. God component yasağı

Aşağıdaki yapı yasak:

```text
App.tsx 3000 lines
```

Screen component orchestration yapar.

Business logic feature service/hook/store'a ayrılır.

---

# 108. Typed frontend gateway

Component'ler doğrudan:

```ts
invoke("get_secret", ...)
```

çağırmaz.

Adapter:

```text
lib/tauri/vault-api.ts
lib/tauri/env-api.ts
lib/tauri/export-api.ts
```

---

# 109. Command listesi

Önerilen:

```text
initialize_vault
unlock_vault
lock_vault
change_master_password

list_projects
create_project
update_project
delete_project

list_env_documents
import_env_file
create_env_document
read_env_document
update_env_document
delete_env_document

export_env_document
start_virtual_file_drag

create_backup
restore_backup

get_settings
update_settings
```

---

# 110. Secret command discipline

`read_env_document`:

- vault unlocked olmalı,
- tek document döndürmeli,
- return payload mümkün olduğunca sınırlı.

`list_env_documents` secret content döndürmez.

---

# 111. Frontend secret persistence yasağı

Secret raw text:

- localStorage,
- sessionStorage,
- IndexedDB,
- Tauri Store,
- query string

içinde saklanmaz.

Sadece aktif memory state.

---

# 112. Browser autofill

Editor / master password alanlarında browser/WebView autofill davranışı kontrol edilmelidir.

Master password:

```text
autocomplete="current-password"
```

gibi semantik davranış güvenlik/UX testine göre.

Secret editor general autofill kapalı olmalıdır.

---

# 113. Tauri capability

Minimum izin.

Frontend broad fs access yok.

Import/export native command veya scoped dialog üzerinden.

Tauri dialog dokümantasyonu güvenlik önemli olduğunda dedicated command yaklaşımını önerdiğinden, secret export yazma işi Rust dedicated command üzerinden yapılmalıdır.

---

# 114. Arbitrary filesystem write

Frontend:

```text
writeFile(path, plaintextSecret)
```

gibi broad API'ye sahip olmamalıdır.

Backend export command:

- user-approved path,
- configured default directory

ile sınırlandırılır.

---

# 115. Default directory permission

Settings'teki path frontend tarafından değiştirilebilir olsa bile backend:

- canonicalize,
- directory,
- writable

doğrulaması yapar.

---

# 116. Path traversal

Filename export:

```text
.env
.env.production
```

olmalı.

Kullanıcı filename içine:

```text
..\..\secret
```

veremez.

Path separator:

- `\`
- `/`

filename içinde reddedilir/sanitize edilir.

---

# 117. Reserved Windows names

Env filename normalde problem yaratmaz.

Ama custom display filename desteklenirse Windows reserved names kontrol edilir:

```text
CON
PRN
AUX
NUL
COM1
LPT1
...
```

---

# 118. Atomic metadata update

Metadata transaction + secret storage update consistency gerektirir.

Örneğin import:

1. temporary secret record,
2. metadata transaction,
3. commit,
4. finalize secret.

Crash consistency tasarlanmalıdır.

---

# 119. Orphan record recovery

Startup integrity check:

- metadata secretRef var,
- secret store kaydı var mı.

Eksikse:

```text
corrupt/orphan
```

olarak raporlanır.

Automatic plaintext recovery yok.

---

# 120. Transaction journal

Basit operation journal düşünülebilir:

```text
operation id
type
state
```

Ama metadata DB transaction yeterliyse ek kompleksite gereksizdir.

Benchmark/implementation sırasında karar verilir.

---

# 121. Metadata database

Öneri:

SQLite.

Neden:

- transaction,
- migration,
- query,
- küçük footprint,
- robust.

Secret payload encrypted olduğu sürece metadata DB plaintext olabilir.

---

# 122. Metadata DB tabloları

```sql
projects
env_documents
settings_meta
schema_migrations
```

Secret values yok.

---

# 123. Migration

Schema version:

```text
1
```

Migration:

```text
v1 -> v2
v2 -> v3
```

tek yön forward.

Backup restore eski version okuyabilmeli veya migration yapmalı.

---

# 124. Performance ilkeleri

- polling yok.
- watcher yok.
- network yok.
- background daemon yok.
- editor sadece gerektiğinde mount.
- large list virtualization.
- blur limited.
- secret parse sadece aktif dokümanda.

---

# 125. Idle

Vault unlocked olsa bile:

- CPU near zero,
- disk I/O zero,
- network zero.

Auto-lock için tek scheduled timer dışında per-second loop yok.

---

# 126. Editor performansı

`.env` tipik olarak küçük.

Yine de 10 MB limit.

CodeMirror extension minimum.

Ağır language server yok.

---

# 127. React performance

Store selectors.

Yanlış:

```ts
const store = useVaultStore();
```

Doğru:

```ts
const isUnlocked = useVaultStore(s => s.isUnlocked);
```

---

# 128. Glass performance

Her card:

```css
backdrop-filter
```

kullanmaz.

Büyük opaque content plane + glass navigation surface.

---

# 129. Motion

- transform,
- opacity.

Duration:

```text
hover 120–160 ms
modal 160–220 ms
panel 180–240 ms
```

Reduced motion.

---

# 130. Drag performance

Drag-over event sırasında secret decrypt yapılmaz.

Decrypt:

- drag gerçekten başladığında,
- veya target content talep ettiğinde.

Virtual stream lazy olabilir.

---

# 131. Import file reading

Drop event sadece path alır.

Dosya okumayı Rust backend yapar.

Frontend file content taşımaz.

---

# 132. Drag-in Tauri davranışı

Tauri webview drag-drop özelliği Windows'ta platform native event ile kullanılmalıdır.

HTML5 drag/drop ile Tauri native drag/drop aynı anda karmaşıklaştırılmamalıdır.

Config tek yaklaşım için net olmalıdır.

---

# 133. Loading states

- Vault unlocking,
- importing,
- saving,
- exporting,
- backup,
- restore.

Küçük işlemlerde spinner flash önlemek için:

```text
150–200 ms delayed loading indicator
```

kullanılabilir.

---

# 134. Progress

Backup/restore çok büyürse progress.

Env import/export genellikle progress gerektirmez.

---

# 135. Error taxonomy

```rust
enum AppError {
    VaultNotInitialized,
    VaultLocked,
    InvalidMasterPassword,
    VaultCorrupted,
    ProjectNotFound,
    EnvDocumentNotFound,
    InvalidEnvFile,
    FileTooLarge,
    UnsupportedEncoding,
    ImportReadFailed,
    SecretWriteFailed,
    SecretReadFailed,
    ExportPathInvalid,
    ExportWriteFailed,
    ExportTargetExists,
    DragDropFailed,
    BackupCreateFailed,
    BackupInvalid,
    BackupPasswordInvalid,
    RestoreFailed,
    SettingsReadFailed,
    SettingsWriteFailed,
    PlatformUnsupported,
}
```

---

# 136. Error UI

Raw stack yok.

Örnek:

```text
.env dosyası okunamadı.
```

Detay:

```text
Erişim izni yok.
```

Debug build log daha detaylı.

---

# 137. Logging

Kesinlikle loglanmaz:

- `.env` raw text,
- secret value,
- master password,
- derived key,
- decrypted backup.

Path'ler release log'da minimum.

---

# 138. Crash

Crash report otomatik upload yok.

Local crash log:

- secret-free.

Panic message içinde secret olmamalı.

---

# 139. Telemetry

Yok.

---

# 140. Analytics

Yok.

---

# 141. Network

MVP core'da HTTP client dependency gereksiz.

Font/asset CDN yok.

---

# 142. Threat model

## Tehdit A — Proje klasörü siliniyor

Çözüm:

Vault bağımsız encrypted copy.

## Tehdit B — Vault storage dosyaları çalınıyor

Çözüm:

Stronghold/encryption + Argon2id.

## Tehdit C — Master password brute force

Çözüm:

Argon2id memory-hard KDF.

## Tehdit D — Uygulama açıkken bilgisayar ele geçiriliyor

Tam olarak önlenemez.

Azaltım:

- auto-lock,
- masked values,
- minimal memory lifetime.

## Tehdit E — Malware aynı kullanıcı context'inde

Tam koruma garanti edilemez.

Açıkça belgelenir.

## Tehdit F — Export edilen plaintext `.env`

Vault kontrolü dışına çıkar.

UI kullanıcıya export'un plaintext oluşturduğunu söyleyebilir.

## Tehdit G — Temp plaintext drag-out

Çözüm:

virtual file drag.

## Tehdit H — Backup kaybı

Backup encrypted.

---

# 143. Security sınırları

Env Vault:

- malware-proof değildir,
- kernel attacker'a karşı koruma sağlamaz,
- admin/root compromise'a karşı kesin garanti vermez,
- kullanıcı export ettiği plaintext dosyanın güvenliğini kontrol edemez.

Ürün yanlış güvenlik iddiası yapmamalıdır.

---

# 144. Risk analizi

## RISK-001 — Vault plaintext saklanır

Etki: Kritik.

Önlem:

- Stronghold/encryption,
- tests,
- file scan.

## RISK-002 — Proje silinince Vault kaydı kaybolur

Etki: Kritik.

Önlem:

- copy-in architecture,
- AppLocalData.

## RISK-003 — Master password kaybı

Etki: Kritik.

Önlem:

- açık onboarding uyarısı,
- encrypted backup.

## RISK-004 — Drag-out temp secret leak

Etki: Yüksek.

Önlem:

- virtual file Shell format.

## RISK-005 — Export yanlış dosyanın üzerine yazar

Etki: Yüksek.

Önlem:

- default ask,
- overwrite policy.

## RISK-006 — Secret console log

Etki: Kritik.

Önlem:

- lint/review,
- logging wrapper.

## RISK-007 — localStorage leak

Etki: Kritik.

Önlem:

- secret persistence ban.

## RISK-008 — DB corrupt

Etki: Yüksek.

Önlem:

- transactions,
- backup,
- integrity check.

## RISK-009 — Stronghold snapshot corrupt

Etki: Kritik.

Önlem:

- backup,
- atomic file behavior,
- restore tests.

## RISK-010 — Liquid Glass readability

Etki: Orta.

Önlem:

- contrast fallback.

## RISK-011 — Excessive memory

Etki: Orta.

Önlem:

- active doc only,
- lazy load.

## RISK-012 — DPAPI machine-bound

Etki: Orta.

Önlem:

- convenience only,
- backup password independent.

---

# 145. Security testleri

- Vault dosyasını hex/string search ile incele.
- Known test secret plaintext diskte aranır.
- metadata DB'de aranır.
- settings file'da aranır.
- logs'da aranır.
- crash log'da aranır.
- localStorage/IndexedDB kontrol edilir.
- backup plaintext search.
- wrong password.
- corrupted snapshot.
- altered backup authentication tag.
- path traversal export.
- default directory missing.
- duplicate overwrite.
- drag-out cancellation.
- drag-out Explorer drop.
- drag-out unsupported target.
- auto-lock sırasında editor.
- app close sırasında unsaved secret.

---

# 146. Plaintext leakage test

Test secret:

```text
ENV_VAULT_TEST_SECRET_7F4C...
```

İçe aktar.

Sonra uygulama kapalıyken `%LOCALAPPDATA%\EnvVault` altındaki tüm dosyalarda byte search yap.

Beklenen:

**0 plaintext match**

Hariç:

- explicit kullanıcı export dosyası test scope içindeyse.

---

# 147. Unit test

## KDF

- deterministic same salt/password.
- different salt.
- parameter validation.

## Parser

- comments.
- blank lines.
- quoted.
- equal sign in value.
- empty.
- export.
- CRLF/LF.

## Filename

- `.env`
- `.env.production`
- invalid separator.
- reserved names.

## Settings

- default.
- migration.
- corruption.

## Export

- ask.
- default dir.
- collision.

---

# 148. Integration test

Fixture:

```text
fixtures/
├── app-a.env
├── .env
├── .env.production
├── crlf.env
├── utf8bom.env
└── invalid-binary
```

Test:

- import,
- delete source,
- reopen,
- decrypt,
- export,
- compare.

---

# 149. En kritik integration testi

```text
temp project create
↓
write .env
↓
import
↓
delete entire project directory
↓
restart app/backend
↓
unlock
↓
read env
↓
export
↓
assert content equal
```

Bu test olmadan release yapılmaz.

---

# 150. Drag-in E2E

- Explorer-like file drop simulation mümkünse.
- fallback integration event.
- multiple files.
- invalid file.
- project selected.
- home selected.

---

# 151. Drag-out E2E

Windows native test:

- virtual data object advertises FILEDESCRIPTOR.
- filename `.env`.
- FILECONTENTS stream correct.
- cancel no file.
- Explorer target writes correct bytes.
- temporary plaintext file oluşmuyor.

---

# 152. Backup test

- create.
- wrong password.
- corrupt byte.
- restore fresh.
- merge.
- duplicate.
- full replace.

---

# 153. Performance tests

## P-001

100 projects.

## P-002

1000 env metadata records.

## P-003

1 MB active editor.

## P-004

10 MB boundary.

## P-005

8-hour idle soak.

## P-006

100 repeated import/export.

## P-007

100 unlock/lock cycles.

## P-008

memory profile after editor close.

## P-009

theme switching.

## P-010

drag 50 times and inspect handle leak.

---

# 154. Memory leak acceptance

100 kez:

```text
open env
close env
```

sonrasında memory sürekli lineer artmamalıdır.

Drag OLE COM objects release edilmelidir.

---

# 155. Handle leak

Windows Process Explorer veya automated counter ile:

- GDI,
- USER,
- handles

drag/export loop sonrası stabil olmalıdır.

---

# 156. Accessibility test

- keyboard-only unlock.
- keyboard project create.
- editor focus.
- reveal button labels.
- modal order.
- destructive confirm.
- themes contrast.

---

# 157. Visual regression

Her tema için:

- lock screen,
- empty vault,
- project list,
- env cards,
- editor,
- settings,
- import drop overlay,
- delete modal,
- backup modal,
- error state.

---

# 158. UI component inventory

Primitives:

```text
Button
IconButton
Input
PasswordInput
Checkbox
Switch
Select
SearchField
Tooltip
Popover
Dialog
ConfirmDialog
DropdownMenu
Surface
GlassSurface
Badge
ProgressBar
Toast
EmptyState
SidebarItem
CodeSurface
```

Feature:

```text
VaultLockScreen
VaultSetup
ProjectSidebar
ProjectHeader
EnvDocumentCard
EnvDocumentList
EnvEditor
EnvPreview
ImportDropOverlay
ExportMenu
DefaultExportFolderSetting
BackupPanel
RestoreDialog
DeleteEnvDialog
DeleteProjectDialog
ThemePicker
```

---

# 159. Toast

Örnek:

```text
.env Vault'a eklendi.
.env indirildi.
Değişiklikler kaydedildi.
Vault kilitlendi.
```

Secret value toast içinde yok.

---

# 160. Modal

Max width:

```text
440–540 px
```

Glass olabilir.

Destructive default focus güvenli.

---

# 161. Import drop overlay

Dosya pencereye girdiğinde:

```text
.env dosyasını bırakın
```

Subtext:

```text
Dosya Vault'a şifreli olarak kopyalanacak.
```

Bu UX copy-in semantics'i öğretir.

---

# 162. Drag-out görseli

Drag image:

- file icon SVG benzeri,
- `.env` filename.

Secret value göstermez.

---

# 163. Settings

Minimum sections:

```text
Güvenlik
İndirme
Görünüm
Yedekleme
Uygulama
```

---

# 164. Güvenlik ayarları

```text
Otomatik kilitle
Windows ile otomatik kilit aç
Değerleri otomatik gizle
Panoya kopyalanan değerleri temizle
Ana parolayı değiştir
```

---

# 165. İndirme ayarları

```text
Her indirmede konum sor
Varsayılan klasör
Dosya varsa ne yapılsın
```

---

# 166. Görünüm

```text
Tema
Hareketleri azalt
Yoğunluk
```

MVP density tek olabilir.

---

# 167. Yedekleme

```text
Vault Yedeği Oluştur
Yedeği Geri Yükle
Son yedek tarihi (lokal metadata)
```

Automatic cloud backup yok.

---

# 168. Uygulama

```text
Sürüm
Lisans
Veri konumu
```

“Vault klasörünü aç” seçeneği security nedeniyle dikkatli.

Encrypted files olduğu için açılabilir fakat kullanıcıya silmemesi uyarısı gerekir.

---

# 169. Master password değişimi

Flow:

1. mevcut parola,
2. yeni parola,
3. tekrar,
4. Stronghold/keys rewrap/re-encrypt,
5. atomic commit.

Crash sırasında eski Vault bozulmamalıdır.

---

# 170. Password change test

- correct current.
- wrong.
- crash simulation.
- backup after change.
- old password invalid.
- new password valid.

---

# 171. Lock behavior

Vault kilitlenince:

- active editor close,
- secret plaintext state clear,
- revealed values clear,
- decrypted caches clear,
- project metadata gösterimi policy'ye göre kalabilir.

Tercih:

Lock screen full overlay; proje isimleri de gizli kalır.

---

# 172. Window title

Locked:

```text
Env Vault
```

Unlocked:

```text
Env Vault
```

Project adı window title'a yazılmak zorunda değildir.

Privacy açısından sabit title tercih edilir.

---

# 173. Recent files Windows integration

Windows Recent Documents listesine export edilen secret dosyaları otomatik eklenebilir.

Uygulama bunu kontrol edebildiği ölçüde privacy değerlendirmesi yapılmalıdır.

MVP'de Shell Recent integration özellikle eklenmez.

---

# 174. File association

`.evault` backup extension ile file association opsiyonel.

V1 installer'da şart değil.

---

# 175. Installer

- NSIS birincil.
- user-level install.
- admin gerektirmemesi tercih.
- uninstall.

Kritik:

Uninstall sırasında kullanıcı Vault verisi otomatik silinmemelidir.

---

# 176. Uninstall data davranışı

Bu ürün için çok önemli.

Uninstaller:

**Vault verisini varsayılan olarak SİLMEMELİDİR.**

Çünkü kullanıcının amacı uzun süre secret saklamak.

Uninstall ekranında ayrı seçenek:

```text
Vault verilerini ve ayarları da sil
```

varsayılan **kapalı**.

Bu seçenek destructive confirmation ister.

---

# 177. Reinstall

Uygulama kaldırılıp yeniden kurulursa:

- AppLocalData korunmuşsa Vault bulunmalı.
- kullanıcı master password ile açabilmeli.

Bu acceptance test yapılmalıdır.

---

# 178. App update

Update mevcut Vault formatını bozmaz.

Schema migration backup tavsiye eder.

Major vault migration öncesi otomatik encrypted local backup değerlendirilebilir.

---

# 179. Code signing

Public distribution yapılırsa Authenticode.

Kişisel kullanımda opsiyonel.

---

# 180. CI

```text
pnpm install --frozen-lockfile
typecheck
lint
frontend test
cargo fmt --check
cargo clippy
cargo test
cargo audit
security plaintext fixture test
build
```

---

# 181. Release security gate

Release öncesi:

- plaintext leakage test,
- backup restore,
- wrong password,
- source project deletion,
- drag-out,
- export overwrite,
- 8-hour soak.

---

# 182. Dependency policy

Her dependency:

- bakım,
- security,
- footprint,
- transitive deps.

Ağır UI framework yok.

Material UI / Ant Design önerilmez.

---

# 183. Editor dependency policy

Monaco çok ağır gelebilir.

CodeMirror 6 preferred.

Sadece gerekli paketler.

---

# 184. Cryptography dependency policy

Kendi crypto primitive yasak.

Audited/widely used crates.

Version pin/lockfile.

---

# 185. Source code secret

Test fixture gerçek credential içermez.

Fake values:

```text
example.invalid
test-secret-not-real
```

---

# 186. Git

Repo `.gitignore`:

```text
.env
.env.*
!.env.example
*.evault-test-secret
```

Uygulama geliştirme repo'sunda gerçek secret tutulmaz.

---

# 187. Config

Development config secret-free.

Signing keys source repo'da değil.

---

# 188. Backup filename

Default:

```text
EnvVault-2026-08-29-2130.evault
```

Türkçe karakter kullanmak zorunlu değil.

---

# 189. Export filename collision

Default directory mode:

Policy:

```text
Sor
```

Alternatif:

```text
.env (1)
```

`.env` dosyasında bu isim beklenmedik olabilir.

Daha doğru:

```text
.env
.env.backup-20260829
```

Ama user project behavior için “Sor” en güvenli.

---

# 190. Hızlı export

Kullanıcı default folder'ı etkinleştirmişse:

```text
[ İndir ]
```

tek tık.

Tooltip:

```text
C:\...\EnvExports konumuna indir
```

---

# 191. İndir butonu yanında menu

```text
[ İndir ▼ ]
```

Menu:

- İndir
- Farklı Konuma İndir
- Varsayılan Klasörü Değiştir

Bu yapı sade olabilir.

---

# 192. Default directory indicator

Settings dışında proje ekranında küçük bilgi:

```text
İndirme: C:\...\EnvExports
```

zorunlu değil.

Tooltip yeterli.

---

# 193. Drag-out conflict

Editor içindeki text selection drag, virtual file drag başlatmamalı.

Drag-out sadece document header/handle.

---

# 194. Drag-in nested target

Editor açıkken `.env` drop edilirse:

default import overlay açılmalıdır.

Text editor içine file path string yapıştırılmamalıdır.

---

# 195. Import multiple

Birden fazla env drop:

- aynı projeye ekle.

Duplicate resolution batch dialog.

---

# 196. Import folder

V1'de klasör drop ederek tüm `.env` bulma yok.

Scope creep.

İleride:

```text
Klasördeki .env dosyalarını bul
```

özelliği eklenebilir.

---

# 197. Project source path

Project oluştururken source path eklemek yararlı.

Ama bağımsızlık kuralı:

```text
project.sourcePath = optional metadata
```

Vault storage değildir.

---

# 198. Source status

Kaynak path kaybolduysa UI:

```text
Kaynak klasör artık bulunamıyor
```

gösterebilir.

Ama warning env sağlığını etkilemez.

Bu özellik MVP için opsiyonel ve path check yalnızca explicit kullanıcı isteğiyle yapılmalı; background polling yok.

---

# 199. “Kaynak dosyayı aç”

Source hâlâ varsa context menu olabilir.

MVP dışında tutulabilir.

---

# 200. Revision history

Güvenlik + usability açısından yararlı.

Ancak V1 basit tutulabilir.

V1.1:

- son 10 revision encrypted,
- restore.

Metadata revision timestamp.

---

# 201. Autosave

Default kapalı.

Ayar olarak bile V1'de eklenmemesi tercih.

Secret editor explicit save.

---

# 202. Editor format normalization

Save sırasında satırlar reformat edilmez.

Parser yalnızca highlight/preview için.

Raw text authoritative.

---

# 203. Parser güvenliği

`.env` value'ları execute edilmez.

Variable expansion yapılmaz.

Shell substitution yapılmaz.

`$(command)` execute edilmez.

Dosya sadece text data.

---

# 204. dotenv loading yasak

Uygulama `.env` dosyasını kendi process environment'ına yüklememelidir.

Yani:

```text
dotenv::from_path()
```

gibi process env'e enjekte eden API kullanılmamalı.

Parse-only.

---

# 205. Secret injection yok

MVP uygulama hiçbir child process'e secret enjekte etmez.

Bu güvenlik scope'unu dar tutar.

---

# 206. Content validation

Import:

- binary NUL byte varsa reject/warn.
- invalid UTF handle.
- max size.
- parse error import'u tamamen engellemek zorunda değil.

`.env` esnek text formatıdır.

Raw mode ile saklanabilir.

---

# 207. Parse warnings

Örnek:

```text
3 satır standart KEY=VALUE biçiminde değil.
Dosya yine de ham metin olarak saklanabilir.
```

User:

- Yine de ekle
- Vazgeç.

---

# 208. Sensitive display timeout

Reveal all:

- 30 saniye sonra hide.
- app loses focus → hide.

Edit mode dışında.

---

# 209. Window blur on focus loss

Opsiyonel privacy feature:

App focus kaybında content blur.

V1.1 olabilir.

---

# 210. Screen capture protection

Windows `SetWindowDisplayAffinity` gibi mekanizmalar ileride değerlendirilebilir.

Ama browser/webview uyumluluğu test gerektirir.

V1 requirement değil.

---

# 211. Performance budget

| Alan | Bütçe |
|---|---|
| Startup JS bundle | mümkün olduğunca küçük |
| Editor lazy chunk | lazy |
| Icon import | per-icon |
| Blur layer | <5 büyük aktif surface |
| Global timer | minimum |
| Network | 0 |
| Watcher | 0 |
| Background worker | unlock dışında idle 0 |

---

# 212. UI density

Sidebar:

```text
row 36–40px
```

Env card:

```text
80–120px
```

Editor full area.

---

# 213. Responsive desktop

Min:

```text
980×640
```

Default:

```text
1180×760
```

---

# 214. Sidebar

Width:

```text
240–280px
```

Resizable opsiyonel.

V1 fixed responsive width yeterli.

---

# 215. Window state

Hatırla:

- width,
- height,
- position,
- maximize.

Secret state hatırlanmaz.

---

# 216. Startup flash

Sequence:

```text
load settings
↓
apply theme
↓
window show
↓
initialize vault status
```

Beyaz flash minimize.

---

# 217. Startup security

Vault secret daha UI render olmadan otomatik decrypt edilmez.

Auto-unlock açık ise kullanıcı convenience tercihi.

---

# 218. Theme persistence

Theme settings plaintext safe.

---

# 219. Default export directory persistence

Path settings plaintext.

Secret değil ama kişisel path olabilir.

Cloud telemetry olmadığı için risk düşük.

---

# 220. Favorite project persistence

Metadata DB.

---

# 221. Project names security

Project name hassas olabilir.

Default metadata plaintext ise disk attacker proje isimlerini görebilir.

Security karar:

**Metadata encryption seviyesi değerlendirilmelidir.**

Tercih edilen premium security:

- project name dahil sensitive metadata Stronghold/encrypted payload içinde,
- SQLite yalnızca opaque UUID/index.

Alternatif basit:

- metadata plaintext.

Bu ürün secret vault olduğu için final öneri:

**Project name ve env filename dahil kullanıcı metadata'sını da mümkün olduğunca encrypted sakla.**

---

# 222. Encrypted metadata modeli

SQLite:

```text
id
type
encrypted_blob
created_at
updated_at
```

veya tamamen Stronghold.

Search için unlock sonrası memory index.

Avantaj:

Disk attacker proje isimlerini görmez.

Dezavantaj:

Query complexity.

10–100 proje için performans sorun değil.

---

# 223. Final storage kararı

Önerilen V1:

```text
Stronghold snapshot
  ├── projects metadata
  ├── env metadata
  └── env raw payload

settings.json
  ├── theme
  ├── default export path
  └── non-secret preferences
```

Bu ölçek için SQLite zorunlu değildir.

Ancak Stronghold Store CRUD ve snapshot büyüme davranışı benchmark edilmelidir.

Eğer performans/transaction gerekirse:

```text
SQLite opaque metadata + encrypted payload
```

modeline geçilir.

Abstraction:

```rust
trait VaultRepository
```

arkasında tutulur.

---

# 224. VaultRepository

```rust
trait VaultRepository {
    fn create_project(&self, project: ProjectSecret) -> Result<()>;
    fn list_projects(&self) -> Result<Vec<ProjectSecret>>;
    fn put_env(&self, env: EnvSecretRecord) -> Result<()>;
    fn get_env(&self, id: EnvId) -> Result<EnvSecretRecord>;
    fn delete_env(&self, id: EnvId) -> Result<()>;
}
```

UI storage implementation bilmez.

---

# 225. ExportService

```rust
trait ExportService {
    fn export_to_path(
        &self,
        document_id: EnvId,
        target: PathBuf
    ) -> Result<ExportReport>;

    fn begin_virtual_drag(
        &self,
        document_id: EnvId
    ) -> Result<DragResult>;
}
```

---

# 226. ImportService

```rust
trait ImportService {
    fn import_file(
        &self,
        project_id: ProjectId,
        path: PathBuf,
        collision: CollisionPolicy
    ) -> Result<ImportedEnv>;
}
```

---

# 227. SettingsService

Secret-independent.

```text
theme
autoLock
defaultExport
askExportLocation
overwritePolicy
clipboardClear
reduceMotion
```

---

# 228. UI store separation

```text
useVaultSessionStore
useProjectStore
useEnvStore
useEditorStore
usePreferencesStore
useDialogStore
```

Editor secret state never persisted middleware.

---

# 229. Test fixtures security

Encrypted snapshot fixture fake secret.

No real company credentials.

---

# 230. Uninstall test

1. Vault oluştur.
2. app uninstall.
3. data keep seç.
4. reinstall.
5. unlock.
6. data exists.

---

# 231. Destructive uninstall test

1. uninstall.
2. “Vault verilerini sil” select.
3. second confirmation.
4. verify AppData removed.

---

# 232. Import path deletion test

Kaynak `.env` imported.

Sonra:

```text
remove_file(source)
```

Vault read passes.

---

# 233. Full project deletion test

Kaynak proje recursive delete.

Vault read passes.

---

# 234. Drive disconnect

Source external disk üzerinde.

Import.

Disk disconnect.

Vault read passes.

Bu ürün bağımsızlık ilkesinin güçlü testidir.

---

# 235. Network share source

UNC'den import mümkün olabilir:

```text
\\server\share\.env
```

Import başarılı olursa copy bağımsız.

V1 best-effort.

---

# 236. Default export to unavailable drive

Default path:

```text
E:\EnvExports
```

drive çıkarılmış.

İndir:

- clear error,
- alternate path dialog.

---

# 237. Backup to unavailable drive

Partial backup file cleanup.

---

# 238. Low disk space

Vault import veya backup sırasında disk full.

- source unaffected,
- existing Vault not corrupted,
- operation fails atomically.

---

# 239. Crash during save

Old secret kaydı korunmalı veya transaction recover.

No half plaintext.

---

# 240. Crash during import

No partially visible record.

---

# 241. Crash during password change

Old unlock still possible veya rollback.

Bu operasyon ayrı hardening gerektirir.

---

# 242. Power loss robustness

Stronghold snapshot/atomic persistence davranışı test edilmeli.

Encrypted backup düzenli tavsiye.

---

# 243. User education

Ayarlar/Yedekleme:

```text
Vault bilgisayarınızda yerel olarak saklanır.
Disk arızasına karşı şifreli yedek oluşturmanız önerilir.
```

Bu doğru beklenti oluşturur.

---

# 244. Backup hatırlatma

Sürekli popup yok.

Örneğin 10 yeni env eklendikten sonra non-intrusive:

```text
Vault'unuzda yeni kayıtlar var. Şifreli yedek oluşturabilirsiniz.
```

V1.1 olabilir.

---

# 245. No cloud

Ürün cloud backup sunmuyorsa kullanıcı `.evault` dosyasını kendi:

- OneDrive,
- Google Drive,
- NAS,
- USB

konumuna koyabilir.

Encrypted olduğu için uygun kullanım.

---

# 246. Drag-out plaintext lifecycle

Virtual file stream tamamlandıktan sonra:

- decrypted buffer release,
- zeroize mümkünse,
- COM objects release.

---

# 247. Export plaintext lifecycle

Export file kullanıcı tarafından kalıcı olarak istenmiştir.

Uygulama export sonrası dosyayı silmez.

---

# 248. Temp files

Vault operations için plaintext temp file kullanımı yasak.

Backup temporary file encrypted olmalıdır.

---

# 249. Thumbnail/indexing

Vault encrypted data Windows indexer tarafından secret olarak görünmemeli.

AppData file extension custom olabilir.

---

# 250. Backup extension

`.evault`

File format magic:

```text
EVLT
```

---

# 251. Backup versioning

Header:

```text
magic
format version
KDF id
KDF params
salt
cipher id
nonce
payload length
ciphertext
tag
```

Endian/version net.

---

# 252. Future compatibility

Unknown backup version:

```text
Bu yedek daha yeni bir Env Vault sürümüyle oluşturulmuş.
```

---

# 253. Restore preview

Parola doğru ve integrity valid sonrası:

```text
12 proje
28 ortam dosyası
Yedek tarihi
```

göster.

Secret values gösterme.

---

# 254. Merge conflict

Same Project UUID:

- update/merge.

Name same UUID different:

- UUID authoritative.

Fresh imported backup with different IDs same name:

- user chooses merge/separate.

V1 simplest:

**Separate project + `(Yedekten)`**

ama UX review.

---

# 255. Project naming

Duplicate project name allowed olabilir.

Disambiguation optional.

Tercih:

duplicate allowed, source path veya timestamp ayırır.

---

# 256. Env filename uniqueness

Aynı proje içinde filename unique.

---

# 257. Display name

Optional.

Filename unchanged.

Example:

```text
Production
.env.production
```

V1 displayName opsiyonel.

---

# 258. Project description

Optional.

Secret-free? Kullanıcı secret yazabilir.

Bu nedenle Vault encrypted metadata.

---

# 259. Labels/tags

MVP dışında.

---

# 260. Grouping

Project sidebar yeterli.

---

# 261. Project favorite

V1.

---

# 262. Project archive

V1.1.

Silmek yerine archive yararlı olabilir.

MVP dışı.

---

# 263. Empty env

Boş `.env` kabul edilir.

---

# 264. Very large env

10 MB üstü reject default.

Ayar ile override yok V1.

---

# 265. Line count

Editor 100k satır test.

---

# 266. CRLF preservation

Windows import CRLF.

Export varsayılan original line ending.

Editor internal normalization yapıyorsa save öncesi original policy.

---

# 267. New document line ending

Windows default:

CRLF

veya cross-platform developer convention LF.

Tercih:

**LF**

Ayar ileride.

---

# 268. BOM

Imported BOM preserved metadata.

New env no BOM.

---

# 269. Filename rename

Env Vault içinde:

```text
.env -> .env.local
```

rename yapılabilir.

Validation.

Export yeni adla.

---

# 270. Drag-out filename

Current filename.

---

# 271. Download button text

Türkçe product request doğrultusunda:

**İndir**

“Dışa Aktar” secondary açıklama olabilir.

---

# 272. Add button text

**Ekle**

Tooltip:

`.env dosyası ekle`

---

# 273. Delete text

**Sil**

Project delete modal açık.

---

# 274. App lock button

Titlebar:

icon + tooltip

```text
Vault'u Kilitle
```

---

# 275. Privacy mode

V1.1:

```text
Gizlilik Modu
```

project names blur.

Not required.

---

# 276. Theme names

UI:

- Beyaz
- Siyah
- Transparan
- Beyaz Transparan
- Koyu Transparan

---

# 277. System theme

Kullanıcı istediği 5 tema dışında “Sistem” opsiyonel.

Talep beş tema olduğu için sistem altıncı olabilir ancak MVP'de gereksiz.

---

# 278. Logo consistency with Node Cleaner

İki uygulama aynı geliştirici araç ailesi ise:

- aynı grid,
- aynı stroke dili,
- benzer radius,
- ayrı sembol.

Brand family.

---

# 279. App name

Working:

**Env Vault**

Final naming daha sonra.

Teknik docs bu adı kullanır.

---

# 280. Performance vs security

Unlock KDF bilinçli olarak biraz maliyetlidir.

Bu “sistemi yormak” değildir.

Sadece unlock anında kısa memory-hard hesap.

Idle'da maliyet yok.

---

# 281. KDF tuning test

Low-end Windows cihaz:

- unlock <1.5s hedef.

High-end:

- minimum security param below not allowed.

---

# 282. KDF migration

KDF parametreleri gelecekte artırılabilir.

Unlock sonrası rewrap.

---

# 283. Password verification

Master password hash separate plaintext verifier yerine Stronghold unlock authentication tercih.

Timing information minimize.

---

# 284. Brute force rate limiting

Local attacker offline snapshot ile brute force yapabilir.

UI login retry delay sınırlı faydalı.

3 yanlış sonrası incremental delay olabilir.

Ama UX gereksiz ağırlaştırılmamalı.

Argon2id ana defense.

---

# 285. Password reset

Master password unutulursa reset Vault'u açamaz.

UI açık:

```text
Ana parola kurtarılamaz.
```

“Parolamı unuttum” sadece:

- yeni boş Vault oluştur,
- encrypted backup password varsa restore.

---

# 286. Recovery key

MVP yok.

İleride generated recovery key değerlendirilebilir.

---

# 287. Auto-unlock risk

DPAPI auto-unlock seçeneği:

UI:

```text
Bu seçenek açıkken Windows oturumunuza erişebilen biri Vault'u daha kolay açabilir.
```

Default kapalı.

---

# 288. Clipboard default

Copy allowed.

Auto clear default:

30 sn.

User change.

---

# 289. Clipboard paste

Master password paste allowed.

Password manager kullanıcılarını engelleme.

---

# 290. Editor clipboard

Ctrl+C secrets explicit user action.

Auto-clear sadece “Kopyala” secret button ile yazılan clipboard'u takip edebilir; editor normal copy'yi agresif temizlemek kullanıcı deneyimini bozabilir.

---

# 291. Drag-out confirmation

Her drag-out için confirmation gerekmez.

Drag zaten explicit export action.

Ama locked state'te drag disabled.

---

# 292. Default directory export confirmation

Tek tık için confirmation gerekmez.

Existing file collision dışında.

---

# 293. Export toast privacy

```text
.env indirildi.
```

Path full toast'ta gösterilmek zorunda değil.

---

# 294. Export audit history

MVP yok.

---

# 295. Secret access history

MVP yok.

---

# 296. Last modified

Env document `updatedAt`.

UI:

```text
2 gün önce
```

Tooltip exact.

---

# 297. Import date

Detail info:

```text
Vault'a eklenme
29 Ağustos 2026
```

---

# 298. Source path

Detail only.

---

# 299. Detail panel

Menu → Bilgi:

- filename,
- project,
- size,
- imported,
- updated,
- original source path.

No secret.

---

# 300. App internal diagnostics

Settings → Hakkında:

- version,
- vault format version,
- Stronghold version optional.

Secret-free.

---

# 301. Manual backup UX

Settings:

```text
Şifreli Yedek Oluştur
```

Native save dialog.

---

# 302. Backup password

Tercih:

Default master password ile backup encryption.

Opsiyonel ayrı backup password ileri sürüm.

Simplify V1:

master password.

---

# 303. Master password not sent frontend unnecessarily

Unlock password kullanıcı input olarak frontend'den backend'e bir kez geçer.

JS memory tamamen avoid edilemez.

Input state minimize.

Submit sonrası clear.

---

# 304. Password input React state

Controlled input secret string JS memory'de kalır.

Uncontrolled/ref yaklaşımı değerlendirilebilir.

Ama WebView DOM yine memory.

Security practical limits documented.

---

# 305. Native unlock dialog

Daha ileri güvenlik için native Rust dialog mümkün, ancak premium custom UI hedefiyle çelişebilir.

V1 custom lock screen acceptable.

---

# 306. CSP

Dar CSP.

No remote sources.

---

# 307. DevTools

Production build'de DevTools disabled.

---

# 308. Source maps

Production source map secret içermez ama attack surface/internals.

Public distribution policy review.

---

# 309. Debug logging

Release `println!("{:?}", env_payload)` gibi kod lint/review ile yasak.

---

# 310. Rust Debug derive

Secret-containing struct'larda `Debug` derive dikkat.

Tercih:

custom Redacted Debug veya no Debug.

---

# 311. Serialization

Secret payload serialize gerektiğinde only encrypted storage path.

Logging middleware no body.

---

# 312. Error propagation

Error secret content içermemeli.

Parser “line 12 invalid” diyebilir.

Line value include etmez.

---

# 313. Search logs

Search query project name olabilir.

Loglanmaz release.

---

# 314. UI tests Turkish

Snapshot'ta İngilizce string regex audit.

Allowlist:

- Env Vault,
- API,
- Node.js,
- npm,
- pnpm,
- `.env`.

---

# 315. Emoji audit

Source UI strings Unicode emoji regex check.

Emoji yasak.

Kullanıcının env content'inde emoji olabilir ve korunur.

---

# 316. SVG audit

UI icons SVG.

No emoji fallback.

---

# 317. Icon tree-shaking

Lucide whole package import yok.

Per icon.

---

# 318. Liquid Glass fallback

`backdrop-filter` unsupported:

solid surface.

---

# 319. Windows DWM

Mica only supported Windows version.

Feature detection.

---

# 320. Windows 10

Acrylic performansı test.

Kötüyse dark/light opaque.

---

# 321. DPI

100, 125, 150, 200%.

---

# 322. Multiple monitors

Window restore off-screen kalmamalı.

---

# 323. Window resize

Minimum width.

No glass resize jank.

---

# 324. Native titlebar

Custom titlebar yapılabilir.

Ama Windows Snap Layout bozulmamalı.

Hit-test ve maximize hover test.

---

# 325. Security-first titlebar

Lock icon kolay erişim.

---

# 326. UX “Apple sadeliği”

Teknik karşılığı:

- fewer controls,
- one primary action,
- progressive disclosure,
- clear hierarchy,
- high-quality spacing,
- subtle transitions,
- low visual noise.

macOS taklidi değil.

---

# 327. Premium detail

- consistent hover,
- optical icon alignment,
- font smoothing,
- empty states,
- shadows,
- micro animation,
- precise modal.

---

# 328. Code quality

TypeScript strict.

Rust no panic normal flow.

---

# 329. God Hook yasağı

```text
useEnvVault()
```

her şeyi yapmaz.

---

# 330. Domain services

- VaultSessionService
- ProjectService
- EnvDocumentService
- ImportService
- ExportService
- BackupService.

---

# 331. Interface boundaries

Storage swap edilebilir.

Windows drag service platform-specific.

---

# 332. Platform abstraction

```rust
trait NativeDragExporter
```

Windows implementation.

Gelecekte macOS.

---

# 333. Windows-only compile

Platform modules `cfg(target_os = "windows")`.

---

# 334. Tests cross-platform

Core crypto/parser tests cross-platform olabilir.

Windows Shell integration Windows CI.

---

# 335. Code comments

“neden” açıklar.

Security decisions comment + doc.

---

# 336. Security architecture decision records

Bu tek doküman içinde ADR özetleri:

### ADR-001
Copy-in storage.

### ADR-002
Local-only.

### ADR-003
Stronghold/Argon2.

### ADR-004
Virtual file drag.

### ADR-005
No broad fs permission.

### ADR-006
No autosave.

---

# 337. ADR-001 — Copy-in

Karar:

Import kaynak dosyayı linklemez.

Sonuç:

Proje silinse bile secret saklanır.

---

# 338. ADR-002 — Local-only

Karar:

Backend server yok.

Sonuç:

Attack surface ve operasyon complexity azalır.

---

# 339. ADR-003 — Crypto

Karar:

Argon2id + Stronghold/audited primitives.

Kendi crypto yok.

---

# 340. ADR-004 — Drag-out

Karar:

Windows virtual file drag.

Neden:

Plaintext temp file riskini azaltmak.

---

# 341. ADR-005 — Filesystem

Karar:

Dedicated Rust command.

Neden:

Frontend compromise halinde arbitrary file write azaltmak.

---

# 342. ADR-006 — Autosave

Kapalı.

Neden:

Secret değişiklikleri explicit.

---

# 343. Test acceptance checklist — ürün

- [ ] Vault oluştur.
- [ ] Unlock.
- [ ] Project ekle.
- [ ] Ekle button import.
- [ ] Drag-in import.
- [ ] Source delete.
- [ ] Source project delete.
- [ ] Vault record survives.
- [ ] Edit.
- [ ] Save.
- [ ] Download.
- [ ] Different location.
- [ ] Default location.
- [ ] Setting toggle.
- [ ] Drag-out.
- [ ] Delete env.
- [ ] Delete project.
- [ ] Backup.
- [ ] Restore.

---

# 344. Acceptance — güvenlik

- [ ] AppData plaintext secret yok.
- [ ] Settings plaintext secret yok.
- [ ] Logs plaintext secret yok.
- [ ] localStorage secret yok.
- [ ] Backup plaintext secret yok.
- [ ] Wrong password rejected.
- [ ] Corrupt backup rejected.
- [ ] Auto-lock.
- [ ] Secret state clear on lock.
- [ ] Drag-out temp plaintext yok.
- [ ] Broad fs permission yok.
- [ ] Production DevTools kapalı.

---

# 345. Acceptance — UI

- [ ] Tam Türkçe.
- [ ] Emoji yok.
- [ ] SVG ikon.
- [ ] Özel SVG logo.
- [ ] Multi-resolution `.ico`.
- [ ] Beyaz.
- [ ] Siyah.
- [ ] Transparan.
- [ ] Beyaz Transparan.
- [ ] Koyu Transparan.
- [ ] Liquid Glass reference uygulandı.
- [ ] Reduced motion.
- [ ] Focus.
- [ ] Contrast.

---

# 346. Acceptance — performans

- [ ] Idle CPU.
- [ ] Idle disk I/O.
- [ ] Idle network 0.
- [ ] 8h soak.
- [ ] 1000 env records.
- [ ] editor lazy.
- [ ] no handle leak drag.
- [ ] no memory leak repeated open.

---

# 347. Acceptance — data integrity

- [ ] CRLF.
- [ ] LF.
- [ ] UTF-8.
- [ ] BOM.
- [ ] empty env.
- [ ] comments.
- [ ] quoted.
- [ ] equals in value.
- [ ] final newline.
- [ ] export fidelity.

---

# 348. Definition of Done

Feature tamamlanmış sayılırsa:

1. requirement karşılandı.
2. security review yapıldı.
3. unit test.
4. integration test uygun.
5. error state.
6. loading state.
7. Türkçe.
8. theme test.
9. accessibility.
10. performance etkisi ölçüldü.
11. secret logging yok.
12. lint/typecheck clean.

---

# 349. Geliştirme fazları

## Faz 0 — Foundation

- Tauri 2.
- React.
- TS strict.
- folder architecture.
- theme tokens.
- logo placeholder.
- security lint rules.

## Faz 1 — Vault core

- initialize.
- Stronghold.
- Argon2.
- lock/unlock.
- session.
- tests.

## Faz 2 — Project + Env storage

- repository.
- project CRUD.
- env CRUD.
- raw text.
- copy-in.
- source deletion tests.

## Faz 3 — Import

- Ekle.
- native dialog.
- drag-in.
- duplicate handling.
- file validation.

## Faz 4 — Editor

- CodeMirror.
- save.
- dirty state.
- reveal/mask.
- clipboard.

## Faz 5 — Export

- save dialog.
- default path.
- overwrite policy.
- quick download.

## Faz 6 — Native drag-out

- OLE.
- IDataObject.
- FILEDESCRIPTOR.
- FILECONTENTS.
- virtual stream.
- Explorer tests.

## Faz 7 — Backup

- encrypted format.
- backup.
- restore.
- conflict.

## Faz 8 — Premium UI

- Liquid Glass final.
- 5 themes.
- logo.
- icon.
- motion.
- accessibility.

## Faz 9 — Hardening

- security.
- leakage tests.
- soak.
- crash consistency.
- performance.

## Faz 10 — Packaging

- installer.
- uninstall data policy.
- reinstall test.
- release.

---

# 350. Milestone 1

> Vault oluştur, unlock et, proje oluştur ve `.env` dosyasını şifreli olarak içe aktar.

Kritik acceptance:

Kaynak dosya silindikten sonra Vault'ta okunabilmeli.

---

# 351. Milestone 2

> Edit + Save + Download.

---

# 352. Milestone 3

> Drag-in + Drag-out + default export directory.

---

# 353. Milestone 4

> Backup/restore + security hardening.

---

# 354. Milestone 5

> Final premium UI + installer.

---

# 355. Future roadmap

- revision history,
- project archive,
- secret key search,
- explicit source refresh,
- dotenvx encrypted export,
- secure sharing,
- Git integration,
- CLI companion,
- Windows Hello,
- macOS.

MVP'yi geciktirmez.

---

# 356. Özellikle yapılmaması gerekenler

1. `.env` path'ini DB'ye yazıp içeriği her seferinde kaynaktan okumak.
2. Kaynak proje silinince Vault kaydını kaybetmek.
3. Plaintext `.env` içeriğini SQLite/Tauri Store'a yazmak.
4. Secret'ı localStorage'a koymak.
5. `console.log(env)`.
6. Temporary plaintext file ile drag-out yapmak, alternatif varken.
7. Broad filesystem permission.
8. Arbitrary shell execution.
9. Background watcher.
10. Auto sync.
11. Cloud dependency.
12. Emoji.
13. Heavy UI framework.
14. God Context.
15. God Component.
16. Kendi encryption algorithm'ını yazmak.
17. Master password'ü saklamak.
18. Silent overwrite.
19. Uninstall sırasında Vault'u default silmek.
20. Export edilen plaintext'in hâlâ encrypted olduğunu ima etmek.

---

# 357. Kodlama ajanı için bağlayıcı özet

1. Windows-first.
2. Tauri 2 + Rust + React + TypeScript.
3. Tam Türkçe UI.
4. Emoji yasak.
5. Profesyonel SVG ikonlar.
6. Özel SVG logo.
7. Windows multi-resolution icon.
8. Apple sadeliğinde premium UI.
9. Liquid Glass kontrollü.
10. Beş tema.
11. Root Liquid Glass örneğini incele.
12. Performance görsel efektlerden öncelikli.
13. God Context yasak.
14. God Component yasak.
15. God Hook yasak.
16. Secret frontend persistence yasak.
17. Secret logging yasak.
18. Copy-in semantics zorunlu.
19. Kaynak `.env` silinse Vault kalır.
20. Kaynak proje tamamen silinse Vault kalır.
21. Vault data project folder dışında.
22. Encrypted at rest.
23. Argon2id.
24. Audited crypto.
25. Stronghold tercih.
26. DPAPI sadece opsiyonel auto-unlock.
27. Auto-lock.
28. Import button.
29. Drag-in.
30. Edit.
31. Save.
32. Delete.
33. Download.
34. Different location download.
35. Default export directory.
36. Ask-every-time toggle.
37. Default path editable.
38. Export overwrite policy.
39. Drag-out Explorer.
40. Drag-out virtual file, temp plaintext değil.
41. Backup encrypted.
42. Restore.
43. No network.
44. No telemetry.
45. No analytics.
46. No watcher.
47. No polling.
48. Offline çalışır.
49. CodeMirror minimal.
50. Test source delete.
51. Test full project delete.
52. Test plaintext leakage.
53. Test backup restore.
54. Test drag-out.
55. Test 8h idle.
56. Uninstall Vault data default korur.
57. Production DevTools kapalı.
58. Tauri capabilities minimum.
59. Shell execution yok.
60. Security bir release gate.

---

# 358. Referans kaynaklar

Aşağıdaki resmi/güvenilir kaynaklar teknik kararlar için referanstır.

1. Tauri Stronghold  
   https://v2.tauri.app/plugin/stronghold/

2. Tauri Stronghold JavaScript API  
   https://v2.tauri.app/reference/javascript/stronghold/

3. Tauri Dialog Plugin  
   https://v2.tauri.app/plugin/dialog/

4. Tauri Webview API / Drag Drop  
   https://v2.tauri.app/reference/javascript/api/namespacewebview/

5. Microsoft — Shell Clipboard Formats  
   https://learn.microsoft.com/en-us/windows/win32/shell/clipboard

6. Microsoft — Shell Data Object  
   https://learn.microsoft.com/en-us/windows/win32/shell/dataobject

7. Microsoft — DoDragDrop  
   https://learn.microsoft.com/en-us/windows/win32/api/ole2/nf-ole2-dodragdrop

8. Microsoft — SHDoDragDrop  
   https://learn.microsoft.com/en-us/windows/win32/api/shlobj_core/nf-shlobj_core-shdodragdrop

9. Microsoft — DPAPI CryptProtectData / CryptUnprotectData  
   https://learn.microsoft.com/en-us/windows/win32/api/dpapi/

10. OWASP — Password Storage Cheat Sheet  
    https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

11. OWASP — Cryptographic Storage Cheat Sheet  
    https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html

12. Apple Developer — Liquid Glass  
    https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass

13. Apple Human Interface Guidelines — Materials  
    https://developer.apple.com/design/human-interface-guidelines/materials

---

# 359. Son ürün tanımı

Env Vault v1 tek cümlede şu şekilde tanımlanabilmelidir:

> **Projelerinize ait `.env` dosyalarını kaynak proje klasörlerinden bağımsız olarak şifreli biçimde saklar; dosyaları sürükleyerek veya Ekle düğmesiyle içe aktarmanızı, düzenlemenizi, Vault'tan silmenizi ve istediğiniz zaman tek tıklamayla ya da sürükle-bırak yöntemiyle yeniden `.env` olarak dışa aktarmanızı sağlar.**

Bu tanımdaki her kelime ürün kapsamını belirler.

**Kaynak projeden bağımsızlık bir detay değil, ürün gereksinimidir.**

**Şifreleme bir opsiyon değil, ürün gereksinimidir.**

**Kolay export bir yardımcı özellik değil, ürün gereksinimidir.**

**Drag-in ve drag-out bir görsel numara değil, temel iş akışıdır.**

**Premium UI sonradan eklenen tema değil, ürün gereksinimidir.**

**Performans optimizasyon değil, ürün gereksinimidir.**

**Modüler mimari kod stili değil, ürün gereksinimidir.**

**Backup veri kaybına karşı ikinci güvenlik katmanıdır.**

**Uninstall sonrası Vault verisinin korunması ürünün kullanım amacıyla doğrudan ilişkilidir.**
