# 13 — Pilot Veri Toplama Formu

**Sürüm:** 0.1
**Durum:** Doldurulmayı bekliyor

Bu form, pilot kapsamını ve puan ekonomisini gerçek verilere göre belirlemek için hazırlanmıştır.
Yaklaşık bilgi kabul edilir; kesin olmayan değerlerin yanına `tahmini` yazılmalıdır. Bilinmeyen
alanlar uydurulmamalı, `bilinmiyor` olarak bırakılmalıdır.

## Nasıl kullanılacak?

1. Her bölüm ilgili kişiyle doldurulur.
2. Kaynak ve veri tarihi mümkünse yazılır.
3. Ticari açıdan hassas değerler GitHub'a yazılmadan ayrı güvenli dosyada tutulabilir.
4. Tamamlanan verilerle puan simülasyonu ve pilot bütçesi hazırlanır.
5. Sonuçlar onaylanınca K-009–K-016 kararları kesinleştirilir.

## A — Proje ve karar sahipleri

| Alan | Cevap |
|---|---|
| Marka/şirket adı | Doldurulacak |
| Ürün sahibi | Doldurulacak |
| Nihai bütçe onaylayanı | Doldurulacak |
| Pazarlama sorumlusu | Doldurulacak |
| Satış/bayi sorumlusu | Doldurulacak |
| Mali işler sorumlusu | Doldurulacak |
| Hukuk/KVKK sorumlusu | Doldurulacak |
| Operasyon/destek sorumlusu | Doldurulacak |
| Teknik sorumlu | Doldurulacak |

### Neden gerekli?

Bir kararın sahibi yoksa konu yazılımcıya veya destek ekibine kalır. Özellikle puan değeri,
iade ve hukuki metinler teknik karar değildir.

## B — Pilot bölge ve zaman

| Alan | Cevap |
|---|---|
| Pilot için düşünülen il/bölge | Doldurulacak |
| Alternatif il/bölge | Doldurulacak |
| Bölge seçme gerekçesi | Doldurulacak |
| Planlanan başlangıç ayı | Doldurulacak |
| Hazırlık süresi | Öneri: 2 hafta |
| Kapalı beta süresi | Öneri: 2 hafta |
| Aktif pilot süresi | Öneri: 8 hafta |
| Pilot usta hedefi | Öneri: 100–250 |
| Pilot bayi/şube hedefi | Öneri: 3–5 |

### Bölge değerlendirme puanlaması

Her aday bölge 1–5 arasında puanlanabilir:

| Ölçüt | Aday 1 | Aday 2 | Aday 3 |
|---|---:|---:|---:|
| Aktif bayi istekliliği |  |  |  |
| Usta yoğunluğu |  |  |  |
| Pilot ürün satış hacmi |  |  |  |
| Saha desteği imkânı |  |  |  |
| İade verisine erişim |  |  |  |
| İnternet/SMS erişimi |  |  |  |
| Toplam |  |  |  |

## C — Pilot bayi listesi

| Bayi/şube | İl/ilçe | Aylık ilgili satış | Aktif usta tahmini | Personel | Pilot isteği | İnternet durumu |
|---|---|---:|---:|---:|---|---|
| Doldurulacak |  |  |  |  |  |  |
| Doldurulacak |  |  |  |  |  |  |
| Doldurulacak |  |  |  |  |  |  |

Her pilot bayi için ayrıca:

- Bir bayi yöneticisi,
- En az bir yedek çalışan,
- Kupon teslim alanı,
- İade sorumlusu,
- Eğitim ve destek iletişim kişisi

belirlenmelidir.

## D — Pilot ürün listesi

İlk pilotta 2–3 ürün grubu önerilir. Çok fazla ürün, kod üretimi ve kampanya kontrolünü gereksiz
zorlaştırır.

| SKU | Ürün adı/grubu | Ortalama satış fiyatı | Aylık bölge satışı | İade oranı | Önerilen temel puan | Kod uygulama yöntemi |
|---|---|---:|---:|---:|---:|---|
| Doldurulacak |  |  |  |  |  |  |
| Doldurulacak |  |  |  |  |  |  |
| Doldurulacak |  |  |  |  |  |  |

### Ürün seçim ölçütleri

- Usta tarafından gerçekten kullanılan veya satın alınan ürün,
- Yeterli fakat kontrol edilebilir satış hacmi,
- İade kaydına ulaşılabilmesi,
- Koda uygun paket yüzeyi veya paket içi konum,
- Sahte/yeniden kullanım riskinin anlaşılabilir olması,
- Bayi çalışanının ürünü kolay tanıması.

## E — Ürün kodu üretimi

| Alan | Cevap |
|---|---|
| Kod üretiminden sorumlu ekip/tedarikçi | Doldurulacak |
| Paket baskısı mümkün mü? | Evet / Hayır / Bilinmiyor |
| Güvenlik etiketi mümkün mü? | Evet / Hayır / Bilinmiyor |
| Kod gizleme yöntemi | Doldurulacak |
| Ürün–parti–kod eşleşmesi mevcut mu? | Doldurulacak |
| Pilot için gereken yaklaşık kod sayısı | Doldurulacak |
| Kod sızıntısında parti durdurma sorumlusu | Doldurulacak |

Kod sayısı yalnızca satış hedefi kadar olmamalıdır; üretim/test/fire payı ayrıca hesaplanmalı fakat
test kodları üretim kodlarından kesin biçimde ayrılmalıdır.

## F — Puan ekonomisi

| Alan | Cevap |
|---|---|
| Aylık pilot puan/ödül bütçesi | Doldurulacak |
| Pilot toplam azami bütçesi | Doldurulacak |
| Hedef ilk ödül süresi | Öneri: 7–14 gün |
| Hedef ilk ödül işlem sayısı | Öneri: 2–3 geçerli ürün |
| İşlem başına azami puan | Doldurulacak |
| Usta başına günlük azami kazanım | Doldurulacak |
| Usta başına aylık azami kazanım | Doldurulacak |
| Kampanya toplam bütçe sınırı | Doldurulacak |

### Hesaplanacak göstergeler

- Bir puanın beklenen ödül maliyeti,
- Ortalama ürün başına puan maliyeti,
- Ortalama usta başına aylık maliyet,
- Puan kazanıp hiç harcamama oranı için senaryolar,
- En yüksek hacimli %5 usta için bütçe etkisi,
- İade ve sahtecilik payı,
- Ödül sağlayıcı komisyonu/vergi etkisi.

Puanın kullanıcıya gösterilen ödül değeri ile şirketin gerçek maliyeti aynı olmak zorunda değildir;
iki değer raporda ayrı tutulmalıdır.

## G — Ödül kataloğu

| Ödül | Tür | Kullanıcı değeri | Gerçek maliyet | Puan bedeli | Stok/adet | Teslim süresi | Sağlayıcı/bayi |
|---|---|---:|---:|---:|---:|---|---|
| Doldurulacak | Dijital/Bayi |  |  |  |  |  |  |
| Doldurulacak | Dijital/Bayi |  |  |  |  |  |  |
| Doldurulacak | Dijital/Bayi |  |  |  |  |  |  |

### İlk katalog için öneri

- En az bir kolay erişilen başlangıç ödülü,
- En az bir orta seviye ödül,
- En az bir biriktirmeyi teşvik eden ödül,
- Mümkünse anında teslim edilen dijital seçenek,
- Stok bittiğinde eşdeğer alternatif.

## H — Seviye kalibrasyon verisi

Son 12 aylık örnek satış verisinden, mümkünse anonim olarak:

| Ölçüm | Değer |
|---|---:|
| Tahmini aktif usta sayısı | Doldurulacak |
| Usta başına aylık medyan ürün adedi | Doldurulacak |
| Usta başına aylık %75 dilim ürün adedi | Doldurulacak |
| Usta başına aylık %90 dilim ürün adedi | Doldurulacak |
| En yoğun %5'in toplam satış payı | Doldurulacak |

Bu dağılım görülmeden Gümüş ve Altın eşiğine kesin puan yazılmamalıdır.

## I — Destek ve operasyon

| Alan | Cevap |
|---|---|
| Destek çalışma gün/saatleri | Doldurulacak |
| Birinci seviye destek kişi sayısı | Doldurulacak |
| Puan düzeltme yetkilisi | Doldurulacak |
| Risk inceleme yetkilisi | Doldurulacak |
| İade anlaşmazlığı karar sahibi | Doldurulacak |
| Hukuki talepler iletişim noktası | Doldurulacak |
| Kritik olay nöbet/iletişim yöntemi | Doldurulacak |

Destek ekibi pilot başlamadan kod sonucu, puan, kupon, iade ve hesap kısıtı için hazır cevap değil,
karar ağacı ve yetki yönlendirmesi almalıdır.

## J — SMS ve bildirim

| Alan | Cevap |
|---|---|
| Mevcut SMS sağlayıcısı | Doldurulacak |
| Bir SMS yaklaşık maliyeti | Doldurulacak |
| Gönderici başlığı hazır mı? | Doldurulacak |
| Teslim raporu destekleniyor mu? | Doldurulacak |
| OTP mesaj şablonu hukuk onaylı mı? | Doldurulacak |
| Kampanya iletişimi kanalları | Doldurulacak |

OTP maliyet bütçesi; kayıt sayısından daha yüksek hesaplanmalıdır çünkü yeniden gönderim, yanlış
numara ve saldırı denemeleri bulunacaktır.

## K — Hukuk ve uyum hazırlığı

| Belge/süreç | Sorumlu | Durum | Hedef tarih |
|---|---|---|---|
| KVKK aydınlatma metni | Doldurulacak | Başlamadı/Taslak/Onaylı |  |
| Üyelik ve program koşulları | Doldurulacak |  |  |
| Açık rıza metinleri gerekiyorsa | Doldurulacak |  |  |
| Ticari ileti izni | Doldurulacak |  |  |
| Çerez tercihleri | Doldurulacak |  |  |
| Bayi kullanım koşulları | Doldurulacak |  |  |
| Ödül/kupon koşulları | Doldurulacak |  |  |
| Veri sahibi başvuru süreci | Doldurulacak |  |  |
| Saklama ve silme politikası | Doldurulacak |  |  |

## L — Mevcut sistem ve entegrasyonlar

| Sistem | Var mı? | Pilot bağlantısı gerekli mi? | Sorumlu | Not |
|---|---|---|---|---|
| ERP |  |  |  |  |
| B2B/bayi sistemi |  |  |  |  |
| CRM |  |  |  |  |
| Ürün/parti sistemi |  |  |  |  |
| İade sistemi |  |  |  |  |
| SMS hizmeti |  |  |  |  |
| Dijital ödül sağlayıcısı |  |  |  |  |

MVP'de tam entegrasyon yapılmasa bile veri aktarım biçimi belirlenmelidir. Pilot için kontrollü CSV
yükleme kullanılabilir; fakat dosya kaynağı, şema, tekrar önleme ve hata raporu tanımlanmalıdır.

## M — Pilot başlamaya hazır mı?

Her madde `Evet`, `Hayır` veya `Kısmen` olarak işaretlenir:

| Kontrol | Durum | Kanıt/bağlantı |
|---|---|---|
| Pilot bölge ve bayiler onaylandı |  |  |
| Pilot ürünler ve kod yöntemi onaylandı |  |  |
| Puan bütçesi ve limitler onaylandı |  |  |
| İlk ödül kataloğu hazır |  |  |
| İade akışı ve sorumluları hazır |  |  |
| Destek ekibi ve çalışma saatleri hazır |  |  |
| Risk karar yetkileri hazır |  |  |
| Hukuki metinler onaylandı |  |  |
| SMS sağlayıcısı ve şablon hazır |  |  |
| Güvenlik ve yük testleri geçti |  |  |
| Yedek ve olay müdahale testi yapıldı |  |  |

Tüm kritik satırlar `Evet` olmadan gerçek kullanıcı pilotu başlamamalıdır.
