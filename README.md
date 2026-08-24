# Usta Ekosistemi

Bu depo, **Usta Kulübü**, ileride eklenecek **Onaylı Usta Ağı** ve seçili işler için
**Dijital Garanti** sisteminin ürün ve teknik belgelerini içerir.

MVP gereksinimleri ve teknoloji mimarisi belgelendirilmiştir. İlk çalışan kod
iskeleti; React/TypeScript usta arayüzü ile ASP.NET Core API projesini içerir.

## Yerel geliştirme

Usta arayüzünü görmek için önce iki ayrı VS Code terminali açın. Birinci terminalde backend'i çalıştırın:

```powershell
dotnet run --project src/backend/Host/UstaEkosistemi.Api
```

İkinci terminalde arayüzü çalıştırın:

```powershell
cd apps/usta-pwa
npm install
npm run dev
```

Terminalde gösterilen `http://localhost:5173` adresini tarayıcıda açın. Telefon görünümünü görmek için tarayıcı penceresini daraltabilir veya `F12` ile cihaz araç çubuğunu açabilirsiniz.

PWA, geliştirmede varsayılan olarak `http://localhost:5028` API adresini kullanır. Ayrı bir test sunucusuna bağlanmanız gerekirse `apps/usta-pwa/.env.example` dosyasını `.env.local` adıyla kopyalayıp yalnızca `VITE_API_URL` değerini değiştirin. Canlıda PWA ve API aynı alan adındaysa ek ayar gerekmez. Bu dosyaya parola, SQL bağlantı dizesi veya SMS sağlayıcı anahtarı yazılmaz.

## Canlı pilot kararı

Proje şu aşamada tamamen ücretsiz ve yerel çalışacaktır: mevcut bilgisayardaki SQL Server Express, ASP.NET Core API ve PWA kullanılacaktır. Azure, Netgsm, alan adı, tünel veya başka ücretli/harici bir hesap açılmayacaktır. Gerçek SMS gönderimi geliştirme modunda yalnızca yerel test kodu ile simüle edilir. İnternete yayınlama, gerçek SMS paketi veya harici dijital ödül sağlayıcısı; proje beğenilip açık onay verilmeden etkinleştirilmeyecektir.

Sağlık kontrolü `/api/health` adresindedir. SQL Server tabloları sonraki aşamada
Entity Framework Core migration dosyalarıyla oluşturulur; SSMS'de elle tablo
oluşturulmamalıdır. Yerel geliştirme veritabanı `UstaEkosistemiDev` adındadır.

## Neden önce belge hazırlıyoruz?

Puan, kupon, iade ve bayi işlemleri birbirini etkileyen finansal değere sahip işlemlerdir.
Kurallar kodlamadan önce netleşmezse aynı işlem farklı ekranlarda farklı yorumlanabilir,
sonradan yapılan düzeltmeler veri kaybına veya kullanıcı güveninin zedelenmesine yol açabilir.

Bu paket şu sorulara cevap vermeyi amaçlar:

- Kim, hangi işlemi yapabilir?
- Her ekran ne gösterir ve hangi durumda hata verir?
- Puan nasıl kazanılır, harcanır ve geri alınır?
- Sahte veya tekrarlı işlemler nasıl önlenir?
- İnternet kesilirse işlem nasıl güvenle devam eder?
- Hangi özellikler ilk sürümde özellikle yapılmayacaktır?
- Bir özelliğin tamamlandığını nasıl doğrularız?

## Belge haritası

| Belge | İçerik | Kim onaylamalı? |
|---|---|---|
| [00-urun-vizyonu.md](docs/00-urun-vizyonu.md) | Vizyon, hedefler, ilkeler ve başarı ölçütleri | Ürün sahibi, yönetim |
| [01-mvp-kapsami-ve-roller.md](docs/01-mvp-kapsami-ve-roller.md) | MVP sınırları, roller ve yetki ilkeleri | Ürün, operasyon, hukuk |
| [02-ekran-envanteri.md](docs/02-ekran-envanteri.md) | Usta, bayi ve yönetici ekranları | Ürün, tasarım, operasyon |
| [03-islem-akislari.md](docs/03-islem-akislari.md) | Temel işlem akışları ve hata durumları | Ürün, yazılım, operasyon |
| [04-puan-kampanya-odul.md](docs/04-puan-kampanya-odul.md) | Puan defteri, kampanya motoru, ödül ve kupon kuralları | Pazarlama, mali işler, hukuk |
| [05-veri-modeli.md](docs/05-veri-modeli.md) | Kavramsal tablolar, ilişkiler ve veri kuralları | Yazılım, veri, güvenlik |
| [06-guvenlik-sahtecilik-uyum.md](docs/06-guvenlik-sahtecilik-uyum.md) | Güvenlik, sahtecilik, KVKK ve denetim | Güvenlik, hukuk, operasyon |
| [07-kalite-kriterleri.md](docs/07-kalite-kriterleri.md) | Performans, çevrimdışı davranış, kabul ve yayın kriterleri | Yazılım, QA, ürün |
| [08-acik-kararlar.md](docs/08-acik-kararlar.md) | İş birimlerinin cevaplaması gereken açık sorular | İlgili karar sahipleri |
| [09-gereksinim-matrisi.md](docs/09-gereksinim-matrisi.md) | Numaralı MVP gereksinimleri ve doğrulama bağlantıları | Ürün, yazılım, QA |
| [10-github-calisma-akisi.md](docs/10-github-calisma-akisi.md) | Dal, commit, PR, inceleme ve yayın süreci | Ürün, yazılım, QA |
| [11-p0-karar-onerileri.md](docs/11-p0-karar-onerileri.md) | MVP'yi etkileyen sekiz kritik karar için öneri ve gerekçeler | Karar sahipleri |
| [12-p1-pilot-karar-onerileri.md](docs/12-p1-pilot-karar-onerileri.md) | Seviye, ilk ödül, bayi faydası, destek, risk ve pilot önerileri | Ürün ve operasyon |
| [13-pilot-veri-toplama-formu.md](docs/13-pilot-veri-toplama-formu.md) | Pilot bölge, ürün, puan, ödül, bayi ve operasyon girdi formu | Proje sahibi ve iş birimleri |
| [14-mvp-gelistirme-sirasi.md](docs/14-mvp-gelistirme-sirasi.md) | Gereksinimlerin epiklere, bağımlılıklara ve teslim sırasına ayrılması | Ürün, yazılım, QA |
| [15-arayuz-konsepti.md](docs/15-arayuz-konsepti.md) | Usta PWA, bayi ve yönetim panellerinin ilk görsel yönü | Ürün, tasarım ve kullanıcılar |
| [16-tasarim-sistemi.md](docs/16-tasarim-sistemi.md) | Onaylı mobil yönün renk, tipografi, bileşen ve erişilebilirlik kuralları | Tasarım ve frontend |
| [17-teknoloji-mimarisi.md](docs/17-teknoloji-mimarisi.md) | MVP teknoloji seçimleri, modüler mimari, klasör yapısı ve editör kullanımı | Ürün, yazılım ve operasyon |

## Belge durumları

- **Taslak:** Tartışmaya açıktır.
- **İncelemede:** İlgili ekiplerden görüş beklenir.
- **Onaylı:** Kodlama ve test için bağlayıcıdır.
- **Değiştirildi:** Yeni sürümle yer değiştirmiştir; geçmiş kayıt korunur.

Belgeler şu anda **v0.1 / Taslak** durumundadır. Açık kararlar kapanmadan teknoloji seçimi
bağlayıcı hâle gelmez ve üretim kodlaması başlamaz.
