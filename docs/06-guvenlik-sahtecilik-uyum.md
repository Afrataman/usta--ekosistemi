# 06 — Güvenlik, Sahtecilik ve Uyum

**Sürüm:** 0.1
**Durum:** Taslak — Güvenlik ve hukuk incelemesi gerektirir

Bu belge hukuki görüş veya sızma testi raporu değildir. Ürün ve yazılım tasarımının karşılaması
gereken başlangıç kontrollerini tanımlar.

## 1. Tehdit yaklaşımı

Korunacak temel değerler:

- Usta hesapları ve kişisel veriler
- Ürün kodlarının gizliliği ve tek kullanımlılığı
- Puan defterinin bütünlüğü
- Kuponların gizliliği ve tek kullanımlılığı
- Bayi satış/iade kayıtlarının doğruluğu
- Kampanya bütçesi ve kuralları
- Yönetici yetkileri ve denetim kayıtları

Olası kötüye kullananlar yalnızca dış saldırgan değildir; usta, bayi çalışanı, yönetici, dış
sağlayıcı veya bunların birlikte hareket ettiği senaryolar da değerlendirilir.

## 2. Kimlik doğrulama güvenliği

- SMS kodu rastgele, 6 haneli, kısa ömürlü ve tek kullanımlık olmalıdır.
- Kod açık metin olarak loglanmamalı veya destek ekranında gösterilmemelidir.
- Telefon, cihaz, IP ve hesap düzeyinde gönderim/deneme sınırları uygulanmalıdır.
- Yanıt mesajları hesap varlığını gereksiz yere açığa çıkarmamalıdır.
- Başarılı doğrulama önceki kodları geçersiz kılmalıdır.
- Oturum belirteçleri güvenli, kısa erişim ömürlü ve iptal edilebilir olmalıdır.
- Telefon değişikliği sıradan profil düzenlemesi değildir; ek doğrulama ve bildirim gerektirir.
- Bayi/yönetici hesaplarında SMS tek başına yeterli kabul edilmemeli; güçlü ikinci faktör
  seçeneği ve kurumsal erişim politikası değerlendirilmelidir.

SMS gibi ücretli ve sınırlı servisler için hız sınırı hem hesap ele geçirmeyi hem de maliyet
saldırısını azaltır. OWASP, kaynak tüketimi sınırı bulunmayan API'lerin hizmet kesintisi ve
maliyet artışı riski taşıdığını belirtir: [OWASP API4:2023](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/).

## 3. Yetkilendirme

- Her API isteği nesne ve işlev düzeyinde sunucuda yetkilendirilir.
- İstemciden gelen `userId`, `dealerId`, rol veya puan değeri güvenilir kabul edilmez.
- Bayi çalışanı yalnızca atanmış aktif şube kapsamında işlem yapabilir.
- Rapor dışa aktarma, kampanya yayınlama, kullanıcı kısıtlama ve düzeltme hareketleri ayrı izinlerdir.
- Yönetici rol/izin değişiklikleri mevcut oturumları gerektiğinde iptal eder.
- Yüksek etkili kampanya ve toplu işlem için hazırlayan/onaylayan ayrımı uygulanır.

## 4. Ürün kodu güvenliği

- Kodlar sıralı veya tahmin edilebilir olmamalıdır.
- Yeterli rastgelelik ve bütünlük doğrulaması taşımalıdır.
- Veri tabanında mümkünse açık kod yerine güvenli arama/doğrulama temsili tutulmalıdır.
- Üretim, baskı, taşıma ve bayi aşamalarındaki kod erişimi ayrı tehdit olarak incelenmelidir.
- Parti, etkinleşmeden önce kullanılamamalıdır.
- Bir kodun başarılı kullanımı veritabanı düzeyinde benzersiz olmalıdır.
- Geçersiz kod yanıtı ürün/parti hakkında saldırgana fazla bilgi vermemelidir.
- Toplu kod denemeleri hız, örüntü ve cihaz sinyalleriyle tespit edilmelidir.
- Sızdığı düşünülen parti durdurulabilmeli; bu işlem geçmiş kayıtları silmemelidir.

## 5. Başlangıç risk sinyalleri

Bir sinyal tek başına kesin suç kabul edilmez. Sinyaller risk puanı veya inceleme vakası üretir.

### Usta sinyalleri

- Olağan dışı kısa sürede çok sayıda kod
- Coğrafi olarak imkânsız veya olağan dışı hareket
- Çok sayıda hesapta aynı cihaz/oturum örüntüsü
- Art arda çok sayıda geçersiz kod denemesi
- Kayıtı izleyen çok kısa sürede yüksek değerli ödül
- Sürekli iade ve yeniden kazanım örüntüsü

### Bayi sinyalleri

- Tek çalışan üzerinden olağan dışı satış/kupon hacmi
- Aynı usta ile yoğun ve tekrarlı işlem
- Mesai dışı veya şube kapasitesini aşan faaliyet
- Yüksek iade oranı
- Doğrulama ile teslim zamanı arasında olağan dışı örüntü

### Kod/parti sinyalleri

- Etkinleşmeden önce deneme
- Aynı partiden coğrafi olarak dağınık hızlı kullanım
- Belirli karakter örüntülerinin sistematik denenmesi
- Üretim miktarını aşan iddia

## 6. Risk kararları ve adalet

- Düşük risk: işlem devam eder, olay kaydedilebilir.
- Orta risk: puan bekleyen duruma alınır, vaka açılır.
- Yüksek risk: işlem reddedilir veya hesap geçici kısıtlanır; politika gerektiriyorsa insan onayı.
- Kalıcı kapatma ve büyük puan geri alımı için belgeli gerekçe ve yetki seviyesi gerekir.
- Kullanıcıya güvenliği zayıflatmayacak ölçüde açıklama ve itiraz yolu sunulur.
- Risk kuralı değişiklikleri sürümlenir ve yanlış pozitif oranı izlenir.

### Neden her şüpheli işlemi otomatik engellemiyoruz?

Ustanın yoğun çalışması veya bayinin toplu teslim günü meşru olabilir. Kesin olmayan sinyallerle
otomatik ceza vermek sadık kullanıcıyı kaybettirebilir. Bu yüzden bekletme, inceleme ve itiraz
mekanizması ürün tasarımının parçasıdır.

## 7. Puan ve kupon bütünlüğü

- Puan miktarı istemcide hesaplanmaz; sunucu, sürümlü kurala göre hesaplar.
- Hareketler silinmez veya miktarı değiştirilmez; ters/düzeltme hareketi oluşturulur.
- Ödül oluşturma ve puan düşümü atomik işlem veya güvenilir rezervasyonla bağlanır.
- Aynı işlem anahtarının tekrarında aynı sonuç döner.
- Kupon kodları listelerde ve loglarda maskelenir.
- Kupon doğrulama, kupon tüketme değildir; teslim için ayrı yetkili onay gerekir.
- Başarılı kupon kullanımı veritabanı düzeyinde tekildir.

## 8. Uygulama ve altyapı güvenliği

- Tüm trafik güncel TLS ile şifrelenir.
- Parola, API anahtarı ve sağlayıcı sırları kaynak kodda tutulmaz.
- Girdi doğrulama, çıktı kodlama ve güvenli dosya türü/boyut sınırları uygulanır.
- PWA önbelleğine erişim belirteci, açık kupon kodu veya gereksiz kişisel veri yazılmaz.
- Güvenlik başlıkları ve sıkı içerik güvenlik politikası uygulanır.
- Bağımlılıklar kilitlenir, taranır ve güncelleme süreci tanımlanır.
- Üretim verisi geliştirme/test ortamına ham biçimde kopyalanmaz.
- Yedekler şifrelenir ve geri yükleme düzenli test edilir.
- Loglarda telefon, kod, belirteç ve kişisel veri maskeleme standardı kullanılır.

## 9. KVKK ve veri yaşam döngüsü

Kişisel veriler yalnızca belirli, açık ve meşru amaçlarla; amaçla bağlantılı, sınırlı ve ölçülü
biçimde işlenmeli ve gerekli süre kadar tutulmalıdır. Bu ilkeler Kişisel Verileri Koruma
Kurumu'nun [kişisel veri işleme genel ilkelerinde](https://www.kvkk.gov.tr/Icerik/6606/General-Principles-in-Processing-of-Personal-Data) açıklanmaktadır.

MVP öncesinde hukuk ekibiyle şu envanter hazırlanmalıdır:

- Her veri alanı ve işleme amacı
- Hukuki işleme şartı
- Veri kaynağı
- Paylaşılan alıcı/sağlayıcılar ve aktarım konumu
- Saklama ve silme/anonimleştirme süresi
- Kullanıcı başvuru ve hak kullanma süreci
- Veri sorumlusu/veri işleyen rolleri
- İhlal müdahale ve bildirim süreci

Aydınlatma yükümlülüğü ile açık rıza aynı kavram değildir. Açık rızaya dayanan bir faaliyet
varsa iki işlem ayrı yürütülmelidir; resmî rehber ayrıca aydınlatmanın veri işleme şartından
bağımsız olduğunu belirtir: [KVKK Aydınlatma Yükümlülüğü Rehberi](https://www.kvkk.gov.tr/Icerik/5394/Aydinlatma-Yukumlulugunun-Yerine-Getirilmesi-Rehberi).

Bu nedenle kayıt ekranında:

- Aydınlatma metni bilgi verme amacıyla sunulur.
- Gerçekten açık rıza gerektiren amaçlar ayrı ve özgür seçim olarak gösterilir.
- Ticari ileti izni hizmet için zorunluymuş gibi birleştirilmez.
- Kullanıcının gördüğü metin sürümü ve karar zamanı kaydedilir.
- Geri çekilebilir izinler için kolay ayar ve kayıt mekanizması sağlanır.

## 10. Denetim kaydı

Asgari olarak şu eylemler denetlenir:

- Rol ve erişim değişiklikleri
- Kampanya/kural/ödül oluşturma, onaylama ve yayınlama
- Ürün kodu partisi yükleme, etkinleştirme ve durdurma
- Usta/bayi kısıtlama ve yeniden açma
- Puan düzeltme ve iade kararları
- Risk vakası kararları
- Kupon teslimi/iptali
- Kişisel veri raporu dışa aktarma
- Sistem yapılandırması ve özellik bayrağı değişiklikleri

Denetim kaydının kendisine erişim de denetlenir. Kritik kayıtlar uygulama yöneticisinin sessizce
değiştiremeyeceği saklama ve bütünlük kontrolüyle korunmalıdır.

## 11. Güvenlik yayın kapıları

Pilot öncesinde en az:

- Tehdit modeli incelemesi
- Yetki matrisi testi
- Otomatik bağımlılık ve gizli anahtar taraması
- API ve web uygulaması güvenlik testi
- SMS/OTP suistimal ve yük testi
- Puan/kupon yarış koşulu testi
- Yedekten geri yükleme testi
- Olay müdahale masa başı tatbikatı
- Hukuk ve KVKK kontrol listesi onayı

tamamlanmalıdır.
