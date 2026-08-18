# 11 — P0 Karar Önerileri

**Sürüm:** 0.1
**Durum:** Öneri — Henüz onaylı değildir

Bu belge sekiz kritik iş kararına önerilen başlangıç cevabını verir. Amaç yazılımcının boşlukları
kendi tahminiyle doldurmasını önlemek ve karar sahiplerine somut bir değerlendirme zemini
sunmaktır.

## Özet öneri tablosu

| Karar | Önerilen MVP yaklaşımı | Onay sahibi |
|---|---|---|
| K-001 | Kod üretimde üretilip pakete gizli ve müdahale belli olacak şekilde uygulanmalı. | Üretim + ürün |
| K-002 | Hak sahibi, ürünü mesleki faaliyetinde kullanmak üzere satın alan ve ilk geçerli talebi yapan kayıtlı usta olmalı. | Ürün + hukuk |
| K-003 | Bayi eşleştirmesi destekleyici kanıt olmalı; normal işlemlerde zorunlu olmamalı. | Satış + ürün |
| K-004 | İade öncelikle bayi tarafından kabul anında, en geç 24 saat içinde bildirilmelidir. | Mali işler + operasyon |
| K-005 | Nakit borç gösterilmemeli; puan açığı gelecek kazanımlardan kapanmalı ve ödül kullanımı geçici durmalıdır. | Mali işler + hukuk |
| K-006 | Pilot/MVP döneminde puan süresi dolmamalı; sistem gelecekte süre kuralını desteklemelidir. | Pazarlama + hukuk |
| K-007 | Pilot boyunca ödül fiyatı korunmalı; sonrasında değişiklikler aylık takvim, çift onay ve önceden bildirimle yapılmalıdır. | Yönetim + mali işler |
| K-008 | Hukuk onaylı, ayrı ve sürümlü metinler yayın ön koşulu olmalıdır. | Hukuk |

## K-001 — Ürün kodunun pakete uygulanması

### Öneri

Kodlar merkezi ve güvenli biçimde üretilmeli; üretim/paketleme aşamasında pakete basılmalı veya
seri numarasıyla eşleştirilmiş güvenlik etiketi olarak uygulanmalıdır. Kod normal raf görüntüsünde
okunamamalı; kazıma alanı, paket içi konum veya açıldığında müdahalesi belli olan bir koruma
altında bulunmalıdır.

Pilot için mevcut üretim hattı baskıyı desteklemiyorsa geçici güvenlik etiketi kullanılabilir;
ancak her etiket ürün, parti ve seriyle izlenebilir olmalıdır. Bayide sonradan serbestçe kod
üretilmesi veya etiketsiz kod listesi dağıtılması önerilmez.

### Neden?

- Kodun ürünle bağını üretimden itibaren kurar.
- Raf fotoğrafıyla kod çalınmasını zorlaştırır.
- Sızan kodların hangi parti ve süreçten geldiğini araştırmayı mümkün kılar.
- Bayi çalışanının sınırsız kod oluşturması riskini kaldırır.

### Uygulama sonucu

Ürün kodu partileri `HAZIR`, `AKTIF`, `DURDURULDU` durumlarını taşımalı; sevkiyat veya belirlenen
ticari olay gerçekleşmeden kodlar kullanılamamalıdır.

### Yeniden değerlendirme koşulu

Üretim hattı maliyeti pilot bütçesini aşıyorsa yalnızca kontrollü etiket pilotu değerlendirilir.

## K-002 — Puanı hak eden kişi

### Öneri

MVP'de hak sahibi şu üç şartı birlikte karşılamalıdır:

1. Kayıtlı ve aktif usta hesabı bulunması,
2. Ürünü mesleki faaliyetinde kullanmak üzere satın almış olması,
3. Kullanılmamış kod için ilk geçerli talebi yapması.

Bayi satış eşleştirmesi varsa satışın bağlandığı usta öncelikli hak sahibidir. Kod başka hesap
tarafından talep edilirse otomatik puan yerine inceleme başlatılır.

“Ürünü uygulayan kişi” doğrulaması MVP'de güvenilir biçimde kanıtlanamayacağı için yalnızca beyana
dayalı ayrı bir ödül kuralı yapılmamalıdır. Uygulayıcı doğrulaması, Onaylı Usta aşamasında iş,
fotoğraf ve kontrol listesi kanıtlarıyla ele alınmalıdır.

### Neden?

- Satın alma anında anlaşılır ve uygulanabilir bir kural sağlar.
- Kalfa, yardımcı veya üçüncü kişinin paket kodunu sahiplenmesi ihtilafını azaltır.
- Gelecekteki uygulama kalitesi programıyla kanıtsız MVP kazanımını birbirine karıştırmaz.

### Açık risk

Usta ürünü nakit ve isimsiz aldıysa yalnızca ilk geçerli kod talebi kanıt olur. Bu işlemler risk
sinyallerine ve gerekirse sonradan bayi teyidine açık tutulmalıdır.

## K-003 — Bayi eşleştirmesi zorunluluğu

### Öneri

Bayi eşleştirmesi normal ürün kodu kazanımında **zorunlu değil, güçlü destekleyici kanıt** olmalıdır.

- Kod + uygun hesap + düşük risk: puan verilir.
- Kod + bayi eşleşmesi: daha güçlü doğrulanmış işlem olarak işaretlenir.
- Kod var fakat risk yüksek: puan beklemeye alınır ve bayi/satış kanıtı istenebilir.
- Belirli yüksek değerli ürün/kampanya: kural bazında bayi eşleştirmesi zorunlu yapılabilir.

### Neden?

Tüm işlemlerde zorunluluk; bayinin sistemi kullanmadığı, satışın başka şehirden yapıldığı veya
bağlantının zayıf olduğu durumlarda ustayı hak kaybına uğratır. Hiç kullanmamak ise iade ve
sahtecilik kontrolünü zayıflatır. Destekleyici kanıt modeli iki ihtiyacı dengeler.

## K-004 — İade bildirimi

### Öneri

- İadenin ana kaynağı ürünü geri alan bayi/şube olmalıdır.
- Bayi, iadeyi kabul ettiği anda sisteme girmeli; operasyon hedefi en geç 24 saattir.
- Gelecekte ERP entegrasyonu devreye girdiğinde ERP kaydı esas doğrulama kaynağı olmalıdır.
- Geç bildirilmiş fakat ticari olarak geçerli bir iade sistem tarafından reddedilmemeli; geçlik
  ayrıca operasyon metriği ve risk sinyali olmalıdır.
- Ustaya puan etkisi kesinleştiğinde uygulama içi bildirim gönderilmelidir.

### Neden?

Sistemin “30 günden sonra iade kabul etmemesi” gibi yapay bir sınırı, gerçek ticari iade ile puan
defterini ayırır. Doğru yaklaşım geçerli iadeyi her zaman işlemek, geç bildirimi ayrıca ölçmektir.

### Gerekli veri

Orijinal satış, ürün/miktar, iade zamanı, kabul eden çalışan, neden, belge referansı ve önceki
kısmi iadeler.

## K-005 — Harcanmış puandan sonra iade

### Öneri

Puanlar nakit borç gibi gösterilmemelidir. İade geri alımı bakiyeyi sıfırın altına düşürecekse:

1. Puan defterinde gerçek negatif ters hareket oluşturulur.
2. Kullanıcı arayüzünde “puan düzeltme açığı” anlaşılır gerekçeyle gösterilir.
3. Yeni kazanımlar önce bu açığı kapatır.
4. Açık kapanana kadar yeni ödül/kupon oluşturma durdurulur.
5. Hesabın kod okutma, geçmiş görme ve destek erişimi tamamen kapatılmaz.
6. Hatalı iade veya özel durum için yetkili itiraz/düzeltme süreci bulunur.

### Neden?

- Kullanıcıdan para tahsil ediliyormuş izlenimi yaratmaz.
- Puan ekonomisinin mali bütünlüğünü korur.
- Hesabı tamamen kapatmadan gelecekteki kazanımla denge sağlar.
- İşlemin geçmişini silmeden açıklanabilir bir kayıt bırakır.

### Hukuk onayı

Program koşullarında iade sonrası puan geri alma ve ödül kısıtlaması açıkça anlatılmalıdır.

## K-006 — Puan geçerlilik süresi

### Öneri

Pilot ve MVP'nin ilk değerlendirme döneminde puanların süresi dolmamalıdır. Buna rağmen veri
modeli, hareket bazında son kullanım tarihi ve süre dolumu ters hareketini desteklemelidir.

Pilot verileri görüldükten sonra süre kuralı gerekiyorsa önerilen korumalar:

- Kazanımdan itibaren en az 12 ay,
- 90, 30 ve 7 gün önce bildirim,
- Kullanıcının hangi puanın ne zaman sona ereceğini görebilmesi,
- Kuralın yalnızca ilanından sonra kazanılan puanlara uygulanması,
- Desteklenmiş istisna/düzeltme süreci.

### Neden?

Yeni programda süre dolumu, kullanıcı henüz ödül ekonomisini öğrenmeden güven kaybı yaratır.
Pilotun amacı önce gerçek kazanım ve harcama davranışını ölçmektir.

## K-007 — Puan–ödül değerinin değiştirilmesi

### Öneri

- Pilot boyunca katalogdaki temel ödüllerin puan bedeli 90 gün korunmalıdır.
- Pilot sonrası normal değişiklikler ayda en fazla bir kez ve önceden belirlenmiş tarihte yapılmalıdır.
- Fiyat artıran değişiklik en az 30 gün önce bildirilmelidir.
- Hazırlayan ve onaylayan farklı yetkililer olmalıdır.
- Bütçe etkisi ve kullanıcı gruplarına etkisi yayın öncesi gösterilmelidir.
- Oluşturulmuş kuponun puan bedeli veya şartı sonradan değiştirilmemelidir.
- Tedarikçi iptali gibi acil durumda ödül durdurulabilir; gerekçe ve eşdeğer alternatif sunulmalıdır.

### Neden?

Ödül fiyatının sessizce yükselmesi, puan programlarında güveni en hızlı zedeleyen davranışlardan
biridir. Değişiklik tamamen yasaklanamaz; fakat takvim, bildirim ve çift onayla yönetilebilir.

### Gösterim kuralı

“500 TL'ye kadar ödül değeri” ifadesi katalogdan hesaplanmalı; erişilebilir ödül kalmadığında eski
değer gösterilmemelidir.

## K-008 — Hukuki metinler ve izinler

### Öneri

Metinlerin içeriğini yazılım veya yapay zekâ kesinleştirmemelidir. Hukuk ekibi en az şu ayrı,
sürümlü belgeleri onaylamalıdır:

1. KVKK aydınlatma metni,
2. Usta Kulübü üyelik ve puan/ödül programı koşulları,
3. Gerekli faaliyetler için ayrı açık rıza metinleri,
4. Ticari elektronik ileti izni,
5. Çerez/benzeri teknolojiler politikası ve tercihleri,
6. Bayi ve bayi çalışanı kullanım koşulları,
7. Ödül/kupon özel koşulları,
8. Veri sahibi başvuru ve iletişim kanalı.

SMS doğrulama mesajı hizmet güvenliği mesajıdır; pazarlama izniyle karıştırılmamalıdır. Kampanya
SMS'i ise uygun iletişim izni ve tercih yönetimine tabi olmalıdır.

### Sistem gereksinimi

- Her metin sürüm, yayın ve yürürlük tarihi taşımalıdır.
- Kullanıcının gördüğü sürüm ve verdiği ayrı kararlar kaydedilmelidir.
- Yeni bağlayıcı metin gerektiğinde kullanıcıdan yeniden işlem istenebilmelidir.
- Rıza/iletişim izni geri çekilebilir olmalı; zorunlu hizmet işleme şartlarıyla karıştırılmamalıdır.
- Onaylı metinler bulunmadan pilot yayına çıkılmamalıdır.

## Önerilen onay sırası

1. Ürün + üretim: K-001
2. Ürün + hukuk + satış: K-002 ve K-003
3. Operasyon + mali işler: K-004 ve K-005
4. Pazarlama + mali işler + hukuk: K-006 ve K-007
5. Hukuk: K-008 metin listesi ve yayın kapısı

Kararlar onaylandığında `08-acik-kararlar.md` içindeki ilgili satırlar kapatılmalı; kapsam, akış,
puan, veri ve test belgeleri aynı commit içinde güncellenmelidir.
