# 12 — P1 Pilot Karar Önerileri

**Sürüm:** 0.1
**Durum:** Öneri — Pilot verileri ve iş birimi onayı bekler

Bu belge seviye, ilk ödül, bayi faydası, kupon kapsamı, destek, risk ve pilot büyüklüğü için
önerilen başlangıç modelini tanımlar. Sayısal eşikler pilot öncesi ürün fiyatı, puan bütçesi ve
bayi ağı verileriyle doğrulanmalıdır.

## K-009 — Bronz, Gümüş ve Altın seviyeleri

### Öneri

Seviye, harcanabilir cüzdan bakiyesinden ayrı bir **nitelikli faaliyet puanı** ile hesaplanmalıdır.
Ödül harcamak seviyeyi düşürmemelidir.

- **Bronz:** Üyelik ve tamamlanmış profil.
- **Gümüş:** Son 12 ay içinde doğrulanmış düzenli faaliyet eşiği.
- **Altın:** Son 12 ay içinde yüksek ve istikrarlı doğrulanmış faaliyet eşiği.

Kesin eşikler ürün başına temel puan tablosu görülmeden sayı olarak sabitlenmemelidir. Teknik
sistem eşikleri yönetici panelinden değiştirebilmeli; pilot başlamadan örnek gerçek satış verisi
üzerinde kullanıcı dağılımı hesaplanmalıdır.

### Pilot dağılım hedefi

Aktif pilot ustalarının yaklaşık:

- %60–75 Bronz,
- %20–30 Gümüş,
- %5–10 Altın

olması hedeflenebilir. Bu oranlar kural değil, eşiklerin aşırı kolay veya zor olup olmadığını
gösteren kalibrasyon sinyalidir.

### Başlangıç avantajları

- Bronz: Standart katalog ve kampanyalar.
- Gümüş: Seçili kampanyalara erken erişim ve sınırlı ek ödül seçenekleri.
- Altın: Öncelikli destek ve seçili eğitim/ürün etkinliklerine erişim.

MVP'de seviyeye kalıcı yüksek puan çarpanı bağlanması önerilmez; bütçeyi kontrolsüz büyütebilir.

## K-010 — İlk ödüle ulaşma hedefi

### Öneri

Usta, normal ve gerçekçi kullanımda ilk düşük maliyetli dijital ödüle:

- en fazla 2–3 geçerli ürün işlemiyle veya
- hedef kullanıcı için yaklaşık 7–14 gün içinde

ulaşabilmelidir.

İlk ödül, “sadece kayıt olana bedava” biçiminde değil, en az bir doğrulanmış ürün işlemi sonrasında
erişilebilir olmalıdır. Böylece gerçek kullanım öğretilirken sahte toplu hesap açma teşviki azalır.

### Ölçüm

- Kayıttan ilk geçerli koda kadar geçen süre,
- İlk koddan ilk ödüle kadar geçen süre,
- İlk ödül öncesi terk oranı,
- Ödül sonrası 30 günlük geri dönüş

birlikte izlenmelidir.

## K-011 — Bayinin somut faydası

### Öneri

Bayiye yalnızca “markaya yardım et” denmemeli; MVP'de şu faydalar verilmelidir:

1. Eşleştirdiği satış ve aktif usta sayısını gösteren basit şube paneli,
2. Kampanya ve ödül teslim trafiğinin bayiye yönlendirilmesi,
3. Doğru ve zamanında işlem yapan bayiler için performans puanı,
4. İade ve kupon işlemlerinde daha hızlı, izlenebilir süreç,
5. Seçili bayi kampanyalarına katılım hakkı.

Nakit komisyon veya prim MVP gereksinimi olarak hemen tanımlanmamalıdır; vergi, fatura ve kötüye
kullanım etkileri mali işler tarafından incelenmelidir. Önce bayi performansı ölçülmelidir.

### Bayi performans ölçütleri

- Geçerli satış eşleştirme oranı,
- Kupon teslim tamamlama süresi,
- İade bildirim süresi,
- İptal/itiraz ve doğrulanmış şüpheli işlem oranı,
- Aktif usta katkısı.

## K-012 — Kuponun geçerli olduğu bayi

### Öneri

- Stok gerektirmeyen veya standart ödül kuponu tüm **uygun ve aktif bayilerde** kullanılabilmelidir.
- Bayi stoklu fiziksel ödülde usta bir şube seçer; stok kısa süreli rezerve edilir.
- Rezervasyon süresinde teslim olmazsa kupon otomatik tüketilmez ve uygun politika ile serbest kalır.
- Kampanya yalnızca belirli bayi grubuna aitse bu sınırlama kupon oluşturulmadan önce açıkça gösterilir.

### Neden?

Ustayı tek bayiye kilitlemek stok ve ulaşım sorununda ödül sözünü bozar. Fiziksel stokta ise tüm
bayilerde geçerli kupon göstermek gerçekte olmayan ürünü vaat edebilir. İki durum ayrı yönetilmelidir.

## K-013 — Fiziksel ödül stoku

### Öneri

Pilotun ilk bölümünde öncelik:

1. Anında teslim edilen dijital ödüller,
2. Bayide zaten bulunan standart ürün/kuponlar,
3. Yalnızca zorunluysa sınırlı pilot fiziksel ödül stoğu

olmalıdır.

Kargo gerektiren merkezi fiziksel ödül operasyonu ilk pilot kapsamına alınmamalıdır. Bu model adres,
kargo, kayıp, iade ve ek destek yükü getirir. Bayi stoklu ödül kullanılacaksa stok şube bazında
tutulmalı ve rezervasyonsuz kupon üretilmemelidir.

## K-014 — Destek hizmet seviyeleri

### Önerilen başlangıç hedefleri

| Talep | İlk yanıt | Hedef çözüm |
|---|---:|---:|
| Kritik hesap güvenliği veya aktif kupon teslim sorunu | 4 çalışma saati | 1 iş günü |
| Puan, ürün kodu ve iade itirazı | 1 iş günü | 3 iş günü |
| Profil, bildirim ve genel bilgi | 1 iş günü | 5 iş günü |

Çalışma gün/saatleri uygulamada açıkça belirtilmelidir. Otomatik “talebiniz alındı” mesajı ilk insan
yanıtı sayılmamalıdır.

### Neden kategori bazlı hedef?

Kullanılmak üzere bayide bekleyen kupon ile genel kampanya sorusunun iş etkisi aynı değildir.
Tek süre hedefi kritik talepleri görünmez yapar veya operasyonu gereksiz pahalılaştırır.

## K-015 — Otomatik engel ve insan incelemesi

### Kesin kurala dayalı otomatik ret

- Ürün kodu daha önce başarıyla kullanılmış,
- Kod/parti iptal edilmiş veya aktif değil,
- Kupon kullanılmış, iptal veya süresi dolmuş,
- Aynı iade miktarı daha önce işlenmiş,
- Kimlik doğrulama veya açık hız sınırı başarısız,
- Kullanıcı/bayi gerekli yetkiye sahip değil.

Bu durumlarda sistem yeni değer üretmez; ancak itiraz yolu bulunur.

### İnceleme gerektiren olasılıksal sinyaller

- Olağan dışı işlem hızı veya saat,
- Aynı cihazda çok sayıda hesap,
- Usta–bayi arasında aşırı yoğun örüntü,
- Olağan dışı coğrafi hareket,
- Yüksek iade oranı,
- Yeni hesapta çok hızlı yüksek değerli ödül.

Bu sinyaller tek başına kalıcı hesap kapatma üretmemeli; puan bekletme ve insan incelemesi
başlatmalıdır. Kalıcı kapatma veya büyük geri alma belgeli insan kararı gerektirir.

## K-016 — Pilot kapsamı

### Öneri

İlk pilot:

- Satış ve saha desteğinin güçlü olduğu tek bir il veya birbirine yakın bölge,
- 3–5 aktif bayi/şube,
- Davetli 100–250 usta,
- 2–3 kolay tanınan ürün grubu,
- 8 haftalık aktif kullanım,
- Öncesinde 2 haftalık bayi/operasyon hazırlığı

ile sınırlandırılmalıdır.

Pilot il yalnızca ekip konumuna göre değil; bayi istekliliği, ürün hacmi, iade verisi ve saha destek
imkânına göre seçilmelidir.

### Aşamalı açılış

1. İç ekip ve 1 bayi ile kontrollü test,
2. 10–20 güvenilir usta ile kapalı beta,
3. 3–5 bayi ve 100–250 usta ile pilot,
4. Başarı kapıları geçilirse ikinci bölge.

### Pilot başarı kapıları

- Çift kod/kupon kaynaklı mali kayıp yok,
- SMS ve kod akışında kabul edilebilir başarı oranı,
- İlk ödüle hedef sürede ulaşım,
- Bayi işlemlerinde sürdürülebilir süre,
- Destek ve risk kuyruğunun ekip kapasitesini aşmaması,
- Puan/ödül bütçesinin öngörülen sınırda kalması,
- Kritik güvenlik veya KVKK bulgusu bulunmaması.

## Onay için gereken gerçek veriler

Bu önerileri kesinleştirmek için tek tabloda şu bilgiler gereklidir:

- Pilot adayı iller ve aktif bayi sayıları,
- Seçilecek ürünlerin satış fiyatı, aylık hacmi ve iade oranı,
- Ürün başına önerilen temel puan,
- Ödül maliyetleri ve aylık pilot bütçesi,
- Destek verecek kişi ve çalışma saatleri,
- Dijital ödül sağlayıcı seçenekleri,
- Bayi stok ve teslim yeteneği.

Bu veriler olmadan seviye eşiklerine kesin sayı vermek, ölçülebilir karar değil tahmin olur.
