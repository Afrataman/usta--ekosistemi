# MVP Teknoloji Mimarisi

**Sürüm:** v0.1  
**Durum:** Önerilen karar  
**Kapsam:** Usta Kulübü MVP

## 1. Karar özeti

MVP; telefon tarayıcısında çalışan üç ayrı web arayüzü, tek bir modüler backend ve
ilişkisel veritabanından oluşacaktır.

| Katman | Seçim | Neden? |
|---|---|---|
| Usta, bayi ve yönetici arayüzleri | React 19 + TypeScript + Vite | Mobil PWA desteği, ortak bileşen kullanımı ve geniş araç ekosistemi |
| Backend | ASP.NET Core / .NET 10 LTS | Uzun destek süresi, güçlü tip güvenliği ve işlem yoğun iş kurallarına uygunluk |
| Mimari | Modüler monolit | Başlangıçta tek sistem olarak kolay işletim; modüller arasında düzenli sınırlar |
| Veritabanı | Microsoft SQL Server | ASP.NET Core uyumu, ilişkisel işlemler, güçlü kısıtlar ve mevcut yerel geliştirme ortamı |
| Veri erişimi | Entity Framework Core 10 | .NET ile bütünleşik şema, sorgu ve migration yönetimi |
| API | REST + OpenAPI | Arayüzler için açık, test edilebilir ve yaygın sözleşme |
| Test | xUnit, Vitest, Testing Library, Playwright | Birim, bileşen ve gerçek kullanıcı akışlarını ayrı seviyelerde doğrulama |
| Gözlemlenebilirlik | Yapılandırılmış log + OpenTelemetry | Hata, gecikme ve işlem zincirlerini tek kimlikle izleyebilme |
| Dağıtım | Container tabanlı | Sunucu sağlayıcısını değiştirebilme ve ortamları tutarlı çalıştırma |

Kütüphaneler sabit bir major sürümde tutulacak; güvenlik ve hata düzeltme
güncellemeleri kontrollü olarak alınacaktır.

## 2. Uygulamalar

### 2.1 Usta PWA

- Mobil öncelikli çalışır ve telefona uygulama gibi eklenebilir.
- QR tarama, elle kod girişi, puan, ödül, bildirim ve destek akışlarını içerir.
- İnternet kesilirse tamamlanmamış istek kaybolmaz; yeniden bağlanınca kullanıcı
  onayıyla veya güvenli otomatik tekrar ile sürdürülür.
- Sunucudan onay gelmeden puan kazanılmış gibi kesin başarı gösterilmez.

### 2.2 Bayi web uygulaması

- Telefon, tablet ve masaüstünde çalışır.
- Usta üyelik QR'ı, satış eşleştirme, kupon teslimi, iade ve şüpheli işlem
  bildirimlerini içerir.

### 2.3 Yönetici web uygulaması

- Masaüstü kullanımına öncelik verir, tablette de temel işlemleri destekler.
- Ürün kodu, puan kuralı, kampanya, ödül, kullanıcı, denetim ve raporlama
  işlemlerini içerir.
- Kampanya tarihleri ve puan katsayıları kod değişikliği olmadan yönetilebilir.

Üç arayüz ayrı uygulama olarak dağıtılır. Tasarım bileşenleri ve API tipleri ortak
paketlerden alınır. Böylece roller birbirine karışmaz, fakat aynı iş tekrar yazılmaz.

## 3. Backend modülleri

Tek backend aşağıdaki sınırları koruyan modüllerden oluşur:

1. Kimlik ve erişim
2. Usta profili ve seviyeler
3. Bayi ve çalışanları
4. Ürün ve tek kullanımlık kodlar
5. Satış ve iade
6. Puan defteri
7. Kampanya kuralları
8. Ödül, kupon ve teslimat
9. Bildirim ve destek
10. Risk ve şüpheli işlem
11. Denetim ve raporlama

Her modül kendi iş kurallarını yönetir. Başka bir modülün verisini doğrudan
değiştirmek yerine tanımlı uygulama servislerini ve olayları kullanır. İleride çok
yük alan bir bölüm bağımsız servise ayrılabilir; MVP'de mikroservis kurulmaz.

## 4. Veri bütünlüğü

Puan, kupon ve iade işlemleri finansal değere yakın davranış gösterdiği için yalnızca
arayüz kontrolüne güvenilmez.

- Her ürün kodu veritabanı benzersizlik kısıtıyla bir kez kullanılır.
- Puan hareketleri silinmez veya üzerine yazılmaz; ters kayıtla düzeltilir.
- Kod okutma, puan ekleme ve satış eşleştirme aynı veritabanı işlemi içinde tamamlanır.
- Tekrarlanan ağ istekleri `idempotency key` ile ikinci kez puan üretmez.
- Kritik durum değişiklikleri denetim kaydına yazılır.
- Bildirim gibi işlem sonrası işler için transactional outbox deseni kullanılır.

## 5. Kimlik ve güvenlik yaklaşımı

- Usta girişi telefon numarası ve altı haneli, süreli SMS koduyla yapılır.
- SMS sağlayıcısı bir arayüzün arkasında tutulur; firma değişikliği iş kurallarını
  etkilemez.
- Bayi çalışanı ve yönetici için rol, kapsam ve gerekirse ek doğrulama uygulanır.
- OTP ve kod denemelerine hız sınırı konur; ham OTP değeri loglanmaz.
- Yetki yalnızca ekranda değil, her API işleminde sunucu tarafından doğrulanır.
- Kişisel veriler ve gizli anahtarlar kaynak kod deposuna yazılmaz.

### Yerel veritabanı ortamı

Geliştirme bilgisayarında SQL Server Express örneği `(local)\SQLEXPRESS` adıyla
çalışır ve SQL Server Management Studio üzerinden Windows Authentication ile
yönetilir. SQL Server Express geliştirme için yeterlidir; üretim ortamında aynı
veritabanı şeması ihtiyaca uygun SQL Server sürümüne taşınabilir.

Tablolar SSMS içinde elle oluşturulmaz. Entity Framework Core migration dosyalarıyla
koddan üretilir. Böylece her şema değişikliği Git geçmişinde görünür ve diğer
ortamlarda tekrarlanabilir. Bağlantı parolaları ve üretim bağlantı bilgileri GitHub'a
eklenmez.

## 6. Çevrimdışı ve zayıf bağlantı

PWA uygulama kabuğunu ve güvenli statik verileri önbelleğe alabilir. Puan kazandıran
işlemler cihazda kesinleşmez; sunucuya ulaşınca doğrulanır. Bekleyen isteğe benzersiz
işlem kimliği verilir. Kullanıcı aynı düğmeye tekrar bassa bile sunucu yalnızca tek
sonuç üretir.

Bu yaklaşım hem zayıf internette form kaybını azaltır hem de çevrimdışı sahte puan
üretilmesini engeller.

## 7. Başlangıçta eklenmeyecek altyapılar

- Mikroservis ve servisler arası mesajlaşma platformu
- Redis tabanlı dağıtık önbellek
- Kubernetes
- GraphQL
- Yerel iOS ve Android uygulamaları
- Ayrı arama motoru veya veri ambarı

Bunlar ihtiyaç doğmadan eklenirse geliştirme, izleme ve işletim maliyetini artırır.
Ölçülen performans veya güvenilirlik ihtiyacı ortaya çıktığında ayrıca değerlendirilir.

## 8. Depo ve klasör yapısı

```text
usta--ekosistemi/
├── apps/
│   ├── usta-pwa/
│   ├── bayi-web/
│   └── yonetim-web/
├── packages/
│   ├── design-system/
│   └── api-client/
├── src/backend/
│   ├── UstaEkosistemi.sln
│   ├── Host/
│   └── Modules/
├── tests/
│   ├── backend/
│   └── e2e/
└── docs/
```

Bu bir monorepo yapısıdır: ilişkili uygulamalar aynı Git deposunda tutulur, fakat ayrı
klasörler ve kurallarla geliştirilir.

## 9. Hangi editör nerede kullanılacak?

**VS Code ana geliştirme ortamıdır.** React/TypeScript arayüzler, proje belgeleri,
Git işlemleri ve günlük geliştirme burada yapılır. Depo klasörü doğrudan VS Code ile
açılır.

**Visual Studio 2022 yardımcı ortamdır.** Backend çözümü oluşturulduktan sonra
`src/backend/UstaEkosistemi.sln` dosyası Visual Studio ile açılarak gelişmiş C# hata
ayıklama, test, profil çıkarma ve Entity Framework araçları kullanılabilir.

İki program farklı proje üretmez; aynı dosyaları düzenler ve aynı Git geçmişini
kullanır.

## 10. Neden diğer seçenekler seçilmedi?

| Seçenek | MVP'de seçilmeme nedeni |
|---|---|
| Mikroservis | Dağıtık işlem, dağıtım ve izleme yükü mevcut ölçek için gereksiz |
| Next.js | Giriş sonrası çalışan uygulamalarda SEO ve sunucu tarafı render faydası sınırlı |
| Blazor PWA | React'in mobil web, QR ve ortak arayüz ekosistemi bu proje için daha uygun |
| Tek rol uygulaması | Rol sınırlarını ve yayın süreçlerini gereksiz biçimde birbirine bağlar |
| PostgreSQL | Teknik olarak uygundur; ancak ekipte hazır SQL Server/SSMS ortamı ve kullanım kolaylığı tercih edilmiştir |
| MongoDB | Puan, iade, kupon ve denetim ilişkileri güçlü SQL işlemlerine daha uygundur |
| Yerel mobil uygulama | İlk sürümün dağıtımını ve bakımını iki platforma bölerek geciktirir |

## 11. Henüz kesinleştirilmeyen kararlar

Aşağıdakiler pilot verileri ve ticari teklifler geldikten sonra seçilecektir:

- Üretimde kullanılacak SQL Server sürümü ve barındırma sağlayıcısı
- SMS firması ve yedek SMS firması
- Nesne depolama sağlayıcısı
- Üretim sunucusu kapasitesi ve yedekleme süresi
- Alan adı, kurumsal e-posta ve izleme hizmetleri

Bu seçimlerin ertelenmesi kodlamayı engellemez; sağlayıcı bağımlılıkları arayüzlerin
arkasında tutulacaktır.

## 12. İlk teknik uygulama sırası

1. Monorepo ve geliştirme araçlarını kur.
2. Ortak tasarım tokenlarını ve mobil uygulama kabuğunu oluştur.
3. .NET çözümünü, modül sınırlarını ve SQL Server geliştirme ortamını oluştur.
4. OpenAPI sözleşmesi ve otomatik TypeScript istemci üretimini kur.
5. Kimlik doğrulama iskeleti ile sağlık kontrollerini hazırla.
6. İlk dikey akış olarak kod doğrulama → satış eşleştirme → puan hareketini geliştir.

Bu sıra, yalnızca ekran üretmek yerine kullanıcı arayüzünden veritabanına kadar çalışan
küçük ama doğrulanabilir bir sistem kurar.
