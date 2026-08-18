# 04 — Puan, Kampanya ve Ödül Kuralları

**Sürüm:** 0.1
**Durum:** Taslak — Hukuk, mali işler ve pazarlama onayı gerektirir

## 1. Puanın niteliği

- Puan, program içindeki ödüllere erişmek için kullanılan sadakat birimidir.
- Para, elektronik para, mevduat veya çekilebilir bakiye olarak tanımlanmaz.
- Kullanıcılar arasında transfer edilemez.
- Nakit olarak ödenemez.
- Değeri sabit kur şeklinde değil, erişilebilir ödül kataloğu üzerinden açıklanır.
- Nihai hukuki ve mali ifade ilgili ekiplerin onayıyla kesinleşir.

## 2. Puan defteri

Bakiye kullanıcı kaydındaki değiştirilebilir tek bir sayı olarak tutulmaz. Her değişiklik,
ekleme mantığında çalışan puan defterine yeni hareket olarak yazılır.

### Hareket türleri

| Tür | İşaret | Örnek |
|---|---:|---|
| Kazanım | + | Ürün kodu doğrulandı |
| Kampanya bonusu | + | Ağustos iki kat puan farkı |
| Ödül harcaması | − | Dijital hediye alındı |
| Rezervasyon | Kullanılabilirden bekleyene | Kupon hazırlanıyor |
| Rezervasyon çözme | Bekleyenden kullanılabilire | Sağlayıcı başarısız oldu |
| İade geri alımı | − | Ürün iade edildi |
| Operasyon düzeltmesi | +/− | Onaylı destek kararı |
| Süre dolumu | − | Onaylı süre kuralı uygulandı |
| Ters kayıt | Karşıt | Hatalı hareket geri çevrildi |

Her hareket şu bilgileri taşır:

- Usta ve benzersiz hareket numarası
- Tür, miktar, durum ve oluşma zamanı
- Kaynak işlem ve varsa ters çevrilen hareket
- Ürün kodu/satış/kampanya/ödül/kupon referansları
- Kullanılan kuralın değişmez sürümü
- İnsan işlemi ise aktör ve gerekçe
- Teknik tekrar önleme anahtarı

### Bakiye türleri

- **Kullanılabilir:** Hemen ödülde kullanılabilir.
- **Bekleyen:** Risk veya dış sağlayıcı sonucu bekler; harcanamaz.
- **Rezerveli:** Başlatılmış ödül işlemi için ayrılmıştır.
- **Toplam kazanılmış:** Raporlama amaçlı tarihsel toplamdır; harcanabilir bakiye değildir.

## 3. Puan hesaplama sırası

Önerilen değerlendirme sırası:

1. İşlem ve ürün uygunluğu
2. Temel ürün puanı
3. Kullanıcı/bayi/bölge uygunluğu
4. Geçerli kampanyalar
5. Birleştirme ve öncelik kuralı
6. İşlem başına üst sınır
7. Günlük/aylık/kampanya toplam sınırı
8. Risk sonucu: kullanılabilir veya bekleyen
9. Hareket ve kullanılan kural sürümünün kaydı

Aynı girdiler ve aynı kural sürümü her zaman aynı sonucu üretmelidir.

## 4. Kampanya kural modeli

Bir kampanya geliştirici müdahalesi olmadan şu alanlarla tanımlanabilmelidir:

### Kim?

- Tüm ustalar veya belirli segment
- Seviye
- İl/ilçe
- İlk işlem/yeni üye durumu
- Bayi veya bayi grubu

### Ne?

- Ürün, SKU, ürün grubu veya kod partisi
- Satış kanalı
- Asgari/azami miktar

### Ne zaman?

- Başlangıç ve bitiş zamanı
- Türkiye saat dilimi ve zaman sınırı davranışı
- Gün/saat penceresi

### Sonuç

- Sabit ek puan
- Temel puana çarpan
- Basamaklı kazanım
- İlk N işlem için bonus

### Koruma sınırları

- Usta başına işlem/gün/ay/kampanya limiti
- Toplam kampanya bütçesi veya puan tavanı
- Başka kampanyayla birleşebilirlik
- Öncelik
- Risk koşulu

## 5. Kural çakışması

MVP'de varsayılan öneri: Aynı işleme uyan kampanyalar kendiliğinden toplanmaz. Her kampanya
`birleşebilir` veya `birleşemez` olarak açıkça işaretlenir. Birleşemeyenler arasında en yüksek
öncelik; eşitse kullanıcıya en fazla puan veren kural uygulanır ve sonuç önizlemede gösterilir.

Bu kural iş birimi tarafından onaylanmalıdır. Gizli veya belirsiz sıralama, maliyet ve kullanıcı
itirazı doğurur.

## 6. Kural yaşam döngüsü

`TASLAK → INCELEMEDE → ONAYLI → ZAMANLANMIS → AKTIF → SONA_ERDI`

İstisnai durumlar: `DURDURULDU`, `IPTAL_EDILDI`.

- Aktif kural yerinde değiştirilmez; yeni sürüm hazırlanır.
- Geçmiş işlem, her zaman kullandığı eski sürüme referans verir.
- Zamanlanmış kural örnek işlemler ve tahmini bütçe etkisiyle test edilir.
- Büyük bütçe etkili değişiklik ikinci kişi onayı olmadan yayınlanmaz.
- Acil durdurma geçmiş kazanımları otomatik geri almaz.

## 7. Seviye modeli

MVP seviyeleri: **Bronz, Gümüş, Altın**.

Eşikler açık karar K-009 ile belirlenecektir. Model şu alanları desteklemelidir:

- Değerlendirme dönemi
- Ölçüt: nitelikli puan, işlem veya ürün karması
- Seviye kazanma tarihi
- Koruma süresi
- Yenileme ve düşme şartı
- Seviye bazlı avantaj
- İade sonrası seviye yeniden hesaplama davranışı

Seviye, toplam cüzdan bakiyesine bağlanmamalıdır; ödül harcamak kullanıcının seviyesini
düşürmemelidir. Bunun yerine nitelikli faaliyet ölçüsü kullanılmalıdır.

## 8. Ödül türleri

### Dijital ödül

- Sistem veya dış sağlayıcı tarafından üretilen kod/bağlantı
- Mümkünse anında teslim
- Sağlayıcı gecikmesinde hazırlanıyor durumu
- Hassas kodun listelerde açık gösterilmemesi

### Bayi kuponu

- Uygun bayi/şube kapsamı
- Son kullanım tarihi
- Tek kullanımlık teslim onayı
- Gerekirse stok rezervasyonu

### Ödül durumları

`TASLAK`, `YAYINDA`, `DURAKLATILDI`, `STOKTA_YOK`, `SONA_ERDI`.

### Kupon durumları

`HAZIRLANIYOR`, `AKTIF`, `REZERVE`, `KULLANILDI`, `SURESI_DOLDU`, `IPTAL`, `HATALI`.

Durum geçişleri sunucu tarafından kontrol edilir. Örneğin `KULLANILDI` kupon yeniden `AKTIF`
yapılamaz; gerekiyorsa yeni telafi kuponu ve bağlı denetim kaydı oluşturulur.

## 9. Kullanıcıya şeffaflık

Her puan hareketinde en az şu açıklanmalıdır:

- Kaç puan ve neden kazanıldı/çıkarıldı?
- Hangi tarih ve işlemle ilgilidir?
- Bekliyorsa ne bekleniyor?
- İade veya süre dolumu hangi kurala dayandı?
- İtiraz için hangi işlem numarası kullanılmalıdır?

Ödül puan bedeli değiştiğinde mevcut, daha önce oluşturulmuş kuponların şartları değişmez.
Katalog fiyat değişiklikleri zaman ve yetkili bilgisiyle kaydedilir.
